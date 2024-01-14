import {
    ArrowDownIcon,
    ArrowUpIcon,
    CaretSortIcon,
    Cross2Icon,
    MixerHorizontalIcon,
} from "@radix-ui/react-icons";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";

import { Tag } from "../models";
import { SelectableItem, SelectableList } from "../SelectableList";
import TabItem, { Favicon } from "../TabItem";
import TabListPlaceholder from "../TabsListPlaceholder";
import { TagChipList } from "../TagChip";
import { unassignedTag, useTagStore } from "../TagStore";
import { Badge } from "../ui/Badge";
import Button from "../ui/Button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/Select";
import { cn, focusSiblingItem } from "../util";
import { SortDir } from "../util/sort";
import FilterTagChips from "./FilterTagChips";
import SavedCommand from "./SavedCommand";
import SavedStore, { TabGrouping, TabSortProp, useSavedTabStore } from "./SavedStore";

function getAnimationProps(stagger: number) {
    return {
        animate: { opacity: 1 },
        transition: {
            type: "tween",
            delay: stagger,
            duration: 0.5,
        },

        initial: { opacity: 0 },
    };
}

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
            {!active || dir === SortDir.Asc ? (
                <ArrowUpIcon className="h-4 w-4" />
            ) : (
                <ArrowDownIcon className="h-4 w-4" />
            )}
        </Button>
    );
}

function calcVisibleTagMembers(
    items: (string | number)[],
    range: { startIndex: number; endIndex: number },
) {
    const visibleItems = new Set<string>();

    for (let i = range.startIndex; i <= range.endIndex; i++) {
        const item = items[i];
        if (typeof item === "string") {
            visibleItems.add(item);
        }
    }

    if (typeof items[range.startIndex] === "number") {
        for (let i = range.startIndex; i > -1; i--) {
            const item = items[i];
            if (typeof item === "string") {
                visibleItems.add(item);
                break;
            }
        }
    }

    return visibleItems;
}

function currentTagFirstComparator(
    a: Partial<Tag>,
    b: Partial<Tag>,
    index: number,
    items: (string | number)[],
) {
    let firstTag;
    for (let i = index; i > -1; i--) {
        const item = items[i];
        if (typeof item === "string") {
            firstTag = item;
            break;
        }
    }
    if (!firstTag) {
        return 0;
    }
    const tagId = Number(firstTag.slice(2));
    if (a.id === tagId) {
        return -1;
    } else if (b.id === tagId) {
        return 1;
    }
    return 0;
}

export default function SavedTabs() {
    const tabStore = useSavedTabStore();
    const tagStore = useTagStore();

    const [tagsExpanded, setTagsExpanded] = useState(
        Object.fromEntries(tabStore.viewTagIds.map((id) => [id, true])),
    );

    const prevView = useRef(tabStore.viewTagIds);
    if (prevView.current !== tabStore.viewTagIds) {
        prevView.current = tabStore.viewTagIds;
        setTagsExpanded(
            Object.fromEntries(tabStore.viewTagIds.map((id) => [id, tagsExpanded[id] ?? true])),
        );
    }

    const handleSort = (prop: TabSortProp) => {
        if (tabStore.view.sort.prop === prop) {
            tabStore.setView({
                sort: {
                    prop,
                    dir: tabStore.view.sort.dir === SortDir.Desc ? SortDir.Asc : SortDir.Desc,
                },
            });
        } else {
            tabStore.setView({
                sort: {
                    prop,
                    dir: SortDir.Asc,
                },
            });
        }
    };

    const toggleTagsExpanded = (id: number) => {
        setTagsExpanded((e) => ({
            ...e,
            [id]: !e[id],
        }));
    };

    const handleRemoveFilterTag = (tagId: number) => {
        tabStore.setFilter({
            ...tabStore.view.filter,
            tags: tabStore.view.filter.tags.filter((id) => id !== tagId),
        });
    };

    const handleRemoveFilterKeyword = (keyword: string) => {
        tabStore.setFilter({
            ...tabStore.view.filter,
            keywords: tabStore.view.filter.keywords.filter((kw) => kw !== keyword.trim()),
        });
    };

    const handleCollapseAll = () => {
        setTagsExpanded(
            Object.fromEntries(Array.from(Object.keys(tagsExpanded)).map((id) => [id, false])),
        );
    };

    const handleExpandAll = () => {
        setTagsExpanded(
            Object.fromEntries(Array.from(Object.keys(tagsExpanded)).map((id) => [id, true])),
        );
    };

    const allCollapsed = Object.values(tagsExpanded).every((v) => !v);

    const listRef = useRef<HTMLUListElement>(null);

    const items =
        tabStore.view.grouping === TabGrouping.All
            ? tabStore.viewTabIds
            : tabStore.viewTagIds.flatMap((id) =>
                  tagsExpanded[id] ? [`t:${id}`, ...tabStore.filteredTabsByTagId[id]] : [`t:${id}`],
              );

    const virtualizer = useWindowVirtualizer({
        count: items.length,
        estimateSize: () => 56,
        overscan: 50,
        scrollMargin: listRef.current?.offsetTop ?? 0,
    });

    useEffect(() => {
        virtualizer.measure();
    }, [tabStore.view.grouping, virtualizer]);

    const range = virtualizer.calculateRange();

    const visibleItems = range ? calcVisibleTagMembers(items, range) : new Set<string>();

    const hasTabs = tabStore.filteredTabIds.size > 0;
    const hasSelectedTabs = tabStore.selectedTabIds.size > 0;
    const isTagView = tabStore.view.grouping === TabGrouping.Tag;

    return (
        <div className={cn("flex h-full flex-col")}>
            <div className="header sticky top-[20px] z-10">
                <SavedCommand />
            </div>
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 py-2">
                {tabStore.filtersApplied && (
                    <div className="flex items-center gap-5">
                        <Button variant="ghost" onClick={tabStore.clearFilter}>
                            Clear Filter
                        </Button>
                        <FilterTagChips
                            filter={tabStore.view.filter}
                            onRemoveKeyword={handleRemoveFilterKeyword}
                            onRemoveTag={handleRemoveFilterTag}
                        />
                    </div>
                )}
                <div className="ml-auto">
                    {hasSelectedTabs ? (
                        <Button variant="ghost" onClick={tabStore.deselectAllTabs}>
                            Deselect All
                        </Button>
                    ) : (
                        hasTabs && (
                            <Button variant="ghost" onClick={tabStore.selectAllTabs}>
                                Select All
                            </Button>
                        )
                    )}
                    {hasTabs &&
                        tabStore.view.grouping === TabGrouping.Tag &&
                        (allCollapsed ? (
                            <Button variant="ghost" onClick={handleExpandAll}>
                                Expand All
                            </Button>
                        ) : (
                            <Button variant="ghost" onClick={handleCollapseAll}>
                                Collapse All
                            </Button>
                        ))}
                </div>
            </div>
            <div className="mx-auto mb-2 mt-12 flex w-full max-w-4xl items-center justify-start">
                <div className="flex flex-1 items-center gap-2 text-sm">
                    {isTagView ? (
                        <div className="flex gap-5">
                            <div className="flex items-center gap-2 text-sm">
                                Tab Count
                                <SortButton
                                    active={tabStore.view.sort.prop === TabSortProp.TabCount}
                                    dir={tabStore.view.sort.dir}
                                    onClick={() => handleSort(TabSortProp.TabCount)}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                Tag Name
                                <SortButton
                                    active={tabStore.view.sort.prop === TabSortProp.TagName}
                                    dir={tabStore.view.sort.dir}
                                    onClick={() => handleSort(TabSortProp.TagName)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-5">
                            <div className="flex items-center gap-2 text-sm">
                                Tab Title
                                <SortButton
                                    active={tabStore.view.sort.prop === TabSortProp.Title}
                                    dir={tabStore.view.sort.dir}
                                    onClick={() => handleSort(TabSortProp.Title)}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                Tag Count
                                <SortButton
                                    active={tabStore.view.sort.prop === TabSortProp.TagCount}
                                    dir={tabStore.view.sort.dir}
                                    onClick={() => handleSort(TabSortProp.TagCount)}
                                />
                            </div>
                        </div>
                    )}
                    <Badge variant="secondary">{tabStore.viewTabIds.length}</Badge>
                </div>
                <Select
                    value={tabStore.view.grouping}
                    onValueChange={(v) => tabStore.setView({ grouping: v as TabGrouping })}>
                    <SelectTrigger className="w-[150px]">
                        <MixerHorizontalIcon className="mr-2 h-4 w-4" />{" "}
                        <SelectValue placeholder="View" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value={TabGrouping.All}>View All</SelectItem>
                            <SelectItem value={TabGrouping.Tag}>View by Tag</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            {tabStore.tabs.length === 0 && (
                <TabListPlaceholder
                    children={
                        <div className="absolute left-1/2 top-1/2 z-[1] w-full translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
                            <div className="text-balance text-lg">
                                Currently, there are no tabs saved.
                            </div>
                            <div className="text-foreground/75 text-balance text-sm">
                                Once you save a tab by tagging it, it will appear here.
                            </div>
                        </div>
                    }
                />
            )}
            <SelectableList
                onResetSelection={() => SavedStore.deselectAllTabs()}
                getSelected={() => SavedStore.selectedTabIds}
                onSelectionChange={(selection) => SavedStore.selectTabs(selection)}>
                <div className="grid grid-cols-[1fr_minmax(auto,56rem)_1fr] items-start gap-x-5">
                    <div className="scrollbar-gray sticky top-5 hidden justify-self-end overflow-auto xl:block">
                        {isTagView && (
                            <ul className="flex max-h-screen flex-col gap-2 py-1 pl-2">
                                {items
                                    .flatMap((item, i) =>
                                        typeof item === "string"
                                            ? [[item, i] as [string, number]]
                                            : [],
                                    )
                                    .map(([item, i]) => {
                                        const tag = tagStore.tags.get(Number(item.slice(2)));

                                        return (
                                            <li
                                                key={item}
                                                className={cn(
                                                    "text-foreground/50 text-sm leading-4 transition-all duration-200",
                                                    {
                                                        "text-foreground -translate-x-1":
                                                            visibleItems.has(item),
                                                    },
                                                )}>
                                                <button
                                                    className="focus-ring w-full select-none truncate rounded text-left"
                                                    onClick={() => {
                                                        virtualizer.scrollToIndex(i, {
                                                            align: "center",
                                                        });
                                                    }}>
                                                    {tag?.name}
                                                </button>
                                            </li>
                                        );
                                    })}
                            </ul>
                        )}
                    </div>
                    <div className="col-start-2 mx-auto w-full max-w-4xl px-2">
                        <ul
                            className="flex-col"
                            ref={listRef}
                            onKeyDown={(e) => focusSiblingItem(e, ".item-container")}
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                                position: "relative",
                            }}>
                            {virtualizer.getVirtualItems().map((i) => {
                                const item = items[i.index];

                                const isTag = typeof item === "string" && item.startsWith("t:");
                                const tagId = isTag ? Number(item.slice(2)) : undefined;
                                const tag = tagStore.tags.get(tagId!);
                                const tabIds = tabStore.filteredTabsByTagId[tagId!];

                                const tab = tabStore.viewTabsById[item as number];

                                return isTag ? (
                                    <li
                                        style={{
                                            transform: `translateY(${
                                                i.start - virtualizer.options.scrollMargin
                                            }px)`,
                                        }}
                                        data-index={i.index}
                                        ref={virtualizer.measureElement}
                                        className="tag-group absolute top-0 flex w-full justify-between pt-8 text-sm [&+.tag-group]:pt-2"
                                        key={i.key}>
                                        <div className="select-none">
                                            <span className="mr-2 inline-flex gap-2">
                                                {tagStore.tags.get(Number(tag?.id))?.name}
                                                <Badge variant="secondary">{tabIds.length}</Badge>
                                            </span>
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    toggleTagsExpanded(Number(tag?.id));
                                                }}>
                                                {tagsExpanded[tag?.id!] ? "Collapse" : "Expand"}
                                                <CaretSortIcon className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button variant="ghost" className="select-none">
                                            Remove All
                                        </Button>
                                    </li>
                                ) : (
                                    <SelectableItem asChild id={tab.id} key={i.key}>
                                        <li
                                            data-index={i.index}
                                            data-key={tab.id}
                                            className="item-container selectable absolute top-0 w-full select-none pt-2"
                                            style={{
                                                transform: `translateY(${
                                                    i.start - virtualizer.options.scrollMargin
                                                }px)`,
                                            }}
                                            ref={virtualizer.measureElement}>
                                            <TabItem
                                                className={cn({
                                                    "bg-card-active border-border-active":
                                                        tabStore.selectedTabIds.has(tab.id),
                                                })}
                                                icon={
                                                    <Favicon
                                                        src={tab.favIconUrl}
                                                        className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
                                                    />
                                                }
                                                tab={tab}
                                                additional={
                                                    <div className="flex gap-2">
                                                        <TagChipList
                                                            minimal
                                                            tags={Array.from(tab.tagIds)
                                                                .map((id) => tagStore.tags.get(id)!)
                                                                .filter(Boolean)
                                                                .sort((a, b) => {
                                                                    if (
                                                                        tabStore.view.grouping ===
                                                                        TabGrouping.All
                                                                    ) {
                                                                        return 0;
                                                                    }

                                                                    return currentTagFirstComparator(
                                                                        a,
                                                                        b,
                                                                        i.index,
                                                                        items,
                                                                    );
                                                                })}
                                                            onRemove={
                                                                tab.tagIds[0] === unassignedTag.id
                                                                    ? undefined
                                                                    : (tag) => {
                                                                          tabStore.removeTabTag(
                                                                              tab.id,
                                                                              tag.id!,
                                                                          );
                                                                      }
                                                            }
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={() =>
                                                                tabStore.removeTab(tab.id)
                                                            }>
                                                            <Cross2Icon className="h-5 w-5 " />
                                                        </Button>
                                                    </div>
                                                }
                                            />
                                        </li>
                                    </SelectableItem>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </SelectableList>
        </div>
    );
}
