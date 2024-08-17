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
import { toast } from "@echotab/ui/Toast";
import { cn } from "@echotab/ui/util";
import { Tag as TagIcon } from "@phosphor-icons/react";
import {
  BookmarkIcon,
  CheckCircledIcon,
  ClipboardIcon,
  CopyIcon,
  Cross2Icon,
  LightningBoltIcon,
  MagnifyingGlassIcon,
  MinusCircledIcon,
  OpenInNewWindowIcon,
} from "@radix-ui/react-icons";
import { useRef } from "react";

import FilterTagChips from "../components/FilterTagChips";
import { CommandPagination, TabCommandDialog, useTabCommand } from "../components/TabCommand";
import TagChip, { TagChipList } from "../components/TagChip";
import { Panel } from "../models";
import { unassignedTag, useTagStore } from "../TagStore";
import { useUIStore } from "../UIStore";
import { formatLinks } from "../util";
import { getUtcISO } from "../util/date";
import { toggle } from "../util/set";
import ActiveStore, {
  SelectionStore,
  useActiveSelectionStore,
  useActiveTabStore,
} from "./ActiveStore";

// todo: clean this & SavedCommand up
export default function ActiveCommand() {
  const tabStore = useActiveTabStore();
  const tagStore = useTagStore();
  const uiStore = useUIStore();
  const selectionStore = useActiveSelectionStore();

  const { pages, goToPage, activePage, pushPage, search, setSearch, setPages, goToPrevPage } =
    useTabCommand();

  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  const getValue = () => {
    const highlighted = commandRef.current?.querySelector(`[cmdk-item=""][aria-selected="true"]`);
    if (highlighted) {
      return (highlighted as HTMLElement)?.dataset?.value;
    }
  };

  const handleQuickSave = async () => {
    const tagName = getUtcISO();

    if (selectionStore.selectedTabIds.size) {
      const quickTag = tagStore.createTag(tagName);

      const tabsToSave = Array.from(SelectionStore.selectedTabIds)
        .map((id) => ActiveStore.viewTabsById[id])
        .filter(Boolean)
        .map((tab) => {
          const tabToSave = {
            id: tab.id,
            url: tab.url,
            favIconUrl: tab?.favIconUrl,
            title: tab.title,
            savedAt: Date.now(),
            tagIds: [quickTag.id],
          };

          return tabToSave;
        });

      await tabStore.saveTabs(tabsToSave);
      return;
    }

    for (const w of Object.keys(ActiveStore.viewTabIdsByWindowId)) {
      const windowId = Number(w);
      if (ActiveStore.viewTabIdsByWindowId[windowId].length === 0) {
        continue;
      }

      const quickTag = tagStore.createTag(`${tagName} - ${windowId}`);

      const tabsToSave = ActiveStore.viewTabIdsByWindowId[windowId]
        .map((id) => ActiveStore.viewTabsById[id])
        .filter(Boolean)
        .map((tab) => {
          const tabToSave = {
            id: tab.id,
            url: tab.url,
            favIconUrl: tab?.favIconUrl,
            title: tab.title,
            savedAt: Date.now(),
            tagIds: [quickTag.id],
          };

          return tabToSave;
        });

      await tabStore.saveTabs(tabsToSave);
      setSearch("");
    }
  };

  const handleSaveAssignedTags = async () => {
    if (ActiveStore.assignedTagIds.size === 0) {
      return;
    }

    const tabsToSave = Array.from(SelectionStore.selectedTabIds)
      .map((id) => ActiveStore.viewTabsById[id])
      .filter(Boolean)
      .map((tab) => {
        const tabToSave = {
          id: tab.id,
          url: tab.url,
          favIconUrl: tab?.favIconUrl,
          title: tab.title,
          savedAt: Date.now(),
          tagIds: Array.from(ActiveStore.assignedTagIds),
        };

        return tabToSave;
      });

    await tabStore.saveTabs(tabsToSave);

    tabStore.clearAssignedTagIds();
    setSearch("");
    setPages(["/"]);
  };

  const handleCopyToClipboard = () => {
    const selectedLinks = tabStore.tabs.filter((tab) => SelectionStore.selectedTabIds.has(tab.id));

    const formatted = formatLinks(selectedLinks, uiStore.settings.clipboardFormat);

    navigator.clipboard
      .writeText(formatted)
      .then(() => {
        toast(`Copied ${selectedLinks.length} links to clipboard!`);
      })
      .catch(() => {
        toast("Failed to copy links to clipboard!");
      });
  };

  const handleCreateTag = () => {
    const newTag = tagStore.createTag(search);
    tabStore.toggleAssignedTagId(newTag.id);
    setSearch("");
  };

  const handleCloseSelected = () => {
    tabStore.removeTabs(Array.from(SelectionStore.selectedTabIds));
  };

  const handleToggleFilterKeyword = (keyword: string) => {
    let filterKeywords = new Set(ActiveStore.view.filter.keywords);
    toggle(filterKeywords, keyword.trim());

    tabStore.updateFilter({
      keywords: Array.from(filterKeywords),
    });

    setSearch("");
  };

  const handleMoveToNewWindow = async (incognito = false) => {
    const tabIds = Array.from(SelectionStore.selectedTabIds);
    await ActiveStore.moveTabsToNewWindow(tabIds, incognito);
  };

  const handleApply = () => {
    if (activePage === "tag") {
      handleSaveAssignedTags();
    }
  };

  let commandLabel = undefined;
  if (activePage === "tag") {
    commandLabel = "Tagging";
  } else if (activePage === "filter") {
    commandLabel = "Filtering";
  }

  const withClear = (fn: () => void) => {
    return () => {
      fn();
      setSearch("");
    };
  };

  return (
    <TabCommandDialog label={commandLabel}>
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
            "scrollbar-gray bg-popover text-popover-foreground absolute top-[100%] block w-full rounded-lg rounded-t-none border border-t-0 p-2 shadow-lg",
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
                        "opacity-0": !selectionStore.selectedTabIds.size,
                      })}>
                      {selectionStore.selectedTabIds.size}
                    </Badge>
                  </span>
                }>
                {selectionStore.selectedTabIds.size === 0 ? (
                  <CommandItem onSelect={withClear(selectionStore.selectAllTabs)}>
                    <CheckCircledIcon className="text-muted-foreground mr-2" />
                    Select All
                  </CommandItem>
                ) : (
                  <CommandItem onSelect={withClear(selectionStore.deselectAllTabs)}>
                    <MinusCircledIcon className="text-muted-foreground mr-2" />
                    Deselect All
                  </CommandItem>
                )}
                {Boolean(selectionStore.selectedTabIds.size) && (
                  <>
                    <CommandItem onSelect={() => pushPage("tag")}>
                      <TagIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
                      Tag
                    </CommandItem>
                    <CommandItem onSelect={withClear(handleCloseSelected)}>
                      <Cross2Icon className="text-muted-foreground mr-2" /> Close
                    </CommandItem>
                    <CommandItem onSelect={withClear(handleCopyToClipboard)}>
                      <ClipboardIcon className="text-muted-foreground mr-2" />
                      Copy to clipboard
                    </CommandItem>
                    <CommandItem onSelect={withClear(handleMoveToNewWindow)}>
                      <OpenInNewWindowIcon className="text-muted-foreground mr-2" />
                      Move to new window
                    </CommandItem>
                  </>
                )}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="General">
                {/* <CommandItem onSelect={handleQuickSave}>
                  <MagicWandIcon className="text-muted-foreground mr-2" />
                  AI Save
                </CommandItem> */}
                <CommandItem onSelect={withClear(handleQuickSave)}>
                  <LightningBoltIcon className="text-muted-foreground mr-2" />
                  Quick Save
                </CommandItem>
                <CommandItem onSelect={() => pushPage("search")}>
                  <MagnifyingGlassIcon className="text-muted-foreground mr-2" />
                  Search
                </CommandItem>
                {tabStore.viewDuplicateTabIds.size > 0 && (
                  <CommandItem onSelect={withClear(tabStore.removeDuplicateTabs)}>
                    <CopyIcon className="text-muted-foreground mr-2" />
                    Close {tabStore.viewDuplicateTabIds.size} Duplicates
                  </CommandItem>
                )}
                <CommandItem onSelect={() => uiStore.activatePanel(Panel.Bookmarks)}>
                  <BookmarkIcon className="text-muted-foreground mr-2" />
                  Go to Bookmarks
                </CommandItem>
              </CommandGroup>
              <CommandEmpty>No Results</CommandEmpty>
            </>
          )}
          {activePage === "tag" && (
            <div className="flex flex-col gap-4">
              {tabStore.assignedTagIds.size > 0 && (
                <div className="tags flex items-center gap-2">
                  <button
                    className="focus-ring whitespace-nowrap rounded px-2 text-sm"
                    onClick={tabStore.clearAssignedTagIds}>
                    Clear all
                  </button>
                  <TagChipList
                    max={10}
                    tags={Array.from(tabStore.assignedTagIds).map((t) => tagStore.tags.get(t)!)}
                    onRemove={(tag) => {
                      tabStore.toggleAssignedTagId(tag.id!);
                    }}
                  />
                </div>
              )}
              <CommandGroup>
                {Array.from(tagStore.tags.values())
                  .filter((t) => !tabStore.assignedTagIds.has(t.id) && t.id !== unassignedTag.id)
                  .map((t) => (
                    <CommandItem
                      key={t.id}
                      value={t.name}
                      onSelect={withClear(() => {
                        tabStore.toggleAssignedTagId(t.id);
                      })}>
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
                    Create <TagChip className="text-sm">{search}</TagChip>
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
                  filter={tabStore.view.filter}
                  onRemoveKeyword={handleToggleFilterKeyword}
                />
              </div>
              <CommandEmpty>{search ? `Search by "${search}"` : "Search by keywords"}</CommandEmpty>
            </div>
          )}
        </CommandList>
      </Command>
    </TabCommandDialog>
  );
}
