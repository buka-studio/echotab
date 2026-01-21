import { Button } from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { BrowserIcon } from "@phosphor-icons/react";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { memo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import ExpandIcon from "~/components/ExpandIcon";

import { AnimatedNumberBadge } from "../components/AnimatedNumberBadge";
import { ConditionalWrapper } from "../components/ConditionalWrapper";
import FilterTagChips from "../components/FilterTagChips";
import ItemListPlaceholder, { ItemListPlaceholderCopy } from "../components/ItemListPlaceholder";
import { SelectableItem, SelectableList } from "../components/SelectableList";
import SortableList, {
  DroppableContainer,
  SortableItem,
  SortableOverlayItem,
} from "../components/SortableList";
import TabItem, { Favicon } from "../components/TabItem";
import { useSettingStore } from "../store/settingStore";
import {
  SelectionStore,
  TabGrouping,
  tabStoreActions,
  tabStoreSelectionActions,
  useFilteredTabIds,
  useFiltersApplied,
  useTabStore,
  useTabViewStore,
  useViewTabIds,
  useViewTabIdsByDomain,
  useViewTabIdsByWindowId,
  useViewTabsById,
} from "../store/tabStore";
import { focusSiblingItem, isPopoverOpen } from "../util/dom";
import ActiveCommand from "./ActiveCommand";
import ActiveTabItem from "./ActiveTabItem";
import DomainHeader from "./DomainHeader";
import RecentlyClosed from "./RecentlyClosed";
import SelectButton from "./SelectButton";
import ViewControl from "./ViewControl";
import WindowHeader from "./WindowHeader";

const MemoActiveTabItem = memo(ActiveTabItem);

export default function ActiveTabs() {
  const tabs = useTabStore((s) => s.tabs);
  const hideFavicons = useSettingStore((s) => s.settings.hideFavicons);
  const view = useTabViewStore();
  const viewTabIdsByWindowId = useViewTabIdsByWindowId();
  const viewTabIdsByDomain = useViewTabIdsByDomain();
  const viewTabsById = useViewTabsById();
  const viewTabIds = useViewTabIds();
  const filtersApplied = useFiltersApplied();
  const filteredTabIds = useFilteredTabIds();

  const [tabIdsByWindowId, setTabIdsByWindowId] = useState(viewTabIdsByWindowId);

  const [domainsExpanded, setDomainsExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(viewTabIdsByDomain).map((id) => [Number(id), true])),
  );

  const [windowsExpanded, setWindowsExpanded] = useState<Record<number, boolean>>(
    Object.fromEntries(Object.keys(viewTabIdsByWindowId).map((id) => [Number(id), true])),
  );

  const prevTabsByWindowId = useRef(viewTabIdsByWindowId);
  if (prevTabsByWindowId.current !== viewTabIdsByWindowId) {
    prevTabsByWindowId.current = viewTabIdsByWindowId;

    setTabIdsByWindowId(viewTabIdsByWindowId);

    setDomainsExpanded((d) => {
      const wipDomains = Object.fromEntries(
        Object.keys(viewTabIdsByDomain).map((id) => [Number(id), true]),
      );
      for (const id of Object.keys(d)) {
        const domainId = Number(id);
        if (domainId in wipDomains) {
          wipDomains[domainId] = d[domainId] ?? true;
        }
      }
      return wipDomains;
    });

    setWindowsExpanded((w) => {
      const wipWindows = Object.fromEntries(
        Object.keys(viewTabIdsByWindowId).map((id) => [Number(id), true]),
      );
      for (const id of Object.keys(w)) {
        const windowId = Number(id);
        if (windowId in wipWindows) {
          wipWindows[windowId] = w[windowId] ?? true;
        }
      }

      return wipWindows;
    });
  }

  const allCollapsed =
    view.grouping === TabGrouping.Domain
      ? Object.values(domainsExpanded).every((v) => !v)
      : Object.values(windowsExpanded).every((v) => !v);

  const toggleWindowsExpanded = (id: number) => {
    setWindowsExpanded((e) => ({
      ...e,
      [id]: !e[id],
    }));
  };

  const toggleDomainsExpanded = (id: number) => {
    setDomainsExpanded((e) => ({
      ...e,
      [id]: !e[id],
    }));
  };

  const handleCollapseAll = () => {
    setWindowsExpanded(
      Object.fromEntries(Array.from(Object.keys(windowsExpanded)).map((id) => [id, false])),
    );
    setDomainsExpanded(
      Object.fromEntries(Array.from(Object.keys(domainsExpanded)).map((id) => [id, false])),
    );
  };

  const handleExpandAll = () => {
    setWindowsExpanded(
      Object.fromEntries(Array.from(Object.keys(windowsExpanded)).map((id) => [id, true])),
    );
    setDomainsExpanded(
      Object.fromEntries(Array.from(Object.keys(domainsExpanded)).map((id) => [id, true])),
    );
  };

  const [activeId, setActiveId] = useState<number | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const activeTab = viewTabsById[activeId!];

  const handleRemoveFilterKeyword = (keyword: string) => {
    tabStoreActions.updateFilter({
      keywords: view.filter.keywords.filter((kw) => kw !== keyword.trim()),
    });
  };

  const hasTabs = tabs.length > 0;
  const hasFilteredTabs = filteredTabIds.size > 0;

  const groupedTabs = view.grouping === TabGrouping.Domain ? viewTabIdsByDomain : tabIdsByWindowId;

  useHotkeys(
    "mod+a",
    () => {
      if (SelectionStore.selectedTabIds.size === viewTabIds.length) {
        tabStoreSelectionActions.deselectAllTabs();
      } else {
        tabStoreSelectionActions.selectAllTabs();
      }
    },
    {
      enabled: () => !isPopoverOpen(),
      preventDefault: true,
    },
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="header contained outlined-side sticky top-0 z-10 flex p-3 px-2">
        <ActiveCommand />
      </div>
      <div className="outlined-bottom outlined-side contained flex items-center justify-between gap-2 not-empty:px-3 not-empty:py-2">
        {filtersApplied && (
          <div className="flex items-center gap-5">
            <Button variant="ghost" onClick={tabStoreActions.clearFilter}>
              Clear Filter
            </Button>
            <FilterTagChips filter={view.filter} onRemoveKeyword={handleRemoveFilterKeyword} />
          </div>
        )}
      </div>

      <div className="outlined-bottom outlined-side contained p-3">
        <RecentlyClosed />
      </div>

      <SelectableList
        className="grid grid-cols-[1fr_minmax(auto,56rem)_1fr]"
        onResetSelection={tabStoreSelectionActions.deselectAllTabs}
        getSelected={() => SelectionStore.selectedTabIds}
        onSelectionChange={(selection) =>
          tabStoreSelectionActions.selectTabs(selection as Set<number>)
        }
        onBeforeStart={() => {
          return activeIdRef.current === null;
        }}>
        <div className="outlined-side col-2 flex w-full items-center justify-start p-3">
          <div className="flex flex-1 items-center gap-2 pl-2 text-sm">
            <div className="flex items-center gap-2 select-none">
              <span className="text-muted-foreground flex items-center gap-2">
                <BrowserIcon className="h-4 w-4" />
                Tabs
              </span>
              <AnimatedNumberBadge value={viewTabIds.length} />
              <ViewControl />
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
            </div>
          </div>
        </div>
        <div className="outlined-side col-2 pt-0 not-empty:p-3">
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
          items={groupedTabs}
          onItemsChange={(items) => setTabIdsByWindowId(items)}
          onSortEnd={(items) => tabStoreActions.syncOrder(items)}
          onActiveIdChange={setActiveId}>
          {Object.entries(groupedTabs).map(([groupId, tabIds], i, groups) => {
            const isLast = i === groups.length - 1;
            const expanded =
              groupedTabs === tabIdsByWindowId
                ? windowsExpanded[Number(groupId)]
                : domainsExpanded[Number(groupId)];

            return (
              <div
                className={cn(
                  "outlined-side border-t-border! border-b-border! col-2 mx-auto w-full border-t [border-top-style:dashed] [border-bottom-style:dashed] p-3 select-none",
                  {
                    "border-b": isLast,
                  },
                )}
                key={groupId}>
                {groupedTabs === tabIdsByWindowId ? (
                  <WindowHeader
                    className={cn("pl-2", {
                      "pb-3": expanded,
                    })}
                    window={{ id: Number(groupId), label: `Window ${i + 1}` }}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          toggleWindowsExpanded(Number(groupId));
                        }}>
                        <ExpandIcon expanded={expanded} />
                      </Button>
                    }
                  />
                ) : (
                  <DomainHeader
                    domain={groupId}
                    className={cn("pl-2", {
                      "pb-3": expanded,
                    })}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          toggleDomainsExpanded(Number(groupId));
                        }}>
                        <ExpandIcon expanded={expanded} />
                      </Button>
                    }
                  />
                )}
                {(view.grouping === TabGrouping.All
                  ? windowsExpanded[Number(groupId)]
                  : domainsExpanded[Number(groupId)]) && (
                  <DroppableContainer id={groupId} asChild>
                    <ul
                      onKeyDown={(e) => {
                        if (activeId) {
                          return;
                        }
                        focusSiblingItem(e, ".item-container");
                      }}
                      className={cn("data-[over=true]:bg-muted/30 flex w-full flex-col", {
                        "[&_.echo-item-icon]:hidden":
                          groupedTabs === viewTabIdsByDomain && groupId !== "Other",
                      })}>
                      {tabIds.map((tabId) => {
                        const tab = viewTabsById[tabId];
                        if (!tab) {
                          return null;
                        }

                        return (
                          <SelectableItem asChild id={tabId} key={tabId}>
                            <motion.li
                              className={cn(
                                "item-container rounded-lg transition-all duration-200 select-none not-first:-mt-px focus-within:z-1 hover:z-1 data-[selected=true]:z-1 [&:first-child_.tab-item]:rounded-t-lg [&:has([data-selected=true])]:z-1 [&:last-child_.tab-item]:rounded-b-lg",
                                {
                                  "[&_.tab-item]:rounded-none! [&_.tab-item]:transition-all [&_.tab-item]:duration-200":
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
                                  <MemoActiveTabItem
                                    tab={tab}
                                    className="group-data-[is-dragged=true]/sortable:opacity-20! group-data-[is-dragged=true]/sortable:blur-sm"
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
            );
          })}
          <SortableOverlayItem>
            {activeTab && (
              <div className="@container">
                <TabItem
                  tab={activeTab}
                  icon={
                    hideFavicons ? (
                      <DragHandleDots2Icon className="text-foreground h-5 w-5" />
                    ) : (
                      <Favicon src={activeTab.url} />
                    )
                  }
                />
              </div>
            )}
          </SortableOverlayItem>
        </SortableList>
        <div className="outlined-side col-2 h-20" />
      </SelectableList>
      <div className="outlined-side contained flex-1" />
    </div>
  );
}
