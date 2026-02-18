import { Button } from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { BroomIcon, BrowserIcon } from "@phosphor-icons/react";
import { BarChartIcon, BookmarkFilledIcon, GearIcon } from "@radix-ui/react-icons";

import PulseLogo from "../collections/PulseLogo";

export default function TabSwitch() {
  return (
    <div className="text-muted-foreground flex h-auto w-full items-center justify-between gap-2 rounded-full bg-transparent p-0">
      <span className="flex items-center gap-2 text-sm">
        <PulseLogo />
        <span className="hidden md:block">EchoTab</span>
      </span>
      <div className="bg-surface-2 border-border grid grid-cols-2 rounded-full border text-sm">
        <span
          className={cn(
            "focus-ring text-muted-foreground data-[state=active]:text-foreground relative flex items-center justify-center rounded bg-transparent p-2 px-5 text-center transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:outline-none md:px-4",
          )}>
          <span className="relative z-1 flex items-center gap-1">
            <BrowserIcon className="h-4 w-4" weight="fill" /> Tabs
          </span>
        </span>
        <span
          className={cn(
            "focus-ring text-muted-foreground data-[state=active]:text-foreground relative flex items-center justify-center rounded bg-transparent p-2 px-5 text-center transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:outline-none md:px-4",
          )}>
          <span className="bg-surface-3 border-border absolute -inset-px rounded-full border will-change-transform dark:shadow-sm" />
          <span className="relative z-1 flex items-center gap-1">
            <BookmarkFilledIcon className="h-4 w-4" /> Bookmarks
          </span>
        </span>
      </div>
      <div className="pointer-events-none flex min-w-3 items-center gap-2">
        <Button size="icon" variant="outline" className="hidden rounded-full md:flex">
          <BroomIcon />
        </Button>
        <Button size="icon" variant="outline" className="hidden rounded-full md:flex">
          <BarChartIcon />
        </Button>
        <Button size="icon" variant="outline" className="hidden rounded-full md:flex">
          <GearIcon />
        </Button>
      </div>
    </div>
  );
}
