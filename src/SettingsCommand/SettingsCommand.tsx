import { ArrowDownIcon, ArrowUpIcon, HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";
import React, { useMemo, useRef, useState } from "react";

import { Tag } from "../models";
import { useSavedTabStore } from "../SavedTabs";
import { unassignedTag, useTagStore } from "../TagStore";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/AlertDialog";
import Button from "../ui/Button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../ui/Command";
import { Label } from "../ui/Label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/Select";
import Switch from "../ui/Switch";
import { ClipboardFormat, useUIStore } from "../UIStore";
import { cn, downloadJSON, getFormattedLinksExample } from "../util";
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

interface SortButtonProps {
    active: boolean;
    dir: SortDir;
    onClick(): void;
}

function SortButton({ active, dir, onClick }: SortButtonProps) {
    return (
        <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClick}
            className={cn({ "text-primary": active })}>
            {!active || dir === SortDir.Desc ? (
                <ArrowUpIcon className="h-4 w-4" />
            ) : (
                <ArrowDownIcon className="h-4 w-4" />
            )}
        </Button>
    );
}

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

export default function SettingsCommand() {
    const savedStore = useSavedTabStore();
    const tagStore = useTagStore();
    const uiStore = useUIStore();

    const cmdInputRef = useRef<HTMLInputElement>(null);
    const [page, setPage] = useState("Tags");

    const [tagSort, setTagSort] = useState<{ col: (typeof sortableColumns)[number]; dir: SortDir }>(
        {
            col: "tabCount",
            dir: SortDir.Desc,
        },
    );

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
                tabs: savedStore.tabs,
                tags: Array.from(tagStore.tags.values()).filter((t) => t.id !== unassignedTag.id),
            },
            `cmdtab-${Date.now()}.json`,
        );
    };

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const handleConfirmDelete = () => {
        savedStore.removeAllTabs();
        tagStore.deleteAllTags();
    };

    const tagSettings: TagSetting[] = useMemo(() => {
        const tabCountsById = new Map(
            Array.from(tagStore.tags.values()).map((t) => [t.id, { ...t, tabCount: 0 }]),
        );
        for (const tab of savedStore.tabs) {
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
    }, [tagStore.tags, savedStore.tabs, tagSort]);

    const handleDeleteTag = (tag: Tag) => {
        savedStore.removeTags([tag.id]);
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

    return (
        <Command loop value={page} onValueChange={setPage} className="min-h-[450px]">
            <div className="mb-4 flex items-center border-b">
                <CommandInput placeholder="Search settings..." ref={cmdInputRef} autoFocus />
            </div>
            <div className="grid h-full grid-cols-[150px_auto] grid-rows-[1fr_30px] gap-4">
                <CommandList>
                    <CommandGroup>
                        <CommandItem>Tags</CommandItem>
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
                <div className="col-start-1 row-start-2 mt-auto text-muted-foreground">
                    {versionLabel}
                </div>
                <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={() => setDeleteDialogOpen(false)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will delete all your saved tabs and tags from this computer.
                                This action cannot be undone.
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
                    className="content scrollbar-gray col-start-2 row-span-2 row-start-1 h-full max-h-[375px] flex-1 overflow-auto border-l-[1px] pl-4"
                    ref={contentRef}>
                    {page === "Tags" && (
                        <div className="grid w-full grid-cols-[20%_20%_auto] content-center items-center gap-3 gap-y-4 pt-1">
                            {sortableColumns.map((c) => (
                                <div className="flex items-center gap-2 text-sm" key={c}>
                                    {columnLabels[c]}{" "}
                                    <SortButton
                                        active={tagSort.col === c}
                                        dir={tagSort.dir}
                                        onClick={() => handleSort(c)}
                                    />
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
                    {page === "Misc" && (
                        <div>
                            <div className="">
                                <div className="">Clipboard Copy Format</div>
                                <div className="my-2 flex gap-5">
                                    <Select
                                        value={uiStore.settings?.clipboardFormat}
                                        onValueChange={(v) => {
                                            uiStore.updateSettings({
                                                clipboardFormat: v as ClipboardFormat,
                                            });
                                        }}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select a format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {Object.values(ClipboardFormat).map((format) => (
                                                    <SelectItem
                                                        key={format}
                                                        value={format}
                                                        className="">
                                                        {format}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="include-tags"
                                            checked={
                                                uiStore.settings?.clipboardIncludeTags ?? false
                                            }
                                            onCheckedChange={(v) => {
                                                uiStore.updateSettings({ clipboardIncludeTags: v });
                                            }}
                                        />
                                        <Label htmlFor="include-tags">Include Tags</Label>
                                    </div>
                                </div>
                                <div className="mb-5 text-sm text-muted-foreground">
                                    Clipboard content preview:
                                </div>
                                <pre className="scrollbar-gray ml-5 max-h-[150px] overflow-auto font-mono text-xs text-muted-foreground">
                                    {getFormattedLinksExample(
                                        uiStore.settings.clipboardFormat,
                                        uiStore.settings.clipboardIncludeTags,
                                    )}
                                </pre>
                            </div>
                        </div>
                    )}

                    {page === "Import" && <ImportField />}
                    {page === "Export" && (
                        <div className="flex flex-col gap-5 p-5">
                            <div className="text-sm text-muted-foreground">
                                Export all your CmdTab data as a JSON file. This will include all
                                your saved tabs and tags. You can import this data later to restore
                                your CmdTab data.
                            </div>
                            <Button variant="outline" onClick={handleExport}>
                                Export
                            </Button>
                        </div>
                    )}
                    {page === "Feedback" && (
                        <div>
                            <div className="p-5 text-sm text-muted-foreground">
                                We'd love to hear from you! If you have any feedback, questions, or
                                issues, please reach out to us at:
                                <br />
                                <a
                                    href="mailto:support@buka.studio?subject=CmdTab Feedback"
                                    className="mt-2 block text-base text-primary">
                                    support@buka.studio
                                </a>
                            </div>
                        </div>
                    )}
                    {page === "Delete" && (
                        <div className="flex flex-col gap-5 p-5">
                            <div className="text-sm text-muted-foreground">
                                Delete all your CmdTab data. It's recommended to export your data
                                before deleting it as this action cannot be undone.
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
