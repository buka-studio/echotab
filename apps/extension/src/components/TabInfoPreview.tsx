import { Button } from "@echotab/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@echotab/ui/Tabs";
import { cn } from "@echotab/ui/util";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { ComponentProps, ReactNode, useState } from "react";
import { create } from "zustand";

import usePatternBackground from "~/hooks/usePatternBackground";
import { useTabInfoQuery } from "~/TabInfo/queries";

interface TabLike {
  url: string;
}

const contentAnimationProps = {
  initial: { opacity: 0, filter: "blur(2px)", scale: 0.95 },
  animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
  exit: { opacity: 0, filter: "blur(2px)", scale: 0.95 },
  transition: { duration: 0.2 },
};

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 15 : -15,
    opacity: 0,
    filter: "blur(2px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 15 : -15,
    opacity: 0,
    filter: "blur(2px)",
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  }),
};

const AnimatedTabsContent = motion.create(TabsContent);

function FallbackState({
  className,
  children,
  title = "Not available.",
  ...props
}: {
  className?: string;
  children?: ReactNode;
  title?: ReactNode;
}) {
  const patternBg = usePatternBackground("diagonal_lines");

  return (
    <motion.div
      className={cn(
        "border-border/50 relative flex h-full w-full flex-1 flex-col items-center justify-center gap-2 rounded-lg border text-sm",
        className,
      )}
      {...contentAnimationProps}
      {...props}>
      <div
        className="bg-background absolute inset-0 rounded-lg mask-[linear-gradient(0deg,transparent_15%,black)]"
        style={{ backgroundImage: patternBg }}
      />
      <div className="text-sm">{title}</div>
      <div className="relative z-1">
        <div className="text-muted-foreground text-center">{children || ""}</div>
      </div>
    </motion.div>
  );
}

export function OGImage({
  tab,
  preload,
  className,
  scope = "page",
}: {
  tab: TabLike;
  preload?: boolean;
  className?: string;
  scope?: string;
}) {
  const info = useTabInfoQuery({ url: tab.url, enabled: preload !== false });
  const patternBg = usePatternBackground("diagonal_lines");

  if (info.isError) {
    return (
      <FallbackState key="image-failed" title="Image not available." className={className}>
        <div className="flex flex-col items-center gap-2">
          Failed to fetch OG image.
          <Button variant="outline" size="sm" onClick={() => info.refetch()}>
            Retry
          </Button>
        </div>
      </FallbackState>
    );
  }

  if (info.isPending) {
    return (
      <FallbackState
        key="image-fetching"
        title={<span className="animate-shimmer-text text-sm">Fetching image...</span>}
        className={className}
      />
    );
  }

  if (!info.data?.image) {
    return (
      <FallbackState key="image-no-image" title="No image available." className={className}>
        This {scope} has no OG image.
      </FallbackState>
    );
  }

  return (
    <motion.div
      key="image-loaded"
      className={cn(
        "flex h-full items-center justify-center overflow-hidden rounded-md",
        className,
      )}
      {...contentAnimationProps}
      style={{ backgroundImage: patternBg }}>
      <img
        src={info.data.image}
        alt={info.data.title || "Preview"}
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </motion.div>
  );
}

export function InfoDescription({
  tab,
  className,
  preload,
  scope = "page",
}: {
  tab: TabLike;
  className?: string;
  preload?: boolean;
  scope?: string;
}) {
  const info = useTabInfoQuery({ url: tab.url, enabled: preload !== false });

  if (info.isError) {
    return (
      <FallbackState key="info-failed" title="Info not available." className={className}>
        <div className="flex flex-col items-center gap-2">
          There was an error fetching info for this {scope}.
          <Button variant="outline" size="sm" onClick={() => info.refetch()}>
            Retry
          </Button>
        </div>
      </FallbackState>
    );
  }

  if (info.isPending) {
    return (
      <FallbackState
        key="info-fetching"
        title={<span className="animate-shimmer-text text-sm">Fetching info...</span>}
        className={className}
      />
    );
  }

  if (!info.data) {
    return (
      <FallbackState key="info-no-metadata" title="Info not available." className={className}>
        No metadata available for this {scope}.
      </FallbackState>
    );
  }

  const metadata = info.data;
  const hasAnyInfo =
    metadata.description ||
    metadata.author ||
    metadata.publishedTime ||
    (metadata.keywords && metadata.keywords.length > 0);

  if (!hasAnyInfo) {
    return (
      <FallbackState key="info-no-info" title="Info not available." className={className}>
        No metadata available for this {scope}.
      </FallbackState>
    );
  }

  return (
    <motion.div
      key="info-loaded"
      className={cn(
        "*:not-last:border-border flex flex-col gap-3 text-left text-sm *:not-last:border-b *:not-last:pb-3",
        className,
      )}
      {...contentAnimationProps}>
      {metadata.description && (
        <div>
          <span className="text-muted-foreground">Description</span>
          <p className="text-foreground leading-relaxed">{metadata.description}</p>
        </div>
      )}

      {metadata.author && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Author</span>
          <span className="text-foreground">{metadata.author}</span>
        </div>
      )}

      {metadata.publishedTime && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Published</span>
          <span className="text-foreground">
            {formatDistanceToNow(new Date(metadata.publishedTime))} ago
          </span>
        </div>
      )}

      {metadata.keywords && metadata.keywords.length > 0 && (
        <div>
          <span className="text-muted-foreground">Keywords</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {metadata.keywords.slice(0, 5).map((keyword, i) => (
              <span
                key={i}
                className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                {keyword}
              </span>
            ))}
            {metadata.keywords.length > 5 && (
              <span className="text-muted-foreground text-xs">
                +{metadata.keywords.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

const tabs = ["image", "info"] as const;
type TabValue = (typeof tabs)[number];

interface TabInfoPreviewStore {
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
}

const useTabInfoPreviewStore = create<TabInfoPreviewStore>((set) => ({
  activeTab: "image",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

function TabIndicator({ ...props }) {
  return (
    <motion.span
      layoutId="tab-indicator"
      className="bg-background dark:border-input dark:bg-card-active absolute inset-0 rounded-md border border-transparent shadow-sm will-change-transform"
      transition={{
        type: "spring",
        bounce: 0.1,
        duration: 0.25,
      }}
      style={{
        originY: "0px",
      }}
      {...props}
    />
  );
}

function InfoTabTrigger({ className, children, ...props }: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "relative z-1 flex-1 gap-2 rounded border-none! bg-transparent! px-2 py-1 text-xs shadow-none!",
        className,
      )}
      {...props}>
      {children}
    </TabsTrigger>
  );
}

export function TabInfoPreview({
  tab,
  className,
  contentClassName,
  preload,
}: {
  tab: TabLike;
  className?: string;
  contentClassName?: string;
  preload?: boolean;
}) {
  const activeTab = useTabInfoPreviewStore((s) => s.activeTab);
  const setActiveTab = useTabInfoPreviewStore((s) => s.setActiveTab);
  const [direction, setDirection] = useState(0);

  const handleTabChange = (val: string) => {
    const newIndex = tabs.indexOf(val as TabValue);
    const oldIndex = tabs.indexOf(activeTab);

    if (newIndex > oldIndex) {
      setDirection(1);
    } else if (newIndex < oldIndex) {
      setDirection(-1);
    }

    setActiveTab(val as TabValue);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className={cn("flex flex-1 flex-col gap-1 overflow-hidden p-1", className)}
      key={tab.url}>
      <TabsList className="relative h-auto w-full rounded-md" key={tab.url}>
        <InfoTabTrigger value="image">
          {activeTab === "image" && (
            <TabIndicator key={tab.url} layoutId={`tab-indicator-${tab.url}`} />
          )}
          <span className="relative z-10">Image</span>
        </InfoTabTrigger>
        <InfoTabTrigger value="info">
          {activeTab === "info" && (
            <TabIndicator key={tab.url} layoutId={`tab-indicator-${tab.url}`} />
          )}
          <span className="relative z-10">Info</span>
        </InfoTabTrigger>
      </TabsList>

      <div
        className={cn("relative flex min-h-0 flex-1 overflow-clip rounded-md", contentClassName)}>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <AnimatedTabsContent
            key={activeTab}
            value={activeTab}
            forceMount
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="scroll-fade scrollbar-gray mt-0 flex flex-col overflow-auto">
            <AnimatePresence mode="popLayout">
              {activeTab === "image" && <OGImage tab={tab} preload={preload} />}
              {activeTab === "info" && (
                <InfoDescription tab={tab} className="p-2 pb-3" preload={preload} />
              )}
            </AnimatePresence>
          </AnimatedTabsContent>
        </AnimatePresence>
      </div>
    </Tabs>
  );
}
