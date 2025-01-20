import { Tabs, TabsContent, TabsList, TabsTrigger } from "@echotab/ui/Tabs";
import { cn } from "@echotab/ui/util";
import {
  BookmarkSimple as BookmarkSimpleIcon,
  FrameCorners as FrameCornersIcon,
  GlobeSimple as GlobeSimpleIcon,
  Sparkle as SparkleIcon,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { ReactNode, useEffect, useMemo, useState } from "react";

import SnapshotPreview from "~/src/components/SnapshotPreview";
import { Favicon } from "~/src/components/TabItem";

import { SavedTab } from "../models";

const defaultDescription =
  "React is the library for web and native user interfaces. Build user interfaces out of individual pieces called components written in JavaScript. React is designed to let you seamlessly combine components written by independent people, teams, and organizations.";

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
    <GlobeSimpleIcon className="h-4 w-4 flex-shrink-0" />
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

    onAnimationEnd?.();
  }, [textParts, currentIndex, speed, onAnimationEnd, disabled]);

  return displayedText;
};

const Jumbo = ({ tab, className }: { tab: SavedTab; className?: string }) => {
  return (
    <div className={cn("flex items-center gap-4 pr-2", className)}>
      <Favicon
        src={tab.url}
        className="bg-muted h-14 w-14 flex-shrink-0 rounded-lg [&>*]:h-10 [&>*]:w-10"
      />
      <div className="flex flex-col text-left">
        <h1 className="line-clamp-1 text-sm font-bold">{tab.title}</h1>
        <div className="text-muted-foreground text-sm">
          <span className="">Saved {formatSavedAt(tab.savedAt)} ago</span> / Visited{" "}
          {formatSavedAt(tab.visitedAt || tab.savedAt)} ago
        </div>

        {/* <TagList tab={tab} /> */}
      </div>
    </div>
  );
};

const AISummaryDescription = ({ tab, className }: { tab: SavedTab; className?: string }) => {
  const displayedText = useTypingAnimation({
    text: tab.metadata?.description || defaultDescription,
    speed: 50,
    splitter: (str) => str.split(/(?= )/),
    onAnimationEnd: () => {},
    disabled: false,
  });

  return (
    <div className={cn("text-foreground text-left text-sm leading-5", className)}>
      {displayedText.map((text, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}>
          {text}
        </motion.span>
      ))}
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
        <Tabs defaultValue="snapshot" className="flex flex-1 flex-col">
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

          <TabsContent value="summary">
            <AISummaryDescription tab={tab} className="p-2" />
          </TabsContent>
          <TabsContent value="snapshot" className="relative flex flex-1 flex-col justify-center">
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
