import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@echotab/ui/AlertDialog";
import { Badge } from "@echotab/ui/Badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@echotab/ui/Command";
import { NumberFlow } from "@echotab/ui/NumberFlow";
import { toast } from "@echotab/ui/Toast";
import { cn } from "@echotab/ui/util";
import { Browser as BrowserIcon, Tag as TagIcon } from "@phosphor-icons/react";
import {
  CheckCircledIcon,
  ClipboardIcon,
  DrawingPinIcon,
  ExternalLinkIcon,
  FilePlusIcon,
  MagnifyingGlassIcon,
  MinusCircledIcon,
  OpenInNewWindowIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import FilterTagChips from "../components/FilterTagChips";
import {
  CommandPagination,
  TabCommandDialog,
  TabCommandDialogRef,
  useTabCommand,
} from "../components/TabCommand";
import TagChip from "../components/tag/TagChip";
import TagChipList from "../components/tag/TagChipList";
import { Panel, SavedTab } from "../models";
import { unassignedTag, useTagStore } from "../TagStore";
import { useUIStore } from "../UIStore";
import { formatLinks } from "../util";
import { toggle } from "../util/set";
import { isAlphanumeric } from "../util/string";
import BookmarkStore, { useBookmarkSelectionStore, useBookmarkStore } from "./BookmarkStore";
import ListFormDialog from "./Lists/ListFormDialog";

const pages = ["/", "tag", "find"] as const;

type Page = (typeof pages)[number];

const CommandLabel = ({ page }: { page: string }) => {
  if (page === "tag") {
    return (
      <span className="text-muted-foreground flex items-center gap-2">
        <TagIcon className="animate-pulse" />
        Tagging...
      </span>
    );
  }
  if (page === "find") {
    return (
      <span className="text-muted-foreground flex items-center gap-2">
        <MagnifyingGlassIcon className="animate-pulse" />
        Finding...
      </span>
    );
  }
  return null;
};

export default function BookmarkCommand() {
  const bookmarkStore = useBookmarkStore();
  const tagStore = useTagStore();
  const uiStore = useUIStore();
  const selectionStore = useBookmarkSelectionStore();

  const { pages, goToPage, search, setSearch, activePage, setPages, pushPage, goToPrevPage } =
    useTabCommand<Page>();

  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  const getValue = () => {
    const highlighted = commandRef.current?.querySelector(`[cmdk-item=""][aria-selected="true"]`);
    if (highlighted) {
      return (highlighted as HTMLElement)?.dataset?.value;
    }
  };

  const handleSaveAssignedTags = async () => {
    bookmarkStore.tagTabs(
      Array.from(selectionStore.selectedItemIds),
      Array.from(BookmarkStore.assignedTagIds),
    );
    bookmarkStore.clearAssignedTagIds();

    setSearch("");
    setPages(["/"]);
  };

  const handleCopyToClipboard = () => {
    const selectedLinks = bookmarkStore.tabs.filter((tab) =>
      selectionStore.selectedItemIds.has(tab.id),
    );

    const linksWithTags = selectedLinks.map((tab) => ({
      title: tab.title,
      url: tab.url,
      tags: tab.tagIds.map((tagId) => tagStore.tags.get(tagId)!.name),
    }));

    const formatted = formatLinks(linksWithTags, uiStore.settings.clipboardFormat);

    navigator.clipboard
      .writeText(formatted)
      .then(() => {
        toast(`Copied ${selectedLinks.length} links to clipboard!`);
      })
      .catch(() => {
        toast("Failed to copy links to clipboard!");
      });
  };

  const handleOpenSelected = (newWindow?: boolean) => {
    const selectedLinks = bookmarkStore.tabs.filter((tab) =>
      selectionStore.selectedItemIds.has(tab.id),
    );
    const urls = selectedLinks.map((tab) => tab.url);
    if (newWindow) {
      chrome.windows.create({
        url: urls,
      });
      return;
    }
    return Promise.all(
      urls.map((url) =>
        chrome.tabs.create({
          url,
        }),
      ),
    );
  };

  const hashtag = search.split(" ").at(-1)?.[0] === "#";

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const handleRemoveSelected = () => {
    bookmarkStore.removeTabs(Array.from(selectionStore.selectedItemIds));
  };

  const handleCreateTag = () => {
    const newTag = tagStore.createTag(search);
    bookmarkStore.toggleAssignedTagId(newTag.id);
    setSearch("");
  };

  const handleToggleFilterTag = (id: number) => {
    let filterTags = new Set(BookmarkStore.view.filter.tags);
    toggle(filterTags, id);

    bookmarkStore.updateFilter({
      tags: Array.from(filterTags),
    });
  };

  const [quickSearch, setQuickSearch] = useState("");
  const quickDeferredSearch = useDeferredValue(quickSearch);

  useEffect(() => {
    if (!quickSearch) {
      return;
    }
    handleToggleFilterKeyword(quickSearch, true);
  }, [quickDeferredSearch]);

  const runningSearchRef = useRef<string>(search);
  const handleToggleFilterKeyword = (keyword: string, isQuick = false) => {
    if (isQuick) {
      const keywords = [...BookmarkStore.view.filter.keywords];
      if (keywords.at(-1) === runningSearchRef.current) {
        keywords.pop();
      }

      keywords.push(keyword);

      bookmarkStore.updateFilter({
        keywords,
      });
      runningSearchRef.current = keyword;
    } else {
      const filterKeywords = new Set(BookmarkStore.view.filter.keywords);
      filterKeywords.add(keyword.trim());

      bookmarkStore.updateFilter({
        keywords: Array.from(filterKeywords),
      });

      setSearch("");
      runningSearchRef.current = "";
    }
  };

  const handleRemoveFilterKeyword = (keyword: string) => {
    const filterKeywords = new Set(BookmarkStore.view.filter.keywords);
    filterKeywords.delete(keyword.trim());

    bookmarkStore.updateFilter({
      keywords: Array.from(filterKeywords),
    });
  };

  const handleApply = () => {
    if (activePage === "tag") {
      handleSaveAssignedTags();
    }
  };

  const [listDialog, setListDialog] = useState({
    open: false,
    defaultLinks: undefined as SavedTab[] | undefined,
  });

  const handleCreateListFromSelected = () => {
    const selectedLinks = bookmarkStore.tabs.filter((tab) =>
      selectionStore.selectedItemIds.has(tab.id),
    );

    setListDialog({ open: true, defaultLinks: selectedLinks });
  };

  const handleListDialogClose = () => {
    setListDialog({ open: false, defaultLinks: undefined });
  };

  const handlePinSelected = () => {
    BookmarkStore.pinTabs(Array.from(selectionStore.selectedItemIds));
  };

  const customLabel = ["tag", "find"].includes(activePage);

  const withClear = (fn: () => void) => {
    return () => {
      fn();
      setSearch("");
    };
  };

  const selectedCount = selectionStore.selectedItemIds.size;

  const dialogRef = useRef<TabCommandDialogRef>(null);

  useHotkeys(
    "meta+f",
    () => {
      dialogRef.current?.open();
      setPages(["/", "find"]);
      inputRef.current?.focus();
    },
    { preventDefault: true },
  );

  const enterToSearch = uiStore.settings.enterToSearch;

  return (
    <>
      <TabCommandDialog
        label={customLabel ? <CommandLabel page={activePage} /> : undefined}
        dialogRef={dialogRef}>
        <Command
          loop
          ref={commandRef}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !search) {
              e.preventDefault();
              goToPrevPage();
            }
            if (activePage === "tag") {
              if (e.key === "Enter" && !getValue() && search) {
                e.preventDefault();
                handleCreateTag();
              } else if (e.key === "Enter" && e.metaKey) {
                e.preventDefault();
                handleSaveAssignedTags();
              }
            }
            if (activePage === "find") {
              if (e.key === "Enter" && !getValue() && search) {
                e.preventDefault();
                handleToggleFilterKeyword(search);
              }

              if (!enterToSearch) {
                if (isAlphanumeric(e.key) && !e.metaKey) {
                  setQuickSearch(search + e.key);
                }
              }
            }
          }}>
          <div className="bg-popover text-popover-foreground flex max-w-[57rem] flex-1 items-center rounded-lg rounded-b-none border p-3 px-4 text-base">
            <CommandPagination pages={pages} goToPage={goToPage} className="mr-2" />
            <CommandInput
              ref={inputRef}
              placeholder="Type a command or search..."
              className="p-0"
              value={search}
              onValueChange={setSearch}
              autoFocus
            />
            <div className="actions">
              {["tag"].includes(activePage) && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleApply}
                    className="focus-ring whitespace-nowrap rounded px-2 text-sm">
                    Apply
                  </button>
                  <span className="flex items-center gap-1">
                    <span className="keyboard-shortcut flex h-6 w-6 items-center justify-center text-lg">
                      ⌘
                    </span>
                    <span className="keyboard-shortcut flex h-6 items-center justify-center">
                      Enter
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
          <CommandList
            className={cn(
              "scrollbar-gray bg-popover/70 text-popover-foreground absolute top-[100%] block w-full rounded-lg rounded-t-none border border-t-0 p-2 shadow-lg backdrop-blur-lg",
            )}>
            {activePage === "/" && (
              <>
                <CommandGroup
                  heading={
                    <span>
                      Selection{" "}
                      <Badge
                        variant="card"
                        className={cn("ml-2", {
                          "opacity-0": !selectedCount,
                        })}>
                        {selectedCount}
                      </Badge>
                    </span>
                  }>
                  {selectedCount === 0 ? (
                    <CommandItem onSelect={withClear(selectionStore.selectAllTabs)}>
                      <CheckCircledIcon className="text-muted-foreground mr-2" />
                      Select All
                    </CommandItem>
                  ) : (
                    <CommandItem onSelect={withClear(selectionStore.deselectAllTabs)}>
                      <MinusCircledIcon className="text-muted-foreground mr-2" /> Deselect All
                    </CommandItem>
                  )}
                  {Boolean(selectedCount) && (
                    <>
                      <CommandItem onSelect={() => pushPage("tag")}>
                        <TagIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
                        Tag
                      </CommandItem>
                      <CommandItem onSelect={withClear(handleCreateListFromSelected)}>
                        <FilePlusIcon className="text-muted-foreground mr-2" /> Create a list
                      </CommandItem>
                      <CommandItem onSelect={withClear(handlePinSelected)}>
                        <DrawingPinIcon className="text-muted-foreground mr-2" />
                        Pin
                      </CommandItem>
                      <CommandItem onSelect={() => setDeleteDialogOpen(true)}>
                        <TrashIcon className="text-muted-foreground mr-2" /> Delete
                      </CommandItem>
                      <CommandItem onSelect={withClear(handleOpenSelected)}>
                        <ExternalLinkIcon className="text-muted-foreground mr-2" /> Open in this
                        window
                      </CommandItem>
                      <CommandItem onSelect={withClear(() => handleOpenSelected(true))}>
                        <OpenInNewWindowIcon className="text-muted-foreground mr-2" /> Open in new
                        window
                      </CommandItem>
                      <CommandItem onSelect={withClear(handleCopyToClipboard)}>
                        <ClipboardIcon className="text-muted-foreground mr-2" />
                        Copy to clipboard
                      </CommandItem>
                    </>
                  )}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Bookmarks">
                  <CommandItem onSelect={() => pushPage("find")}>
                    <MagnifyingGlassIcon className="text-muted-foreground mr-2" /> Find
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Other">
                  <CommandItem onSelect={() => uiStore.activatePanel(Panel.Tabs)}>
                    <BrowserIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
                    Go to Tabs
                  </CommandItem>
                </CommandGroup>
                <CommandEmpty>No Results</CommandEmpty>
              </>
            )}
            {activePage === "tag" && (
              <div className="flex flex-col gap-4">
                {bookmarkStore.assignedTagIds.size > 0 && (
                  <div className="tags flex items-center gap-2">
                    <button
                      className="focus-ring whitespace-nowrap rounded px-2 text-sm"
                      onClick={bookmarkStore.clearAssignedTagIds}>
                      Clear all
                    </button>
                    <TagChipList
                      max={10}
                      tags={Array.from(bookmarkStore.assignedTagIds).map(
                        (t) => tagStore.tags.get(t)!,
                      )}
                      onRemove={(tag) => {
                        bookmarkStore.toggleAssignedTagId(tag.id!);
                      }}
                    />
                  </div>
                )}
                <CommandGroup>
                  {Array.from(tagStore.tags.values())
                    .filter(
                      (t) => !bookmarkStore.assignedTagIds.has(t.id) && t.id !== unassignedTag.id,
                    )
                    .map((t) => (
                      <CommandItem
                        key={t.id}
                        value={t.name}
                        onSelect={() => {
                          bookmarkStore.toggleAssignedTagId(t.id);
                          setSearch("");
                        }}>
                        <div className="flex items-center">
                          {t.name}{" "}
                          <div
                            className="ml-2 h-3 w-3 rounded-full"
                            style={{ background: t.color }}
                          />
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
                <CommandEmpty className="cursor-pointer" onClick={handleCreateTag}>
                  {search ? (
                    <span className="inline-flex gap-2">
                      Create{" "}
                      <TagChip className="text-sm" color="#000">
                        {search}
                      </TagChip>
                    </span>
                  ) : (
                    "Type to create a tag"
                  )}
                </CommandEmpty>
              </div>
            )}
            {activePage === "find" && (
              <div>
                <div className="mb-2 px-2">
                  <FilterTagChips
                    filter={bookmarkStore.view.filter}
                    onRemoveKeyword={handleRemoveFilterKeyword}
                    onRemoveTag={handleToggleFilterTag}
                  />
                </div>
                {Boolean(hashtag) && (
                  <div className="">
                    <CommandGroup>
                      {Array.from(tagStore.tags.values())
                        .filter((t) => !bookmarkStore.view.filter.tags.includes(t.id))
                        .map((t) => (
                          <CommandItem
                            value={"#" + t.name}
                            key={t.id}
                            onSelect={() => {
                              handleToggleFilterTag(t.id);
                            }}>
                            <div className="flex items-center">
                              {t.name}{" "}
                              <div
                                className="ml-2 h-3 w-3 rounded-full"
                                style={{ background: t.color }}
                              />
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </div>
                )}
                <CommandEmpty>
                  {search && !Boolean(hashtag)
                    ? `Search by "${search}"`
                    : search
                      ? "No tags found"
                      : "Search by keyword or #tag"}
                </CommandEmpty>
                <div className="text-muted-foreground absolute bottom-2 right-3">
                  Results: <NumberFlow value={bookmarkStore.viewTabIds.length} />
                </div>
              </div>
            )}
          </CommandList>
        </Command>
      </TabCommandDialog>
      {/* todo: figure out how to wrap CommandItem in Dialog and make it work that way */}
      <ListFormDialog
        open={listDialog.open}
        defaultLinks={listDialog.defaultLinks}
        onOpenChange={handleListDialogClose}
        onSubmit={handleListDialogClose}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
        <AlertDialogTrigger asChild></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {selectedCount} saved tabs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={withClear(handleRemoveSelected)} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
