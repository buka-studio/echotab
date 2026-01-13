import { Button } from "@echotab/ui/Button";
import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import { Drawer, DrawerContent, DrawerTrigger } from "@echotab/ui/Drawer";
import { useMatchMedia } from "@echotab/ui/hooks";
import { cn } from "@echotab/ui/util";
import { BookmarkFilledIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Virtualizer } from "@tanstack/react-virtual";
import { memo, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import ExpandIcon from "~/components/ExpandIcon";

import { AnimatedNumberBadge } from "../components/AnimatedNumberBadge";
import FilterTagChips from "../components/FilterTagChips";
import ItemListPlaceholder, { ItemListPlaceholderCopy } from "../components/ItemListPlaceholder";
import { MobileBottomBarPortal } from "../components/MobileBottomBar";
import { SelectableList } from "../components/SelectableList";
import { Tag } from "../models";
import {
  bookmarkStoreSelectionActions,
  bookmarkStoreViewActions,
  SelectionStore,
  TabGrouping,
  useFilteredTabIds as useBookmarkFilteredTabIds,
  useFiltersApplied as useBookmarkFiltersApplied,
  useBookmarkStore,
  useBookmarkViewStore,
  useViewTabIds as useBookmarkViewTabIds,
  useViewTabsById as useBookmarkViewTabsById,
  useFilteredTabsByTagId,
  useViewTagIds,
} from "../store/bookmarkStore";
import { useTagsById } from "../store/tagStore";
import { isPopoverOpen } from "../util/dom";
import BookmarkCommand from "./BookmarkCommand";
import Lists from "./Lists";
import Pinned from "./Pinned";
import SavedTabItem from "./SavedTabItem";
import SelectableVirtualList from "./SelectableVirtualList";
import SelectButton from "./SelectButton";
import TagHeader from "./TagHeader";
import TagNavigation from "./TagNavigation";
import ViewControl from "./ViewControl";

const MemoSavedTabItem = memo(SavedTabItem);

export default function Bookmarks() {
  const tabs = useBookmarkStore((s) => s.tabs);
  const tagsById = useTagsById();
  const view = useBookmarkViewStore();
  const viewTagIds = useViewTagIds();
  const viewTabIds = useBookmarkViewTabIds();
  const viewTabsById = useBookmarkViewTabsById();
  const filteredTabsByTagId = useFilteredTabsByTagId();
  const filteredTabIds = useBookmarkFilteredTabIds();
  const filtersApplied = useBookmarkFiltersApplied();

  const [tagsExpanded, setTagsExpanded] = useState(
    Object.fromEntries(viewTagIds.map((id) => [id, true])),
  );

  const prevView = useRef(viewTagIds);
  if (prevView.current !== viewTagIds) {
    prevView.current = viewTagIds;
    setTagsExpanded(Object.fromEntries(viewTagIds.map((id) => [id, tagsExpanded[id] ?? true])));
  }

  const toggleTagsExpanded = (id: number) => {
    setTagsExpanded((e) => ({
      ...e,
      [id]: !e[id],
    }));
  };

  const handleRemoveFilterTag = (tagId: number) => {
    bookmarkStoreViewActions.updateFilter({
      tags: view.filter.tags.filter((id) => id !== tagId),
    });
  };

  const handleRemoveFilterKeyword = (keyword: string) => {
    bookmarkStoreViewActions.updateFilter({
      keywords: view.filter.keywords.filter((kw) => kw !== keyword.trim()),
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

  const isTagView = view.grouping === TabGrouping.Tag;

  const itemGroups = isTagView
    ? viewTagIds
        .map((id) => ({
          tag: tagsById.get(id),
          items: tagsExpanded[id] ? filteredTabsByTagId[id] : [],
        }))
        .filter((g) => g.tag)
    : viewTabIds.length
      ? [{ tag: undefined, items: viewTabIds }]
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
    Object.fromEntries(viewTagIds.map((id) => [id, false])),
  );

  const virtualizerRefs = useRef(new Set<Virtualizer<Window, Element>>());
  useEffect(() => {
    virtualizerRefs.current.forEach((v) => {
      v.measure();
    });
  }, [view]);

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
  }, [view]);

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
  const hasTabs = tabs.length > 0;
  const hasFilteredTabs = filteredTabIds.size > 0;

  const isXLScreen = useMatchMedia("(min-width: 1440px)");

  useHotkeys(
    "meta+a",
    () => {
      if (viewTabIds.length === SelectionStore.selectedTabIds.size) {
        bookmarkStoreSelectionActions.deselectAllTabs();
      } else {
        bookmarkStoreSelectionActions.selectAllTabs();
      }
    },
    {
      enabled: () => !isPopoverOpen(),
      preventDefault: true,
    },
  );

  const tagCount = viewTagIds.length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="header contained outlined-side sticky top-0 z-10 flex p-3 px-2">
        <BookmarkCommand />
      </div>
      <div className="outlined-bottom outlined-side contained flex items-center justify-between gap-2 not-empty:p-2">
        {filtersApplied && (
          <div className="flex items-center gap-5">
            <Button variant="ghost" onClick={bookmarkStoreViewActions.clearFilter}>
              Clear Filter
            </Button>
            <FilterTagChips
              filter={view.filter}
              onRemoveKeyword={handleRemoveFilterKeyword}
              onRemoveTag={handleRemoveFilterTag}
            />
          </div>
        )}
      </div>

      <div className="outlined-bottom outlined-side contained p-3">
        <Lists />
      </div>
      <div className="outlined-bottom outlined-side contained p-3">
        <Pinned />
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
        onResetSelection={() => bookmarkStoreSelectionActions.deselectAllTabs()}
        getSelected={() => SelectionStore.selectedTabIds}
        onSelectionChange={(selection) =>
          bookmarkStoreSelectionActions.selectTabs(selection as Set<string>)
        }
        className="grid grid-cols-[1fr_minmax(auto,56rem)_1fr] items-start">
        {isTagView && tagCount > 0 && (
          <>
            {isXLScreen ? (
              <div className="scrollbar-gray scroll-fade sticky top-5 col-3 row-[1/3] mt-15 hidden h-full w-full justify-self-end overflow-auto p-3 xl:block xl:max-h-[96vh]">
                <TagNavigation
                  visibleTagIds={visibleTagItems}
                  onTagClick={handleScrollToTag}
                  className="h-full max-h-screen w-full [&_li]:max-w-[200px]"
                />
              </div>
            ) : (
              <Drawer
                shouldScaleBackground={false}
                modal={false}
                nested // prevents vaul's default behavior of setting position:fixed on body
                direction="bottom">
                <MobileBottomBarPortal>
                  <DrawerTrigger asChild>
                    <ButtonWithTooltip
                      tooltipText="Toggle tag drawer"
                      aria-label="Toggle tag drawer"
                      className="absolute bottom-4 left-10"
                      size="icon"
                      variant="ghost">
                      <HamburgerMenuIcon />
                    </ButtonWithTooltip>
                  </DrawerTrigger>
                </MobileBottomBarPortal>
                <DrawerContent>
                  <div className="scroll-fade scrollbar-gray h-[min(50vh,400px)] overflow-auto p-4 px-5">
                    <TagNavigation visibleTagIds={visibleTagItems} onTagClick={handleScrollToTag} />
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </>
        )}

        <div className="outlined-side col-2 p-3">
          <div className="flex items-center justify-start gap-3 pl-2">
            <div className="flex flex-1 items-center gap-2 text-sm">
              <div className="flex items-center gap-2 select-none">
                <span className="text-muted-foreground flex items-center gap-2">
                  <BookmarkFilledIcon /> Bookmarks
                </span>
                <AnimatedNumberBadge value={viewTabIds.length} />
                <ViewControl />
              </div>
              <div className="ml-auto flex">
                <SelectButton />
                {hasFilteredTabs &&
                  view.grouping === TabGrouping.Tag &&
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
        <div className="outlined-side col-2">
          {!hasTabs && (
            <ItemListPlaceholder className="p-3" variant="diagonal">
              <ItemListPlaceholderCopy
                title="No saved bookmarks yet."
                subtitle="Once you save links by tagging them, they will appear here."
              />
            </ItemListPlaceholder>
          )}
          {hasTabs && !hasFilteredTabs && (
            <ItemListPlaceholder className="p-3">
              <ItemListPlaceholderCopy
                title="No items found for the current filters."
                subtitle="Try removing some filters or changing the view."
              />
            </ItemListPlaceholder>
          )}

          <div className="flex w-full flex-col">
            {itemGroups.map(({ tag, items }, i) => {
              const tabsVisible = tag ? tagsExpanded[tag.id] : !isTagView;
              const key = tag ? `${tag.id}_${tag.name}` : i;
              const isLast = i === itemGroups.length - 1;
              const expanded = tag ? tagsExpanded[tag.id] : true;

              return (
                <div
                  className={cn(
                    "flex flex-col border-t [border-top-style:dashed] [border-bottom-style:dashed] p-3",
                    {
                      "border-b": isLast,
                    },
                  )}
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
                      className={cn("tag-header pl-2", {
                        "pb-3": expanded,
                      })}
                      tag={tag!}
                      highlighted={scrollTargetId === tag?.id}
                      actions={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            toggleTagsExpanded(Number(tag?.id));
                          }}>
                          <ExpandIcon expanded={expanded} />
                        </Button>
                      }
                    />
                  )}
                  {tabsVisible && (
                    <SelectableVirtualList
                      className="sortable-list"
                      items={items || []}
                      ref={(e) => {
                        e?.virtualizer && virtualizerRefs.current.add(e?.virtualizer);
                      }}>
                      {(item) => {
                        const tabId = items?.[item.index];
                        if (!tabId) {
                          return null;
                        }
                        const tab = viewTabsById[tabId];
                        if (!tab) {
                          return null;
                        }

                        return <MemoSavedTabItem tab={tab} currentGroupTagId={tag?.id} />;
                      }}
                    </SelectableVirtualList>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="outlined-side col-2 h-20" />
      </SelectableList>
      <div className="outlined-side contained flex-1" />
    </div>
  );
}
