import { Button } from "@echotab/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@echotab/ui/Tabs";
import { cn } from "@echotab/ui/util";
import {
  BookmarkSimpleIcon,
  FrameCornersIcon,
  GlobeSimpleIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useEffect, useMemo, useState } from "react";

import SnapshotPreview from "~/components/SnapshotPreview";
import { Favicon } from "~/components/TabItem";

import { useLLMSummarizeQuery } from "../AI/queries";
import usePatternBackground from "../hooks/usePatternBackground";
import { SavedTab } from "../models";
import { useUIStore } from "../UIStore";

const Header = ({
  children,
  bookmarked = true,
  className,
}: {
  children: ReactNode;
  bookmarked?: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      "header relative flex w-full items-center justify-between gap-5 overflow-hidden px-5 py-2",
      className,
    )}>
    <div className="flex items-center justify-center gap-1">
      <div className="bg-muted h-3 w-3 rounded-full" />
      <div className="bg-muted h-3 w-3 rounded-full" />
      <div className="bg-muted h-3 w-3 rounded-full" />
    </div>
    {children}
    <span>
      <BookmarkSimpleIcon
        className={cn("text-muted h-4 w-4 translate-y-[-10px] scale-[2]", {
          "opacity-100": bookmarked,
          "opacity-0": !bookmarked,
        })}
        weight="fill"
      />
    </span>
  </div>
);

const HeaderUrl = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={cn(
      "text-muted-foreground border-border flex items-center gap-2 overflow-hidden rounded-full border px-2 py-1 pl-1 text-xs",
      className,
    )}>
    <GlobeSimpleIcon className="h-4 w-4 shrink-0" />
    <span className="line-clamp-1 overflow-hidden text-ellipsis whitespace-nowrap">{children}</span>
  </div>
);

const formatSavedAt = (savedAt: string) => {
  return formatDistanceToNow(savedAt);
};

const useTypingAnimation = ({
  text,
  speed = 50,
  splitter = (t) => [...t],
  onAnimationEnd,
  disabled,
}: {
  text: string;
  speed?: number;
  splitter?: (t: string) => string[];
  onAnimationEnd?: () => void;
  disabled?: boolean;
}) => {
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const textParts = useMemo(() => splitter(text), [text, splitter]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    if (currentIndex < textParts.length) {
      const timer = setTimeout(
        () => {
          setDisplayedText((prev) => [...prev, textParts[currentIndex]]);
          setCurrentIndex((prev) => prev + 1);
        },
        speed + speed * (Math.random() - 0.5),
      );

      return () => clearTimeout(timer);
    }

    if (currentIndex === textParts.length && textParts.length > 0) {
      onAnimationEnd?.();
    }
  }, [textParts, currentIndex, speed, onAnimationEnd, disabled]);

  return displayedText;
};

const Jumbo = ({ tab, className }: { tab: SavedTab; className?: string }) => {
  return (
    <div className={cn("flex items-center gap-4 pr-2", className)}>
      <Favicon src={tab.url} className="bg-muted h-14 w-14 shrink-0 rounded-lg *:h-10 *:w-10" />
      <div className="flex flex-col text-left">
        <h1 className="line-clamp-1 text-sm font-bold break-all">{tab.title}</h1>
        {tab.savedAt && (
          <div className="text-muted-foreground text-sm">
            <span className="">Saved {formatSavedAt(tab.savedAt)} ago</span> / Visited{" "}
            {formatSavedAt(tab.visitedAt || tab.savedAt)} ago
          </div>
        )}
      </div>
    </div>
  );
};

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

const AISummaryDescription = ({ tab, className }: { tab: SavedTab; className?: string }) => {
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
};

export default function CurateCard({ tab, visible }: { tab: SavedTab; visible: boolean }) {
  return (
    <article className="border-border bg-background flex h-[400px] w-[420px] flex-col rounded-xl border">
      <Header className="border-border border-b">
        <HeaderUrl className={cn("transition-opacity duration-150", { "opacity-0": !visible })}>
          {tab.url}
        </HeaderUrl>
      </Header>
      <div className="flex flex-1 flex-col gap-3 p-2 pt-3">
        <Jumbo tab={tab} className="" />
        <Tabs defaultValue="snapshot" className="flex flex-1 flex-col overflow-auto" key={tab.id}>
          <div className="flex justify-between">
            <TabsList className="ml-auto h-auto w-full rounded-md">
              <TabsTrigger value="snapshot" className="flex-1 gap-2 rounded px-2 py-1 text-xs">
                <FrameCornersIcon className="h-4 w-4" />
                Snapshot
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex-1 gap-2 rounded px-2 py-1 text-xs">
                <SparkleIcon className="h-4 w-4" />
                Summary
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="summary" className="overflow-auto not-empty:flex-1">
            <AISummaryDescription tab={tab} className="p-2 pb-3" />
          </TabsContent>
          <TabsContent
            value="snapshot"
            className="relative flex flex-col justify-center not-empty:flex-1">
            <SnapshotPreview
              tab={{ id: tab.id, url: tab.url }}
              className="border-border rounded-lg border"
            />
          </TabsContent>
        </Tabs>
      </div>
    </article>
  );
}
