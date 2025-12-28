import { cn } from "@echotab/ui/util";
import { Browser as BrowserIcon } from "@phosphor-icons/react";
import { BookmarkFilledIcon } from "@radix-ui/react-icons";

import PulseLogo from "../lists/PulseLogo";

export default function TabSwitch() {
  return (
    <div className="text-muted-foreground flex h-auto items-center justify-center gap-2 rounded-full bg-transparent p-0">
      <PulseLogo />
      <div className="bg-surface-2 flex rounded-full text-sm">
        <span
          className={cn(
            "focus-ring text-muted-foreground data-[state=active]:text-foreground relative rounded bg-transparent p-2 px-5 transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:outline-none md:px-8",
          )}>
          <span className="bg-surface-3 absolute inset-0 rounded-full border shadow-sm will-change-transform" />
          <span className="relative z-1 flex items-center gap-1">
            <BrowserIcon className="h-4 w-4" weight="fill" /> Tabs
          </span>
        </span>
        <span
          className={cn(
            "focus-ring text-muted-foreground data-[state=active]:text-foreground relative rounded bg-transparent p-2 px-5 transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:outline-none md:px-8",
          )}>
          <span className="relative z-1 flex items-center gap-1">
            <BookmarkFilledIcon className="h-4 w-4" /> Bookmarks
          </span>
        </span>
      </div>
    </div>
  );
}
