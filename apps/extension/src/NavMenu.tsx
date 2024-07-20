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

import ButtonWithTooltip from "@echotab/ui/ButtonWithTooltip";

export default function NavMenu() {
  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <ButtonWithTooltip
            tooltipText="Settings"
            variant="outline"
            size="icon"
            className="rounded-full">
            <GearIcon className="h-4 w-4" />
          </ButtonWithTooltip>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle className="sr-only">Settings</DialogTitle>
          <DialogDescription className="sr-only">Change your extension settings.</DialogDescription>
          <Settings />
        </DialogContent>
      </Dialog>

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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Statistics</DialogTitle>
            <DialogDescription>View statistics for your bookmarks and tags.</DialogDescription>
          </DialogHeader>
          <Stats />
        </DialogContent>
      </Dialog>
    </div>
  );
}
