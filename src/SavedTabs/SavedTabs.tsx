import {
    CaretSortIcon,
    DrawingPinFilledIcon,
    HamburgerMenuIcon,
    MixerHorizontalIcon,
} from "@radix-ui/react-icons";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { ReactNode, useEffect, useRef, useState } from "react";

import FilterTagChips from "../FilterTagChips";
import useMatchMedia from "../hooks/useMatchMedia";
import { MobileBottomBarPortal } from "../MobileBottomBar";
import { Tag } from "../models";
import { SelectableItem, SelectableList } from "../SelectableList";
import SortButton from "../SortButton";
import TabListPlaceholder from "../TabsListPlaceholder";
import { useTagStore } from "../TagStore";
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
} from "../ui/AlertDialog";
import { Badge } from "../ui/Badge";
import Button from "../ui/Button";
import { Drawer, DrawerContent, DrawerTrigger } from "../ui/Drawer";
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
import SavedCommand from "./SavedCommand";
import {
    SelectionStore,
    TabGrouping,
    TabSortProp,
    useSavedSelectionStore,
    useSavedTabStore,
} from "./SavedStore";
import SavedTabItem from "./SavedTabItem";

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

function TagHeaderItem({
    tag,
    actions,
    highlighted,
}: {
    tag: Tag;
    actions?: ReactNode;
    highlighted?: boolean;
}) {
    const tabStore = useSavedTabStore();
    const tagStore = useTagStore();

    const tabIds = tabStore.filteredTabsByTagId[tag?.id];
    if (!tagStore.tags.has(Number(tag?.id))) {
        return null;
    }
    return (
        <>
            <div className="select-none">
                <span className="mr-2 inline-flex gap-2">
                    <span
                        className={cn("text-muted-foreground transition-colors duration-300", {
                            "text-primary": highlighted,
                        })}>
                        {tagStore.tags.get(Number(tag.id))!.name}
                    </span>
                    <Badge variant="outline">{tabIds?.length}</Badge>
                </span>
                {actions}
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="select-none">
                        Remove Tabs
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove all tabs in this group.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => tabStore.removeTabs(tabIds)}
                            variant="destructive">
                            Remove Tabs
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function TagNavigationLinks({
    visibleTagItems,
    items,
    onLinkClick,
    className,
}: {
    visibleTagItems: Set<string>;
    items: string[];
    onLinkClick: (i: number) => void;
    className?: string;
}) {
    const tagStore = useTagStore();

    return (
        <ul className={cn("flex flex-col gap-2 py-1 pl-2", className)}>
            {items
                .flatMap((item, i) => (isTagItem(item) ? [[item, i] as [string, number]] : []))
                .map(([item, i]) => {
                    const tag = tagStore.tags.get(Number(item.slice(2)));
                    if (!tag) {
                        return null;
                    }
                    return (
                        <li
                            key={item}
                            className={cn(
                                "text-sm leading-4 text-foreground/50 transition-all duration-200 [.favorite_+_&:not(.favorite)]:mt-5",
                                {
                                    "-translate-x-1 text-foreground": visibleTagItems.has(item),
                                    favorite: tag.favorite,
                                },
                            )}>
                            <button
                                className="focus-ring flex w-full select-none items-center gap-1 truncate rounded text-left"
                                onClick={() => onLinkClick(i)}>
                                {tag?.name}
                            </button>
                        </li>
                    );
                })}
        </ul>
    );
}

function isTagItem(item: unknown) {
    return typeof item === "string" && item.startsWith("t:");
}

function calcVisibleTagItems(items: string[], range: { startIndex: number; endIndex: number }) {
    const visibleItems = new Set<string>();

    for (let i = range.startIndex; i <= range.endIndex; i++) {
        const item = items[i];
        if (isTagItem(item)) {
            visibleItems.add(item);
        }
    }

    if (!isTagItem(items[range.startIndex])) {
        for (let i = range.startIndex; i > -1; i--) {
            const item = items[i];
            if (isTagItem(item)) {
                visibleItems.add(item);
                break;
            }
        }
    }

    return visibleItems;
}

function SelectButton() {
    const { filteredTabIds } = useSavedTabStore();
    const { selectedTabIds } = useSavedSelectionStore();

    const hasTabs = filteredTabIds.size > 0;
    const hasSelectedTabs = selectedTabIds.size > 0;

    return (
        <>
            {hasSelectedTabs ? (
                <Button variant="ghost" onClick={SelectionStore.deselectAllTabs}>
                    Deselect All
                </Button>
            ) : (
                hasTabs && (
                    <Button variant="ghost" onClick={SelectionStore.selectAllTabs}>
                        Select All
                    </Button>
                )
            )}
        </>
    );
}

export default function SavedTabs() {
    const tabStore = useSavedTabStore();
    const tagStore = useTagStore();

    const [tagsExpanded, setTagsExpanded] = useState(
        Object.fromEntries(tabStore.viewTagIds.map((id) => [id, true])),
    );
    const [pinnedExpanded, setPinnedExpanded] = useState(true);

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
        tabStore.updateFilter({
            tags: tabStore.view.filter.tags.filter((id) => id !== tagId),
        });
    };

    const handleRemoveFilterKeyword = (keyword: string) => {
        tabStore.updateFilter({
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
        estimateSize: () => 58,
        overscan: 50,
        scrollMargin: listRef.current?.offsetTop ?? 0,
    });

    const [scrollTargetIndex, setScrollTargetIndex] = useState<number | null>(null);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;

        if (scrollTargetIndex !== null) {
            timeout = setTimeout(() => {
                setScrollTargetIndex(null);
            }, 2000);
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [scrollTargetIndex]);

    const handleScrollToItem = (i: number) => {
        virtualizer.scrollToIndex(i, {
            align: "center",
        });

        setScrollTargetIndex(i);
    };

    useEffect(() => {
        virtualizer.measure();
    }, [tabStore.view.grouping, virtualizer]);

    const range = virtualizer.calculateRange();

    const visibleTagItems = range ? calcVisibleTagItems(items, range) : new Set<string>();
    const hasTabs = tabStore.tabs.length > 0;
    const hasFilteredTabs = tabStore.filteredTabIds.size > 0;

    const isTagView = tabStore.view.grouping === TabGrouping.Tag;

    let prevTagId = 0;

    const isXLScreen = useMatchMedia("(min-width: 1440px)");

    return (
        <div className={cn("flex h-full flex-col")}>
            <div className="header sticky top-[20px] z-10 mx-auto flex w-full max-w-4xl">
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
                    <SelectButton />
                    {hasFilteredTabs &&
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
            <div>
                <div className="mx-auto my-8 max-w-4xl">
                    <div className="mb-2 flex select-none items-center text-sm">
                        <span className="mr-2 inline-flex gap-2">
                            <DrawingPinFilledIcon className="h-5 w-5" />
                            <span className="text-muted-foreground">Pinned Tabs</span>
                            <Badge variant="outline">{tabStore.pinnedTabs?.length}</Badge>
                        </span>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setPinnedExpanded(!pinnedExpanded);
                            }}>
                            {pinnedExpanded ? "Collapse" : "Expand"}
                            <CaretSortIcon className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    {pinnedExpanded && (
                        <>
                            {tabStore.pinnedTabs.length === 0 && (
                                <TabListPlaceholder
                                    layout="grid"
                                    count={5}
                                    className="[&_.tabs-placeholder]:max-h-[110px]">
                                    <div className="absolute left-1/2 top-1/2 z-[1] w-full translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
                                        <div className="text-balance text-lg">
                                            No pinned tabs yet.{" "}
                                        </div>
                                        <div className="text-balance text-sm text-foreground/75">
                                            Pin a tab by clicking the pin icon.{" "}
                                        </div>
                                    </div>
                                </TabListPlaceholder>
                            )}
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
                                {tabStore.pinnedTabs.map((tab) => (
                                    <div className="@container" key={tab.id}>
                                        <SavedTabItem tab={tab} />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="mx-auto mb-2 mt-12 flex w-full max-w-4xl items-center justify-start">
                <div className="flex flex-1 items-center gap-2 text-sm">
                    {isTagView ? (
                        <div className="flex gap-5">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                Tab Count
                                <SortButton
                                    active={tabStore.view.sort.prop === TabSortProp.TabCount}
                                    dir={tabStore.view.sort.dir}
                                    onClick={() => handleSort(TabSortProp.TabCount)}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                    <Badge variant="outline">{tabStore.viewTabIds.length}</Badge>
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
            {!hasTabs && (
                <TabListPlaceholder
                    children={
                        <div className="absolute left-1/2 top-1/2 z-[1] w-full translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
                            <div className="text-balance text-lg">
                                Currently, there are no tabs saved.
                            </div>
                            <div className="text-balance text-sm text-foreground/75">
                                Once you save a tab by tagging it, it will appear here.
                            </div>
                        </div>
                    }
                />
            )}
            {hasTabs && !hasFilteredTabs && (
                <TabListPlaceholder
                    children={
                        <div className="absolute left-1/2 top-1/2 z-[1] w-full translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
                            <div className="text-balance text-lg">
                                No tabs found for the current filters.
                            </div>
                            <div className="text-balance text-sm text-foreground/75">
                                Try removing some filters or changing the view.
                            </div>
                        </div>
                    }
                />
            )}
            <SelectableList
                onResetSelection={() => SelectionStore.deselectAllTabs()}
                getSelected={() => SelectionStore.selectedTabIds}
                onSelectionChange={(selection) =>
                    SelectionStore.selectTabs(selection as Set<string>)
                }>
                <div className="grid grid-cols-[1fr_minmax(auto,56rem)_1fr] items-start gap-x-5">
                    {isTagView && (
                        <>
                            {isXLScreen ? (
                                <div className="scrollbar-gray sticky top-5 hidden justify-self-end overflow-auto xl:block xl:max-h-[96vh]">
                                    <TagNavigationLinks
                                        visibleTagItems={visibleTagItems}
                                        items={items}
                                        onLinkClick={handleScrollToItem}
                                        className="max-h-screen [&_li]:max-w-[200px]"
                                    />
                                </div>
                            ) : (
                                <Drawer
                                    shouldScaleBackground={false}
                                    modal={false}
                                    nested // prevents vaul's default behavior of setting position:fixed on body
                                    direction="right">
                                    <MobileBottomBarPortal>
                                        <DrawerTrigger asChild>
                                            <Button
                                                aria-label="Open tag navigation"
                                                className="absolute bottom-4 left-10"
                                                size="icon"
                                                variant="ghost">
                                                <HamburgerMenuIcon />
                                            </Button>
                                        </DrawerTrigger>
                                    </MobileBottomBarPortal>
                                    <DrawerContent>
                                        <div className="scrollbar-gray mx-auto flex w-full flex-col overflow-auto rounded-t-[10px] p-4 px-5">
                                            <TagNavigationLinks
                                                visibleTagItems={visibleTagItems}
                                                items={items}
                                                onLinkClick={handleScrollToItem}
                                            />
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            )}
                        </>
                    )}
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

                                if (isTagItem(item)) {
                                    const tagId = Number(item.slice(2));
                                    prevTagId = tagId;

                                    const tag = tagStore.tags.get(tagId!);

                                    return (
                                        <li
                                            style={{
                                                transform: `translateY(${
                                                    i.start - virtualizer.options.scrollMargin
                                                }px)`,
                                            }}
                                            data-index={i.index}
                                            ref={virtualizer.measureElement}
                                            className="tag-group absolute top-0 flex w-full justify-between pt-8 text-sm [.tag-group_+_&]:pt-2"
                                            key={i.key}>
                                            <TagHeaderItem
                                                tag={tag!}
                                                highlighted={scrollTargetIndex === i.index}
                                                actions={
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            toggleTagsExpanded(Number(tag?.id));
                                                        }}>
                                                        {tagsExpanded[tag?.id!]
                                                            ? "Collapse"
                                                            : "Expand"}
                                                        <CaretSortIcon className="ml-2 h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                        </li>
                                    );
                                }

                                const currentGroupTagId =
                                    tabStore.view.grouping === TabGrouping.All ? 0 : prevTagId;
                                const tab = tabStore.viewTabsById[item];

                                return (
                                    <SelectableItem asChild id={tab.id} key={i.key}>
                                        <li
                                            data-index={i.index}
                                            className="item-container absolute top-0 w-full select-none pt-2 @container"
                                            style={{
                                                transform: `translateY(${
                                                    i.start - virtualizer.options.scrollMargin
                                                }px)`,
                                            }}
                                            ref={virtualizer.measureElement}>
                                            <SavedTabItem
                                                tab={tab}
                                                currentGroupTagId={currentGroupTagId}
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
