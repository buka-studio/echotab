import { useRef } from "react";

import { Panel, SavedTab } from "../models";
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
import ActiveStore, { useActiveTabStore } from "./ActiveStore";

export default function ActiveCommand() {
    const tabStore = useActiveTabStore();
    const tagStore = useTagStore();
    const uiStore = useUIStore();

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

    const handleSaveAssignedTags = async () => {
        const tabsToSave = Array.from(ActiveStore.selectedTabIds)
            .map((id) => ActiveStore.viewTabsById[id])
            .filter(Boolean)
            .map((tab) => {
                const tabToSave: SavedTab = {
                    id: tab?.id,
                    url: tab?.url,
                    favIconUrl: tab?.favIconUrl,
                    title: tab?.title,
                    savedAt: Date.now(),
                    tagIds: [...tabStore.assignedTagIds],
                };

                return tabToSave;
            });

        await tabStore.saveTabs(tabsToSave);

        tabStore.clearAssignedTagIds();
        setSearch("");
        setPages(["/"]);
    };

    const handleCopyToClipboard = () => {
        const selectedLinks = tabStore.tabs.filter((tab) => tabStore.selectedTabIds.has(tab.id));

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

    let commandLabel = undefined;
    if (activePage === "tag") {
        commandLabel = "Tagging";
    }

    const handleCreateTag = () => {
        const newTag = tagStore.createTag(search);
        tabStore.toggleAssignedTagId(newTag.id);
        setSearch("");
    };

    const handleCloseSelected = () => {
        tabStore.removeTabs(Array.from(ActiveStore.selectedTabIds));
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
                        {activePage === "tag" && (
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={tabStore.assignedTagIds.size === 0}
                                    onClick={handleSaveAssignedTags}
                                    className="focus-ring whitespace-nowrap rounded px-2 text-sm">
                                    Save
                                </button>
                                <span className="keyboard-shortcut">⌘ + Enter</span>
                            </div>
                        )}
                    </div>
                </div>
                <CommandList
                    className={cn(
                        "absolute top-[100%] block w-full rounded-lg rounded-t-none border border-t-0 bg-popover p-2 text-popover-foreground shadow-lg",
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
                                                "opacity-0": !tabStore.selectedTabIds.size,
                                            })}>
                                            {tabStore.selectedTabIds.size}
                                        </Badge>
                                    </span>
                                }>
                                {tabStore.selectedTabIds.size === 0 ? (
                                    <CommandItem onSelect={tabStore.selectAllTabs}>
                                        Select All
                                    </CommandItem>
                                ) : (
                                    <CommandItem onSelect={tabStore.deselectAllTabs}>
                                        Deselect All
                                    </CommandItem>
                                )}
                                {Boolean(tabStore.selectedTabIds.size) && (
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
                                    </>
                                )}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="Misc">
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
                </CommandList>
            </Command>
        </TabCommandDialog>
    );
}
