import { Button } from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

import { useLLMSummarizeQuery } from "~/AI/queries";
import usePatternBackground from "~/hooks/usePatternBackground";
import { SavedTab } from "~/models";
import { useUIStore } from "~/UIStore";

import { useTypingAnimation } from "./useTypingAnimation";

const AIEmptyState = ({ className, children }: { className?: string; children?: ReactNode }) => {
  const patternBg = usePatternBackground("diagonal_lines");

  return (
    <div
      className={cn(
        "border-border relative flex h-full w-full flex-1 flex-col items-center justify-center gap-2 rounded-lg border text-sm",
        className,
      )}>
      <div
        className="bg-background absolute inset-0 rounded-lg mask-[linear-gradient(180deg,transparent_60%,black)]"
        style={{ backgroundImage: patternBg }}
      />
      <div className="text-sm">AI Summary not available</div>
      <div className="relative z-1">
        <div className="text-muted-foreground text-center">
          {children || "Enable AI Summary by adding LLM endpoint details in settings."}
        </div>
      </div>
    </div>
  );
};

const AnimatedText = ({ text }: { text: string }) => {
  const displayedText = useTypingAnimation({
    text: text || "",
    speed: 50,
    splitter: (str) => str.split(/(?= )/),
  });

  return displayedText.map((text, i) => (
    <motion.span
      key={i}
      initial={{ opacity: 0, filter: "blur(6px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}>
      {text}
    </motion.span>
  ));
};

export function AISummaryDescription({ tab, className }: { tab: SavedTab; className?: string }) {
  const uiStore = useUIStore();
  const aiEnabled = Boolean(uiStore.settings.aiApiProvider);
  const llmSummary = useLLMSummarizeQuery({ tab });

  if (!aiEnabled) {
    return <AIEmptyState />;
  }

  if (llmSummary.isError) {
    return (
      <AIEmptyState>
        <div className="flex flex-col items-center gap-2">
          There was an error summarizing this link.
          <Button variant="outline" size="sm" onClick={() => llmSummary.refetch()}>
            Retry
          </Button>
        </div>
      </AIEmptyState>
    );
  }

  return (
    <div className={cn("text-foreground text-left text-sm leading-5", className)}>
      <AnimatePresence mode="popLayout">
        {llmSummary.isPending && (
          <motion.div
            initial={{ opacity: 0, filter: "blur(5px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(5px)" }}
            transition={{ duration: 0.25, delay: 0.25 }}>
            <span className="animate-shimmer-text">Summarizing...</span>
          </motion.div>
        )}
      </AnimatePresence>
      {llmSummary.data && <AnimatedText text={llmSummary.data} />}
    </div>
  );
}
