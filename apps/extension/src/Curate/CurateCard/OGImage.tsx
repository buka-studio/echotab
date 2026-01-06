import { Button } from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { ReactNode } from "react";

import usePatternBackground from "~/hooks/usePatternBackground";
import { SavedTab } from "~/models";
import { useTabInfoQuery } from "~/TabInfo/queries";

function OGImageFallbackState({
  className,
  children,
  title = "Image not available.",
}: {
  className?: string;
  children?: ReactNode;
  title?: ReactNode;
}) {
  const patternBg = usePatternBackground("diagonal_lines");

  return (
    <div
      className={cn(
        "border-border/50 relative flex h-full w-full flex-1 flex-col items-center justify-center gap-2 rounded-lg border text-sm",
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
  const patternBg = usePatternBackground("diagonal_lines");

  if (info.isError) {
    return (
      <OGImageFallbackState title="Image not available.">
        <div className="flex flex-col items-center gap-2">
          Failed to fetch OG image.
          <Button variant="outline" size="sm" onClick={() => info.refetch()}>
            Retry
          </Button>
        </div>
      </OGImageFallbackState>
    );
  }

  if (info.isPending) {
    return (
      <OGImageFallbackState
        title={<span className="animate-shimmer-text text-sm">Fetching image...</span>}
      />
    );
  }

  if (!info.data?.image) {
    return (
      <OGImageFallbackState title="No image available.">
        This page has no OG image.
      </OGImageFallbackState>
    );
  }

  return (
    <div
      className="flex h-full items-center justify-center overflow-hidden rounded-lg"
      style={{ backgroundImage: patternBg }}>
      <img
        src={info.data.image}
        alt={info.data.title || "Preview"}
        className="h-full max-h-[245px] w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
