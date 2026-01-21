import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@echotab/ui/Dialog";
import { BarChartIcon, GearIcon } from "@radix-ui/react-icons";

import Settings from "./Settings";
import Stats from "./Stats";

import "@echotab/ui/globals.css";
import "./app.css";

import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import { BroomIcon } from "@phosphor-icons/react";

import { NumberNotificationBadge } from "./components/NumberNotificationBadge";
import { Curate, CurateTrigger } from "./Curate";
import { useCurateQueue, useCurateStore } from "./store/curateStore";
import { settingStoreActions, useSettingStore } from "./store/settingStore";

export default function NavMenu() {
  const queue = useCurateQueue();
  const open = useCurateStore((s) => s.open);
  const settingsOpen = useSettingStore((s) => s.open);

  return (
    <div className="flex gap-2">
      <Curate key={String(open)} curateQueueItems={queue}>
        <NumberNotificationBadge value={queue.length} variant="secondary" show={queue.length > 0}>
          <CurateTrigger>
            <ButtonWithTooltip
              tooltipText="Curate"
              variant="outline"
              size="icon"
              className="rounded-full">
              <BroomIcon className="h-4 w-4" />
            </ButtonWithTooltip>
          </CurateTrigger>
        </NumberNotificationBadge>
      </Curate>
      <Dialog>
        <DialogTrigger asChild>
          <ButtonWithTooltip
            tooltipText="Statistics"
            variant="outline"
            size="icon"
            className="rounded-full">
            <BarChartIcon />
          </ButtonWithTooltip>
        </DialogTrigger>
        <DialogContent className="md:max-w-[min(57rem,95vw)]">
          <DialogHeader>
            <DialogTitle>Statistics</DialogTitle>
            <DialogDescription>View statistics for your bookmarks and tags.</DialogDescription>
          </DialogHeader>
          <Stats />
        </DialogContent>
      </Dialog>
      <Dialog
        open={settingsOpen}
        onOpenChange={(open) => settingStoreActions.setSettingsOpen(open)}>
        <DialogTrigger asChild>
          <ButtonWithTooltip
            tooltipText="Settings"
            variant="outline"
            size="icon"
            className="rounded-full">
            <GearIcon className="h-4 w-4" />
          </ButtonWithTooltip>
        </DialogTrigger>
        <DialogContent className="overflow-hidden p-0 md:max-w-[min(57rem,95vw)]" close={false}>
          <DialogTitle className="sr-only">Settings</DialogTitle>
          <DialogDescription className="sr-only">Change your extension settings.</DialogDescription>
          <Settings />
        </DialogContent>
      </Dialog>
    </div>
  );
}
