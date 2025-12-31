import { Badge } from "@echotab/ui/Badge";
import { Button } from "@echotab/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandSeparator,
} from "@echotab/ui/Command";
import { NumberFlow } from "@echotab/ui/NumberFlow";
import { toast } from "@echotab/ui/Toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import { OpenAiLogoIcon, TagIcon } from "@phosphor-icons/react";
import {
  BookmarkIcon,
  CheckCircledIcon,
  ClipboardIcon,
  ClockIcon,
  CopyIcon,
  Cross2Icon,
  InfoCircledIcon,
  LightningBoltIcon,
  MagnifyingGlassIcon,
  MinusCircledIcon,
  OpenInNewWindowIcon,
} from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { useLLMTagMutation } from "../AI/queries";
import FilterTagChips from "../components/FilterTagChips";
import { KeyboardShortcut, KeyboardShortcutKey } from "../components/KeyboardShortcut";
import {
  CommandPagination,
  OnClose,
  TabCommandDialog,
  TabCommandDialogRef,
  TabCommandGroup,
  TabCommandItem,
  useTabCommand,
} from "../components/TabCommand";
import TagChip from "../components/tag/TagChip";
import TagChipList from "../components/tag/TagChipList";
import { ActiveTab, Panel } from "../models";
import TagStore, { unassignedTag, useTagStore } from "../TagStore";
import UIStore, { useUIStore } from "../UIStore";
import { formatLinks, pluralize, wait } from "../util";
import { isAlphanumeric } from "../util/string";
import ActiveStore, {
  SelectionStore,
  staleThresholdDaysInMs,
  useActiveSelectionStore,
  useActiveTabStore,
} from "./ActiveStore";

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

const AiTagTooltip = ({ className }: { className?: string }) => {
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "text-muted-foreground focus-visible:ring-ring flex rounded-full focus-visible:ring-1 focus-visible:outline-none",
          className,
        )}>
        <InfoCircledIcon />
      </TooltipTrigger>
      <TooltipContent className="max-w-[250px] text-pretty">
        Enable AI Tagging by adding LLM endpoint details in settings.
      </TooltipContent>
    </Tooltip>
  );
};

// todo: clean this & SavedCommand up
export default function ActiveCommand() {
  const tabStore = useActiveTabStore();
  const tagStore = useTagStore();
  const uiStore = useUIStore();
  const selectionStore = useActiveSelectionStore();

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

  const llmMutation = useLLMTagMutation();

  const aiDisabled = !uiStore.settings.aiApiProvider;
  const enterToSearch = false; //uiStore.settings.enterToSearch;

  const handleAITag = async () => {
    if (aiDisabled) {
      toast.info("AI Tagging is disabled. Add LLM endpoint details in settings to enable.");
      return;
    }
    if (selectionStore.selectedTabIds.size) {
      const existingTags = Array.from(tagStore.tags.values());

      const res = await llmMutation.mutateAsync({
        tags: existingTags,
        tabs: Array.from(selectionStore.selectedTabIds)
          .map((id) => ActiveStore.viewTabsById[id])
          .filter(Boolean),
      });

      const tags = res.map((t) => ({ name: t }));

      const createdTags = tagStore.createTags(tags);

      pushPage("tag");
      for (const tag of createdTags) {
        await wait(50);
        tabStore.toggleAssignedTagId(tag.id);
      }
    }
  };

  const handleQuickSave = async () => {
    const tagName = TagStore.getQuickSaveTagName();

    if (selectionStore.selectedTabIds.size) {
      const quickTag = tagStore.createTag({ name: tagName, isQuick: true });

      const tabsToSave = Array.from(SelectionStore.selectedTabIds)
        .map((id) => ActiveStore.viewTabsById[id])
        .filter(Boolean)
        .map((t) => {
          const tab = t as ActiveTab;

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

      const tagName = TagStore.getQuickSaveTagName();

      const quickTag = tagStore.createTag({ name: tagName, isQuick: true });

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
    const newTag = tagStore.createTag({ name: search });
    tabStore.toggleAssignedTagId(newTag.id);
    setSearch("");
  };

  const handleCloseSelected = () => {
    tabStore.removeTabs(Array.from(SelectionStore.selectedTabIds));
  };

  const runningSearchRef = useRef<string>(search);
  const handleToggleFilterKeyword = (keyword: string, isQuick = false) => {
    if (isQuick) {
      const keywords = [...ActiveStore.view.filter.keywords];
      if (keywords.at(-1) === runningSearchRef.current) {
        keywords.pop();
      }

      keywords.push(keyword);

      tabStore.updateFilter({
        keywords,
      });
      runningSearchRef.current = keyword;
    } else {
      const filterKeywords = new Set(ActiveStore.view.filter.keywords);
      filterKeywords.add(keyword.trim());

      tabStore.updateFilter({
        keywords: Array.from(filterKeywords),
      });

      setSearch("");
      runningSearchRef.current = "";
    }
  };

  const handleRemoveFilterKeyword = (keyword: string) => {
    const filterKeywords = new Set(ActiveStore.view.filter.keywords);
    filterKeywords.delete(keyword.trim());

    tabStore.updateFilter({
      keywords: Array.from(filterKeywords),
    });
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

  const customLabel = ["tag", "find"].includes(activePage);

  const withClear = (fn: () => void) => {
    return () => {
      fn();
      setSearch("");
    };
  };

  const selectedCount = selectionStore.selectedTabIds.size;

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
    tabStore.updateFilter({
      looseMatch: true,
    });
  };

  const handleOpenInLLM = (provider: "chatgpt" | "claude") => () => {
    const selectedLinks = tabStore.tabs.filter((tab) => SelectionStore.selectedTabIds.has(tab.id));
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
          if (activePage === "find") {
            if (e.key === "Enter" && !getValue() && search) {
              e.preventDefault();
              handleToggleFilterKeyword(search);
            }

            if (!enterToSearch) {
              if (isAlphanumeric(e.key) && !e.metaKey && !search.startsWith("#")) {
                handleToggleFilterKeyword(search + e.key, true);
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
                  disabled={ActiveStore.assignedTagIds.size === 0}
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
        <CommandList
          className={cn(
            "scrollbar-gray bg-popover text-popover-foreground absolute top-full block w-full rounded-lg rounded-t-none border border-t-0 p-2 px-0 shadow-lg",
          )}>
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
                  <TabCommandItem onSelect={withClear(selectionStore.selectAllTabs)}>
                    <CheckCircledIcon className="text-muted-foreground mr-2" />
                    Select All
                  </TabCommandItem>
                ) : (
                  <TabCommandItem onSelect={withClear(selectionStore.deselectAllTabs)}>
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
                      Quick Save
                      <SaveSessionTooltip selectedCount={selectedCount} className="ml-2" />
                    </TabCommandItem>

                    {/* <TabCommandItem
                      onSelect={withClear(handleAITag)}
                      value="AI Tag"
                      className="group"
                      disabled={llmMutation.isPending}>
                      <SparkleIcon className="text-muted-foreground mr-2 h-[15px] w-[15px]" />
                      AI Tag {llmMutation.isPending && <Spinner className="ml-auto h-4 w-4" />}
                      {aiDisabled && (
                        <>
                          <AiTagTooltip className="ml-2" />
                          <Badge variant="card" className="ml-8">
                            Disabled
                          </Badge>
                        </>
                      )}
                    </TabCommandItem> */}

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
                    Save Session{" "}
                    <SaveSessionTooltip selectedCount={selectedCount} className="ml-2" />
                  </TabCommandItem>
                )}
                <TabCommandItem onSelect={() => pushPage("find")} value="Find Search">
                  <MagnifyingGlassIcon className="text-muted-foreground mr-2" />
                  Find
                </TabCommandItem>
                {tabStore.viewDuplicateTabIds.size > 0 && (
                  <TabCommandItem onSelect={withClear(ActiveStore.removeDuplicateTabs)}>
                    <CopyIcon className="text-muted-foreground mr-2" />
                    Close {pluralize(tabStore.viewDuplicateTabIds.size, "Duplicate")}
                  </TabCommandItem>
                )}
                {tabStore.viewStaleTabIds.size > 0 && (
                  <TabCommandItem onSelect={withClear(ActiveStore.removeStaleTabs)}>
                    <ClockIcon className="text-muted-foreground mr-2" />
                    Close {tabStore.viewStaleTabIds.size} Stale Tabs{" "}
                    <span className="text-muted-foreground/50 ml-2 text-xs">
                      &gt; {staleThresholdDaysInMs / (1000 * 60 * 60 * 24)} days old
                    </span>
                  </TabCommandItem>
                )}
              </TabCommandGroup>
              <CommandSeparator />
              <TabCommandGroup heading="Other">
                <TabCommandItem onSelect={() => UIStore.activatePanel(Panel.Bookmarks)}>
                  <BookmarkIcon className="text-muted-foreground mr-2" />
                  Go to Bookmarks
                </TabCommandItem>
              </TabCommandGroup>
              <CommandEmpty>No Results</CommandEmpty>
            </>
          )}
          {activePage === "tag" && (
            <div className="flex flex-col gap-4">
              {tabStore.assignedTagIds.size > 0 && (
                <div className="tags flex items-center gap-2">
                  <button
                    className="focus-ring rounded px-2 text-sm whitespace-nowrap"
                    onClick={ActiveStore.clearAssignedTagIds}>
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
              <TabCommandGroup>
                {Array.from(tagStore.tags.values())
                  .filter((t) => !tabStore.assignedTagIds.has(t.id) && t.id !== unassignedTag.id)
                  .map((t) => (
                    <TabCommandItem
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
          {activePage === "find" && (
            <div>
              <div className="mb-2 px-2">
                <FilterTagChips
                  filter={tabStore.view.filter}
                  onRemoveKeyword={handleRemoveFilterKeyword}
                />
              </div>
              <CommandEmpty className="flex items-center justify-center gap-2">
                <div className="text-muted-foreground">
                  {search ? (
                    <span>
                      Find by "<span className="text-foreground italic">{search}</span>"
                    </span>
                  ) : (
                    "Find by keywords"
                  )}
                </div>
                {tabStore.viewTabIds.length === 0 && !tabStore.view.filter.looseMatch && (
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
              <div className="text-muted-foreground absolute right-3 bottom-2 overflow-hidden">
                Results: <NumberFlow value={tabStore.viewTabIds.length} />
              </div>
            </div>
          )}
        </CommandList>
      </Command>
    </TabCommandDialog>
  );
}
