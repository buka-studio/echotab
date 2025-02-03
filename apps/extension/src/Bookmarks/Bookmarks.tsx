import Button from "@echotab/ui/Button";
import ButtonWithTooltip from "@echotab/ui/ButtonWithTooltip";
import { Drawer, DrawerContent, DrawerTrigger } from "@echotab/ui/Drawer";
import { useMatchMedia } from "@echotab/ui/hooks";
import { cn } from "@echotab/ui/util";
import { BookmarkFilledIcon, CaretSortIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Virtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { BookmarkStore } from ".";
import { AnimatedNumberBadge } from "../components/AnimatedNumberBadge";
import FilterTagChips from "../components/FilterTagChips";
import ItemListPlaceholder, { ItemListPlaceholderCopy } from "../components/ItemListPlaceholder";
import { MobileBottomBarPortal } from "../components/MobileBottomBar";
import { SelectableList } from "../components/SelectableList";
import { Tag } from "../models";
import { useTagStore } from "../TagStore";
import { isPopoverOpen } from "../util/dom";
import BookmarkCommand from "./BookmarkCommand";
import { SelectionStore, TabGrouping, useBookmarkStore } from "./BookmarkStore";
import Lists from "./Lists";
import Pinned from "./Pinned";
import SavedTabItem from "./SavedTabItem";
import SelectableVirtualList from "./SelectableVirtualList";
import SelectButton from "./SelectButton";
import TagHeader from "./TagHeader";
import TagNavigation from "./TagNavigation";
import ViewControl from "./ViewControl";

export default function Bookmarks() {
  const bookmarkStore = useBookmarkStore();
  const tagStore = useTagStore();

  const [tagsExpanded, setTagsExpanded] = useState(
    Object.fromEntries(bookmarkStore.viewTagIds.map((id) => [id, true])),
  );

  const prevView = useRef(bookmarkStore.viewTagIds);
  if (prevView.current !== bookmarkStore.viewTagIds) {
    prevView.current = bookmarkStore.viewTagIds;
    setTagsExpanded(
      Object.fromEntries(bookmarkStore.viewTagIds.map((id) => [id, tagsExpanded[id] ?? true])),
    );
  }

  const toggleTagsExpanded = (id: number) => {
    setTagsExpanded((e) => ({
      ...e,
      [id]: !e[id],
    }));
  };

  const handleRemoveFilterTag = (tagId: number) => {
    bookmarkStore.updateFilter({
      tags: bookmarkStore.view.filter.tags.filter((id) => id !== tagId),
    });
  };

  const handleRemoveFilterKeyword = (keyword: string) => {
    bookmarkStore.updateFilter({
      keywords: bookmarkStore.view.filter.keywords.filter((kw) => kw !== keyword.trim()),
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

  const isTagView = bookmarkStore.view.grouping === TabGrouping.Tag;

  const itemGroups = isTagView
    ? bookmarkStore.viewTagIds
        .map((id) => ({
          tag: tagStore.tags.get(id),
          items: tagsExpanded[id] ? bookmarkStore.filteredTabsByTagId[id] : [],
        }))
        .filter((g) => g.tag)
    : bookmarkStore.viewTabIds.length
      ? [{ tag: undefined, items: bookmarkStore.viewTabIds }]
      : [];

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
    Object.fromEntries(bookmarkStore.viewTagIds.map((id) => [id, false])),
  );

  const virtualizerRefs = useRef(new Set<Virtualizer<Window, Element>>());
  useEffect(() => {
    virtualizerRefs.current.forEach((v) => {
      v.measure();
    });
  }, [bookmarkStore.view]);

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
  }, [bookmarkStore.view]);

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
  const hasTabs = bookmarkStore.tabs.length > 0;
  const hasFilteredTabs = bookmarkStore.filteredTabIds.size > 0;

  const isXLScreen = useMatchMedia("(min-width: 1440px)");

  useHotkeys(
    "meta+a",
    () => {
      if (BookmarkStore.viewTabIds.length === SelectionStore.selectedItemIds.size) {
        SelectionStore.deselectAllTabs();
      } else {
        SelectionStore.selectAllTabs();
      }
    },
    {
      enabled: () => !isPopoverOpen(),
      preventDefault: true,
    },
  );

  return (
    <div className={cn("flex h-full flex-col")}>
      <div className="header sticky top-[20px] z-10 mx-auto flex w-full max-w-[57rem]">
        <BookmarkCommand />
      </div>
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 py-2">
        {bookmarkStore.filtersApplied && (
          <div className="flex items-center gap-5">
            <Button variant="ghost" onClick={bookmarkStore.clearFilter}>
              Clear Filter
            </Button>
            <FilterTagChips
              filter={bookmarkStore.view.filter}
              onRemoveKeyword={handleRemoveFilterKeyword}
              onRemoveTag={handleRemoveFilterTag}
            />
          </div>
        )}
      </div>

      <SelectableList
        features={{
          touch: false,
          range: true,
          singleTap: {
            allow: true,
            intersect: "native",
          },
        }}
        onResetSelection={() => SelectionStore.deselectAllTabs()}
        getSelected={() => SelectionStore.selectedItemIds}
        onSelectionChange={(selection) => SelectionStore.selectItems(selection as Set<string>)}>
        <div className="mt-12 grid grid-cols-[1fr_minmax(auto,56rem)_1fr] grid-rows-[repeat(4,auto)] items-start pb-3 lg:gap-x-5">
          {isTagView && (
            <>
              {isXLScreen ? (
                <div className="scrollbar-gray sticky top-5 col-[1] row-[3/5] mt-12 hidden justify-self-end overflow-hidden xl:block xl:max-h-[96vh]">
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
                        tooltipText="Toggle tag sidebar"
                        aria-label="Toggle tag sidebar"
                        className="absolute bottom-4 left-10"
                        size="icon"
                        variant="ghost">
                        <HamburgerMenuIcon />
                      </ButtonWithTooltip>
                    </DrawerTrigger>
                  </MobileBottomBarPortal>
                  <DrawerContent>
                    <div className="scrollbar-gray mx-auto flex w-full flex-col overflow-auto overscroll-contain rounded-t-[10px] p-4 px-5">
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
          <div className="border-border col-[2] row-[1/5] h-full rounded-[1.125rem] border border-dashed" />
          <div className="col-[2] row-[1] mx-3 select-none pt-3">
            <Lists />
          </div>
          <div className="col-[2] row-[2] mx-3 mb-14 select-none pt-3">
            <Pinned />
          </div>
          <div className="col-[2] row-[3] mx-4">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-start gap-2">
              <div className="flex flex-1 items-center gap-2 px-2 text-sm">
                <div className="flex select-none items-center gap-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <BookmarkFilledIcon /> Links
                  </span>
                  <AnimatedNumberBadge value={bookmarkStore.viewTabIds.length} />
                  <ViewControl />
                </div>
                <div className="ml-auto flex">
                  <SelectButton />
                  {hasFilteredTabs &&
                    bookmarkStore.view.grouping === TabGrouping.Tag &&
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
          <div className="col-[2] row-[4] mx-3 mb-4 mt-4 max-w-4xl rounded-xl">
            {!hasTabs && (
              <ItemListPlaceholder>
                <ItemListPlaceholderCopy
                  title="Currently, there are no links."
                  subtitle="Once you save links by tagging them, they will appear here."
                />
              </ItemListPlaceholder>
            )}
            {hasTabs && !hasFilteredTabs && (
              <ItemListPlaceholder>
                <ItemListPlaceholderCopy
                  title="No items found for the current filters."
                  subtitle="Try removing some filters or changing the view."
                />
              </ItemListPlaceholder>
            )}

            <div className="flex flex-col gap-4">
              {itemGroups.map(({ tag, items }, i) => {
                const tabsVisible = tag ? tagsExpanded[tag.id] : !isTagView;
                const key = tag ? `${tag.id}_ ${tag.name}` : i;
                return (
                  <div
                    className="bg-surface-2 flex flex-col gap-3 rounded-xl border [&:has(.sortable-list)]:p-[0.5rem_0.25rem_0.25rem] [&:not(:has(.sortable-list))]:p-[0.5rem_0.25rem] [&:not(:has(.tag-header))]:p-[0.25rem]"
                    key={key}
                    data-tagid={tag?.id}
                    ref={(el) => {
                      if (!tag) {
                        return;
                      }
                      groupRefs.current[tag.id] = el;
                    }}>
                    {tag && (
                      <TagHeader
                        className="tag-header"
                        tag={tag!}
                        highlighted={scrollTargetId === tag?.id}
                        actions={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              toggleTagsExpanded(Number(tag?.id));
                            }}>
                            <CaretSortIcon className="h-4 w-4" />
                          </Button>
                        }
                      />
                    )}
                    {tabsVisible && (
                      <SelectableVirtualList
                        className="sortable-list"
                        items={items}
                        ref={(e) => e?.virtualizer && virtualizerRefs.current.add(e?.virtualizer)}>
                        {(item) => {
                          const tabId = items[item.index];
                          const tab = bookmarkStore.viewTabsById[tabId];
                          return <SavedTabItem tab={tab} currentGroupTagId={tag?.id} />;
                        }}
                      </SelectableVirtualList>
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
