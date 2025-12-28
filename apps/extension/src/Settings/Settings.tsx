import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@echotab/ui/Command";
import { BroomIcon, PaletteIcon, SparkleIcon, TagIcon } from "@phosphor-icons/react";
import {
  DownloadIcon,
  ExclamationTriangleIcon,
  MixerHorizontalIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { ComponentProps, useRef, useState } from "react";

import AIPage from "./AIPage";
import AppearancePage from "./AppearancePage";
import CuratePage from "./CuratePage";
import DeletePage from "./DeletePage";
import ExportPage from "./ExportPage";
import FeedbackPage from "./FeedbackPage";
import ImportPage from "./ImportPage";
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

const pages = [
  "Tags",
  "Appearance",
  "AI",
  "Misc",
  "Import",
  "Export",
  "Feedback",
  "Delete",
  "Curate",
] as const;

type Page = (typeof pages)[number];

export default function Settings() {
  const cmdInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState<Page>("Tags");

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Command loop value={page} onValueChange={(p) => setPage(p as Page)} className="min-h-[450px]">
      <div className="grid h-full grid-cols-[150px_auto] grid-rows-[1fr_30px] gap-4">
        <div>
          <div className="mb-4 flex items-center">
            <CommandInput placeholder="Search settings..." ref={cmdInputRef} autoFocus />
          </div>
          <CommandList className="max-h-[400px]">
            <CommandGroup>
              <CommandItem>
                <TagIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
                Tags
              </CommandItem>
              <CommandItem>
                <PaletteIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
                Appearance
              </CommandItem>
              <CommandItem>
                <SparkleIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
                AI
              </CommandItem>
              <CommandItem>
                <BroomIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
                Curate
              </CommandItem>
              <CommandItem>
                <MixerHorizontalIcon className="text-muted-foreground mr-2" />
                Misc
              </CommandItem>
              <CommandItem>
                <DownloadIcon className="text-muted-foreground mr-2" />
                Import
              </CommandItem>
              <CommandItem>
                <UploadIcon className="text-muted-foreground mr-2" />
                Export
              </CommandItem>
              <CommandItem>
                <BukaIcon className="text-muted-foreground mr-2" />
                Feedback
              </CommandItem>
              <CommandItem value="Delete" className="text-destructive">
                <ExclamationTriangleIcon className="mr-2" />
                Delete Data
              </CommandItem>
            </CommandGroup>
            <CommandEmpty className="p-2 text-base">No Results.</CommandEmpty>
          </CommandList>
        </div>

        <div className="text-muted-foreground col-start-1 row-start-2 mt-auto font-mono">
          {versionLabel}
        </div>
        <div
          className="content scrollbar-gray col-start-2 row-span-2 row-start-1 h-full max-h-[375px] flex-1 overflow-auto pt-2 pr-2 pl-4"
          ref={contentRef}>
          {page === "Tags" && <TagsPage />}
          {page === "AI" && <AIPage />}
          {page === "Appearance" && <AppearancePage />}
          {page === "Misc" && <MiscPage />}
          {page === "Import" && <ImportPage />}
          {page === "Export" && <ExportPage />}
          {page === "Feedback" && <FeedbackPage />}
          {page === "Delete" && <DeletePage />}
          {page === "Curate" && <CuratePage />}
        </div>
      </div>
    </Command>
  );
}
