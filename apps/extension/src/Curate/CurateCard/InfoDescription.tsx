import { Button } from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

import usePatternBackground from "~/hooks/usePatternBackground";
import { SavedTab } from "~/models";
import { useTabInfoQuery } from "~/TabInfo/queries";

function InfoEmptyState({
  className,
  children,
  title = "Info not available",
}: {
  className?: string;
  children?: ReactNode;
  title?: string;
}) {
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
      <div className="text-sm">{title}</div>
      <div className="relative z-1">
        <div className="text-muted-foreground text-center">{children || ""}</div>
      </div>
    </div>
  );
}

export function InfoDescription({
  tab,
  className,
  preload,
}: {
  tab: SavedTab;
  className?: string;
  preload?: boolean;
}) {
  const info = useTabInfoQuery({ tabId: tab.id, url: tab.url, enabled: preload !== false });

  if (info.isError) {
    return (
      <InfoEmptyState>
        <div className="flex flex-col items-center gap-2">
          There was an error fetching info for this bookmark.
          <Button variant="outline" size="sm" onClick={() => info.refetch()}>
            Retry
          </Button>
        </div>
      </InfoEmptyState>
    );
  }

  if (info.isPending) {
    return (
      <div className={cn("text-foreground text-left text-sm leading-5", className)}>
        <AnimatePresence mode="popLayout">
          <motion.div
            initial={{ opacity: 0, filter: "blur(5px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(5px)" }}
            transition={{ duration: 0.25, delay: 0.25 }}>
            <span className="animate-shimmer-text">Fetching info...</span>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (!info.data) {
    return <InfoEmptyState>No metadata available for this page.</InfoEmptyState>;
  }

  const metadata = info.data;
  const hasAnyInfo =
    metadata.description ||
    metadata.siteName ||
    metadata.author ||
    metadata.type ||
    metadata.publishedTime ||
    (metadata.keywords && metadata.keywords.length > 0);

  if (!hasAnyInfo) {
    return <InfoEmptyState>No metadata available for this page.</InfoEmptyState>;
  }

  return (
    <div className={cn("flex flex-col gap-3 text-left text-sm", className)}>
      {metadata.description && (
        <div>
          <span className="text-muted-foreground text-xs font-medium uppercase">Description</span>
          <p className="text-foreground leading-relaxed">{metadata.description}</p>
        </div>
      )}

      {metadata.siteName && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium uppercase">Site</span>
          <span className="text-foreground">{metadata.siteName}</span>
        </div>
      )}

      {metadata.author && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium uppercase">Author</span>
          <span className="text-foreground">{metadata.author}</span>
        </div>
      )}

      {metadata.type && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium uppercase">Type</span>
          <span className="text-foreground capitalize">{metadata.type}</span>
        </div>
      )}

      {metadata.publishedTime && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium uppercase">Published</span>
          <span className="text-foreground">
            {formatDistanceToNow(new Date(metadata.publishedTime))} ago
          </span>
        </div>
      )}

      {metadata.keywords && metadata.keywords.length > 0 && (
        <div>
          <span className="text-muted-foreground text-xs font-medium uppercase">Keywords</span>
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
    </div>
  );
}
