import Fuse from "fuse.js";
import { useEffect, useState } from "react";
import { proxy, subscribe, useSnapshot } from "valtio";
import { derive, proxySet } from "valtio/utils";

import { ActiveTab } from "../models";
import { SavedStore } from "../SavedTabs";
import { toast } from "../ui/Toast";
import { canonicalizeURL, isValidActiveTab } from "../util";
import { toggle } from "../util/set";
import { SortDir } from "../util/sort";

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

    initTabs(): Promise<void>;
    toggleAssignedTagId(tagId: number): void;
    clearAssignedTagIds(): void;
    setView(view: Partial<ActiveStore["view"]>): void;
    updateFilter(filter: Partial<Filter>): void;
    clearFilter(): void;
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
    saveTabs(
        tabs: (Partial<ActiveTab> & { tagIds: number[] })[],
        autoremove?: boolean,
    ): Promise<void>;
    updateTab(tabId: number, options: chrome.tabs.UpdateProperties): Promise<void>;
    moveTabsToNewWindow(tabIds: number[], incognito?: boolean): Promise<void>;
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
        sort: {
            prop: "index" as const,
            dir: SortDir.Asc,
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
    saveTabs: async (tabs: (ActiveTab & { tagIds: number[] })[], remove = true) => {
        if (remove) {
            const tabIds = tabs.map(({ id }) => id!).filter(Boolean);
            await store.removeTabs(tabIds).catch(() => {
                const msg = `Failed to remove tabs: ${tabIds}`;
                toast.error(msg);
                console.error(msg);
            });
        }

        const withoutIds = tabs.map(({ id, windowId, ...t }) => t);

        SavedStore.saveTabs(withoutIds);
    },
    toggleAssignedTagId: (tagId: number) => {
        toggle(store.assignedTagIds, tagId);
    },
    clearAssignedTagIds: () => {
        store.assignedTagIds = proxySet();
    },
    setView(view: Partial<ActiveStore["view"]>) {
        store.view = { ...store.view, ...view };
    },
    updateFilter: (filter: Partial<Filter>) => {
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
            Object.entries(tabs).map(([windowId, tabs]) => {
                const sortedTabs = store.view.sort.dir === SortDir.Asc ? tabs : [...tabs].reverse();
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
        const duplicates = store.viewDuplicateTabIds;
        await store.removeTabs(Array.from(duplicates));
    },
    updateTab: async (tabId: number, options: chrome.tabs.UpdateProperties) => {
        await chrome.tabs.update(tabId, options);
    },
    moveTabsToNewWindow: async (tabIds: number[], incognito = false) => {
        await chrome.windows.create({
            url: tabIds.map((id) => store.viewTabsById[id]?.url).filter(Boolean),
            incognito,
        });

        await store.removeTabs(tabIds);
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
            const view = get(store).view;
            const filteredIds = get(store).filteredTabIds;
            const tabs = get(store.tabs).filter((t) => filteredIds.has(t.id));

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
    { proxy: store },
);

subscribe(store, (ops) => {
    const savedTabsUpdated = ops.filter((op) => op[1][0] === "tabs");

    if (savedTabsUpdated.length) {
        activeFuse.setCollection(store.tabs);
    }
});

store.initTabs();

export function useActiveTabStore() {
    return useSnapshot(store) as typeof store;
}

export function useIsTabSelected(tabId: number) {
    const [selected, setSelected] = useState(store.selectedTabIds.has(tabId));

    useEffect(() => {
        const callback = () => {
            setSelected(store.selectedTabIds.has(tabId));
        };
        const unsubscribe = subscribe(store, callback);
        callback();

        return unsubscribe;
    }, [tabId]);

    return selected;
}

export function usIsTabDuplicate(tabId: number) {
    const [duplicate, setSelected] = useState(store.viewDuplicateTabIds.has(tabId));

    useEffect(() => {
        const callback = () => {
            setSelected(store.viewDuplicateTabIds.has(tabId));
        };
        const unsubscribe = subscribe(store, callback);
        callback();

        return unsubscribe;
    }, [tabId]);

    return duplicate;
}

export default store;
