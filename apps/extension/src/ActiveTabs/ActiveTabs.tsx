import { Badge } from "@echotab/ui/Badge";
import Button from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { CaretSortIcon, DragHandleDots2Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

import { ConditionalWrapper } from "../components/ConditionalWrapper";
import FilterTagChips from "../components/FilterTagChips";
import ItemListPlaceholder, { ItemListPlaceholderCopy } from "../components/ItemListPlaceholder";
import { SelectableItem, SelectableList } from "../components/SelectableList";
import SortableList, {
  DroppableContainer,
  SortableItem,
  SortableOverlayItem,
} from "../components/SortableList";
import SortButton from "../components/SortButton";
import TabItem, { Favicon } from "../components/TabItem";
import { useUIStore } from "../UIStore";
import { focusSiblingItem } from "../util/dom";
import { SortDir } from "../util/sort";
import ActiveCommand from "./ActiveCommand";
import ActiveStore, { SelectionStore, useActiveTabStore } from "./ActiveStore";
import ActiveTabItem from "./ActiveTabItem";
import SelectButton from "./SelectButton";
import WindowHeader from "./WindowHeader";

export default function ActiveTabs() {
  const tabStore = useActiveTabStore();
  const {
    settings: { hideTabsFavicons },
  } = useUIStore();

  const [tabIdsByWindowId, setTabIdsByWindowId] = useState(tabStore.viewTabIdsByWindowId);
  const [windowsExpanded, setWindowsExpanded] = useState<Record<number, boolean>>(
    Object.fromEntries(Object.keys(tabStore.viewTabIdsByWindowId).map((id) => [Number(id), true])),
  );

  const prevFilteredIds = useRef(tabStore.viewTabIdsByWindowId);
  if (prevFilteredIds.current !== tabStore.viewTabIdsByWindowId) {
    prevFilteredIds.current = tabStore.viewTabIdsByWindowId;
    setTabIdsByWindowId(tabStore.viewTabIdsByWindowId);
    setWindowsExpanded((w) => {
      const wipWindows = { ...w };
      for (const id of Object.keys(tabStore.viewTabIdsByWindowId)) {
        const windowId = Number(id);
        if (wipWindows[windowId] === undefined) {
          wipWindows[windowId] = true;
        }
      }

      for (const id of Object.keys(wipWindows)) {
        const windowId = Number(id);
        if (!tabStore.viewTabIdsByWindowId[windowId]) {
          delete wipWindows[windowId];
        }
      }

      return wipWindows;
    });
  }

  const allCollapsed = Object.values(windowsExpanded).every((v) => !v);

  const toggleWindowsExpanded = (id: number) => {
    setWindowsExpanded((e) => ({
      ...e,
      [id]: !e[id],
    }));
  };

  const handleCollapseAll = () => {
    setWindowsExpanded(
      Object.fromEntries(Array.from(Object.keys(windowsExpanded)).map((id) => [id, false])),
    );
  };

  const handleExpandAll = () => {
    setWindowsExpanded(
      Object.fromEntries(Array.from(Object.keys(windowsExpanded)).map((id) => [id, true])),
    );
  };

  const [activeId, setActiveId] = useState<number | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const activeTab = tabStore.viewTabsById[activeId!];

  const handleRemoveFilterKeyword = (keyword: string) => {
    tabStore.updateFilter({
      keywords: ActiveStore.view.filter.keywords.filter((kw) => kw !== keyword.trim()),
    });
  };

  const handleSort = () => {
    tabStore.setView({
      sort: {
        prop: "index",
        dir: tabStore.view.sort.dir === SortDir.Desc ? SortDir.Asc : SortDir.Desc,
      },
    });
  };

  const hasDuplicates = tabStore.viewDuplicateTabIds.size > 0;
  const hasTabs = tabStore.tabs.length > 0;
  const hasFilteredTabs = tabStore.filteredTabIds.size > 0;

  return (
    <div className={cn("flex h-full flex-col", {})}>
      <div className="header sticky top-[20px] z-10 mx-auto flex w-full max-w-[57rem]">
        <ActiveCommand />
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
            />
          </div>
        )}
      </div>
      <SelectableList
        onResetSelection={SelectionStore.deselectAllTabs}
        getSelected={() => SelectionStore.selectedTabIds}
        onSelectionChange={(selection) => SelectionStore.selectTabs(selection as Set<number>)}
        onBeforeStart={() => {
          return activeIdRef.current === null;
        }}>
        <div className="bg-surface-2 mx-auto mt-12 w-full max-w-4xl rounded-xl border p-3">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-start">
            <div className="flex flex-1 items-center gap-2 px-2 text-sm">
              <div className="flex items-center gap-5">
                <span className="text-muted-foreground">Sort by</span>{" "}
                <div className="flex items-center gap-2 text-sm">
                  Browser Order
                  <SortButton active dir={tabStore.view.sort.dir} onClick={() => handleSort()} />
                  <Badge variant="card">{tabStore.tabs.length}</Badge>
                </div>
              </div>
              <div className="ml-auto">
                <SelectButton />
                {hasFilteredTabs &&
                  (allCollapsed ? (
                    <Button variant="ghost" onClick={handleExpandAll}>
                      Expand All
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={handleCollapseAll}>
                      Collapse All
                    </Button>
                  ))}
                {/* {hasDuplicates && (
                  <Button variant="ghost" onClick={ActiveStore.removeDuplicateTabs}>
                    Close {pluralize(tabStore.viewDuplicateTabIds.size, "Duplicate")}
                  </Button>
                )} */}
              </div>
            </div>
          </div>
          <div className="mt-4">
            {!hasTabs && (
              <ItemListPlaceholder>
                <ItemListPlaceholderCopy
                  title="Currently, there are no open tabs."
                  subtitle="Open tabs will be displayed here."
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
          </div>
          <SortableList
            getSelectedIds={() => SelectionStore.selectedTabIds}
            items={tabIdsByWindowId}
            onItemsChange={(items) => setTabIdsByWindowId(items)}
            onSortEnd={(items) => tabStore.syncOrder(items)}
            onActiveIdChange={setActiveId}>
            {Object.entries(tabIdsByWindowId).map(([windowId, tabIds], i) => (
              <div
                className="bg-surface-2 mx-auto mt-4 max-w-4xl select-none rounded-xl border p-3"
                key={windowId}>
                <WindowHeader
                  window={{ id: Number(windowId), label: `Window ${i + 1}` }}
                  actions={
                    <Button
                      variant="ghost"
                      onClick={() => {
                        toggleWindowsExpanded(Number(windowId));
                      }}>
                      {windowsExpanded[Number(windowId)] ? "Collapse" : "Expand"}
                      <CaretSortIcon className="ml-2 h-4 w-4" />
                    </Button>
                  }
                />
                {windowsExpanded[Number(windowId)] && (
                  <DroppableContainer id={windowId} asChild>
                    <ul
                      onKeyDown={(e) => {
                        if (activeId) {
                          return;
                        }
                        focusSiblingItem(e, ".item-container");
                      }}
                      className={cn(
                        "data-[over=true]:bg-muted/30 flex w-full flex-col rounded-xl",
                      )}>
                      {tabIds.map((tabId, j) => {
                        const tab = tabStore.viewTabsById[tabId];
                        if (!tab) {
                          return null;
                        }

                        const isActive = activeId === tabId;

                        return (
                          <SelectableItem asChild id={tabId} key={tabId}>
                            <motion.li
                              animate={{ opacity: 1 }}
                              transition={{
                                type: "tween",
                                delay: isActive ? 0 : 0.01 * j,
                                duration: isActive ? 0 : 0.5,
                              }}
                              initial={{ opacity: 0 }}
                              className={cn(
                                "item-container select-none rounded-lg transition-all duration-200 [&:first-child_.tab-item]:rounded-t-lg [&:last-child_.tab-item]:rounded-b-lg [&:not(:first-child)]:mt-[-1px]",
                                {
                                  "[&_.tab-item]:!rounded-none [&_.tab-item]:transition-all [&_.tab-item]:duration-200":
                                    activeId,
                                },
                              )}>
                              <ConditionalWrapper
                                condition={!tab.pinned}
                                wrapper={(children) => (
                                  <SortableItem id={tabId} useHandle asChild>
                                    {children}
                                  </SortableItem>
                                )}>
                                <div className="group/sortable @container">
                                  <ActiveTabItem
                                    tab={tab}
                                    className="group-data-[is-dragged=true]/sortable:!opacity-20 group-data-[is-dragged=true]/sortable:blur-sm"
                                  />
                                </div>
                              </ConditionalWrapper>
                            </motion.li>
                          </SelectableItem>
                        );
                      })}
                    </ul>
                  </DroppableContainer>
                )}
              </div>
            ))}
            <SortableOverlayItem>
              {activeTab && (
                <div className="@container">
                  <TabItem
                    tab={activeTab}
                    icon={
                      hideTabsFavicons ? (
                        <DragHandleDots2Icon className="text-foreground h-5 w-5" />
                      ) : (
                        <Favicon src={activeTab.favIconUrl} />
                      )
                    }
                  />
                </div>
              )}
            </SortableOverlayItem>
          </SortableList>
        </div>
      </SelectableList>
    </div>
  );
}
