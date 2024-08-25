import { toast } from "@echotab/ui/Toast";
import Fuse from "fuse.js";
import { useEffect, useState } from "react";
import { proxy, subscribe, useSnapshot } from "valtio";
import { derive, proxySet } from "valtio/utils";

import { BookmarkStore } from "../Bookmarks";
import { ActiveTab } from "../models";
import { pluralize } from "../util";
import { toggle } from "../util/set";
import { SortDir } from "../util/sort";
import { canonicalizeURL } from "../util/url";

function isValidActiveTab(tab?: Partial<chrome.tabs.Tab>) {
  return tab && tab.url && tab.id && tab.title;
}

export interface Filter {
  keywords: string[];
}

function toActiveTab(tab: Partial<chrome.tabs.Tab> = {}): Partial<ActiveTab> {
  return {
    favIconUrl: tab.favIconUrl,
    id: tab.id,
    title: tab.title,
    url: tab.url,
    windowId: tab.windowId,
    pinned: tab.pinned,
  };
}

async function getActiveTabs(): Promise<ActiveTab[]> {
  const tabs = await chrome.tabs.query({});
  const activeTabs = tabs.map(toActiveTab).filter(isValidActiveTab) as ActiveTab[];

  return activeTabs;
}

interface ReorderOp {
  windowId: number;
  index: number;
}

export const SelectionStore = proxy({
  selectedTabIds: proxySet<number>(),
  toggleSelected: (tabId: number) => {
    toggle(SelectionStore.selectedTabIds, tabId);
  },
  selectTabs: (tabIds?: Set<number>) => {
    SelectionStore.selectedTabIds = proxySet(tabIds);
  },
  selectAllTabs: () => {
    SelectionStore.selectedTabIds = proxySet(Store.filteredTabIds);
  },
  deselectAllTabs: () => {
    SelectionStore.selectedTabIds = proxySet();
  },
});

// todo: deduplicate stores
export interface ActiveStore {
  initialized: boolean;
  assignedTagIds: Set<number>;
  tabs: ActiveTab[];
  view: {
    filter: Filter;
    sort: {
      prop: "index";
      dir: SortDir;
    };
  };
  filtersApplied: boolean;
  filteredTabIds: Set<number>;
  viewDuplicateTabIds: Set<number>;
  viewTabsById: Record<number, ActiveTab>;
  viewTabIdsByWindowId: Record<number, number[]>;

  initStore(): Promise<void>;
  toggleAssignedTagId(tagId: number): void;
  clearAssignedTagIds(): void;
  setView(view: Partial<ActiveStore["view"]>): void;
  updateFilter(filter: Partial<Filter>): void;
  clearFilter(): void;
  addTab(tabId: number, tab: ActiveTab): void;
  reorderTab(from: number, to: number, syncBrowser?: boolean): void;
  syncOrder(tabs: Record<number, number[]>): void;
  removeTab(tabId: number): Promise<void>;
  removeAllTabs(): Promise<void>;
  removeAllInWindow(windowId: number): Promise<void>;
  removeTabs(tabIds: number[]): Promise<void>;
  removeDuplicateTabs(): Promise<void>;
  resetTabs(): Promise<void>;
  saveTabs(
    tabs: (Partial<ActiveTab> & { tagIds: number[] })[],
    autoremove?: boolean,
  ): Promise<void>;
  updateTab(tabId: number, options: chrome.tabs.UpdateProperties): Promise<void>;
  moveTabsToNewWindow(tabIds: number[], incognito?: boolean): Promise<void>;
}

const Store = proxy({
  initialized: false,
  assignedTagIds: proxySet<number>(),
  tabs: [] as ActiveTab[],
  view: proxy({
    filter: {
      keywords: [] as string[],
    },
    sort: {
      prop: "index" as const,
      dir: SortDir.Asc,
    },
  }),
  initStore: async () => {
    Store.tabs = await getActiveTabs();

    let syncDebounceTimer: null | ReturnType<typeof setTimeout> = null;
    chrome.tabs.onMoved.addListener(() => {
      if (syncDebounceTimer) {
        clearTimeout(syncDebounceTimer);
      }
      syncDebounceTimer = setTimeout(() => {
        Store.resetTabs();
      }, 200);
    });

    chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
      const tabIndex = Store.tabs.findIndex((t) => t.id === tabId);
      if (tabIndex !== -1) {
        Store.tabs[tabIndex] = { ...Store.tabs[tabIndex], ...toActiveTab(tab) };
      } else if (change.status === "complete") {
        const newTab = toActiveTab(tab);
        if (isValidActiveTab(newTab)) {
          Store.tabs.push(newTab as ActiveTab);
        }
      }
    });

    chrome.tabs.onRemoved.addListener((id) => {
      Store.tabs = Store.tabs.filter((t) => t.id !== id);
    });

    Store.initialized = true;
  },
  addTab: (tabId: number, tab: ActiveTab) => {
    if (!isValidActiveTab(tab)) {
      return;
    }

    let i = Store.tabs.findIndex((t) => t.id === tabId);

    if (i !== -1) {
      Store.tabs[i] = tab;
    } else {
      Store.tabs.push(tab);
    }
  },
  removeTab: async (tabId: number) => {
    return Store.removeTabs([tabId]);
  },
  removeTabs: async (tabIds: number[]) => {
    const idsSet = new Set(tabIds);
    const removedTabs = Store.tabs.filter((t) => idsSet.has(t.id));

    await chrome.tabs.remove(tabIds);

    Store.tabs = Store.tabs.filter((t) => !idsSet.has(t.id));
    for (const id of idsSet) {
      SelectionStore.selectedTabIds.delete(id);
    }

    toast.success(`Closed ${pluralize(tabIds.length, "tab")}`, {
      action: {
        label: "Undo",
        onClick: () => {
          Promise.all(removedTabs.map((t) => chrome.tabs.create({ url: t.url, active: false })));
        },
      },
    });
  },
  removeAllInWindow: async (windowId: number) => {
    const tabs = Store.tabs.filter((t) => t.windowId === windowId);
    await Store.removeTabs(tabs.map((t) => t.id));
  },
  removeAllTabs: async () => {
    const tabIds = Store.tabs.map((t) => t.id);
    await Store.removeTabs(tabIds);
  },
  resetTabs: async () => {
    Store.tabs = await getActiveTabs();
  },
  saveTabs: async (tabs: (ActiveTab & { tagIds: number[] })[], remove = true) => {
    if (remove) {
      const tabIds = tabs.map(({ id }) => id!).filter(Boolean);
      await Store.removeTabs(tabIds).catch(() => {
        const msg = `Failed to remove tabs: ${tabIds}`;
        toast.error(msg);
        console.error(msg);
      });
    }

    const withoutIds = tabs.map(({ id, windowId, ...t }) => t);

    BookmarkStore.saveTabs(withoutIds);
  },
  toggleAssignedTagId: (tagId: number) => {
    toggle(Store.assignedTagIds, tagId);
  },
  clearAssignedTagIds: () => {
    Store.assignedTagIds = proxySet();
  },
  setView(view: Partial<ActiveStore["view"]>) {
    Store.view = { ...Store.view, ...view };
  },
  updateFilter: (filter: Partial<Filter>) => {
    Store.view.filter = { ...Store.view.filter, ...filter };
  },
  clearFilter: () => {
    Store.view.filter = { keywords: [] };
  },
  reorderTab: async (op: { tabId: number; from: ReorderOp; to: ReorderOp }) => {
    await chrome.tabs.move(op.tabId, {
      index: op.to.index,
      windowId: op.to.windowId,
    });
  },
  syncOrder: async (tabs: Record<number, number[]>) => {
    await Promise.all(
      Object.entries(tabs).map(([windowId, tabs]) => {
        const sortedTabs = Store.view.sort.dir === SortDir.Asc ? tabs : [...tabs].reverse();
        return chrome.tabs.move(Array.from(sortedTabs), {
          index: 0,
          windowId: Number(windowId),
        });
      }),
    ).catch((e) => {
      console.error(e);
    });
  },
  removeDuplicateTabs: async () => {
    const duplicates = Store.viewDuplicateTabIds;
    await Store.removeTabs(Array.from(duplicates));
  },
  updateTab: async (tabId: number, options: chrome.tabs.UpdateProperties) => {
    await chrome.tabs.update(tabId, options);
  },
  moveTabsToNewWindow: async (tabIds: number[], incognito = false) => {
    await chrome.windows.create({
      url: tabIds.map((id) => Store.viewTabsById[id]?.url).filter(Boolean),
      incognito,
    });

    await Store.removeTabs(tabIds);
  },
}) as unknown as ActiveStore;

const fuseOptions = {
  useExtendedSearch: true,
  keys: ["title", { name: "url", weight: 2 }],
};

const tabsFuse = new Fuse(Store.tabs, fuseOptions);

export function filterTabs(tabs: ActiveTab[], filter: Filter) {
  if (!filter.keywords.length) {
    return new Set<number>();
  }

  const allIds = new Set(tabs.map((t) => t.id));

  const fuseIds = filter.keywords.length
    ? new Set(
        tabsFuse.search(filter.keywords.map((kw) => kw.trim()).join(" ")).map((r) => r.item.id),
      )
    : new Set(allIds);

  return fuseIds;
}

derive(
  {
    filtersApplied: (get) => {
      const filter = get(Store).view.filter;
      return Boolean(filter.keywords.length);
    },
    filteredTabIds: (get) => {
      const filter = get(Store).view.filter;
      const tabs = get(Store).tabs;

      const allIds = new Set(tabs.map((t) => t.id));

      if (!filter.keywords.length) {
        return proxySet(allIds);
      }

      return proxySet(filterTabs(tabs, filter));
    },
    viewDuplicateTabIds: (get) => {
      const filteredIds = get(Store).filteredTabIds;
      const tabs = get(Store.tabs).filter((t) => filteredIds.has(t.id));
      const savedTabs = get(BookmarkStore.tabs);
      const activeByUrl = new Map(tabs.map((t) => [canonicalizeURL(t.url), t]));

      const savedByUrl = new Map(
        Array.from(savedTabs.values()).map((t) => [canonicalizeURL(t.url), t]),
      );

      const duplicates = new Set<number>();

      // canonicalizeURL
      for (const { id, url } of tabs) {
        const canonicalUrl = canonicalizeURL(url);
        const saved = savedByUrl.has(canonicalUrl);
        const duplicateActive = activeByUrl.has(canonicalUrl) && !(activeByUrl.get(url)?.id === id);
        if (saved || duplicateActive) {
          duplicates.add(id);
        }
      }

      return proxySet(duplicates);
    },
    viewTabsById: (get) => {
      const filteredIds = get(Store).filteredTabIds;
      const tabs = get(Store.tabs).filter((t) => filteredIds.has(t.id));

      const ids: Record<number, ActiveTab> = {};
      for (const t of tabs) {
        ids[t.id] = t;
      }

      return ids;
    },
    viewTabIdsByWindowId: (get) => {
      const view = get(Store).view;
      const filteredIds = get(Store).filteredTabIds;
      const tabs = get(Store.tabs).filter((t) => filteredIds.has(t.id));

      const ids: Record<number, number[]> = {};
      for (const t of tabs) {
        if (!ids[t.windowId]) {
          ids[t.windowId] = [];
        }
        ids[t.windowId].push(t.id);
      }

      if (view.sort.dir === SortDir.Desc) {
        for (const windowId of Object.keys(ids)) {
          ids[Number(windowId)] = ids[Number(windowId)].reverse();
        }
      }

      return ids;
    },
  },
  { proxy: Store },
);

subscribe(Store, (ops) => {
  const savedTabsUpdated = ops.filter((op) => op[1][0] === "tabs");

  if (savedTabsUpdated.length) {
    tabsFuse.setCollection(Store.tabs);
  }
});

export function useActiveTabStore() {
  return useSnapshot(Store) as typeof Store;
}

export function useActiveSelectionStore() {
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

export function useIsTabDuplicate(tabId: number) {
  const [duplicate, setDuplicate] = useState(Store.viewDuplicateTabIds.has(tabId));

  useEffect(() => {
    const callback = () => {
      setDuplicate(Store.viewDuplicateTabIds.has(tabId));
    };
    const unsubscribe = subscribe(Store, callback);
    callback();

    return unsubscribe;
  }, [tabId]);

  return duplicate;
}

export default Store;
