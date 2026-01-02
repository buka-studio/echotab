import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@echotab/ui/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@echotab/ui/Popover";
import { cn } from "@echotab/ui/util";
import { BroomIcon, DatabaseIcon, PaletteIcon, TagIcon } from "@phosphor-icons/react";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { ComponentProps, useRef, useState } from "react";

import AppearancePage from "./AppearancePage";
import CuratePage from "./CuratePage";
import DataPage from "./DataPage";
import FeedbackPage from "./FeedbackPage";
import MiscPage from "./MiscPage";
import TagsPage from "./TagsPage";

const BukaIcon = (props: ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" fill="none" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M2 2.533c0-.57.463-1.033 1.033-1.033h10.832c.591 0 1.092.509 1.012 1.134a10.422 10.422 0 0 1-4.26 7.127c1.18-.328 2.274-.848 3.205-1.655C14.256 7.73 15 8 15 8.637v4.83c0 .57-.463 1.033-1.033 1.033H3.033C2.463 14.5 2 14.037 2 13.467V2.533ZM3.033 2.5A.033.033 0 0 0 3 2.533v10.934c0 .018.015.033.033.033h10.934a.033.033 0 0 0 .033-.033V9.244c-1.716 1.275-3.794 1.773-5.836 1.952a.566.566 0 0 1-.605-.452.57.57 0 0 1 .353-.65 9.439 9.439 0 0 0 5.973-7.587.02.02 0 0 0-.007-.005.03.03 0 0 0-.013-.002H3.033Z"
      clipRule="evenodd"
    />
  </svg>
);

const versionLabel = `Version: ${chrome.runtime.getManifest().version}`;

const pages = ["Tags", "Appearance", "AI", "Misc", "Data", "Feedback", "Delete", "Curate"] as const;

type Page = (typeof pages)[number];

function SettingsCommandItem({
  children,
  className,
  ...props
}: ComponentProps<typeof CommandItem>) {
  return (
    <CommandItem
      className={cn("h-auto min-h-auto rounded-none pl-4", className)}
      variant="primary"
      {...props}>
      {children}
    </CommandItem>
  );
}

export default function Settings() {
  const cmdInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState<Page>("Tags");
  const [open, setOpen] = useState(false);

  const commandList = (
    <CommandList className="max-h-[400px]">
      <CommandGroup className="p-0">
        <SettingsCommandItem>
          <TagIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
          Tags
        </SettingsCommandItem>
        <SettingsCommandItem>
          <PaletteIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
          Appearance
        </SettingsCommandItem>
        {/* <SettingsCommandItem>
      <SparkleIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
      AI
    </SettingsCommandItem> */}
        <SettingsCommandItem>
          <BroomIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
          Curate
        </SettingsCommandItem>
        <SettingsCommandItem>
          <MixerHorizontalIcon className="text-muted-foreground mr-2" />
          Misc
        </SettingsCommandItem>
        <SettingsCommandItem>
          <DatabaseIcon className="text-muted-foreground mr-2" />
          Data
        </SettingsCommandItem>
        {/* <SettingsCommandItem>
      <UploadIcon className="text-muted-foreground mr-2" />
      Export
    </SettingsCommandItem> */}
        <SettingsCommandItem>
          <BukaIcon className="text-muted-foreground mr-2" />
          Feedback
        </SettingsCommandItem>
      </CommandGroup>
      <CommandEmpty className="p-2 text-base">No Results.</CommandEmpty>
    </CommandList>
  );

  const commandInput = (
    <CommandInput
      placeholder="Search settings..."
      ref={cmdInputRef}
      autoFocus
      className="border-border max-h-[60px] border-b py-5 pl-5 text-sm"
    />
  );

  return (
    <Command
      loop
      value={page}
      onValueChange={(p) => {
        setPage(p as Page);
        setOpen(false);
      }}
      className="h-[500px] sm:min-h-[450px]"
      disablePointerSelection>
      <div className="flex h-full grid-cols-[180px_auto] grid-rows-[1fr_40px] flex-col sm:grid">
        <div className="col-1 row-1 hidden sm:block">
          <div className="mb-2 flex items-center">{commandInput}</div>
          {commandList}
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="text-muted-foreground bg-card hover:bg-card-active border-b p-3 text-left text-sm transition-all sm:hidden">
              Settings <span className="mx-2 font-bold opacity-50">/</span> {page}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
            {commandList}
          </PopoverContent>
        </Popover>

        {page === "Tags" && <TagsPage contentClassName="px-1 sm:px-3" />}
        {page === "Appearance" && <AppearancePage />}
        {page === "Misc" && <MiscPage />}
        {page === "Data" && <DataPage />}
        {page === "Feedback" && <FeedbackPage />}
        {page === "Curate" && <CuratePage />}
        <div className="text-muted-foreground bg-card col-start-1 row-start-2 mt-auto border-t border-transparent p-3 font-mono sm:bg-transparent">
          {versionLabel}
        </div>
      </div>
    </Command>
  );
}
