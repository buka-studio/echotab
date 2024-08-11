import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@echotab/ui/AlertDialog";
import Button from "@echotab/ui/Button";
import ButtonWithTooltip from "@echotab/ui/ButtonWithTooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@echotab/ui/Command";
import { Label } from "@echotab/ui/Label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@echotab/ui/Select";
import Switch from "@echotab/ui/Switch";
import { toast } from "@echotab/ui/Toast";
import { ToggleGroup, ToggleGroupItem } from "@echotab/ui/ToggleGroup";
import { Tooltip, TooltipContent, TooltipTrigger } from "@echotab/ui/Tooltip";
import { Palette } from "@phosphor-icons/react";
import {
  DesktopIcon,
  HeartFilledIcon,
  HeartIcon,
  InfoCircledIcon,
  MoonIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useRef, useState } from "react";

import { useBookmarkStore } from "../Bookmarks";
import { getLists, unpublishLists } from "../Bookmarks/Lists/api";
import SortButton from "../components/SortButton";
import { Tag } from "../models";
import { unassignedTag, useTagStore } from "../TagStore";
import { ClipboardFormat, Theme, useUIStore } from "../UIStore";
import { downloadJSON, getFormattedLinksExample } from "../util";
import { SortDir } from "../util/sort";
import ImportField from "./ImportField";
import TagControl from "./TagControl";

interface TagSetting extends Tag {
  tabCount: number;
}

const sortableColumns = ["favorite", "tabCount", "name"] as const;
type Column = (typeof sortableColumns)[number];

const columnLabels: Record<Column, string> = {
  favorite: "Favorite",
  tabCount: "# Tabs",
  name: "Name",
};

function propComparator<T extends { name: string; tabCount: number; favorite: boolean }>(
  a: T,
  b: T,
  prop: "tabCount" | "name" | "favorite",
): number {
  if (prop === "tabCount") {
    return a[prop] - b[prop];
  }
  if (prop === "favorite") {
    return Number(a[prop] ?? 0) - Number(b[prop] ?? 0);
  }
  return a[prop].localeCompare(b[prop]);
}

const versionLabel = `Version: ${chrome.runtime.getManifest().version}`;

export default function Settings() {
  const bookmarkStore = useBookmarkStore();
  const tagStore = useTagStore();
  const uiStore = useUIStore();

  const cmdInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState("Tags");

  const [tagSort, setTagSort] = useState<{ col: (typeof sortableColumns)[number]; dir: SortDir }>({
    col: "tabCount",
    dir: SortDir.Desc,
  });

  const handleSort = (col: (typeof sortableColumns)[number]) => {
    if (tagSort.col === col) {
      setTagSort({ col, dir: tagSort.dir === SortDir.Desc ? SortDir.Asc : SortDir.Desc });
    } else {
      setTagSort({ col, dir: SortDir.Desc });
    }
  };

  const handleExport = () => {
    downloadJSON(
      {
        tabs: bookmarkStore.tabs,
        tags: Array.from(tagStore.tags.values()).filter((t) => t.id !== unassignedTag.id),
      },
      `echotab-${Date.now()}.json`,
    );
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const handleConfirmDelete = () => {
    bookmarkStore.removeAllItems();
    tagStore.deleteAllTags();
  };

  const tagSettings: TagSetting[] = useMemo(() => {
    const tabCountsById = new Map(
      Array.from(tagStore.tags.values()).map((t) => [t.id, { ...t, tabCount: 0 }]),
    );
    for (const tab of bookmarkStore.tabs) {
      for (const tagId of tab.tagIds) {
        if (!tabCountsById.has(tagId)) {
          continue;
        }
        tabCountsById.get(tagId)!.tabCount += 1;
      }
    }

    const sorted = Array.from(tabCountsById.values()).sort((a, b) => {
      const tags = tagSort.dir === SortDir.Desc ? ([b, a] as const) : ([a, b] as const);
      return propComparator(...tags, tagSort.col);
    });
    return sorted;
  }, [tagStore.tags, bookmarkStore.tabs, tagSort]);

  const handleDeleteTag = (tag: Tag) => {
    bookmarkStore.removeTags([tag.id]);
    tagStore.deleteTag(tag.id);
  };

  const contentRef = useRef<HTMLDivElement>(null);

  const handleAddTag = () => {
    const tag = tagStore.createTag(`Tag ${tagStore.tags.size + 1}`);
    setTimeout(() => {
      // todo: do via ref
      contentRef?.current?.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });

      const input = contentRef.current?.querySelector(
        `input[value="${tag.name}"`,
      ) as HTMLInputElement;

      input?.focus();
      input?.select();
    });
  };

  const setTheme = (theme: Theme) => {
    uiStore.updateSettings({ theme });
  };

  const publicLists = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
    retry: 0,
    enabled: bookmarkStore.lists.length > 0,
    refetchOnWindowFocus: false,
  });

  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const unpublishMutation = useMutation({
    mutationFn: unpublishLists,
    onSuccess: () => {
      queryClient.setQueryData(["lists"], () => {
        return [];
      });

      toast.success("Lists unpublished successfully");
      setUnpublishDialogOpen(false);
    },
  });

  const handleConfirmUnpublish = () => {
    unpublishMutation.mutate();
  };

  const handleShuffleTagColors = () => {
    tagStore.shuffleTagColors();
  };

  return (
    <Command loop value={page} onValueChange={setPage} className="min-h-[450px]">
      <div className="mb-4 flex items-center border-b">
        <CommandInput placeholder="Search settings..." ref={cmdInputRef} autoFocus />
      </div>
      <div className="grid h-full grid-cols-[150px_auto] grid-rows-[1fr_30px] gap-4">
        <CommandList>
          <CommandGroup>
            <CommandItem>Tags</CommandItem>
            <CommandItem>Appearance</CommandItem>
            <CommandItem>Misc</CommandItem>
            <CommandItem>Import</CommandItem>
            <CommandItem>Export</CommandItem>
            <CommandItem>Feedback</CommandItem>
            <CommandItem value="Delete" className="text-destructive">
              Delete Data
            </CommandItem>
          </CommandGroup>
          <CommandEmpty className="p-2 text-base">No Results.</CommandEmpty>
        </CommandList>
        <div className="text-muted-foreground col-start-1 row-start-2 mt-auto">{versionLabel}</div>
        <AlertDialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all your saved tabs and tags from this computer. This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} variant="destructive">
                Delete Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div
          className="content scrollbar-gray col-start-2 row-span-2 row-start-1 h-full max-h-[375px] flex-1 overflow-auto border-l-[1px] pl-4 pr-2 pt-2"
          ref={contentRef}>
          {page === "Tags" && (
            <div className="grid w-full grid-cols-[20%_20%_auto] content-center items-center gap-3 gap-y-4">
              {sortableColumns.map((c, i) => (
                <div className="text-muted-foreground flex items-center gap-2 text-sm" key={c}>
                  {columnLabels[c]}{" "}
                  <SortButton
                    active={tagSort.col === c}
                    dir={tagSort.dir}
                    onClick={() => handleSort(c)}
                  />
                  {i === sortableColumns.length - 1 && (
                    <ButtonWithTooltip
                      onClick={handleShuffleTagColors}
                      size="icon-sm"
                      className="ml-auto mr-[42px]"
                      variant="ghost"
                      tooltipText="Shuffle tag colors">
                      <Palette size={18} />
                    </ButtonWithTooltip>
                  )}
                </div>
              ))}
              {tagSettings.map((t) => (
                <React.Fragment key={t.id}>
                  <Button
                    className="mr-auto"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Favorite ${t.name}`}
                    onClick={() => tagStore.toggleTagFavorite(t.id)}>
                    {t.favorite ? <HeartFilledIcon /> : <HeartIcon />}
                  </Button>
                  <span className="">{t.tabCount}</span>
                  <TagControl
                    tag={t}
                    onChange={(update) => tagStore.updateTag(t.id, update)}
                    onDelete={() => handleDeleteTag(t)}
                    disabled={t.id === unassignedTag.id}
                  />
                </React.Fragment>
              ))}
              <div className="sticky bottom-0 z-10 col-span-3 pt-4">
                <Button variant="outline" className="w-full" onClick={handleAddTag}>
                  Add new tag
                </Button>
              </div>
            </div>
          )}
          {page === "Appearance" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-sm">Favicons</span>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="hide-favicons">
                    Hide Favicons in <span>Tabs</span>
                  </Label>
                  <Switch
                    id="hide-tabs-favicons"
                    checked={uiStore.settings?.hideTabsFavicons ?? false}
                    onCheckedChange={(v) => {
                      uiStore.updateSettings({ hideTabsFavicons: v });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="hide-favicons">
                    Hide Favicons in <span>Bookmarks</span>
                  </Label>
                  <Switch
                    id="hide-bookmarks-favicons"
                    checked={uiStore.settings?.hideBookmarkFavicons ?? false}
                    onCheckedChange={(v) => {
                      uiStore.updateSettings({ hideBookmarkFavicons: v });
                    }}
                  />
                </div>
              </div>
              <hr />
              <div className="text-muted-foreground flex flex-col gap-2 text-sm">
                <Label htmlFor="theme">Theme</Label>
                <ToggleGroup
                  className="justify-start"
                  id="theme"
                  variant="outline"
                  type="single"
                  value={uiStore.settings.theme}
                  onValueChange={(t) => setTheme(t as Theme)}>
                  <ToggleGroupItem value={Theme.Light} aria-label="Set light theme">
                    <SunIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value={Theme.Dark} aria-label="Set dark theme">
                    <MoonIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value={Theme.System} aria-label="Set system theme">
                    <DesktopIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          )}
          {page === "Misc" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="text-muted-foreground text-sm">Clipboard</div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="include-tags">Include Tags</Label>
                  <Switch
                    id="include-tags"
                    checked={uiStore.settings?.clipboardIncludeTags ?? false}
                    onCheckedChange={(v) => {
                      uiStore.updateSettings({ clipboardIncludeTags: v });
                    }}
                  />
                </div>
                <div className="my-2 flex items-center justify-between space-x-2">
                  <span className="flex items-center gap-1">
                    <Label htmlFor="clipboard-format">Clipboard Format</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="mb-5 text-sm">Clipboard content preview:</div>
                        <pre className="scrollbar-gray text-muted-foreground font-mono text-xs">
                          {getFormattedLinksExample(
                            uiStore.settings.clipboardFormat,
                            uiStore.settings.clipboardIncludeTags,
                          )}
                        </pre>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <Select
                    value={uiStore.settings?.clipboardFormat}
                    onValueChange={(v) => {
                      uiStore.updateSettings({
                        clipboardFormat: v as ClipboardFormat,
                      });
                    }}>
                    <SelectTrigger className="w-[180px]" id="clipboard-format">
                      <SelectValue placeholder="Select a format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.values(ClipboardFormat).map((format) => (
                          <SelectItem key={format} value={format} className="">
                            {format}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <hr className="last:hidden" />
              {process.env.PLASMO_PUBLIC_LIST_SHARING_FF && (
                <div className="flex flex-col gap-2">
                  <div className="text-muted-foreground mb-2 text-sm">Lists</div>
                  <div className="flex items-center justify-between space-x-2">
                    <span className="flex items-center gap-1">
                      <Label htmlFor="disable-list-sharing">Disable list sharing</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-[250px]">
                            Disables list sharing features for a completely offline experience.
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <Switch
                      id="disable-list-sharing"
                      checked={uiStore.settings?.disableListSharing ?? false}
                      onCheckedChange={(v) => {
                        uiStore.updateSettings({ disableListSharing: v });
                        if (v && publicLists.data?.some((l) => l.published)) {
                          setUnpublishDialogOpen(true);
                        }
                      }}
                    />
                    <AlertDialog
                      open={unpublishDialogOpen}
                      onOpenChange={() => setUnpublishDialogOpen(false)}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>You have published lists</AlertDialogTitle>
                          <AlertDialogDescription>
                            You have published lists. Do you also want to unpublish them?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Published</AlertDialogCancel>
                          <AlertDialogAction onClick={handleConfirmUnpublish} variant="destructive">
                            Unpublish
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </div>
          )}

          {page === "Import" && <ImportField />}
          {page === "Export" && (
            <div className="flex flex-col gap-5">
              <div className="text-muted-foreground text-sm">
                Export all your echotab data as a JSON file. This will include all your saved tabs
                and tags. You can import this data later to restore your echotab data.
              </div>
              <Button variant="outline" onClick={handleExport}>
                Export
              </Button>
            </div>
          )}
          {page === "Feedback" && (
            <div>
              <div className="text-muted-foreground text-sm">
                We&apos;d love to hear from you! If you have any feedback, questions, or issues,
                please reach out to us at:
                <br />
                <a
                  href="mailto:support@buka.studio?subject=EchoTab Feedback"
                  className="mt-2 block">
                  support@buka.studio
                </a>
              </div>
            </div>
          )}
          {page === "Delete" && (
            <div className="flex flex-col gap-5">
              <div className="text-muted-foreground text-sm">
                Delete all your echotab data. It&apos;s recommended to export your data before
                deleting it as this action cannot be undone.
              </div>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </Command>
  );
}
