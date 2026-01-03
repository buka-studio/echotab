import { Button } from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { ReactNode } from "react";

import usePatternBackground from "~/hooks/usePatternBackground";
import { SavedTab } from "~/models";
import { useTabInfoQuery } from "~/TabInfo/queries";

function OgImageEmptyState({
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

export function OGImage({ tab, preload }: { tab: SavedTab; preload?: boolean }) {
  const info = useTabInfoQuery({ tabId: tab.id, url: tab.url, enabled: preload !== false });

  if (info.isError) {
    return (
      <OgImageEmptyState title="Image not available">
        <div className="flex flex-col items-center gap-2">
          Failed to fetch image.
          <Button variant="outline" size="sm" onClick={() => info.refetch()}>
            Retry
          </Button>
        </div>
      </OgImageEmptyState>
    );
  }

  if (info.isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="animate-shimmer-text text-sm">Loading...</span>
      </div>
    );
  }

  if (!info.data?.image) {
    return (
      <OgImageEmptyState title="No image available">This page has no OG image.</OgImageEmptyState>
    );
  }

  return (
    <div className="flex h-full items-center justify-center overflow-hidden rounded-lg">
      <img
        src={info.data.image}
        alt={info.data.title || "Preview"}
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
