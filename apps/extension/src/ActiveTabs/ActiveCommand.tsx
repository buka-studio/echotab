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
import { Tooltip, TooltipContent, TooltipTrigger } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import { BroomIcon, OpenAiLogoIcon, TagIcon, XIcon } from "@phosphor-icons/react";
import {
  BookmarkIcon,
  CheckCircledIcon,
  ClipboardIcon,
  ClockIcon,
  CopyIcon,
  Cross2Icon,
  GearIcon,
  InfoCircledIcon,
  LightningBoltIcon,
  MagnifyingGlassIcon,
  MinusCircledIcon,
  OpenInNewWindowIcon,
} from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { curateStoreActions } from "~/store/curateStore";
import { openLinksInLLM } from "~/util/url";

import { useDebounceValue } from "usehooks-ts";
import FilterTagChips from "../components/FilterTagChips";
import { KeyboardShortcut, KeyboardShortcutKey } from "../components/KeyboardShortcut";
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
import { Panel } from "../models";
import { settingStoreActions, useSettingStore } from "../store/settingStore";
import {
  SelectionStore,
  staleThresholdDaysInMs,
  tabStoreActions,
  tabStoreSelectionActions,
  useTabSelectionStore,
  useTabStore,
  useTabViewStore,
  useViewDuplicateTabIds,
  useViewStaleTabIds,
  useViewTabIds,
  useViewTabIdsByWindowId,
  useViewTabsById,
} from "../store/tabStore";
import { tagStoreActions, unassignedTag, useTagsById, useTagStore } from "../store/tagStore";
import { formatLinks, pluralize } from "../util";
import { isAlphanumeric } from "../util/string";

const pages = ["/", "tag", "search", "paste"] as const;

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

  if (page === "paste") {
    return (
      <span className="text-muted-foreground flex items-center gap-2">
        <ClipboardIcon className="animate-pulse" />
        Paste links...
      </span>
    );
  }

  return null;
};

const SaveSessionTooltip = ({
  selectedCount,
  className,
}: {
  selectedCount: number;
  className?: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "text-muted-foreground focus-visible:ring-ring flex rounded-full focus-visible:ring-1 focus-visible:outline-none",
          className,
        )}>
        <InfoCircledIcon />
      </TooltipTrigger>
      <TooltipContent>
        <p>This will save and close {selectedCount ? selectedCount : "all"} tabs.</p>
      </TooltipContent>
    </Tooltip>
  );
};

const parseLinks = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const matches = text.match(urlRegex) || [];

  return [...new Set(matches)];
};

// todo: clean this & SavedCommand up
export default function ActiveCommand() {
  const tabs = useTabStore((s) => s.tabs);
  const assignedTagIds = useTabStore((s) => s.assignedTagIds);
  const tags = useTagStore((s) => s.tags);
  const tagsById = useTagsById();
  const settings = useSettingStore((s) => s.settings);
  const viewTabsById = useViewTabsById();
  const viewTabIdsByWindowId = useViewTabIdsByWindowId();
  const viewTabIds = useViewTabIds();
  const viewDuplicateTabIds = useViewDuplicateTabIds();
  const viewStaleTabIds = useViewStaleTabIds();
  const view = useTabViewStore();
  const selectionStore = useTabSelectionStore();
  const [pastedLinks, setPastedLinks] = useState<string[]>([]);
  const [pastedLinksVisible, setPastedLinksVisible] = useState(3);

  const {
    pages,
    goToPage,
    activePage = "/",
    pushPage,
    search,
    setSearch,
    setPages,
    goToPrevPage,
  } = useTabCommand<Page>();

  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  const getValue = () => {
    const highlighted = commandRef.current?.querySelector(`[cmdk-item=""][aria-selected="true"]`);
    if (highlighted) {
      return (highlighted as HTMLElement)?.dataset?.value;
    }
  };

  const enterToSearch = false;

  const handleQuickSave = async () => {
    const tagName = tagStoreActions.getQuickSaveTagName();

    if (SelectionStore.selectedTabIds.size) {
      const [quickTag] = tagStoreActions.createTags([{ name: tagName, isQuick: true }]);
      if (!quickTag) return;

      const tabsToSave = Array.from(SelectionStore.selectedTabIds)
        .map((id) => viewTabsById[id])
        .filter((tab): tab is NonNullable<typeof tab> => tab != null)
        .map((tab) => ({
          ...tab,
          tagIds: [quickTag.id],
        }));

      await tabStoreActions.saveTabs(tabsToSave);
      return;
    }

    for (const w of Object.keys(viewTabIdsByWindowId)) {
      const windowId = Number(w);
      if (viewTabIdsByWindowId[windowId]?.length === 0) {
        continue;
      }

      const tagName = tagStoreActions.getQuickSaveTagName();
      const [quickTag] = tagStoreActions.createTags([{ name: tagName, isQuick: true }]);
      if (!quickTag) continue;

      const tabsToSave = (viewTabIdsByWindowId[windowId] ?? [])
        .map((id) => viewTabsById[id])
        .filter((tab): tab is NonNullable<typeof tab> => tab != null)
        .map((tab) => ({
          ...tab,
          tagIds: [quickTag.id],
        }));

      await tabStoreActions.saveTabs(tabsToSave);
      setSearch("");
    }
  };

  const handleSaveAssignedTags = async () => {
    if (assignedTagIds.size === 0) {
      return;
    }

    const tabsToSave = Array.from(SelectionStore.selectedTabIds)
      .map((id) => viewTabsById[id])
      .filter((tab): tab is NonNullable<typeof tab> => tab != null)
      .map((tab) => ({
        ...tab,
        tagIds: Array.from(assignedTagIds),
      }));

    await tabStoreActions.saveTabs(tabsToSave);

    tabStoreActions.clearAssignedTagIds();
    setSearch("");
    setPages(["/"]);
  };

  const handleCopyToClipboard = () => {
    const selectedIdsSet = new Set(SelectionStore.selectedTabIds);
    const selectedLinks = tabs.filter((tab) => selectedIdsSet.has(tab.id));

    const formatted = formatLinks(selectedLinks, settings.clipboardFormat);

    if (!formatted) return;

    navigator.clipboard
      .writeText(formatted)
      .then(() => {
        toast.success(`${pluralize(selectedLinks.length, "link")} copied to clipboard`);
      })
      .catch(() => {
        toast.error("Failed to copy links to clipboard");
      });
  };

  const handleCreateTag = () => {
    const [newTag] = tagStoreActions.createTags([{ name: search }]);
    if (newTag) {
      tabStoreActions.toggleAssignedTagId(newTag.id);
    }
    setSearch("");
  };

  const handleCloseSelected = () => {
    tabStoreActions.removeTabs(Array.from(SelectionStore.selectedTabIds));
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

      tabStoreActions.updateFilter({
        keywords,
      });
      runningSearchRef.current = keyword;
    } else {
      const filterKeywords = new Set(view.filter.keywords);
      filterKeywords.add(keyword.trim());

      tabStoreActions.updateFilter({
        keywords: Array.from(filterKeywords),
      });

      setSearch("");
      runningSearchRef.current = "";
    }
  };

  const handleRemoveFilterKeyword = (keyword: string) => {
    const filterKeywords = new Set(view.filter.keywords);
    filterKeywords.delete(keyword.trim());

    tabStoreActions.updateFilter({
      keywords: Array.from(filterKeywords),
    });
  };

  const handleMoveToNewWindow = async (incognito = false) => {
    const tabIds = Array.from(SelectionStore.selectedTabIds);
    await tabStoreActions.moveTabsToNewWindow(tabIds, incognito);
  };

  const handleApply = () => {
    if (activePage === "tag") {
      handleSaveAssignedTags();
    }
  };

  const customLabel = ["tag", "search", "paste"].includes(activePage);

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

  const handleLooseMatch = () => {
    tabStoreActions.updateFilter({
      looseMatch: true,
    });
  };

  const handleOpenInLLM = (provider: "chatgpt" | "claude") => () => {
    const selectedIdsSet = new Set(selectionStore.selectedTabIds);
    const selectedLinks = tabs.filter((tab) => selectedIdsSet.has(tab.id));

    openLinksInLLM(selectedLinks, provider);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (activePage !== "paste") return;

    e.preventDefault();

    const text = e.clipboardData.getData("text");
    const links = parseLinks(text);
    if (links.length > 0) {
      setPastedLinks(links);
    }
  };

  const handleOpenPastedLinks = () => {
    pastedLinks.forEach((url) => {
      chrome.tabs.create({ url, active: false });
    });
    setPastedLinks([]);
    setPages(["/"]);
    setSearch("");
  };

  const handleRemovePastedLink = (link: string) => {
    setPastedLinks(pastedLinks.filter((l) => l !== link));
  };

  return (
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

            if (activePage === "paste") {
              setPastedLinks([]);
            }

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
            onPaste={handlePaste}
            autoFocus
          />
          <div className="actions">
            {["tag"].includes(activePage) && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleApply}
                  disabled={assignedTagIds.size === 0}
                  className="focus-ring rounded px-2 text-sm whitespace-nowrap disabled:opacity-50">
                  Apply
                </button>
                <KeyboardShortcut>
                  <KeyboardShortcutKey className="w-6 text-lg">⌘</KeyboardShortcutKey>
                  <KeyboardShortcutKey>enter</KeyboardShortcutKey>
                </KeyboardShortcut>
              </div>
            )}
          </div>
        </div>
        <div className="bg-popover/80 text-popover-foreground absolute top-full block w-full rounded-lg rounded-t-none border border-t-0 p-2 px-0 pb-0 shadow-lg backdrop-blur-lg">
          <CommandList className={cn("scrollbar-gray scroll-fade overscroll-contain")}>
            {activePage === "/" && (
              <>
                <TabCommandGroup
                  className="px-0"
                  heading={
                    <span>
                      Selection{" "}
                      <Badge
                        variant="card"
                        className={cn("ml-2 inline", {
                          "opacity-0": !selectedCount,
                        })}>
                        {selectedCount}
                      </Badge>
                    </span>
                  }>
                  {selectedCount === 0 ? (
                    <TabCommandItem onSelect={withClear(tabStoreSelectionActions.selectAllTabs)}>
                      <CheckCircledIcon className="text-muted-foreground mr-2" />
                      Select All
                    </TabCommandItem>
                  ) : (
                    <TabCommandItem onSelect={withClear(tabStoreSelectionActions.deselectAllTabs)}>
                      <MinusCircledIcon className="text-muted-foreground mr-2" />
                      Deselect All
                    </TabCommandItem>
                  )}
                  {Boolean(selectedCount) && (
                    <>
                      <TabCommandItem onSelect={() => pushPage("tag")}>
                        <TagIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
                        Tag
                      </TabCommandItem>

                      <TabCommandItem onSelect={withClear(handleQuickSave)}>
                        <LightningBoltIcon className="text-muted-foreground mr-2" />
                        Quick Save Tabs
                        <SaveSessionTooltip selectedCount={selectedCount} className="ml-2" />
                      </TabCommandItem>

                      <TabCommandItem onSelect={withClear(handleCopyToClipboard)}>
                        <ClipboardIcon className="text-muted-foreground mr-2" />
                        Copy to clipboard
                      </TabCommandItem>
                      <TabCommandItem onSelect={withClear(handleMoveToNewWindow)}>
                        <OpenInNewWindowIcon className="text-muted-foreground mr-2" />
                        Move to new window
                      </TabCommandItem>
                      <TabCommandItem onSelect={withClear(handleOpenInLLM("chatgpt"))}>
                        <OpenAiLogoIcon className="text-muted-foreground mr-2" />
                        Open in ChatGPT
                      </TabCommandItem>
                      <TabCommandItem onSelect={withClear(handleCloseSelected)}>
                        <Cross2Icon className="text-muted-foreground mr-2" /> Close
                      </TabCommandItem>
                    </>
                  )}
                </TabCommandGroup>
                <CommandSeparator />
                <TabCommandGroup heading="All Tabs">
                  {selectedCount === 0 && (
                    <TabCommandItem onSelect={withClear(handleQuickSave)}>
                      <LightningBoltIcon className="text-muted-foreground mr-2" />
                      Quick Save All Tabs
                      <SaveSessionTooltip selectedCount={selectedCount} className="ml-2" />
                    </TabCommandItem>
                  )}
                  <TabCommandItem onSelect={() => pushPage("search")} value="Find Search">
                    <MagnifyingGlassIcon className="text-muted-foreground mr-2" />
                    Search
                  </TabCommandItem>
                  {viewDuplicateTabIds.size > 0 && (
                    <TabCommandItem onSelect={withClear(tabStoreActions.removeDuplicateTabs)}>
                      <CopyIcon className="text-muted-foreground mr-2" />
                      Close {pluralize(viewDuplicateTabIds.size, "Duplicate")}
                    </TabCommandItem>
                  )}
                  {viewStaleTabIds.size > 0 && (
                    <TabCommandItem onSelect={withClear(tabStoreActions.removeStaleTabs)}>
                      <ClockIcon className="text-muted-foreground mr-2" />
                      Close {viewStaleTabIds.size} Stale Tabs{" "}
                      <span className="text-muted-foreground/50 ml-2 text-xs">
                        &gt; {staleThresholdDaysInMs / (1000 * 60 * 60 * 24)} days old
                      </span>
                    </TabCommandItem>
                  )}
                </TabCommandGroup>
                <CommandSeparator />
                <TabCommandGroup heading="Other">
                  <TabCommandItem onSelect={() => pushPage("paste")} value="Paste to Open">
                    <ClipboardIcon className="text-muted-foreground mr-2" />
                    Paste to Open
                  </TabCommandItem>
                  <TabCommandItem
                    onSelect={() => settingStoreActions.activatePanel(Panel.Bookmarks)}>
                    <BookmarkIcon className="text-muted-foreground mr-2" />
                    Go to Bookmarks
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
                      onClick={tabStoreActions.clearAssignedTagIds}>
                      Clear all
                    </button>
                    <TagChipList
                      max={10}
                      tags={Array.from(assignedTagIds).map((t) => tagsById.get(t)!)}
                      onRemove={(tag) => {
                        tabStoreActions.toggleAssignedTagId(tag.id!);
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
                        onSelect={withClear(() => {
                          tabStoreActions.toggleAssignedTagId(t.id);
                        })}>
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
                    filter={view.filter}
                    onRemoveKeyword={handleRemoveFilterKeyword}
                  />
                </div>
                <CommandEmpty className="flex items-center justify-center gap-2">
                  <div className="text-muted-foreground">
                    {search ? (
                      <span>
                        Search by "<span className="text-foreground italic">{search}</span>"
                      </span>
                    ) : (
                      "Type to search"
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

            {activePage === "paste" && (
              <div className="flex flex-col gap-2">
                {pastedLinks.length > 0 ? (
                  <>
                    <TabCommandGroup heading={`Pasted Links`}>
                      <TabCommandItem onSelect={handleOpenPastedLinks}>
                        <OpenInNewWindowIcon className="text-muted-foreground mr-2" />
                        Open {pluralize(pastedLinks.length, "Tab")}
                      </TabCommandItem>
                    </TabCommandGroup>
                    <CommandSeparator />
                    <div className="flex flex-col items-start gap-1">
                      <ul className="w-full">
                        {pastedLinks.slice(0, pastedLinksVisible).map((link, i) => (
                          <li
                            key={i}
                            className="text-muted-foreground hover:bg-card/50 flex items-center justify-between gap-2 truncate py-1 pr-1 pl-4 text-sm">
                            <span className="truncate">{link}</span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-6"
                              onClick={() => handleRemovePastedLink(link)}>
                              <XIcon className="text-muted-foreground" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                      {pastedLinks.length > pastedLinksVisible && (
                        <Button
                          onClick={() => setPastedLinksVisible(pastedLinks.length)}
                          size="sm"
                          variant="ghost"
                          className="ml-1 h-6">
                          <span className="truncate">
                            Show {pastedLinks.length - pastedLinksVisible} more
                          </span>
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <CommandEmpty>
                    <span className="text-muted-foreground">Paste text containing links (⌘V)</span>
                  </CommandEmpty>
                )}
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
  );
}
