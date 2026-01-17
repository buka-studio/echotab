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
import { Button } from "@echotab/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandSeparator,
} from "@echotab/ui/Command";
import { toast } from "@echotab/ui/Toast";
import { cn } from "@echotab/ui/util";
import { BroomIcon, BrowserIcon, OpenAiLogoIcon, TagIcon } from "@phosphor-icons/react";
import {
  CheckCircledIcon,
  ClipboardIcon,
  DrawingPinIcon,
  ExternalLinkIcon,
  FilePlusIcon,
  GearIcon,
  MagnifyingGlassIcon,
  MinusCircledIcon,
  OpenInNewWindowIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDebounceValue } from "usehooks-ts";

import { curateStoreActions } from "~/store/curateStore";

import FilterTagChips from "../components/FilterTagChips";
import {
  CommandPagination,
  OnClose,
  TabCommandDialog,
  TabCommandDialogRef,
  TabCommandFooter,
  TabCommandGroup,
  TabCommandItem,
  useTabCommand,
} from "../components/TabCommand";
import TagChip from "../components/tag/TagChip";
import TagChipList from "../components/tag/TagChipList";
import { Panel, SavedTab } from "../models";
import {
  bookmarkStoreActions,
  bookmarkStoreSelectionActions,
  bookmarkStoreViewActions,
  useBookmarkSelectionStore,
  useBookmarkStore,
  useBookmarkViewStore,
  useViewTabIds as useBookmarkViewTabIds,
} from "../store/bookmarkStore";
import { settingStoreActions, useSettingStore } from "../store/settingStore";
import { tagStoreActions, unassignedTag, useTagsById, useTagStore } from "../store/tagStore";
import { formatLinks } from "../util";
import { toggle } from "../util/set";
import { isAlphanumeric } from "../util/string";
import ListFormDialog from "./Lists/ListFormDialog";

const pages = ["/", "tag", "search"] as const;

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
  if (page === "search") {
    return (
      <span className="text-muted-foreground flex items-center gap-2">
        <MagnifyingGlassIcon className="animate-pulse" />
        Searching...
      </span>
    );
  }
  return null;
};

export default function BookmarkCommand({ onCurate }: { onCurate?: () => void }) {
  const tabs = useBookmarkStore((s) => s.tabs);
  const tags = useTagStore((s) => s.tags);
  const tagsById = useTagsById();
  const settings = useSettingStore((s) => s.settings);
  const selectionStore = useBookmarkSelectionStore();
  const view = useBookmarkViewStore();
  const viewTabIds = useBookmarkViewTabIds();

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

  const [assignedTagIds, setAssignedTagIds] = useState<Set<number>>(new Set());

  const handleSaveAssignedTags = async () => {
    bookmarkStoreActions.tagTabs(
      Array.from(selectionStore.selectedTabIds),
      Array.from(assignedTagIds),
    );
    setAssignedTagIds(new Set());

    setSearch("");
    setPages(["/"]);
  };

  const handleCopyToClipboard = () => {
    const selectedLinks = tabs.filter((tab) => selectionStore.selectedTabIds.has(tab.id));

    const linksWithTags = selectedLinks.map((tab) => ({
      title: tab.title,
      url: tab.url,
      tags: tab.tagIds.map((tagId) => tagsById.get(tagId)?.name ?? ""),
    }));

    const formatted = formatLinks(linksWithTags, settings.clipboardFormat);

    if (!formatted) return;

    navigator.clipboard
      .writeText(formatted)
      .then(() => {
        toast.success(`Copied ${selectedLinks.length} links to clipboard!`);
      })
      .catch(() => {
        toast.error("Failed to copy links to clipboard!");
      });
  };

  const handleOpenSelected = (newWindow?: boolean) => {
    const selectedLinks = tabs.filter((tab) => selectionStore.selectedTabIds.has(tab.id));
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
    bookmarkStoreActions.removeTabs(Array.from(selectionStore.selectedTabIds));
  };

  const handleCreateTag = () => {
    const [newTag] = tagStoreActions.createTags([{ name: search }]);
    if (newTag) {
      setAssignedTagIds((prev) => new Set([...prev, newTag.id]));
    }
    setSearch("");
  };

  const toggleAssignedTagId = (tagId: number) => {
    setAssignedTagIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleToggleFilterTag = (id: number) => {
    let filterTags = new Set(view.filter.tags);
    toggle(filterTags, id);

    bookmarkStoreViewActions.updateFilter({
      tags: Array.from(filterTags),
    });
  };

  const [quickSearch, setQuickSearch] = useState("");
  const [debouncedQuickSearch, setValue] = useDebounceValue(quickSearch, 300);

  useEffect(() => {
    if (!quickSearch) {
      return;
    }
    handleToggleFilterKeyword(quickSearch, true);
  }, [debouncedQuickSearch]);

  const runningSearchRef = useRef<string>(search);
  const handleToggleFilterKeyword = (keyword: string, isQuick = false) => {
    if (isQuick) {
      const keywords = [...view.filter.keywords];
      if (keywords.at(-1) === runningSearchRef.current) {
        keywords.pop();
      }

      keywords.push(keyword);

      bookmarkStoreViewActions.updateFilter({
        keywords,
      });
      runningSearchRef.current = keyword;
    } else {
      const filterKeywords = new Set(view.filter.keywords);
      filterKeywords.add(keyword.trim());

      bookmarkStoreViewActions.updateFilter({
        keywords: Array.from(filterKeywords),
      });

      setSearch("");
      runningSearchRef.current = "";
    }
  };

  const handleRemoveFilterKeyword = (keyword: string) => {
    const filterKeywords = new Set(view.filter.keywords);
    filterKeywords.delete(keyword.trim());

    bookmarkStoreViewActions.updateFilter({
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
    const selectedLinks = tabs.filter((tab) => selectionStore.selectedTabIds.has(tab.id));

    setListDialog({ open: true, defaultLinks: selectedLinks });
  };

  const handleListDialogClose = () => {
    setListDialog({ open: false, defaultLinks: undefined });
  };

  const handlePinSelected = () => {
    bookmarkStoreActions.pinTabs(Array.from(selectionStore.selectedTabIds));
  };

  const customLabel = ["tag", "search"].includes(activePage);

  const withClear = (fn: () => void) => {
    return () => {
      fn();
      setSearch("");
    };
  };

  const withClose = (fn: () => void) => {
    return () => {
      fn();
      dialogRef.current?.close();
    };
  };

  const selectedCount = selectionStore.selectedTabIds.size;

  const dialogRef = useRef<TabCommandDialogRef>(null);

  useHotkeys(
    "mod+f",
    () => {
      dialogRef.current?.open();
      setPages(["/", "search"]);
      inputRef.current?.focus();
    },
    { preventDefault: true },
  );

  useHotkeys(
    "alt+t",
    () => {
      dialogRef.current?.open();
      setPages(["/", "tag"]);
      inputRef.current?.focus();
    },
    { preventDefault: true, enabled: selectedCount > 0 },
    [],
  );

  const enterToSearch = false;

  const handleLooseMatch = () => {
    bookmarkStoreViewActions.updateFilter({
      looseMatch: true,
    });
  };

  const handleOpenInLLM = (provider: "chatgpt" | "claude") => () => {
    const selectedLinks = tabs.filter((tab) => selectionStore.selectedTabIds.has(tab.id));
    const linksText = selectedLinks.map((tab) => `[${tab.title}](${tab.url})`).join("\n");
    const prompt = `Open the following links and analyze the content. Tell me when you're done and ready to answer questions about them. ${linksText}`;
    const promptQuery = `q=${encodeURIComponent(prompt)}`;

    if (provider === "chatgpt") {
      chrome.tabs.create({ url: `https://chatgpt.com/chat?${promptQuery}` });
    } else if (provider === "claude") {
      chrome.tabs.create({ url: `https://claude.ai/chat?${promptQuery}` });
    }
  };

  return (
    <>
      <TabCommandDialog
        label={customLabel ? <CommandLabel page={activePage} /> : undefined}
        dialogRef={dialogRef}>
        <OnClose
          callback={() =>
            setTimeout(() => {
              setSearch("");
            }, 250)
          }
        />
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
            if (activePage === "search") {
              if (e.key === "Enter" && !getValue() && search) {
                e.preventDefault();
                handleToggleFilterKeyword(search);
              }

              if (!enterToSearch) {
                if (isAlphanumeric(e.key) && !e.metaKey && !search.startsWith("#")) {
                  setQuickSearch(search + e.key);
                  setValue(search + e.key);
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
                    className="focus-ring rounded px-2 text-sm whitespace-nowrap">
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
          <div className="bg-popover/70 text-popover-foreground absolute top-full block w-full rounded-lg rounded-t-none border border-t-0 p-2 px-0 pb-0 shadow-lg backdrop-blur-lg">
            <CommandList className={cn("scrollbar-gray scroll-fade overscroll-contain")}>
              {activePage === "/" && (
                <>
                  <TabCommandGroup
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
                      <TabCommandItem
                        onSelect={withClear(bookmarkStoreSelectionActions.selectAllTabs)}>
                        <CheckCircledIcon className="text-muted-foreground mr-2" />
                        Select All
                      </TabCommandItem>
                    ) : (
                      <TabCommandItem
                        onSelect={withClear(bookmarkStoreSelectionActions.deselectAllTabs)}>
                        <MinusCircledIcon className="text-muted-foreground mr-2" /> Deselect All
                      </TabCommandItem>
                    )}
                    {Boolean(selectedCount) && (
                      <>
                        <TabCommandItem onSelect={() => pushPage("tag")}>
                          <TagIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
                          Tag
                        </TabCommandItem>
                        <TabCommandItem onSelect={withClear(handleCreateListFromSelected)}>
                          <FilePlusIcon className="text-muted-foreground mr-2" /> Create a list
                        </TabCommandItem>
                        <TabCommandItem onSelect={withClear(handlePinSelected)}>
                          <DrawingPinIcon className="text-muted-foreground mr-2" />
                          Pin
                        </TabCommandItem>

                        <TabCommandItem onSelect={withClear(handleOpenSelected)}>
                          <ExternalLinkIcon className="text-muted-foreground mr-2" /> Open in this
                          window
                        </TabCommandItem>
                        <TabCommandItem onSelect={withClear(() => handleOpenSelected(true))}>
                          <OpenInNewWindowIcon className="text-muted-foreground mr-2" /> Open in new
                          window
                        </TabCommandItem>
                        <TabCommandItem onSelect={withClear(handleCopyToClipboard)}>
                          <ClipboardIcon className="text-muted-foreground mr-2" />
                          Copy to clipboard
                        </TabCommandItem>
                        <TabCommandItem onSelect={withClear(handleOpenInLLM("chatgpt"))}>
                          <OpenAiLogoIcon className="text-muted-foreground mr-2" />
                          Open in ChatGPT
                        </TabCommandItem>
                        <TabCommandItem onSelect={() => setDeleteDialogOpen(true)}>
                          <TrashIcon className="text-muted-foreground mr-2" /> Delete
                        </TabCommandItem>
                      </>
                    )}
                  </TabCommandGroup>
                  <CommandSeparator />
                  <TabCommandGroup heading="Bookmarks">
                    <TabCommandItem onSelect={() => pushPage("search")} value="Find Search">
                      <MagnifyingGlassIcon className="text-muted-foreground mr-2" /> Search
                    </TabCommandItem>
                  </TabCommandGroup>
                  <CommandSeparator />
                  <TabCommandGroup heading="Other">
                    {onCurate && (
                      <TabCommandItem onSelect={withClear(onCurate)}>
                        <BroomIcon className="text-muted-foreground mr-2" />
                        Curate
                      </TabCommandItem>
                    )}
                    <TabCommandItem onSelect={() => settingStoreActions.activatePanel(Panel.Tabs)}>
                      <BrowserIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
                      Go to Tabs
                    </TabCommandItem>
                    <TabCommandItem
                      onSelect={withClose(() => settingStoreActions.setSettingsOpen(true))}>
                      <GearIcon className="text-muted-foreground mr-2" />
                      Open Settings
                    </TabCommandItem>
                    <TabCommandItem
                      onSelect={withClose(() => curateStoreActions.setCurateOpen(true))}>
                      <BroomIcon className="text-muted-foreground mr-2" />
                      Curate
                    </TabCommandItem>
                  </TabCommandGroup>
                  <CommandEmpty>No Results</CommandEmpty>
                </>
              )}
              {activePage === "tag" && (
                <div className="flex flex-col gap-4">
                  {assignedTagIds.size > 0 && (
                    <div className="tags flex items-center gap-2 pl-2">
                      <button
                        className="focus-ring rounded px-2 text-sm whitespace-nowrap"
                        onClick={() => setAssignedTagIds(new Set())}>
                        Clear all
                      </button>
                      <TagChipList
                        max={10}
                        tags={Array.from(assignedTagIds).map((t) => tagsById.get(t)!)}
                        onRemove={(tag) => {
                          toggleAssignedTagId(tag.id!);
                        }}
                      />
                    </div>
                  )}
                  <TabCommandGroup>
                    {tags
                      .filter((t) => !assignedTagIds.has(t.id) && t.id !== unassignedTag.id)
                      .map((t) => (
                        <TabCommandItem
                          key={t.id}
                          value={t.name}
                          onSelect={() => {
                            toggleAssignedTagId(t.id);
                            setSearch("");
                          }}>
                          <div className="flex items-center">
                            {t.name}{" "}
                            <div
                              className="ml-2 h-3 w-3 rounded-full"
                              style={{ background: t.color }}
                            />
                          </div>
                        </TabCommandItem>
                      ))}
                  </TabCommandGroup>
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
              {activePage === "search" && (
                <div>
                  <div className="mb-2 px-2">
                    <FilterTagChips
                      filter={view.filter}
                      onRemoveKeyword={handleRemoveFilterKeyword}
                      onRemoveTag={handleToggleFilterTag}
                    />
                  </div>
                  {Boolean(hashtag) && (
                    <div className="">
                      <TabCommandGroup>
                        {tags
                          .filter((t) => !view.filter.tags.includes(t.id))
                          .map((t) => (
                            <TabCommandItem
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
                            </TabCommandItem>
                          ))}
                      </TabCommandGroup>
                    </div>
                  )}
                  <CommandEmpty className="flex items-center justify-center gap-2">
                    <div className="text-muted-foreground">
                      {search && !Boolean(hashtag) ? (
                        <span>
                          Search by "<span className="text-foreground italic">{search}</span>"
                        </span>
                      ) : search ? (
                        "No tags found"
                      ) : (
                        <span>
                          Type to search - <kbd className="keyboard-shortcut small">#</kbd> to
                          search by tag
                        </span>
                      )}
                    </div>
                    {viewTabIds.length === 0 && !view.filter.looseMatch && search && (
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
                        transition={{ duration: 0.2 }}>
                        <div className="text-muted-foreground">or</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto px-2 py-1 text-xs"
                          onClick={handleLooseMatch}>
                          Try loose match
                        </Button>
                      </motion.div>
                    )}
                  </CommandEmpty>
                </div>
              )}
            </CommandList>
            <TabCommandFooter
              className="mt-1"
              pages={pages}
              resultsCount={activePage === "search" ? viewTabIds.length : undefined}
            />
          </div>
        </Command>
      </TabCommandDialog>
      {/* todo: figure out how to wrap TabCommandItem in Dialog and make it work that way */}
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
