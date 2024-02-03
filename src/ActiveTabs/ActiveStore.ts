import Fuse from "fuse.js";
import { proxy, subscribe, useSnapshot } from "valtio";
import { derive, proxySet } from "valtio/utils";

import { ActiveTab, SavedTab } from "../models";
import { SavedStore } from "../SavedTabs";
import { toast } from "../ui/Toast";
import { canonicalizeURL, isValidActiveTab } from "../util";
import { toggle } from "../util/set";

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

export interface ActiveStore {
    initialized: boolean;
    assignedTagIds: Set<number>;
    tabs: ActiveTab[];
    selectedTabIds: Set<number>;

    view: { filter: Filter };
    filtersApplied: boolean;
    filteredTabIds: Set<number>;
    viewDuplicateTabIds: Set<number>;
    viewTabsById: Record<number, ActiveTab>;
    viewTabIdsByWindowId: Record<number, number[]>;

    initTabs(): Promise<void>;
    toggleAssignedTagId(tagId: number): void;
    clearAssignedTagIds(): void;
    setFilter(filter: Filter): void;
    clearFilter(): void;
    setPreviewFilter(filter: Filter): void;
    addTab(tabId: number, tab: ActiveTab): void;
    reorderTab(from: number, to: number, syncBrowser?: boolean): void;
    syncOrder(tabs: Record<number, number[]>): void;
    selectTabs(tabIds: Set<number>): void;
    deselectAllTabs(): void;
    selectAllTabs(): void;
    toggleTabSelection(tabId: number): void;
    removeTab(tabId: number): Promise<void>;
    removeAllTabs(): Promise<void>;
    removeAllInWindow(windowId: number): Promise<void>;
    removeTabs(tabIds: number[]): Promise<void>;
    removeDuplicateTabs(): Promise<void>;
    resetTabs(): Promise<void>;
    saveTabs(tabs: SavedTab[], autoremove?: boolean): Promise<void>;
    updateTab(tabId: number, options: chrome.tabs.UpdateProperties): Promise<void>;
}

const store = proxy({
    initialized: false,
    assignedTagIds: proxySet<number>(),
    tabs: [] as ActiveTab[],
    selectedTabIds: proxySet<number>(),
    view: proxy({
        filter: {
            keywords: [] as string[],
        },
    }),
    initTabs: async () => {
        store.tabs = await getActiveTabs();

        let syncDebounceTimer: null | ReturnType<typeof setTimeout> = null;
        chrome.tabs.onMoved.addListener(() => {
            if (syncDebounceTimer) {
                clearTimeout(syncDebounceTimer);
            }
            syncDebounceTimer = setTimeout(() => {
                store.resetTabs();
            }, 200);
        });

        chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
            const tabIndex = store.tabs.findIndex((t) => t.id === tabId);
            if (tabIndex !== -1) {
                store.tabs[tabIndex] = { ...store.tabs[tabIndex], ...toActiveTab(tab) };
            } else if (change.status === "complete") {
                const newTab = toActiveTab(tab);
                if (isValidActiveTab(newTab)) {
                    store.tabs.push(newTab as ActiveTab);
                }
            }
        });

        chrome.tabs.onRemoved.addListener((id) => {
            store.tabs = store.tabs.filter((t) => t.id !== id);
        });

        store.initialized = true;
    },
    addTab: (tabId: number, tab: ActiveTab) => {
        if (!isValidActiveTab(tab)) {
            return;
        }

        let i = store.tabs.findIndex((t) => t.id === tabId);

        if (i !== -1) {
            store.tabs[i] = tab;
        } else {
            store.tabs.push(tab);
        }
    },
    removeTab: async (tabId: number) => {
        return store.removeTabs([tabId]);
    },
    removeTabs: async (tabIds: number[]) => {
        await chrome.tabs.remove(tabIds);

        const idsSet = new Set(tabIds);
        store.tabs = store.tabs.filter((t) => !idsSet.has(t.id));
        for (const id of idsSet) {
            store.selectedTabIds.delete(id);
        }
    },
    removeAllInWindow: async (windowId: number) => {
        const tabs = store.tabs.filter((t) => t.windowId === windowId);
        await store.removeTabs(tabs.map((t) => t.id));
    },
    removeAllTabs: async () => {
        const tabIds = store.tabs.map((t) => t.id);
        await store.removeTabs(tabIds);
    },
    resetTabs: async () => {
        store.tabs = await getActiveTabs();
    },
    selectTabs: (tabIds: Set<number>) => {
        store.selectedTabIds = proxySet(tabIds);
    },
    toggleTabSelection: (tabId: number) => {
        if (store.selectedTabIds.has(tabId)) {
            store.selectedTabIds.delete(tabId);
        } else {
            store.selectedTabIds.add(tabId);
        }
    },
    deselectAllTabs: () => {
        store.selectedTabIds = proxySet();
    },
    selectAllTabs: () => {
        store.selectedTabIds = proxySet([...store.filteredTabIds]);
    },
    saveTabs: async (tabs: SavedTab[], remove = true) => {
        if (remove) {
            const tabIds = tabs.map(({ id }) => id);
            await store.removeTabs(tabIds).catch(() => {
                const msg = `Failed to remove tabs: ${tabIds}`;
                toast.error(msg);
                console.error(msg);
            });
        }

        SavedStore.saveTabs(tabs);
    },
    toggleAssignedTagId: (tagId: number) => {
        toggle(store.assignedTagIds, tagId);
    },
    clearAssignedTagIds: () => {
        store.assignedTagIds = proxySet();
    },
    setFilter: (filter: Partial<Filter>) => {
        store.view.filter = { ...store.view.filter, ...filter };
    },
    clearFilter: () => {
        store.view.filter = { keywords: [] };
    },
    reorderTab: async (op: { tabId: number; from: ReorderOp; to: ReorderOp }) => {
        await chrome.tabs.move(op.tabId, {
            index: op.to.index,
            windowId: op.to.windowId,
        });
    },
    syncOrder: async (tabs: Record<number, number[]>) => {
        await Promise.all(
            Object.entries(tabs).map(([windowId, tabs]) =>
                chrome.tabs.move(Array.from(tabs), { index: 0, windowId: Number(windowId) }),
            ),
        ).catch((e) => {
            console.error(e);
        });
    },
    removeDuplicateTabs: async () => {
        const duplicates = store.viewDuplicateTabIds;
        await store.removeTabs(Array.from(duplicates));
    },
    updateTab: async (tabId: number, options: chrome.tabs.UpdateProperties) => {
        await chrome.tabs.update(tabId, options);
    },
}) as unknown as ActiveStore;

const fuseOptions = {
    useExtendedSearch: true,
    keys: ["title", { name: "url", weight: 2 }],
};

const activeFuse = new Fuse(store.tabs, fuseOptions);

export function filterTabs(tabs: ActiveTab[], filter: Filter) {
    if (!filter.keywords.length) {
        return new Set<number>();
    }

    const allIds = new Set(tabs.map((t) => t.id));

    const fuseIds = filter.keywords.length
        ? new Set(
              activeFuse
                  .search(filter.keywords.map((kw) => kw.trim()).join(" "))
                  .map((r) => r.item.id),
          )
        : new Set(allIds);

    return fuseIds;
}

derive(
    {
        filtersApplied: (get) => {
            const filter = get(store).view.filter;
            return Boolean(filter.keywords.length);
        },
        filteredTabIds: (get) => {
            const filter = get(store).view.filter;
            const tabs = get(store).tabs;

            const allIds = new Set(tabs.map((t) => t.id));

            if (!filter.keywords.length) {
                return proxySet(allIds);
            }

            return proxySet(filterTabs(tabs, filter));
        },
        viewDuplicateTabIds: (get) => {
            const filteredIds = get(store).filteredTabIds;
            const tabs = get(store.tabs).filter((t) => filteredIds.has(t.id));
            const savedTabs = get(SavedStore.tabs);
            const activeByUrl = new Map(tabs.map((t) => [canonicalizeURL(t.url), t]));

            const savedByUrl = new Map(
                Array.from(savedTabs.values()).map((t) => [canonicalizeURL(t.url), t]),
            );

            const duplicates = new Set<number>();

            // canonicalizeURL
            for (const { id, url } of tabs) {
                const canonicalUrl = canonicalizeURL(url);
                const saved = savedByUrl.has(canonicalUrl);
                const duplicateActive =
                    activeByUrl.has(canonicalUrl) && !(activeByUrl.get(url)?.id === id);
                if (saved || duplicateActive) {
                    duplicates.add(id);
                }
            }

            return proxySet(duplicates);
        },
        viewTabsById: (get) => {
            const filteredIds = get(store).filteredTabIds;
            const tabs = get(store.tabs).filter((t) => filteredIds.has(t.id));

            const ids: Record<number, ActiveTab> = {};
            for (const t of tabs) {
                ids[t.id] = t;
            }

            return ids;
        },
        viewTabIdsByWindowId: (get) => {
            const filteredIds = get(store).filteredTabIds;
            const tabs = get(store.tabs).filter((t) => filteredIds.has(t.id));

            const ids: Record<number, number[]> = {};
            for (const t of tabs) {
                if (!ids[t.windowId]) {
                    ids[t.windowId] = [];
                }
                ids[t.windowId].push(t.id);
            }

            return ids;
        },
    },
    { proxy: store },
);

subscribe(store, (ops) => {
    const savedTabsUpdated = ops.filter((op) => op[1][0] === "tabs");

    if (savedTabsUpdated.length) {
        activeFuse.setCollection(store.tabs);
    }
});

store.initTabs();

export const useActiveTabStore = () => useSnapshot(store) as typeof store;

export default store;
