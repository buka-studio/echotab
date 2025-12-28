import ButtonWithTooltip from "@echotab/ui/ButtonWithTooltip";
import { cn } from "@echotab/ui/util";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import usePatternBackground from "~/hooks/usePatternBackground";

import { Message } from "../models";
import SnapshotStore, { Snapshot } from "../util/SnapshotStore";

const isSavedTab = (id: string | number): id is string => typeof id === "string";

function useSnapshot(id: string | number) {
  return useQuery({
    queryKey: ["snapshots", id],
    queryFn: async () => {
      const snapshotStore = await SnapshotStore.init();
      let snap: Snapshot | undefined;
      if (isSavedTab(id)) {
        snap = await snapshotStore.getSnapshot(id);
      } else {
        snap = await snapshotStore.getTmp(id);
      }

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
  tab: {
    url: string;
    id: string | number;
  };
  className?: string;
  onVisit?: () => void;
};

export default function SnapshotPreview({ tab, className, onVisit }: Props) {
  const { data, isLoading } = useSnapshot(tab.id);
  const queryClient = useQueryClient();

  const handleVisit = () => {
    chrome.tabs.create({ url: tab.url, active: true }).then(async (newTab) => {
      chrome.runtime.onMessage.addListener(async (message: Message, sender) => {
        if (message.type === "snapshot_tmp" && tab.url === message.url) {
          const snapshotStore = await SnapshotStore.init();
          try {
            if (isSavedTab(tab.id)) {
              await snapshotStore.commitSnapshot(message.tabId, tab.id, tab.url);
            }
          } catch (e) {
            // ehh, we tried
            console.error(e);
          }
          queryClient.refetchQueries({ queryKey: ["snapshots", tab.id] });
        }
      });
    });
  };

  const handleClear = async () => {
    const snapshotStore = await SnapshotStore.init();
    if (isSavedTab(tab.id)) {
      await snapshotStore.deleteSnapshot(tab.id);
    } else {
      await snapshotStore.discardTmp(tab.id);
    }
    queryClient.setQueryData(["snapshots", tab.id], null);
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
