import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@echotab/ui/AlertDialog";
import { Button } from "@echotab/ui/Button";
import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@echotab/ui/Dialog";
import { NumberFlow } from "@echotab/ui/NumberFlow";
import { Tooltip, TooltipContent, TooltipTrigger } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import {
  ArrowLineUpRightIcon,
  FastForwardIcon,
  HeartIcon,
  RewindIcon,
  SparkleIcon,
  TagIcon,
  XIcon,
} from "@phosphor-icons/react";
import { ClockIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { AnimatedNumberBadge } from "../components/AnimatedNumberBadge";
import { SavedTab } from "../models";
import { bookmarkStoreActions, useBookmarkStore } from "../store/bookmarkStore";
import {
  curateStoreActions,
  InclusionReason,
  InclusionResult,
  useCurateStore,
} from "../store/curateStore";
import { pluralize } from "../util";
import { getUtcISO } from "../util/date";
import { remap } from "../util/math";
import { CurateCard } from "./CurateCard";
import CurateDock, { DockAction } from "./CurateDock";
import CurateSummary from "./CurateSummary";
import Ruler from "./Ruler";
import SwipeableCard, { Direction, SwipeableRef } from "./SwipeableCard";
import TagList from "./TagList";

interface Props {
  children?: ReactNode;
  maxCards?: number;
  curateQueueItems: InclusionResult[];
}

const useCurateQueue = (maxCards: number, curateQueueItems: InclusionResult[]) => {
  const open = useCurateStore((s) => s.open);
  const [queue, setQueue] = useState<InclusionResult[]>([]);
  const [initialized, setInitialized] = useState(false);
  const total = useRef(0);

  useEffect(() => {
    setInitialized(open);
    if (open) {
      setQueue(curateQueueItems);
      total.current = curateQueueItems.length;
    }
  }, [open, curateQueueItems]);

  const [kept, setKept] = useState<InclusionResult[]>([]);
  const [deleted, setDeleted] = useState<InclusionResult[]>([]);

  const dequeue = (choice: "keep" | "delete" | "skip") => {
    const [item, ...wipQueue] = queue;

    if (!item) {
      return;
    }

    if (choice === "keep") {
      setKept((prev) => [...prev, item]);
      setQueue(wipQueue);
    } else if (choice === "delete") {
      setDeleted((prev) => [...prev, item]);
      setQueue(wipQueue);
    } else if (choice === "skip") {
      setQueue([...wipQueue, { ...item, skipped: true, unshifted: false }]);
    }
  };

  const unshift = () => {
    if (queue.length < 2) return;

    setQueue((prev) => {
      const lastItem = prev.at(-1);
      if (!lastItem || !lastItem.skipped) {
        return prev;
      }
      const rest = prev.slice(0, -1).map((item) => ({ ...item, unshifted: false }));
      return [{ ...lastItem, unshifted: true }, ...rest];
    });
  };

  const visibleQueue = queue.slice(0, maxCards);

  return {
    total: total.current,
    queue: visibleQueue,
    dequeue,
    unshift,
    left: queue.length,
    kept,
    deleted,
    initialized,
  };
};

export function CurateTrigger({ children }: { children: ReactNode }) {
  return <DialogTrigger asChild>{children}</DialogTrigger>;
}

export default function Curate({ children, maxCards = 5, curateQueueItems }: Props) {
  const open = useCurateStore((s) => s.open);
  const settings = useCurateStore((s) => s.settings);
  const tabs = useBookmarkStore((s) => s.tabs);
  // const curateQueueItems = useCurateQueueHook({ manualIds: [] });

  const { initialized, total, queue, kept, deleted, left, dequeue, unshift } = useCurateQueue(
    maxCards,
    curateQueueItems,
  );

  const curateTabsById = useMemo(() => {
    const curateTabIds = new Set(curateQueueItems.map((result) => result.tabId));

    return Object.fromEntries(
      tabs.filter((tab) => curateTabIds.has(tab.id)).map((tab) => [tab.id, tab]),
    );
  }, [tabs, curateQueueItems]);

  const swipeableRef = useRef<SwipeableRef | null>(null);

  const [pressAction, setPressAction] = useState<string | null>(null);
  const pressActionTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSwipe = (tab: SavedTab, direction?: Direction) => {
    if (direction === "left") {
      dequeue("delete");
    } else if (direction === "right") {
      dequeue("keep");
    } else if (direction === "down") {
      dequeue("skip");
      setSkipCount((prev) => ({ ...prev, [tab.id]: (prev[tab.id] || 0) + 1 }));
    } else if (direction === "up") {
      setSkipCount((prev) => {
        const count = prev[tab.id] || 0;
        return { ...prev, [tab.id]: count - 1 };
      });
      unshift();
    }
  };

  const handleBeforeSwipe = (tab: SavedTab, direction?: Direction) => {
    if (direction === "left") {
      setPressAction("delete");
    } else if (direction === "right") {
      setPressAction("keep");
    }

    if (pressActionTimeout.current) {
      clearTimeout(pressActionTimeout.current);
    }

    pressActionTimeout.current = setTimeout(() => {
      setPressAction(null);
    }, 150);
  };

  const handleFinish = () => {
    if (kept.length + deleted.length !== 0) {
      curateStoreActions.saveCurateSession({
        kept: kept.length,
        deleted: deleted.length,
        keptIds: kept.map((result) => result.tabId),
      });

      if (deleted.length) {
        const deletedIds = deleted.map((result) => result.tabId);
        bookmarkStoreActions.removeTabs(deletedIds);
      }

      if (kept.length) {
        const keptIds = kept.map((result) => result.tabId);
        bookmarkStoreActions.updateTabs(keptIds, { lastCuratedAt: getUtcISO() });
      }
    }

    curateStoreActions.setCurateOpen(false);
  };

  const tabId = queue[0]?.tabId;
  const currentTab = tabId ? curateTabsById[tabId] : null;

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [forceFinish, setForceFinish] = useState(false);

  const ended = initialized && (forceFinish || left === 0);

  const [skipCount, setSkipCount] = useState<Record<string, number>>({});

  const applicableReasons = Object.entries(queue[0]?.reasons || {})
    .filter(([_, value]) => value)
    .map(([reason]) => reason);

  useHotkeys("up", () => unshift());

  const hasSkipped = Object.values(skipCount).some((count) => count > 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (state) {
          curateStoreActions.setCurateOpen(true);
        } else {
          if (left > 0 && !forceFinish) {
            setConfirmDialogOpen(true);
          } else {
            curateStoreActions.setCurateOpen(false);
          }
        }
      }}>
      {children}
      <DialogContent
        close={false}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className={cn(
          "flex h-full max-h-screen flex-col overflow-hidden border-none bg-transparent p-0 md:max-w-[100vw]",
        )}
        overlay={
          <DialogOverlay className="bg-background-base dark:bg-background-base dark:brightness-90" />
        }>
        <Ruler value={deleted.length} side="left">
          <AnimatedNumberBadge value={deleted.length} />
        </Ruler>
        <Ruler value={kept.length} side="right">
          <AnimatedNumberBadge value={kept.length} />
        </Ruler>

        <DialogHeader
          className={cn(
            "border-border fixed top-0 right-0 left-0 z-50 mx-auto w-full max-w-[calc(100vw-200px)] border-b p-8 pb-2 text-center backdrop-blur-md transition-all duration-300 ease-in-out",
            {
              "translate-y-[-200px] opacity-0": ended,
            },
          )}>
          <DialogTitle className="sr-only">Curate</DialogTitle>
          <DialogDescription className="flex items-center text-sm">
            <span className="hidden md:block">Swipe left to delete</span>
            <span
              className={cn("mx-auto flex items-center gap-2", {
                "opacity-0": left === 0,
              })}>
              <NumberFlow value={left} /> links left
            </span>
            <span className="hidden md:block">Swipe right to keep</span>
          </DialogDescription>
        </DialogHeader>
        <div className="relative z-20 flex h-full flex-col items-center justify-center p-5">
          <div className="relative h-full w-full">
            <div className="opacity-mask absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
              {ended && (
                <CurateSummary
                  className=""
                  deleted={deleted.length}
                  kept={kept.length}
                  empty={total === 0}>
                  <Button onClick={handleFinish} variant="outline" className="text-foreground mt-5">
                    Close
                  </Button>
                </CurateSummary>
              )}
              {!forceFinish &&
                queue.map((result, i) => {
                  const tab = curateTabsById[result.tabId]!;
                  return (
                    <SwipeableCard
                      autoFocus={i === 0}
                      key={tab.id + skipCount[tab.id]}
                      constrained
                      className={cn(
                        "focus-ring absolute rounded-2xl perspective-dramatic transform-3d",
                      )}
                      style={{
                        zIndex: remap(i, 0, maxCards, maxCards, 0),
                        y: remap(i, 0, maxCards, 0, -200),
                        scale: remap(i, 0, maxCards, 1, 0.6),
                        filter: `blur(${remap(i, 0, maxCards, 0, 5)}px)`,
                        ...(result.unshifted &&
                          i === 0 && {
                            filter: "blur(10px)",
                            opacity: 0,
                            y: -50,
                            scale: 0.9,
                          }),
                      }}
                      active={i === 0}
                      i={i}
                      swipeableRef={(e) => {
                        if (i === 0) {
                          swipeableRef.current = e;
                        }
                      }}
                      directions={["left", "right", "down"]}
                      onBeforeSwipe={(direction) => handleBeforeSwipe(tab, direction)}
                      onSwipe={(direction) => handleSwipe(tab, direction)}>
                      <CurateCard tab={tab} index={i} visible={i === 0} />
                    </SwipeableCard>
                  );
                })}
            </div>
          </div>
        </div>
        <div
          className={cn(
            "border-border bg-surface-1 fixed bottom-0 z-50 flex min-h-[170px] w-full flex-col items-center justify-center border-t pb-3 backdrop-blur-md transition-all duration-300 ease-in-out",
          )}>
          <div className="flex flex-col items-center justify-center gap-3">
            {!ended && <TagList tagIds={currentTab?.tagIds || []} tabId={currentTab?.id || ""} />}
            <AnimatePresence mode="popLayout">
              {!ended && (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}>
                  <CurateDock>
                    <DockAction
                      onClick={() => swipeableRef.current?.swipe("left")}
                      tooltipText="Delete"
                      className={cn({
                        "scale-90": pressAction === "delete",
                      })}>
                      <XIcon
                        className="h-6 w-6 text-[#F05B5D] shadow-current dark:filter-[drop-shadow(0_0_4px_#D9282B)]"
                        weight="bold"
                      />
                    </DockAction>
                    <div className="flex items-center gap-2">
                      <ButtonWithTooltip
                        variant="outline"
                        size="icon"
                        className="bg-card"
                        tooltipText="Rewind"
                        disabled={hasSkipped}
                        onClick={() => {
                          unshift();
                        }}>
                        <RewindIcon className="text-muted-foreground/60 h-5 w-5" />
                      </ButtonWithTooltip>
                      <ButtonWithTooltip
                        variant="outline"
                        size="icon"
                        className="bg-card"
                        tooltipText="Open"
                        onClick={() => {
                          window.open(currentTab?.url, "_blank");
                        }}>
                        <ArrowLineUpRightIcon className="text-muted-foreground/60 h-5 w-5" />
                      </ButtonWithTooltip>
                      <ButtonWithTooltip
                        variant="outline"
                        size="icon"
                        className="bg-card"
                        tooltipText="Skip"
                        disabled={queue.length < 2}
                        onClick={() => {
                          swipeableRef.current?.swipe("up");
                        }}>
                        <FastForwardIcon className="text-muted-foreground/60 h-5 w-5" />
                      </ButtonWithTooltip>
                    </div>
                    <DockAction
                      onClick={() => swipeableRef.current?.swipe("right")}
                      tooltipText="Keep"
                      className={cn({
                        "scale-90": pressAction === "keep",
                      })}>
                      <HeartIcon
                        className="h-6 w-6 text-[#F05BF0] shadow-current dark:filter-[drop-shadow(0_0_4px_#D328D9)]"
                        weight="bold"
                      />
                    </DockAction>
                  </CurateDock>
                </motion.div>
              )}
            </AnimatePresence>
            {!ended && (
              <ul className="flex items-center gap-2">
                <AnimatePresence mode="popLayout">
                  {applicableReasons.map((r) => {
                    const reason = r as keyof InclusionReason;
                    const threshold = settings.reminder.value;
                    const unit = settings.reminder.unit;

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}>
                        <Tooltip>
                          <TooltipTrigger className="text-muted-foreground">
                            {reason === "hasUnassignedTags" && <TagIcon />}
                            {reason === "hasAITags" && <SparkleIcon />}
                            {reason === "hasQuickTags" && <LightningBoltIcon />}
                            {reason === "olderThanThreshold" && <ClockIcon />}
                          </TooltipTrigger>
                          <TooltipContent>
                            {reason === "hasUnassignedTags" && (
                              <span>This tab has unassigned tags</span>
                            )}
                            {reason === "hasAITags" && <span>This tab has AI tags</span>}
                            {reason === "hasQuickTags" && <span>This tab has quick tags</span>}
                            {reason === "olderThanThreshold" && (
                              <span>This bookmark is older than {pluralize(threshold, unit)}</span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </div>
        <AlertDialog open={confirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{left} links left</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to finish curating?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmDialogOpen(false)}>
                Continue
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setForceFinish(true);
                  setConfirmDialogOpen(false);
                }}
                variant="default">
                Finish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
