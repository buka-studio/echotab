import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import { cn } from "@echotab/ui/util";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

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

const NoSnapshot = ({ onVisit }: { onVisit: () => void }) => {
  const patternBg = usePatternBackground("diagonal_lines");

  return (
    <div className="relative flex h-full w-full flex-1 flex-col items-center justify-center gap-2 rounded-lg text-sm">
      <div
        className="bg-background absolute inset-0 rounded-lg [mask-image:linear-gradient(180deg,transparent_60%,black)]"
        style={{ backgroundImage: patternBg }}
      />
      <div className="text-sm">No snapshot available</div>
      <div className="relative z-1">
        <div className="text-muted-foreground text-center">
          A snapshot will be taken
          <br />
          the next time you{" "}
          <button className="text-foreground underline" onClick={onVisit}>
            visit
          </button>{" "}
          this link.
        </div>
      </div>
    </div>
  );
};

type Props = {
  url: string;
  className?: string;
  onVisit?: () => void;
};

export default function SnapshotPreview({ url, className, onVisit }: Props) {
  const { data } = useSnapshot(url);
  const queryClient = useQueryClient();

  const handleVisit = () => {
    chrome.tabs.create({ url, active: true });
  };

  const handleClear = async () => {
    const snapshotStore = await SnapshotStore.init();
    await snapshotStore.deleteSnapshot(url);
    queryClient.setQueryData(["snapshots", url], null);
  };

  return (
    <div className={cn("relative h-full w-full", className)}>
      {data ? (
        <>
          <motion.img
            initial={{ filter: "blur(10px)" }}
            animate={{ filter: "blur(0px)" }}
            transition={{ duration: 0.25 }}
            src={data}
            className="pointer-events-none h-full w-full rounded-lg object-cover object-top"
            alt="screenshot"
          />
          <ButtonWithTooltip
            tooltipText="Remove snapshot"
            size="icon-sm"
            onClick={handleClear}
            className="absolute top-2 right-2 rounded-full"
            variant="outline">
            <Cross2Icon />
          </ButtonWithTooltip>
        </>
      ) : (
        <NoSnapshot onVisit={onVisit ?? handleVisit} />
      )}
    </div>
  );
}
