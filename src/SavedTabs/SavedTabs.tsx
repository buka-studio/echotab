import { CaretSortIcon, Cross2Icon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
    ComponentProps,
    ComponentRef,
    forwardRef,
    ReactNode,
    useEffect,
    useRef,
    useState,
} from "react";

import FilterTagChips from "../FilterTagChips";
import { SavedTab, Tag } from "../models";
import { SelectableItem, SelectableList } from "../SelectableList";
import SortButton from "../SortButton";
import TabItem, { Favicon } from "../TabItem";
import TabListPlaceholder from "../TabsListPlaceholder";
import { TagChipList } from "../TagChip";
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
    AlertDialogTrigger,
} from "../ui/AlertDialog";
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
import SavedCommand from "./SavedCommand";
import SavedStore, {
    TabGrouping,
    TabSortProp,
    useIsTabSelected,
    useSavedTabStore,
} from "./SavedStore";

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

function TagHeaderItem({ tag, actions }: { tag: Tag; actions?: ReactNode }) {
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
                    {tagStore.tags.get(Number(tag.id))!.name}
                    <Badge variant="secondary">{tabIds?.length}</Badge>
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
                        <AlertDialogAction onClick={() => tabStore.removeTabs(tabIds)}>
                            Remove Tabs
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

const SavedTabItem = forwardRef<
    ComponentRef<typeof TabItem>,
    ComponentProps<typeof TabItem> & { tab: SavedTab; currentGroupTagId: number }
>(function SavedTabItem({ tab, currentGroupTagId, ...rest }, ref) {
    const { assignedTagIds } = useSavedTabStore();
    const { tags } = useTagStore();

    const selected = useIsTabSelected(tab.id);

    const combinedTags = Array.from(tab.tagIds)
        .concat(selected ? Array.from(assignedTagIds) : [])
        .map((id) => tags.get(id)!)
        .filter((t) => Number.isFinite(t?.id));

    return (
        <TabItem
            ref={ref}
            className={cn({
                "border-border-active bg-card-active": selected,
            })}
            icon={
                <Favicon
                    src={tab.favIconUrl}
                    className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
                />
            }
            link={
                <a
                    className="focus-ring overflow-hidden text-ellipsis whitespace-nowrap rounded-sm"
                    target="_blank"
                    href={tab.url}>
                    {tab.url}
                </a>
            }
            tab={tab}
            actions={
                <div className="flex gap-2">
                    <TagChipList
                        minimal
                        tags={combinedTags.sort((a, b) =>
                            currentTagFirstComparator(a, b, currentGroupTagId),
                        )}
                        onRemove={
                            tab.tagIds[0] === unassignedTag.id
                                ? undefined
                                : (tag) => {
                                      SavedStore.removeTabTag(tab.id, tag.id!);
                                  }
                        }
                    />
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => SavedStore.removeTab(tab.id)}>
                        <Cross2Icon className="h-5 w-5 " />
                    </Button>
                </div>
            }
            {...rest}
        />
    );
});

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

function currentTagFirstComparator(a: Partial<Tag>, b: Partial<Tag>, currentTagId: number) {
    if (!currentTagId) {
        return 0;
    }

    if (a.id === currentTagId) {
        return -1;
    } else if (b.id === currentTagId) {
        return 1;
    }
    return 0;
}

function SelectButton() {
    const { filteredTabIds, selectedTabIds } = useSavedTabStore();

    const hasTabs = filteredTabIds.size > 0;
    const hasSelectedTabs = selectedTabIds.size > 0;

    return (
        <>
            {hasSelectedTabs ? (
                <Button variant="ghost" onClick={SavedStore.deselectAllTabs}>
                    Deselect All
                </Button>
            ) : (
                hasTabs && (
                    <Button variant="ghost" onClick={SavedStore.selectAllTabs}>
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

    useEffect(() => {
        virtualizer.measure();
    }, [tabStore.view.grouping, virtualizer]);

    const range = virtualizer.calculateRange();

    const visibleTagItems = range ? calcVisibleTagItems(items, range) : new Set<string>();
    const hasTabs = tabStore.filteredTabIds.size > 0;

    const isTagView = tabStore.view.grouping === TabGrouping.Tag;

    let prevTagId = 0;

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
                            <div className="text-balance text-sm text-foreground/75">
                                Once you save a tab by tagging it, it will appear here.
                            </div>
                        </div>
                    }
                />
            )}
            <SelectableList
                onResetSelection={() => SavedStore.deselectAllTabs()}
                getSelected={() => SavedStore.selectedTabIds}
                onSelectionChange={(selection) => SavedStore.selectTabs(selection as Set<string>)}>
                <div className="grid grid-cols-[1fr_minmax(auto,56rem)_1fr] items-start gap-x-5">
                    <div className="scrollbar-gray sticky top-5 hidden justify-self-end overflow-auto xl:block">
                        {isTagView && (
                            <ul className="flex max-h-screen flex-col gap-2 py-1 pl-2">
                                {items
                                    .flatMap((item, i) =>
                                        isTagItem(item) ? [[item, i] as [string, number]] : [],
                                    )
                                    .map(([item, i]) => {
                                        const tag = tagStore.tags.get(Number(item.slice(2)));
                                        if (!tag) {
                                            return null;
                                        }
                                        return (
                                            <li
                                                key={item}
                                                className={cn(
                                                    "text-sm leading-4 text-foreground/50 transition-all duration-200",
                                                    {
                                                        "-translate-x-1 text-foreground":
                                                            visibleTagItems.has(item),
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
                                            className="tag-group absolute top-0 flex w-full justify-between pt-8 text-sm [&+.tag-group]:pt-2"
                                            key={i.key}>
                                            <TagHeaderItem
                                                tag={tag!}
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
                                            className="item-container absolute top-0 w-full select-none pt-2"
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
