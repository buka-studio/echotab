import { toast } from "@echotab/ui/Toast";
import { derive } from "derive-valtio";
import Fuse from "fuse.js";
import { useEffect, useState } from "react";
import { proxy, subscribe, useSnapshot } from "valtio";
import { proxySet } from "valtio/utils";

import BookmarkStore from "../Bookmarks/BookmarkStore";
import { version } from "../constants";
import { ActiveTab, Serializable } from "../models";
import { pluralize, sortRecord } from "../util";
import { zip } from "../util/array";
import { toggle } from "../util/set";
import SnapshotStore from "../util/SnapshotStore";
import { SortDir } from "../util/sort";
import { StoragePersistence } from "../util/StoragePersistence";
import { isValidActiveTab } from "../util/tab";
import { canonicalizeURL, getDomain } from "../util/url";
import RecentlyClosedStore from "./RecentlyClosed/RecentlyClosedStore";

export interface Filter {
  keywords: string[];
  looseMatch: boolean;
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

export const staleThresholdDaysInMs = 1000 * 60 * 60 * 24 * 7; // 7 days
function isStale(lastAccessed: number | undefined) {
  if (!lastAccessed) {
    return false;
  }
  return Date.now() - lastAccessed > staleThresholdDaysInMs;
}

interface ReorderOp {
  windowId: number;
  index: number;
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

interface RemoveTabResult {
  status: "success" | "error";
  tabId: number;
}

interface RemoveTabOpts {
  notify?: boolean;
}

type PersistedActiveStore = Pick<ActiveStore, "view">;

const storageKey = `cmdtab-active-store-${version}`;
const persistence = new StoragePersistence({ key: storageKey });

// todo: deduplicate stores
export interface ActiveStore extends Serializable<PersistedActiveStore> {
  initialized: boolean;
  assignedTagIds: Set<number>;
  tabs: ActiveTab[];
  windows: chrome.windows.Window[];
  activeWindowId: number;
  view: {
    filter: Filter;
    grouping: TabGrouping;
    sort: {
      prop: TabSortProp;
      dir: SortDir;
    };
  };
  filtersApplied: boolean;
  filteredTabIds: Set<number>;
  viewDuplicateTabIds: Set<number>;
  viewStaleTabIds: Set<number>;
  viewTabIds: number[];
  viewTabsById: Record<number, ActiveTab>;
  viewTabIdsByWindowId: Record<number, number[]>;
  viewTabIdsByDomain: Record<string, number[]>;

  initStore(): Promise<void>;
  toggleAssignedTagId(tagId: number): void;
  clearAssignedTagIds(): void;
  setView(view: Partial<ActiveStore["view"]>): void;
  updateFilter(filter: Partial<Filter>): void;
  clearFilter(): void;
  addTab(tabId: number, tab: ActiveTab): void;
  reorderTab(from: number, to: number, syncBrowser?: boolean): void;
  syncOrder(tabs: Record<number, number[]>): void;
  removeAllTabs(): Promise<void>;
  removeAllInWindow(windowId: number): Promise<void>;
  removeTab(tabId: number, opts?: RemoveTabOpts): Promise<void>;
  removeTabs(tabIds: number[], opts?: RemoveTabOpts): Promise<void>;
  removeTabsPar(tabIds: number[], opts?: RemoveTabOpts): Promise<void>;
  removeTabsSeq(tabIds: number[], opts?: RemoveTabOpts): Promise<void>;
  removeTabSeq(tabId: number, opts?: RemoveTabOpts): Promise<RemoveTabResult>;
  removeDuplicateTabs(): Promise<void>;
  removeStaleTabs(): Promise<void>;
  resetTabs(): Promise<void>;
  saveTabs(
    tabs: (Partial<ActiveTab> & { tagIds: number[] })[],
    autoremove?: boolean,
    snapshot?: boolean,
  ): Promise<void>;
  saveTabsSeq(
    tabs: (Partial<ActiveTab> & { tagIds: number[] })[],
    autoremove?: boolean,
    snapshot?: boolean,
  ): Promise<{
    success: { tabId: number; saveId: string }[];
    error: { tabs: number[]; snapshots: string[] };
  }>;
  saveTabsPar(
    tabs: (Partial<ActiveTab> & { tagIds: number[] })[],
    autoremove?: boolean,
    snapshot?: boolean,
  ): Promise<void>;
  updateTab(tabId: number, options: chrome.tabs.UpdateProperties): Promise<void>;
  moveTabsToNewWindow(tabIds: number[], incognito?: boolean): Promise<void>;
  reloadTab(tabId: number): Promise<void>;
  focusWindow(windowId: number): void;
  removeWindow(windowId: number): Promise<void>;
}

const Store = proxy({
  initialized: false,
  assignedTagIds: proxySet<number>(),
  tabs: [] as ActiveTab[],
  windows: [] as chrome.windows.Window[],
  activeWindowId: chrome.windows?.WINDOW_ID_CURRENT,
  view: proxy({
    filter: {
      keywords: [] as string[],
    },
    grouping: TabGrouping.All,
    sort: {
      prop: TabSortProp.Index,
      dir: SortDir.Asc,
    },
  }),
  initStore: async () => {
    Store.tabs = await getActiveTabs();

    const stored = await persistence.load();
    if (stored) {
      const deserialized = Store.deserialize(stored);
      if (deserialized) {
        Object.assign(Store, deserialized);
      }
    }

    persistence.subscribe((data) => {
      const deserialized = Store.deserialize(data);
      if (deserialized) {
        Object.assign(Store, deserialized);
      }
    });

    let syncDebounceTimer: null | ReturnType<typeof setTimeout> = null;
    chrome.tabs?.onMoved.addListener(() => {
      if (syncDebounceTimer) {
        clearTimeout(syncDebounceTimer);
      }
      syncDebounceTimer = setTimeout(() => {
        Store.resetTabs();
      }, 200);
    });

    chrome.tabs?.onUpdated.addListener((tabId, change, tab) => {
      const tabIndex = Store.tabs.findIndex((t) => t.id === tabId);
      if (tabIndex !== -1) {
        Store.tabs[tabIndex] = { ...Store.tabs[tabIndex], ...toActiveTab(tab) } as ActiveTab;
      } else if (change.status === "complete") {
        const newTab = toActiveTab(tab);
        if (isValidActiveTab(newTab)) {
          Store.tabs.push(newTab as ActiveTab);
        }
      }
    });

    chrome.tabs?.onRemoved.addListener((id) => {
      const removedTab = Store.tabs.find((t) => t.id === id);
      if (removedTab) {
        RecentlyClosedStore.addTab(removedTab);
      }
      Store.tabs = Store.tabs.filter((t) => t.id !== id);
      SelectionStore.selectedTabIds.delete(id);
    });

    chrome.windows?.onFocusChanged.addListener((windowId) => {
      Store.activeWindowId = windowId;
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
  removeTab: async (tabId: number, opts: RemoveTabOpts = {}) => {
    return Store.removeTabs([tabId], opts);
  },
  removeTabs: async (tabIds: number[], opts: RemoveTabOpts = {}) => {
    if (!tabIds.length) {
      return;
    }

    return Store.removeTabsPar(tabIds, opts);
  },
  removeTabSeq: async (tabId: number, opts: RemoveTabOpts = {}) => {
    try {
      await chrome.tabs?.remove(tabId);

      return {
        status: "success",
        tabId,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "error",
        tabId,
      };
    }
  },
  removeTabsSeq: async (tabIds: number[], opts: RemoveTabOpts = {}) => {
    const success: RemoveTabResult[] = [];
    const error: RemoveTabResult[] = [];

    const idsSet = new Set(tabIds);
    const removedTabs = new Map(Store.tabs.filter((t) => idsSet.has(t.id)).map((t) => [t.id, t]));

    for (const id of tabIds) {
      const result = await Store.removeTabSeq(id);
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

    return {
      success,
      error,
    };
  },
  removeTabsPar: async (tabIds: number[], opts: RemoveTabOpts = {}) => {
    const idsSet = new Set(tabIds);
    const removedTabs = Store.tabs.filter((t) => idsSet.has(t.id));
    try {
      await chrome.tabs.remove(Array.from(tabIds));

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
    } catch (e) {
      toast.error(`Failed to close ${pluralize(tabIds.length, "tab")}. Please try again.`);
      console.error(e);
    }
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

  saveTabs: async (tabs: (ActiveTab & { tagIds: number[] })[], remove = true, snapshot = true) => {
    if (!tabs.length) {
      return;
    }

    return Store.saveTabsPar(tabs, remove, snapshot);
  },
  saveTabsSeq: async (
    tabs: (ActiveTab & { tagIds: number[] })[],
    remove = true,
    snapshot = true,
  ) => {
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

    const snapshotStore = await SnapshotStore.init();

    for (const tab of tabs) {
      const saveId = BookmarkStore.generateId();

      if (snapshot) {
        try {
          await snapshotStore.commitSnapshot(tab.id, saveId);
        } catch (e) {
          results.error.snapshots.push(tab.url);
        }
      }

      try {
        if (remove) {
          await Store.removeTab(tab.id, { notify: false });
        }
        BookmarkStore.saveTabs([
          {
            ...tab,
            id: saveId,
          },
        ]);

        results.success.push({ tabId: tab.id, saveId });
      } catch (e) {
        results.error.tabs.push(tab.id);
      }
    }

    if (results.success.length) {
      toast.success(`Saved ${pluralize(results.success.length, "tab")}`);
    }
    if (results.error.tabs.length) {
      toast.error(
        `Failed to save ${pluralize(results.error.tabs.length, "tab")}. Please try again.`,
      );
    }

    return results;
  },
  saveTabsPar: async (
    tabs: (ActiveTab & { tagIds: number[] })[],
    remove = true,
    snapshot = true,
  ) => {
    if (!tabs.length) {
      return;
    }

    if (remove) {
      const tabIds = tabs.map(({ id }) => id!).filter(Boolean);
      await Store.removeTabs(tabIds).catch(() => {
        const msg = `Failed to remove tabs: ${tabIds}`;
        toast.error(msg);
        console.error(msg);
      });
    }

    const withoutIds = tabs.map(({ id, windowId, ...t }) => ({
      ...t,
    }));

    const saved = BookmarkStore.saveTabs(withoutIds);

    const idPairs = zip(
      tabs.map(({ id }) => id!),
      saved.map(({ id }) => id!),
    ) as [number, string][];

    if (snapshot) {
      const snapshotStore = await SnapshotStore.init();
      const snapshotResults = await Promise.allSettled(
        idPairs.map(([tabId, savedId]) => snapshotStore.commitSnapshot(tabId, savedId)),
      );

      const failed = snapshotResults.filter((r) => r.status === "rejected");
      if (failed.length) {
        toast.error(`Failed to save ${pluralize(failed.length, "snapshot")}.`);
        console.error(failed);
      }
    }
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
    const wipFilter = { ...filter };
    if (wipFilter.keywords?.length === 0) {
      wipFilter.looseMatch = false;
    }

    Store.view.filter = { ...Store.view.filter, ...wipFilter };
  },
  clearFilter: () => {
    Store.view.filter = { keywords: [], looseMatch: false };
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
    await Store.removeTabs(Array.from(duplicates), { notify: true });
  },
  removeStaleTabs: async () => {
    const stale = Store.viewStaleTabIds;
    await Store.removeTabs(Array.from(stale), { notify: true });
  },
  updateTab: async (tabId: number, options: chrome.tabs.UpdateProperties) => {
    await chrome.tabs.update(tabId, options);
  },
  moveTabsToNewWindow: async (tabIds: number[], incognito = false) => {
    await chrome.windows.create({
      url: tabIds.map((id) => Store.viewTabsById[id]?.url).filter(Boolean) as string[],
      incognito,
    });

    await Store.removeTabs(tabIds);
  },
  reloadTab: async (tabId: number) => {
    return chrome.tabs.reload(tabId);
  },
  focusWindow: (windowId: number) => {
    chrome.windows.update(windowId, { focused: true });
  },
  removeWindow: async (windowId: number) => {
    await chrome.windows.remove(windowId);
  },
  serialize: () => {
    return JSON.stringify({
      view: Store.view,
    });
  },
  deserialize: (serialized: string): PersistedActiveStore | undefined => {
    try {
      const init = JSON.parse(serialized) as PersistedActiveStore;
      return {
        view: { ...Store.view, ...init.view },
      };
    } catch (e) {
      toast.error("Failed to load stored active tabs view");
      console.error(e);
    }
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
    viewStaleTabIds: (get) => {
      const filteredIds = get(Store).filteredTabIds;
      const tabs = get(Store.tabs).filter((t) => filteredIds.has(t.id));
      return proxySet(tabs.filter((t) => isStale(t.lastAccessed)).map((t) => t.id));
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
        ids[t.windowId]!.push(t.id);
      }

      if (view.sort.dir === SortDir.Desc) {
        for (const windowId of Object.keys(ids)) {
          ids[Number(windowId)] = ids[Number(windowId)]!.reverse();
        }
      }

      return ids;
    },
    viewTabIdsByDomain: (get) => {
      const view = get(Store).view;
      const filteredIds = get(Store).filteredTabIds;
      const tabs = get(Store.tabs).filter((t) => filteredIds.has(t.id));

      const domains = Array.from(new Set(tabs.map((t) => getDomain(t.url))));

      const tabsByDomain: Record<string, number[]> = Object.fromEntries(
        domains.map((domain) => [domain, []]),
      );

      for (const t of tabs) {
        const domain = getDomain(t.url);
        tabsByDomain[domain]!.push(t.id);
      }

      const singleTabDomains = Object.entries(tabsByDomain)
        .filter(([domain, ids]) => ids.length === 1)
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
        if (view.sort.prop === TabSortProp.TabDomain) {
          return view.sort.dir === SortDir.Asc
            ? domainA.localeCompare(domainB)
            : domainB.localeCompare(domainA);
        }
        if (view.sort.prop === TabSortProp.TabCount) {
          return view.sort.dir === SortDir.Asc
            ? idsA.length - idsB.length
            : idsB.length - idsA.length;
        }
        return 0;
      };

      return sortRecord(tabsByDomain, keyComparator);
    },
    viewTabIds: (get) => {
      const filteredIds = get(Store).filteredTabIds;
      const tabs = get(Store.tabs).filter((t) => filteredIds.has(t.id));
      return tabs.map((t) => t.id);
    },
  },
  { proxy: Store },
);

subscribe(Store, (ops) => {
  const savedTabsUpdated = ops.filter((op) => op[1][0] === "tabs");

  if (savedTabsUpdated.length) {
    tabsFuse.setCollection(Store.tabs);
  }

  if (Store.initialized) {
    persistence.save(Store.serialize());
  }
});

export function useActiveTabStore() {
  return useSnapshot(Store) as typeof Store;
}

export function useActiveSelectionStore() {
  return useSnapshot(SelectionStore);
}

export function useTabInfo(tabId: number) {
  const [info, setInfo] = useState({
    duplicate: Store.viewDuplicateTabIds.has(tabId),
    stale: Store.viewStaleTabIds.has(tabId),
  });

  const [selectionInfo, setSelectionInfo] = useState({
    selected: SelectionStore.selectedTabIds.has(tabId),
  });

  useEffect(() => {
    const unsub = subscribe(Store, () =>
      setInfo({
        duplicate: Store.viewDuplicateTabIds.has(tabId),
        stale: Store.viewStaleTabIds.has(tabId),
      }),
    );

    const unsubInfo = subscribe(SelectionStore, () =>
      setSelectionInfo({
        selected: SelectionStore.selectedTabIds.has(tabId),
      }),
    );

    return () => {
      unsub();
      unsubInfo();
    };
  }, [tabId]);

  return { ...info, ...selectionInfo };
}

export default Store;
