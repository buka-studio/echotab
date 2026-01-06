import { cn } from "@echotab/ui/util";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";

import usePatternBackground from "~/hooks/usePatternBackground";
import { SnapshotStore } from "~/snapshot";

function useSnapshot(url: string) {
  return useQuery({
    queryKey: ["snapshots", url],
    staleTime: 0,
    queryFn: async () => {
      const snapshotStore = await SnapshotStore.init();
      const snap = await snapshotStore.getSnapshot(url);

      if (snap?.blob) {
        return URL.createObjectURL(snap.blob);
      }

      return null;
    },
  });
}

function SnapshotFallbackState({
  className,
  children,
  title = "No snapshot available.",
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

type Props = {
  url: string;
  className?: string;
  onVisit?: () => void;
};

export default function SnapshotPreview({ url, className }: Props) {
  const { data, isLoading } = useSnapshot(url);
  const patternBg = usePatternBackground("diagonal_lines");

  if (isLoading) {
    return <SnapshotFallbackState title="Loading snapshot..." />;
  }

  if (!data) {
    return <SnapshotFallbackState title="No snapshot available." />;
  }

  return (
    <div
      className={cn(
        "flex h-full items-center justify-center overflow-hidden rounded-lg",
        className,
      )}
      style={{ backgroundImage: patternBg }}>
      <img
        src={data}
        alt="Snapshot preview"
        className="h-full max-h-[245px] w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
