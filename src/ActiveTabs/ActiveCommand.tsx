import { useRef } from "react";

import FilterTagChips from "../FilterTagChips";
import { Panel } from "../models";
import { CommandPagination, TabCommandDialog, useTabCommand } from "../TabCommand";
import TagChip, { TagChipList } from "../TagChip";
import { defaultTagColor, unassignedTag, useTagStore } from "../TagStore";
import { Badge } from "../ui/Badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "../ui/Command";
import { toast } from "../ui/Toast";
import { useUIStore } from "../UIStore";
import { cn, formatLinks } from "../util";
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
        const highlighted = commandRef.current?.querySelector(
            `[cmdk-item=""][aria-selected="true"]`,
        );
        if (highlighted) {
            return (highlighted as HTMLElement)?.dataset?.value;
        }
    };

    const handleQuickSave = async () => {
        const tagName = new Date().toUTCString();

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
        const selectedLinks = tabStore.tabs.filter((tab) =>
            SelectionStore.selectedTabIds.has(tab.id),
        );

        const formatted = formatLinks(selectedLinks, uiStore.settings.clipboardFormat);

        navigator.clipboard
            .writeText(formatted)
            .then(() => {
                toast("Copied links to clipboard!");
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
                    if (activePage === "filter") {
                        if (e.key === "Enter" && !getValue() && search) {
                            e.preventDefault();
                            handleToggleFilterKeyword(search);
                        }
                    }
                }}>
                <div className="flex max-w-4xl flex-1 items-center rounded-lg rounded-b-none border bg-popover p-3 px-4 text-base text-popover-foreground">
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
                                <span className="keyboard-shortcut">⌘ + Enter</span>
                            </div>
                        )}
                    </div>
                </div>
                <CommandList
                    className={cn(
                        "scrollbar-gray absolute top-[100%] block w-full rounded-lg rounded-t-none border border-t-0 bg-popover p-2 text-popover-foreground shadow-lg",
                    )}>
                    {activePage === "/" && (
                        <>
                            <CommandGroup
                                heading={
                                    <span>
                                        Selection{" "}
                                        <Badge
                                            variant="secondary"
                                            className={cn({
                                                "opacity-0": !selectionStore.selectedTabIds.size,
                                            })}>
                                            {selectionStore.selectedTabIds.size}
                                        </Badge>
                                    </span>
                                }>
                                {selectionStore.selectedTabIds.size === 0 ? (
                                    <CommandItem onSelect={selectionStore.selectAllTabs}>
                                        Select All
                                    </CommandItem>
                                ) : (
                                    <CommandItem onSelect={selectionStore.deselectAllTabs}>
                                        Deselect All
                                    </CommandItem>
                                )}
                                {Boolean(selectionStore.selectedTabIds.size) && (
                                    <>
                                        <CommandItem onSelect={() => pushPage("tag")}>
                                            Tag
                                        </CommandItem>
                                        <CommandItem onSelect={handleCloseSelected}>
                                            Close
                                        </CommandItem>
                                        <CommandItem onSelect={handleCopyToClipboard}>
                                            Copy to clipboard
                                        </CommandItem>
                                        <CommandItem onSelect={() => handleMoveToNewWindow()}>
                                            Move to new window
                                        </CommandItem>
                                    </>
                                )}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="General">
                                <CommandItem onSelect={handleQuickSave}>Quick Save</CommandItem>
                                <CommandItem onSelect={() => pushPage("filter")}>
                                    Filter
                                </CommandItem>
                                {tabStore.viewDuplicateTabIds.size > 0 && (
                                    <CommandItem onSelect={tabStore.removeDuplicateTabs}>
                                        Close {tabStore.viewDuplicateTabIds.size} Duplicates
                                    </CommandItem>
                                )}
                                <CommandItem onSelect={() => uiStore.activatePanel(Panel.Saved)}>
                                    Go to Saved Tabs
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
                                        className="focus-ring whitespace-nowrap rounded px-2"
                                        onClick={tabStore.clearAssignedTagIds}>
                                        Clear all
                                    </button>
                                    <TagChipList
                                        max={10}
                                        tags={Array.from(tabStore.assignedTagIds).map(
                                            (t) => tagStore.tags.get(t)!,
                                        )}
                                        onRemove={(tag) => {
                                            tabStore.toggleAssignedTagId(tag.id!);
                                        }}
                                    />
                                </div>
                            )}
                            <CommandGroup>
                                {Array.from(tagStore.tags.values())
                                    .filter(
                                        (t) =>
                                            !tabStore.assignedTagIds.has(t.id) &&
                                            t.id !== unassignedTag.id,
                                    )
                                    .map((t) => (
                                        <CommandItem
                                            key={t.id}
                                            value={t.name}
                                            onSelect={() => {
                                                tabStore.toggleAssignedTagId(t.id);
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
                                        <TagChip className="text-sm" color={defaultTagColor}>
                                            {search}
                                        </TagChip>
                                    </span>
                                ) : (
                                    "Type to create a tag"
                                )}
                            </CommandEmpty>
                        </div>
                    )}
                    {activePage === "filter" && (
                        <div>
                            <div className="mb-2 px-2">
                                <FilterTagChips
                                    filter={tabStore.view.filter}
                                    onRemoveKeyword={handleToggleFilterKeyword}
                                />
                            </div>
                            <CommandEmpty>
                                {search ? `Filter by "${search}"` : "Filter by keywords"}
                            </CommandEmpty>
                        </div>
                    )}
                </CommandList>
            </Command>
        </TabCommandDialog>
    );
}
