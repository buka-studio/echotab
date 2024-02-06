import {
    ArrowDownIcon,
    ArrowUpIcon,
    DownloadIcon,
    HeartFilledIcon,
    HeartIcon,
} from "@radix-ui/react-icons";
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/Select";
import { ClipboardFormat, useUIStore } from "../UIStore";
import { cn, downloadJSON } from "../util";
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
export default function SettingsCommand() {
    const savedStore = useSavedTabStore();
    const tagStore = useTagStore();
    const uiStore = useUIStore();

    const cmdInputRef = useRef<HTMLInputElement>(null);
    const [page, setPage] = useState("tags");

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
                tabCountsById.get(tagId)!.tabCount += 1;
            }
        }

        const sorted = Array.from(tabCountsById.values()).sort((a, b) => {
            const tags = tagSort.dir === SortDir.Desc ? ([b, a] as const) : ([a, b] as const);
            return propComparator(...tags, tagSort.col);
        });
        return sorted;
    }, [tagStore.tags, savedStore.tabs, tagSort]);

    return (
        <Command loop value={page} onValueChange={setPage} className="min-h-[450px]">
            <div className="mb-4 flex items-center border-b">
                <CommandInput placeholder="Search settings..." ref={cmdInputRef} autoFocus />
            </div>
            <div className="grid h-full grid-cols-[150px_auto] gap-4">
                <CommandList>
                    <CommandGroup>
                        <CommandItem>Tags</CommandItem>
                        <CommandItem>Misc</CommandItem>
                        <CommandItem>Import</CommandItem>
                        <CommandItem onSelect={handleExport} value="Export" className="mt-auto">
                            <span className="flex w-full items-center justify-between">
                                Export
                                <DownloadIcon className="h-4 w-4" />
                            </span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => setDeleteDialogOpen(true)}
                            className="text-destructive">
                            Delete Data
                        </CommandItem>
                    </CommandGroup>
                    <CommandEmpty className="p-2 text-base">No Results.</CommandEmpty>
                </CommandList>
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
                            <AlertDialogAction onClick={handleConfirmDelete}>
                                Delete Data
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <div className="content scrollbar-gray h-full max-h-[350px] flex-1 overflow-auto border-l-[1px] pl-4">
                    {page === "tags" && (
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
                                <React.Fragment key={t.name}>
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
                                        onDelete={() => tagStore.deleteTag(t.id)}
                                        disabled={t.id === unassignedTag.id}
                                    />
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    {page === "misc" && (
                        <div>
                            <div className="">
                                <div className="mb-2">Clipboard Copy Format</div>
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
                            </div>
                        </div>
                    )}
                    {page === "import" && <ImportField />}
                </div>
            </div>
        </Command>
    );
}
