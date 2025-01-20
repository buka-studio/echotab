import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@echotab/ui/Dialog";
import { cn } from "@echotab/ui/util";
import {
  ArrowLineUpRight as ArrowLineUpRightIcon,
  FastForward as FastForwardIcon,
  HeartStraight as HeartIcon,
  X as XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useEffect, useRef, useState } from "react";

import { useLLMSummarizeMutation } from "~/src/AI/queries";
import { useUIStore } from "~/src/UIStore";
import { remap } from "~/src/util/math";

import { CurateStore } from ".";
import { SavedTab } from "../models";
import Ruler from "./Ruler";

import "./CurateDialog.css";

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
import Button from "@echotab/ui/Button";
import ButtonWithTooltip from "@echotab/ui/ButtonWithTooltip";
import { NumberFlow } from "@echotab/ui/NumberFlow";

import { AnimatedNumberBadge } from "../components/AnimatedNumberBadge";
import CurateCard from "./CurateCard";
import CurateDock, { DockAction } from "./CurateDock";
import { InclusionResult, useCurateStore } from "./CurateStore";
import CurateSummary from "./CurateSummary";
import SwipeableCard, { Direction, SwipeableRef } from "./SwipeableCard";
import TagList from "./TagList";

interface Props {
  children?: ReactNode;
  maxCards?: number;
}

const useCurateQueue = (maxCards: number) => {
  const curateStore = useCurateStore();
  const [queue, setQueue] = useState<InclusionResult[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setInitialized(curateStore.open);
    if (curateStore.open) {
      setQueue(curateStore.queue);
    }
  }, [curateStore.open]);

  const [kept, setKept] = useState<InclusionResult[]>([]);
  const [deleted, setDeleted] = useState<InclusionResult[]>([]);

  const dequeue = (choice: "keep" | "delete" | "skip") => {
    const [item, ...wipQueue] = queue;

    if (choice === "keep") {
      setKept((prev) => [...prev, item]);
      setQueue(wipQueue);
    } else if (choice === "delete") {
      setDeleted((prev) => [...prev, item]);
      setQueue(wipQueue);
    } else if (choice === "skip") {
      setQueue([...wipQueue, item]);
    }
  };

  const visibleQueue = queue.slice(0, maxCards);

  return {
    queue: visibleQueue,
    total: curateStore.queue.length,
    dequeue,
    left: queue.length,
    kept,
    deleted,
    initialized,
  };
};

export function CurateTrigger({ children }: { children: ReactNode }) {
  return <DialogTrigger asChild>{children}</DialogTrigger>;
}

export default function Curate({ children, maxCards = 5 }: Props) {
  const curateStore = useCurateStore();
  const uiStore = useUIStore();

  const { initialized, queue, kept, deleted, left, total, dequeue } = useCurateQueue(maxCards);

  const swipeableRef = useRef<SwipeableRef | null>(null);

  const handleSwipe = (tab: SavedTab, direction?: Direction) => {
    if (direction === "left") {
      dequeue("delete");
    } else if (direction === "right") {
      dequeue("keep");
    } else if (direction === "up") {
      dequeue("skip");
      setSkipCount((prev) => ({ ...prev, [tab.id]: (prev[tab.id] || 0) + 1 }));
    }
  };

  const llmSummarizeMutation = useLLMSummarizeMutation();
  const aiDisabled = !uiStore.settings.aiApiProvider;

  const handleFinish = () => {
    if (kept.length + deleted.length !== 0) {
      CurateStore.saveSession({
        kept: kept.length,
        deleted: deleted.length,
      });
    }

    curateStore.setOpen(false);
  };

  const currentTab = queue[0]?.tab;

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [forceFinish, setForceFinish] = useState(false);

  const ended = initialized && (forceFinish || left === 0);

  const [skipCount, setSkipCount] = useState<Record<string, number>>({});

  return (
    <Dialog
      open={curateStore.open}
      onOpenChange={(state) => {
        if (state) {
          curateStore.setOpen(true);
        } else {
          if (left > 0 && !forceFinish) {
            setConfirmDialogOpen(true);
          } else {
            curateStore.setOpen(false);
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
          "flex h-full max-h-[100vh] max-w-[100vw] flex-col overflow-hidden border-none bg-transparent p-0",
        )}
        overlay={<DialogOverlay className="bg-background-base brightness-90" />}>
        <Ruler value={deleted.length} side="left">
          <AnimatedNumberBadge value={deleted.length} />
        </Ruler>
        <Ruler value={kept.length} side="right">
          <AnimatedNumberBadge value={kept.length} />
        </Ruler>

        <DialogHeader
          className={cn(
            "border-border fixed left-0 right-0 top-0 z-50 mx-auto w-full max-w-[calc(100vw-200px)] border-b p-8 pb-2 text-center backdrop-blur-md transition-all duration-300 ease-in-out",
            {
              "translate-y-[-200px] opacity-0": ended,
            },
          )}>
          <DialogTitle className="sr-only">Curate</DialogTitle>
          <DialogDescription className="flex items-center justify-between text-sm">
            <span>Swipe left to remove</span>
            <span
              className={cn("flex items-center gap-2", {
                "opacity-0": left === 0,
              })}>
              <NumberFlow value={left} /> links left
            </span>
            <span>Swipe right to keep</span>
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
                  const tab = result.tab;
                  return (
                    <SwipeableCard
                      autoFocus={i === 0}
                      key={tab.id + skipCount[tab.id]}
                      constrained
                      className={cn("focus-ring absolute rounded-2xl")}
                      style={{
                        zIndex: remap(i, 0, maxCards, maxCards, 0),
                        y: remap(i, 0, maxCards, 0, -200),
                        scale: remap(i, 0, maxCards, 1, 0.6),
                        filter: `blur(${remap(i, 0, maxCards, 0, 5)}px)`,
                      }}
                      active={i === 0}
                      i={i}
                      swipeableRef={(e) => {
                        if (i === 0) {
                          swipeableRef.current = e;
                        }
                      }}
                      directions={left > 1 ? ["left", "right", "up"] : ["left", "right"]}
                      onSwiped={(direction) => handleSwipe(tab, direction)}>
                      <CurateCard tab={tab} visible={i === 0} />
                    </SwipeableCard>
                  );
                })}
            </div>
            <div className="blur-mask absolute inset-0 z-[1000]" />
          </div>
        </div>
        <div
          className={cn(
            "border-border bg-surface-1 fixed bottom-0 z-50 flex min-h-[170px] w-full flex-col items-center justify-center border-t pb-5 backdrop-blur-md transition-all duration-300 ease-in-out",
          )}>
          <div className="flex flex-col items-center justify-center gap-5">
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
                      tooltipText="Delete">
                      <XIcon
                        className="h-6 w-6 text-[#F05B5D] shadow-current [filter:drop-shadow(0_0_4px_#D9282B)]"
                        weight="bold"
                      />
                    </DockAction>
                    <div className="flex items-center gap-2">
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
                      tooltipText="Keep">
                      <HeartIcon
                        className="h-6 w-6 text-[#F05BF0] shadow-current [filter:drop-shadow(0_0_4px_#D328D9)]"
                        weight="bold"
                      />
                    </DockAction>
                  </CurateDock>
                </motion.div>
              )}
            </AnimatePresence>
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
                variant="destructive">
                Finish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
