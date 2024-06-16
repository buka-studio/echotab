import { Badge } from "@echotab/ui/Badge";
import Button from "@echotab/ui/Button";
import ButtonWithTooltip from "@echotab/ui/ButtonWithTooltip";
import { Drawer, DrawerContent, DrawerTrigger } from "@echotab/ui/Drawer";
import { cn } from "@echotab/ui/util";
import { CaretSortIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Virtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";

import FilterTagChips from "../FilterTagChips";
import useMatchMedia from "../hooks/useMatchMedia";
import { MobileBottomBarPortal } from "../MobileBottomBar";
import { Tag } from "../models";
import { SelectableList } from "../SelectableList";
import TabListPlaceholder, { TabListPlaceholderCopy } from "../TabsListPlaceholder";
import { useTagStore } from "../TagStore";
import PinnedTabs from "./PinnedTabs";
import SavedCommand from "./SavedCommand";
import { SelectionStore, TabGrouping, useSavedTabStore } from "./SavedStore";
import SelectButton from "./SelectButton";
import TagHeader from "./TagHeader";
import TagNavigation from "./TagNavigation";
import ViewControl from "./ViewControl";
import VirtualTabList from "./VirtualTabList";

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

    const isTagView = tabStore.view.grouping === TabGrouping.Tag;

    const itemGroups = isTagView
        ? tabStore.viewTagIds
              .map((id) => ({
                  tag: tagStore.tags.get(id),
                  items: tagsExpanded[id] ? tabStore.filteredTabsByTagId[id] : [],
              }))
              .filter((g) => g.tag)
        : [{ tag: undefined, items: tabStore.viewTabIds }];

    const [scrollTargetId, setScrollTargetId] = useState<number | null>(null);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;

        if (scrollTargetId !== null) {
            timeout = setTimeout(() => {
                setScrollTargetId(null);
            }, 2000);
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [scrollTargetId]);

    const [tagVisibility, setTagVisibility] = useState(
        Object.fromEntries(tabStore.viewTagIds.map((id) => [id, false])),
    );

    const virtualizerRefs = new Set<Virtualizer<Window, Element>>();
    useEffect(() => {
        virtualizerRefs.forEach((v) => {
            v.measure();
        });
    }, [tabStore.view]);

    const groupRefs = useRef<Record<number, HTMLDivElement | null>>({});
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const changes = Object.fromEntries(
                entries
                    .map((e) => [(e.target as HTMLElement).dataset.tagid, e.isIntersecting])
                    .filter(([k, v]) => k),
            );

            setTagVisibility((prev) => ({
                ...prev,
                ...changes,
            }));
        });

        Object.values(groupRefs.current).forEach((el) => {
            if (el) {
                observer.observe(el);
            }
        });

        return () => {
            observer.disconnect();
        };
    }, [tabStore.view]);

    const handleScrollToTag = ({ tag, index }: { tag: Tag; index: number }) => {
        const item = groupRefs.current[tag.id];
        if (!item) {
            return;
        }
        window.scrollTo({
            top: item.offsetTop - 100,
        });
        setScrollTargetId(tag.id);
    };

    const visibleTagItems = new Set<number>(
        Object.entries(tagVisibility)
            .filter(([_, v]) => v)
            .map(([k, _]) => Number(k)),
    );
    const hasTabs = tabStore.tabs.length > 0;
    const hasFilteredTabs = tabStore.filteredTabIds.size > 0;

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
            </div>
            <SelectableList
                onResetSelection={() => SelectionStore.deselectAllTabs()}
                getSelected={() => SelectionStore.selectedTabIds}
                onSelectionChange={(selection) =>
                    SelectionStore.selectTabs(selection as Set<string>)
                }>
                <div className="mt-12 grid grid-cols-[1fr_minmax(auto,56rem)_1fr] grid-rows-[auto_auto_auto] items-start gap-x-5 pb-3">
                    {isTagView && (
                        <>
                            {isXLScreen ? (
                                <div className="scrollbar-gray sticky top-5 col-[1] row-[3] mt-12 hidden justify-self-end overflow-auto xl:block xl:max-h-[96vh]">
                                    <TagNavigation
                                        visibleTagIds={visibleTagItems}
                                        onTagClick={handleScrollToTag}
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
                                            <ButtonWithTooltip
                                                tooltipText="Tag Navigation"
                                                aria-label="Open tag navigation"
                                                className="absolute bottom-4 left-10"
                                                size="icon"
                                                variant="ghost">
                                                <HamburgerMenuIcon />
                                            </ButtonWithTooltip>
                                        </DrawerTrigger>
                                    </MobileBottomBarPortal>
                                    <DrawerContent>
                                        <div className="scrollbar-gray mx-auto flex w-full flex-col overflow-auto rounded-t-[10px] p-4 px-5">
                                            <TagNavigation
                                                visibleTagIds={visibleTagItems}
                                                onTagClick={handleScrollToTag}
                                            />
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            )}
                        </>
                    )}
                    <div className="bg-surface-2 border-border col-[2] row-[1/4] h-full rounded-xl border" />
                    <div className="col-[2] row-[1] mx-3 mb-12 mt-3 select-none">
                        <PinnedTabs />
                    </div>
                    <div className="col-[2] row-[2] mx-4">
                        <div className="mx-auto flex w-full max-w-4xl items-center justify-start gap-2">
                            <div className="flex flex-1 items-center gap-2 px-3 text-sm">
                                <div className="flex select-none items-center gap-2">
                                    <span className="text-muted-foreground">Items</span>
                                    <Badge variant="card">{tabStore.viewTabIds.length}</Badge>
                                    <ViewControl />
                                </div>
                                <div className="ml-auto flex">
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
                        </div>
                    </div>
                    <div className="bg-surface-2 col-[2] row-[3] mx-3 mb-4 mt-4 max-w-4xl rounded-xl">
                        {!hasTabs && (
                            <TabListPlaceholder>
                                <TabListPlaceholderCopy
                                    title="Currently, there are no tabs items."
                                    subtitle="Once you save a tab by tagging it or add a note, they will appear here."
                                />
                            </TabListPlaceholder>
                        )}
                        {hasTabs && !hasFilteredTabs && (
                            <TabListPlaceholder>
                                <TabListPlaceholderCopy
                                    title="No items found for the current filters."
                                    subtitle="Try removing some filters or changing the view."
                                />
                            </TabListPlaceholder>
                        )}

                        <div className="flex flex-col gap-4">
                            {itemGroups.map(({ tag, items }, i) => {
                                const tabsVisible = tag ? tagsExpanded[tag.id] : !isTagView;

                                return (
                                    <div
                                        className="bg-surface-2 flex flex-col gap-3 rounded-xl border p-3"
                                        key={tag?.id || i}
                                        data-tagid={tag?.id}
                                        ref={(el) => {
                                            if (!tag) {
                                                return;
                                            }
                                            groupRefs.current[tag.id] = el;
                                        }}>
                                        {tag && (
                                            <TagHeader
                                                tag={tag!}
                                                highlighted={scrollTargetId === tag?.id}
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
                                        )}
                                        {tabsVisible && (
                                            <VirtualTabList
                                                tag={tag}
                                                items={items}
                                                ref={(e) =>
                                                    e?.virtualizer &&
                                                    virtualizerRefs.add(e?.virtualizer)
                                                }
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </SelectableList>
        </div>
    );
}
