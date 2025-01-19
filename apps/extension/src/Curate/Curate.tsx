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
import { HeartStraight as HeartIcon, Trash as TrashIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useEffect, useRef, useState } from "react";

import { useLLMSummarizeMutation } from "~/src/AI/queries";
import TagChip from "~/src/components/tag/TagChip";
import { useTagStore } from "~/src/TagStore";
import { useUIStore } from "~/src/UIStore";
import { remap } from "~/src/util/math";

import { CurateStore } from ".";
import { SavedTab } from "../models";
import ChoiceButton, { ButtonRef } from "./ChoiceButton";

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
import { NumberFlow } from "@echotab/ui/NumberFlow";

import CardStack from "./CardStack";
import CurateCard from "./CurateCard";
import { InclusionResult, useCurateStore } from "./CurateStore";
import CurateSummary from "./CurateSummary";
import SwipeableCard, { SwipeableRef } from "./SwipeableCard";

interface Props {
  children?: ReactNode;
  maxCards?: number;
}

const TagList = ({ tagIds, tabId }: { tagIds: number[]; tabId: string }) => {
  const tagStore = useTagStore();

  return (
    <motion.ul className="flex flex-wrap gap-2" layout>
      <AnimatePresence mode="wait">
        {tagIds.map((id, i) => {
          const tag = tagStore.tags.get(id);
          return (
            <motion.div
              key={id + "_" + tabId}
              initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
              transition={{ delay: 0.1 * i, duration: 0.1 }}>
              <TagChip color={tag?.color}>{tag!.name}</TagChip>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.ul>
  );
};

const useCurateQueue = (maxCards: number) => {
  const curateStore = useCurateStore();
  const [queue, setQueue] = useState<InclusionResult[]>([]);
  const [skipped, setSkipped] = useState<InclusionResult[]>([]);

  const next = useRef(0);
  const total = useRef(curateStore.queue.length);
  const left = useRef(0);
  const curated = useRef(0);

  useEffect(() => {
    if (curateStore.open) {
      setQueue(curateStore.queue.slice(0, maxCards));
      next.current = maxCards;
      total.current = curateStore.queue.length;
      left.current = total.current;
      curated.current = 0;
    }
  }, [curateStore.open]);

  const [kept, setKept] = useState<InclusionResult[]>([]);
  const [deleted, setDeleted] = useState<InclusionResult[]>([]);

  const totalCount = total.current + skipped.length;

  const dequeue = (choice: "keep" | "delete" | "skip") => {
    const [item, ...wipQueue] = queue;

    if (next.current < totalCount) {
      wipQueue.push(curateStore.queue.concat(skipped)[next.current]);
      next.current = Math.min(next.current + 1, totalCount);
    }

    setQueue(wipQueue);

    if (choice === "keep") {
      setKept((prev) => [...prev, item]);
    } else if (choice === "delete") {
      setDeleted((prev) => [...prev, item]);
    } else if (choice === "skip") {
      setSkipped((prev) => [...prev, item]);
      return;
    }

    curated.current = Math.min(curated.current + 1, totalCount);
    left.current = Math.max(0, left.current - 1);
  };
  // console.log({ queue, setQueue, i: next, total, dequeue, kept, deleted });
  return {
    queue,
    setQueue,
    i: next.current,
    total: totalCount,
    dequeue,
    left: left.current,
    kept,
    deleted,
  };
};

export function CurateTrigger({ children }: { children: ReactNode }) {
  return <DialogTrigger asChild>{children}</DialogTrigger>;
}

export default function Curate({ children, maxCards = 5 }: Props) {
  const curateStore = useCurateStore();
  const curateLinks = useCurateStore();
  const uiStore = useUIStore();

  const { queue, setQueue, kept, deleted, i, left, total, dequeue } = useCurateQueue(maxCards);

  const discardRef = useRef<ButtonRef>(null);
  const keepRef = useRef<ButtonRef>(null);
  const swipeableRef = useRef<SwipeableRef | null>(null);

  const handleKeep = (tab: SavedTab, btn = true) => {
    if (btn) {
      keepRef.current?.activate("clicked");
    }

    dequeue("keep");
  };

  const handleDelete = (tab: SavedTab, btn = true) => {
    if (btn) {
      discardRef.current?.activate("clicked");
    }

    dequeue("delete");
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

  const ended = forceFinish || left === 0;

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
        // overlay={<DialogOverlay className="bg-white/60 backdrop-blur-md dark:bg-black/60" />}>
        overlay={<DialogOverlay className="bg-background-base brightness-90" />}>
        <DialogHeader
          className={cn(
            "border-border fixed left-0 right-0 top-0 z-50 w-full max-w-screen-xl border-b p-8 pb-2 text-center backdrop-blur-md transition-all duration-300 ease-in-out",
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
                      key={tab.id}
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
                      onSwiped={(direction) => {
                        if (direction === "left") {
                          handleDelete(tab);
                        } else if (direction === "right") {
                          handleKeep(tab);
                        }
                      }}>
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
            "fixed bottom-0 z-50 flex min-h-[150px] w-full flex-col items-center justify-center gap-10 pb-10 backdrop-blur-md transition-all duration-300 ease-in-out",
            {
              "translate-y-[100px]": ended,
            },
          )}>
          <div
            className={cn(
              "absolute bottom-full right-[calc(100%-100px)] transition-all duration-500",
              {
                "opacity-0": ended,
              },
            )}>
            <CardStack count={Math.min(deleted.length, 10)} />
          </div>
          <div
            className={cn(
              "absolute bottom-[calc(100%-20px)] flex w-full max-w-xs justify-between gap-10 transition-all duration-500",
              {
                "opacity-0": ended,
              },
            )}>
            <ChoiceButton
              ref={discardRef}
              onClick={() => swipeableRef.current?.swipe("left")}
              color="#3C24D7"
              IconElement={TrashIcon}
            />
            <ChoiceButton
              ref={keepRef}
              onClick={() => swipeableRef.current?.swipe("right")}
              color="#f0abfc"
              IconElement={HeartIcon}
            />
          </div>
          <CardStack
            count={Math.min(kept.length, 10)}
            className={cn("absolute bottom-full left-full transition-all duration-500", {
              "opacity-0": ended,
            })}
          />
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

          {/* <TagList tagIds={currentTab?.tagIds || []} tabId={currentTab?.id || ""} /> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
