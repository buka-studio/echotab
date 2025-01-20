import Button from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { Browser as BrowserIcon } from "@phosphor-icons/react";
import { CaretSortIcon, DragHandleDots2Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

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
import { useUIStore } from "../UIStore";
import { focusSiblingItem, isPopoverOpen } from "../util/dom";
import ActiveCommand from "./ActiveCommand";
import ActiveStore, { SelectionStore, TabGrouping, useActiveTabStore } from "./ActiveStore";
import ActiveTabItem from "./ActiveTabItem";
import DomainHeader from "./DomainHeader";
import SelectButton from "./SelectButton";
import ViewControl from "./ViewControl";
import WindowHeader from "./WindowHeader";

export default function ActiveTabs() {
  const tabStore = useActiveTabStore();
  const {
    settings: { hideTabsFavicons },
  } = useUIStore();

  const [tabIdsByWindowId, setTabIdsByWindowId] = useState(tabStore.viewTabIdsByWindowId);

  const [domainsExpanded, setDomainsExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(tabStore.viewTabIdsByDomain).map((id) => [Number(id), true])),
  );

  const [windowsExpanded, setWindowsExpanded] = useState<Record<number, boolean>>(
    Object.fromEntries(Object.keys(tabStore.viewTabIdsByWindowId).map((id) => [Number(id), true])),
  );

  const prevTabsByWindowId = useRef(tabStore.viewTabIdsByWindowId);
  if (prevTabsByWindowId.current !== ActiveStore.viewTabIdsByWindowId) {
    prevTabsByWindowId.current = ActiveStore.viewTabIdsByWindowId;

    setTabIdsByWindowId(tabStore.viewTabIdsByWindowId);

    setDomainsExpanded((d) => {
      const wipDomains = Object.fromEntries(
        Object.keys(tabStore.viewTabIdsByDomain).map((id) => [Number(id), true]),
      );
      for (const id of Object.keys(d)) {
        const domainId = Number(id);
        if (domainId in wipDomains) {
          wipDomains[domainId] = d[domainId];
        }
      }
      return wipDomains;
    });

    setWindowsExpanded((w) => {
      const wipWindows = Object.fromEntries(
        Object.keys(tabStore.viewTabIdsByWindowId).map((id) => [Number(id), true]),
      );
      for (const id of Object.keys(w)) {
        const windowId = Number(id);
        if (windowId in wipWindows) {
          wipWindows[windowId] = w[windowId];
        }
      }

      return wipWindows;
    });
  }

  const allCollapsed =
    tabStore.view.grouping === TabGrouping.Domain
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
  const activeTab = tabStore.viewTabsById[activeId!];

  const handleRemoveFilterKeyword = (keyword: string) => {
    tabStore.updateFilter({
      keywords: ActiveStore.view.filter.keywords.filter((kw) => kw !== keyword.trim()),
    });
  };

  const hasTabs = tabStore.tabs.length > 0;
  const hasFilteredTabs = tabStore.filteredTabIds.size > 0;

  const groupedTabs =
    tabStore.view.grouping === TabGrouping.Domain ? tabStore.viewTabIdsByDomain : tabIdsByWindowId;

  useHotkeys(
    "meta+a",
    () => {
      if (SelectionStore.selectedTabIds.size === ActiveStore.viewTabIds.length) {
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
        <div className="mx-auto mt-12 w-full max-w-4xl rounded-[1.125rem] border border-dashed p-3">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-start">
            <div className="flex flex-1 items-center gap-2 px-2 text-sm">
              <div className="flex select-none items-center gap-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <BrowserIcon weight="fill" className="h-4 w-4" />
                  Tabs
                </span>
                <AnimatedNumberBadge value={tabStore.viewTabIds.length} />
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
            items={groupedTabs}
            onItemsChange={(items) => setTabIdsByWindowId(items)}
            onSortEnd={(items) => tabStore.syncOrder(items)}
            onActiveIdChange={setActiveId}>
            {Object.entries(groupedTabs).map(([groupId, tabIds], i) => (
              <div
                className="bg-surface-2 mx-auto mt-4 max-w-4xl select-none rounded-xl border [&:has(ul)]:p-[0.5rem_0.25rem_0.25rem] [&:not(:has(ul))]:p-[0.5rem_0.25rem]"
                key={groupId}>
                {groupedTabs === tabIdsByWindowId ? (
                  <WindowHeader
                    window={{ id: Number(groupId), label: `Window ${i + 1}` }}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          toggleWindowsExpanded(Number(groupId));
                        }}>
                        <CaretSortIcon className="h-4 w-4" />
                      </Button>
                    }
                  />
                ) : (
                  <DomainHeader
                    domain={groupId}
                    actions={
                      <Button
                        variant="ghost"
                        onClick={() => {
                          toggleDomainsExpanded(Number(groupId));
                        }}>
                        <CaretSortIcon className="ml-2 h-4 w-4" />
                      </Button>
                    }
                  />
                )}
                {(tabStore.view.grouping === TabGrouping.All
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
                      className={cn(
                        "data-[over=true]:bg-muted/30 flex w-full flex-col rounded-xl",
                        {
                          "[&_.echo-item-icon]:hidden":
                            groupedTabs === tabStore.viewTabIdsByDomain && groupId !== "Other",
                        },
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
                                "item-container select-none rounded-lg transition-all duration-200 focus-within:z-[1] hover:z-[1] data-[selected=true]:z-[1] [&:first-child_.tab-item]:rounded-t-lg [&:has([data-selected=true])]:z-[1] [&:last-child_.tab-item]:rounded-b-lg [&:not(:first-child)]:mt-[-1px]",
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
                        <Favicon src={activeTab.url} />
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
