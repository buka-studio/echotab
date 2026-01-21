import { cn } from "@echotab/ui/util";
import { BroomIcon, BrowserIcon } from "@phosphor-icons/react";
import { BarChartIcon, BookmarkFilledIcon, GearIcon } from "@radix-ui/react-icons";

import { Button } from "@echotab/ui/Button";
import PulseLogo from "../collections/PulseLogo";

export default function TabSwitch() {
  return (
    <div className="text-muted-foreground flex h-auto items-center gap-2 rounded-full bg-transparent p-0 justify-between w-full">
      <span className="flex items-center gap-2 text-sm ">
        <PulseLogo />
        <span className="hidden md:block">
          EchoTab

        </span>
      </span>
      <div className="bg-surface-2 rounded-full text-sm border border-border grid grid-cols-2">
        <span
          className={cn(
            "focus-ring text-muted-foreground data-[state=active]:text-foreground relative rounded bg-transparent p-2 px-5 transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:outline-none md:px-4 text-center justify-center flex items-center",
          )}>
          <span className="bg-surface-3 absolute -inset-px rounded-full border border-border dark:shadow-sm will-change-transform" />
          <span className="relative z-1 flex items-center gap-1">
            <BrowserIcon className="h-4 w-4" weight="fill" /> Tabs
          </span>
        </span>
        <span
          className={cn(
            "focus-ring text-muted-foreground data-[state=active]:text-foreground relative rounded bg-transparent p-2 px-5 transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:outline-none md:px-4 text-center justify-center flex items-center",
          )}>
          <span className="relative z-1 flex items-center gap-1">
            <BookmarkFilledIcon className="h-4 w-4" /> Bookmarks
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2 pointer-events-none min-w-3">
        <Button size="icon" variant="outline" className="rounded-full hidden md:flex">
          <BroomIcon />

        </Button>
        <Button size="icon" variant="outline" className="rounded-full hidden md:flex">
          <BarChartIcon />

        </Button>
        <Button size="icon" variant="outline" className="rounded-full hidden md:flex">
          <GearIcon />

        </Button>
      </div>
    </div>
  );
}
