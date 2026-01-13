import { toast } from "@echotab/ui/Toast";
import Fuse from "fuse.js";
import { useMemo } from "react";
import { proxy, subscribe, useSnapshot } from "valtio";
import { proxySet } from "valtio/utils";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { pluralize, sortRecord } from "~/util";
import { createLogger } from "~/util/Logger";
import { toggle as toggleSet } from "~/util/set";
import { SortDir } from "~/util/sort";
import { isValidActiveTab } from "~/util/tab";
import { canonicalizeURL, getDomain } from "~/util/url";

import {
  generateId as generateBookmarkId,
  saveTabs as saveBookmarkTabs,
  useBookmarkStore,
} from "./bookmarkStore";
import { addRecentlyClosed } from "./recentlyClosedStore";
import { ActiveTab } from "./schema";

const logger = createLogger("TabStore");

export interface Filter {
  keywords: string[];
  looseMatch: boolean;
}

export enum TabSortProp {
  TabName = "Title",
  Index = "index",
  TabCount = "Tab Count",
  TabDomain = "Domain",
}

export enum TabGrouping {
  All = "All",
  Domain = "Domain",
}

export const staleThresholdDaysInMs = 1000 * 60 * 60 * 24 * 7; // 7 days

function isStale(lastAccessed: number | undefined) {
  if (!lastAccessed) {
    return false;
  }
  return Date.now() - lastAccessed > staleThresholdDaysInMs;
}

function toActiveTab(tab: Partial<chrome.tabs.Tab> = {}): Partial<ActiveTab> {
  return {
    favIconUrl: tab.favIconUrl,
    id: tab.id!,
    title: tab.title,
    url: tab.url,
    windowId: tab.windowId,
    pinned: tab.pinned,
    lastAccessed: tab.lastAccessed,
    audible: tab.audible,
    muted: tab.mutedInfo?.muted,
  };
}

async function getActiveTabs(): Promise<ActiveTab[]> {
  const tabs = await chrome.tabs?.query({});
  const activeTabs = tabs?.map(toActiveTab).filter(isValidActiveTab) as ActiveTab[];
  return activeTabs || [];
}

const fuseOptions = {
  useExtendedSearch: true,
  keys: ["title", { name: "url", weight: 2 }],
};

const tabsFuse = new Fuse<ActiveTab>([], fuseOptions);

export const useTabStore = create(
  subscribeWithSelector(() => ({
    initialized: false as boolean,
    tabs: [] as ActiveTab[],
    windows: [] as chrome.windows.Window[],
    activeWindowId: (chrome.windows?.WINDOW_ID_CURRENT ?? -1) as number,
    assignedTagIds: new Set<number>(),
  })),
);

export const useTabViewStore = create(
  subscribeWithSelector(() => ({
    filter: {
      keywords: [] as string[],
      looseMatch: false as boolean,
    },
    grouping: TabGrouping.All as TabGrouping,
    sort: {
      prop: TabSortProp.Index as TabSortProp,
      dir: SortDir.Asc as SortDir,
    },
  })),
);

export const SelectionStore = proxy({
  selectedTabIds: proxySet<number>(),
});

const toggleSelected = (tabId: number) => {
  toggleSet(SelectionStore.selectedTabIds, tabId);
};

const selectTabs = (tabIds?: Set<number>) => {
  SelectionStore.selectedTabIds = proxySet(tabIds);
};
const selectAllTabs = () => {
  SelectionStore.selectedTabIds = proxySet(getFilteredTabIds());
};
const deselectAllTabs = () => {
  SelectionStore.selectedTabIds = proxySet();
};

export const initStore = async () => {
  const tabs = await getActiveTabs();
  useTabStore.setState({ tabs });
  tabsFuse.setCollection(tabs);

  let syncDebounceTimer: null | ReturnType<typeof setTimeout> = null;
  chrome.tabs?.onMoved.addListener(() => {
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
    }
    syncDebounceTimer = setTimeout(() => {
      resetTabs();
    }, 200);
  });

  chrome.tabs?.onUpdated.addListener((tabId, change, tab) => {
    const state = useTabStore.getState();
    const tabIndex = state.tabs.findIndex((t) => t.id === tabId);

    if (tabIndex !== -1) {
      const updatedTab = { ...state.tabs[tabIndex], ...toActiveTab(tab) } as ActiveTab;
      useTabStore.setState({
        tabs: state.tabs.map((t, i) => (i === tabIndex ? updatedTab : t)),
      });
    } else if (change.status === "complete") {
      const newTab = toActiveTab(tab);
      if (isValidActiveTab(newTab)) {
        useTabStore.setState({ tabs: [...state.tabs, newTab as ActiveTab] });
      }
    }
  });

  chrome.tabs?.onRemoved.addListener((id) => {
    const state = useTabStore.getState();
    const removedTab = state.tabs.find((t) => t.id === id);

    if (removedTab) {
      addRecentlyClosed(removedTab);
    }

    useTabStore.setState({ tabs: state.tabs.filter((t) => t.id !== id) });

    const selectedTabIds = new Set(SelectionStore.selectedTabIds);
    selectedTabIds.delete(id);
    SelectionStore.selectedTabIds = proxySet(selectedTabIds);
  });

  chrome.windows?.onFocusChanged.addListener((windowId) => {
    useTabStore.setState({ activeWindowId: windowId });
  });

  useTabStore.setState({ initialized: true });
};

useTabStore.subscribe(
  (s) => s.tabs,
  (tabs) => {
    tabsFuse.setCollection(tabs);
  },
);

export const toggleAssignedTagId = (tagId: number) => {
  useTabStore.setState((state) => {
    const newSet = new Set(state.assignedTagIds);
    if (newSet.has(tagId)) {
      newSet.delete(tagId);
    } else {
      newSet.add(tagId);
    }
    return { assignedTagIds: newSet };
  });
};

export const clearAssignedTagIds = () => {
  useTabStore.setState({ assignedTagIds: new Set() });
};

type TabViewState = ReturnType<typeof useTabViewStore.getState>;

export const setView = (view: Partial<TabViewState>) => {
  useTabViewStore.setState(view);
};

export const updateFilter = (filter: Partial<Filter>) => {
  useTabViewStore.setState((state) => {
    const wipFilter = { ...filter };
    if (wipFilter.keywords?.length === 0) {
      wipFilter.looseMatch = false;
    }
    return { filter: { ...state.filter, ...wipFilter } };
  });
};

export const clearFilter = () => {
  useTabViewStore.setState({ filter: { keywords: [], looseMatch: false } });
};

export const addTab = (tabId: number, tab: ActiveTab) => {
  if (!isValidActiveTab(tab)) {
    return;
  }

  useTabStore.setState((state) => {
    const index = state.tabs.findIndex((t) => t.id === tabId);
    if (index !== -1) {
      return { tabs: state.tabs.map((t, i) => (i === index ? tab : t)) };
    } else {
      return { tabs: [...state.tabs, tab] };
    }
  });
};

export const resetTabs = async () => {
  const tabs = await getActiveTabs();
  useTabStore.setState({ tabs });
};

interface RemoveTabResult {
  status: "success" | "error";
  tabId: number;
}

interface RemoveTabOpts {
  notify?: boolean;
}

export const removeTab = async (tabId: number, opts: RemoveTabOpts = {}) => {
  return removeTabs([tabId], opts);
};

export const removeTabs = async (tabIds: number[], opts: RemoveTabOpts = {}) => {
  if (!tabIds.length) {
    return;
  }
  return removeTabsPar(tabIds, opts);
};

const removeTabSeq = async (tabId: number): Promise<RemoveTabResult> => {
  try {
    await chrome.tabs?.remove(tabId);
    return { status: "success", tabId };
  } catch (e) {
    logger.error("Failed to remove tab", tabId, e);
    return { status: "error", tabId };
  }
};

export const removeTabsSeq = async (tabIds: number[], opts: RemoveTabOpts = {}) => {
  const success: RemoveTabResult[] = [];
  const error: RemoveTabResult[] = [];

  const state = useTabStore.getState();
  const idsSet = new Set(tabIds);
  const removedTabs = new Map(state.tabs.filter((t) => idsSet.has(t.id)).map((t) => [t.id, t]));

  for (const id of tabIds) {
    const result = await removeTabSeq(id);
    if (result.status === "success") {
      success.push(result);
    } else {
      error.push(result);
    }
  }

  if (opts.notify && success.length) {
    toast.success(`Closed ${pluralize(success.length, "tab")}`, {
      action: {
        label: "Undo",
        onClick: () => {
          Promise.all(
            success.map(({ tabId }) =>
              chrome.tabs.create({ url: removedTabs.get(tabId)?.url, active: false }),
            ),
          );
        },
      },
    });
  }

  if (opts.notify && error.length) {
    toast.error(`Failed to close ${pluralize(error.length, "tab")}. Please try again.`);
  }

  return { success, error };
};

export const removeTabsPar = async (tabIds: number[], opts: RemoveTabOpts = {}) => {
  const state = useTabStore.getState();
  const idsSet = new Set(tabIds);
  const removedTabs = state.tabs.filter((t) => idsSet.has(t.id));

  try {
    await chrome.tabs.remove(Array.from(tabIds));

    useTabStore.setState((state) => ({
      tabs: state.tabs.filter((t) => !idsSet.has(t.id)),
    }));

    // Remove from selection
    const selectedTabIds = new Set(SelectionStore.selectedTabIds);
    for (const id of idsSet) {
      selectedTabIds.delete(id);
    }
    SelectionStore.selectedTabIds = proxySet(selectedTabIds);

    if (opts.notify !== false) {
      toast.success(`Closed ${pluralize(tabIds.length, "tab")}`, {
        action: {
          label: "Undo",
          onClick: () => {
            Promise.all(removedTabs.map((t) => chrome.tabs.create({ url: t.url, active: false })));
          },
        },
      });
    }
  } catch (e) {
    toast.error(`Failed to close ${pluralize(tabIds.length, "tab")}. Please try again.`);
    logger.error("Failed to close tabs", e);
  }
};

export const removeAllInWindow = async (windowId: number) => {
  const state = useTabStore.getState();
  const tabs = state.tabs.filter((t) => t.windowId === windowId);
  await removeTabs(tabs.map((t) => t.id));
};

export const removeAllTabs = async () => {
  const state = useTabStore.getState();
  const tabIds = state.tabs.map((t) => t.id);
  await removeTabs(tabIds);
};

export const removeDuplicateTabs = async () => {
  const duplicates = getDuplicateTabIds();
  await removeTabs(Array.from(duplicates), { notify: true });
};

export const removeStaleTabs = async () => {
  const stale = getStaleTabIds();
  await removeTabs(Array.from(stale), { notify: true });
};

export const saveTabs = async (tabs: (ActiveTab & { tagIds: number[] })[], remove = true) => {
  if (!tabs.length) {
    return;
  }
  return saveTabsPar(tabs, remove);
};

export const saveTabsSeq = async (tabs: (ActiveTab & { tagIds: number[] })[], remove = true) => {
  if (!tabs.length) {
    return;
  }

  const results = {
    success: [] as { tabId: number; saveId: string }[],
    error: {
      tabs: [] as number[],
      snapshots: [] as string[],
    },
  };

  for (const tab of tabs) {
    const saveId = generateBookmarkId();

    try {
      if (remove) {
        await removeTab(tab.id, { notify: false });
      }
      saveBookmarkTabs([{ ...tab, id: saveId }]);
      results.success.push({ tabId: tab.id, saveId });
    } catch (e) {
      results.error.tabs.push(tab.id);
    }
  }

  if (results.success.length) {
    toast.success(`Saved ${pluralize(results.success.length, "tab")}`);
  }
  if (results.error.tabs.length) {
    toast.error(`Failed to save ${pluralize(results.error.tabs.length, "tab")}. Please try again.`);
  }

  return results;
};

export const saveTabsPar = async (tabs: (ActiveTab & { tagIds: number[] })[], remove = true) => {
  if (!tabs.length) {
    return;
  }

  if (remove) {
    const tabIds = tabs.map(({ id }) => id!).filter(Boolean);
    await removeTabs(tabIds, { notify: false }).catch(() => {
      const msg = `Failed to remove tabs: ${tabIds}`;
      toast.error(msg);
      logger.error(msg);
    });
  }

  const withoutIds = tabs.map(({ id, windowId, ...t }) => ({
    ...t,
  }));

  const saved = saveBookmarkTabs(withoutIds);
  return saved;
};

interface ReorderOp {
  windowId: number;
  index: number;
}

export const reorderTab = async (op: { tabId: number; from: ReorderOp; to: ReorderOp }) => {
  await chrome.tabs.move(op.tabId, {
    index: op.to.index,
    windowId: op.to.windowId,
  });
};

export const syncOrder = async (tabs: Record<number, number[]>) => {
  const sort = useTabViewStore.getState().sort;

  await Promise.all(
    Object.entries(tabs).map(([windowId, tabIds]) => {
      const sortedTabs = sort.dir === SortDir.Asc ? tabIds : [...tabIds].reverse();
      return chrome.tabs.move(Array.from(sortedTabs), {
        index: 0,
        windowId: Number(windowId),
      });
    }),
  ).catch((e) => {
    logger.error("Failed to sync tab order", e);
  });
};

export const updateTab = async (tabId: number, options: chrome.tabs.UpdateProperties) => {
  await chrome.tabs.update(tabId, options);
};

export const moveTabsToNewWindow = async (tabIds: number[], incognito = false) => {
  const state = useTabStore.getState();
  const tabsById = new Map(state.tabs.map((t) => [t.id, t]));

  await chrome.windows.create({
    url: tabIds.map((id) => tabsById.get(id)?.url).filter(Boolean) as string[],
    incognito,
  });

  await removeTabs(tabIds);
};

export const reloadTab = async (tabId: number) => {
  return chrome.tabs.reload(tabId);
};

export const focusWindow = (windowId: number) => {
  chrome.windows.update(windowId, { focused: true });
};

export const removeWindow = async (windowId: number) => {
  await chrome.windows.remove(windowId);
};

export function filterTabs(tabs: ActiveTab[], filter: Filter): Set<number> {
  if (!filter.keywords.length) {
    return new Set<number>();
  }

  const allIds = new Set(tabs.map((t) => t.id));
  const extendedPrefix = filter.looseMatch ? "" : "'";

  const fuseIds = filter.keywords.length
    ? new Set(
        tabsFuse
          .search(`${extendedPrefix}${filter.keywords.map((kw) => `${kw.trim()}`).join(" ")}`)
          .map((r) => r.item.id),
      )
    : new Set(allIds);

  return fuseIds;
}

const getFilteredTabIds = (): Set<number> => {
  const { tabs } = useTabStore.getState();
  const { filter } = useTabViewStore.getState();

  const allIds = new Set(tabs.map((t) => t.id));

  if (!filter.keywords.length) {
    return allIds;
  }

  return filterTabs(tabs, filter);
};

const getDuplicateTabIds = (): Set<number> => {
  const { tabs } = useTabStore.getState();
  const savedTabs = useBookmarkStore.getState().tabs;
  const filteredIds = getFilteredTabIds();

  const filteredTabs = tabs.filter((t) => filteredIds.has(t.id));
  const activeByUrl = new Map(filteredTabs.map((t) => [canonicalizeURL(t.url), t]));
  const savedByUrl = new Map(savedTabs.map((t) => [canonicalizeURL(t.url), t]));

  const duplicates = new Set<number>();

  for (const { id, url } of filteredTabs) {
    const canonicalUrl = canonicalizeURL(url);
    const saved = savedByUrl.has(canonicalUrl);
    const duplicateActive = activeByUrl.has(canonicalUrl) && !(activeByUrl.get(url)?.id === id);
    if (saved || duplicateActive) {
      duplicates.add(id);
    }
  }

  return duplicates;
};

const getStaleTabIds = (): Set<number> => {
  const { tabs } = useTabStore.getState();
  const filteredIds = getFilteredTabIds();

  const filteredTabs = tabs.filter((t) => filteredIds.has(t.id));
  return new Set(filteredTabs.filter((t) => isStale(t.lastAccessed)).map((t) => t.id));
};

export const useFiltersApplied = () => {
  const filter = useTabViewStore((s) => s.filter);
  return Boolean(filter.keywords.length);
};

export const useFilteredTabIds = () => {
  const tabs = useTabStore((s) => s.tabs);
  const filter = useTabViewStore((s) => s.filter);

  return useMemo(() => {
    const allIds = new Set(tabs.map((t) => t.id));

    if (!filter.keywords.length) {
      return allIds;
    }

    return filterTabs(tabs, filter);
  }, [tabs, filter]);
};

export const useViewDuplicateTabIds = () => {
  const tabs = useTabStore((s) => s.tabs);
  const savedTabs = useBookmarkStore((s) => s.tabs);
  const filteredIds = useFilteredTabIds();

  return useMemo(() => {
    const filteredTabs = tabs.filter((t) => filteredIds.has(t.id));
    const activeByUrl = new Map(filteredTabs.map((t) => [canonicalizeURL(t.url), t]));
    const savedByUrl = new Map(savedTabs.map((t) => [canonicalizeURL(t.url), t]));

    const duplicates = new Set<number>();

    for (const { id, url } of filteredTabs) {
      const canonicalUrl = canonicalizeURL(url);
      const saved = savedByUrl.has(canonicalUrl);
      const duplicateActive = activeByUrl.has(canonicalUrl) && !(activeByUrl.get(url)?.id === id);
      if (saved || duplicateActive) {
        duplicates.add(id);
      }
    }

    return duplicates;
  }, [tabs, savedTabs, filteredIds]);
};

export const useViewStaleTabIds = () => {
  const tabs = useTabStore((s) => s.tabs);
  const filteredIds = useFilteredTabIds();

  return useMemo(() => {
    const filteredTabs = tabs.filter((t) => filteredIds.has(t.id));
    return new Set(filteredTabs.filter((t) => isStale(t.lastAccessed)).map((t) => t.id));
  }, [tabs, filteredIds]);
};

export const useViewTabsById = () => {
  const tabs = useTabStore((s) => s.tabs);
  const filteredIds = useFilteredTabIds();

  return useMemo(() => {
    const filteredTabs = tabs.filter((t) => filteredIds.has(t.id));
    const result: Record<number, ActiveTab> = {};
    for (const t of filteredTabs) {
      result[t.id] = t;
    }
    return result;
  }, [tabs, filteredIds]);
};

export const useViewTabIdsByWindowId = () => {
  const tabs = useTabStore((s) => s.tabs);
  const sort = useTabViewStore((s) => s.sort);
  const filteredIds = useFilteredTabIds();

  return useMemo(() => {
    const filteredTabs = tabs.filter((t) => filteredIds.has(t.id));
    const ids: Record<number, number[]> = {};

    for (const t of filteredTabs) {
      if (!ids[t.windowId]) {
        ids[t.windowId] = [];
      }
      ids[t.windowId]!.push(t.id);
    }

    if (sort.dir === SortDir.Desc) {
      for (const windowId of Object.keys(ids)) {
        ids[Number(windowId)] = ids[Number(windowId)]!.reverse();
      }
    }

    return ids;
  }, [tabs, filteredIds, sort.dir]);
};

export const useViewTabIdsByDomain = () => {
  const tabs = useTabStore((s) => s.tabs);
  const sort = useTabViewStore((s) => s.sort);
  const filteredIds = useFilteredTabIds();

  return useMemo(() => {
    const filteredTabs = tabs.filter((t) => filteredIds.has(t.id));
    const domains = Array.from(new Set(filteredTabs.map((t) => getDomain(t.url))));

    const tabsByDomain: Record<string, number[]> = Object.fromEntries(
      domains.map((domain) => [domain, []]),
    );

    for (const t of filteredTabs) {
      const domain = getDomain(t.url);
      tabsByDomain[domain]!.push(t.id);
    }

    const singleTabDomains = Object.entries(tabsByDomain)
      .filter(([, ids]) => ids.length === 1)
      .map(([domain]) => domain);

    if (singleTabDomains.length) {
      tabsByDomain["Other"] = singleTabDomains.flatMap((domain) => tabsByDomain[domain] ?? []);
      for (const domain of singleTabDomains) {
        delete tabsByDomain[domain];
      }
    }

    const keyComparator = (
      [domainA, idsA]: [string, number[]],
      [domainB, idsB]: [string, number[]],
    ) => {
      if (sort.prop === TabSortProp.TabDomain) {
        return sort.dir === SortDir.Asc
          ? domainA.localeCompare(domainB)
          : domainB.localeCompare(domainA);
      }
      if (sort.prop === TabSortProp.TabCount) {
        return sort.dir === SortDir.Asc ? idsA.length - idsB.length : idsB.length - idsA.length;
      }
      return 0;
    };

    return sortRecord(tabsByDomain, keyComparator);
  }, [tabs, filteredIds, sort]);
};

export const useViewTabIds = () => {
  const tabs = useTabStore((s) => s.tabs);
  const filteredIds = useFilteredTabIds();

  return useMemo(() => {
    const filteredTabs = tabs.filter((t) => filteredIds.has(t.id));
    return filteredTabs.map((t) => t.id);
  }, [tabs, filteredIds]);
};

export const useTabInfo = (tabId: number) => {
  const duplicateTabIds = useViewDuplicateTabIds();
  const staleTabIds = useViewStaleTabIds();
  const selected = useIsTabSelected(tabId);

  return useMemo(
    () => ({
      duplicate: duplicateTabIds.has(tabId),
      stale: staleTabIds.has(tabId),
      selected,
    }),
    [duplicateTabIds, staleTabIds, selected, tabId],
  );
};

export function useTabSelectionStore() {
  return useSnapshot(SelectionStore);
}

export function useIsTabSelected(tabId: number) {
  const [selected, setSelected] = useState(SelectionStore.selectedTabIds.has(tabId));

  useEffect(() => {
    const callback = () => {
      setSelected(SelectionStore.selectedTabIds.has(tabId));
    };
    const unsubscribe = subscribe(SelectionStore, callback);
    callback();

    return unsubscribe;
  }, [tabId]);

  return selected;
}

export const tabStoreActions = {
  toggleAssignedTagId,
  clearAssignedTagIds,
  setView,
  updateFilter,
  clearFilter,
  addTab,
  resetTabs,
  removeTab,
  removeTabs,
  removeAllInWindow,
  removeAllTabs,
  removeDuplicateTabs,
  removeStaleTabs,
  saveTabs,
  saveTabsSeq,
  saveTabsPar,
  reorderTab,
  syncOrder,
  updateTab,
  moveTabsToNewWindow,
  reloadTab,
  focusWindow,
  removeWindow,
  filterTabs,
  getFilteredTabIds,
  getDuplicateTabIds,
  getStaleTabIds,
};

export const tabStoreViewActions = {
  setView,
  updateFilter,
  clearFilter,
};

export const tabStoreSelectionActions = {
  deselectAllTabs,
  selectAllTabs,
  selectTabs,
  toggleSelected,
};
