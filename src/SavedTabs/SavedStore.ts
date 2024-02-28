import { arrayMove } from "@dnd-kit/sortable";
import Fuse from "fuse.js";
import { useEffect, useState } from "react";
import { uuidv7 } from "uuidv7";
import { proxy, subscribe, useSnapshot } from "valtio";
import { derive, proxySet } from "valtio/utils";

import ChromeLocalStorage from "../ChromeLocalStorage";
import { version } from "../constants";
import { SavedTab } from "../models";
import TagStore, { unassignedTag } from "../TagStore";
import { toast } from "../ui/Toast";
import { canonicalizeURL } from "../util";
import { intersection, toggle } from "../util/set";
import { numberComparator, SortDir, stringComparator } from "../util/sort";

export interface Filter {
    tags: number[];
    keywords: string[];
}

export enum TabGrouping {
    All = "All",
    Tag = "Tag",
}

export enum TabSortProp {
    TagName = "TagName",
    Title = "Title",
    TagCount = "TagCount",
    TabCount = "TabCount",
}

const storageKey = `cmdtab-tab-store-${version}`;

export interface SavedStore {
    initialized: boolean;
    assignedTagIds: Set<number>;
    tabs: SavedTab[];
    selectedTabIds: Set<string>;
    view: {
        filter: Filter;
        grouping: TabGrouping;
        sort: {
            prop?: TabSortProp;
            dir: SortDir;
        };
    };
    filtersApplied: boolean;
    filteredTabIds: Set<string>;
    viewTabIds: string[];
    viewTabsById: Record<string, SavedTab>;
    filteredTabsByTagId: Record<number, string[]>;
    viewTagIds: number[];

    initStore(): Promise<void>;
    toggleAssignedTagId(tagId: number): void;
    clearAssignedTagIds(): void;
    setView(view: Partial<SavedStore["view"]>): void;
    updateFilter(filter: Partial<Filter>): void;
    clearFilter(): void;
    initStorage(): void;
    removeTab(tabId: string): void;
    removeTabs(tabIds: string[]): void;
    removeAllTabs(): void;
    removeTabTag(tabId: string, tagId: number): void;
    removeTags(tagIds: number[]): void;
    selectTabs(tabIds?: Set<string>): void;
    deselectAllTabs(): void;
    selectAllTabs(): void;
    reorderTabs(from: number, to: number): void;
    saveTabs(tabs: Omit<SavedTab, "id">[]): void;
    tagTabs(tabsIds: string[], tagIds: number[]): void;
    import(store: { tabs: SavedTab[] }): void;
}

type PersistedTabStore = Pick<SavedStore, "tabs" | "view">;
type ImportedTabStore = Partial<Pick<SavedStore, "tabs" | "view">>;

const store = proxy({
    initialized: false,
    assignedTagIds: proxySet<number>(),
    tabs: [] as SavedTab[],
    selectedTabIds: proxySet<string>(),
    view: proxy({
        filter: {
            tags: [] as number[],
            keywords: [] as string[],
        },
        grouping: TabGrouping.All,
        sort: {
            prop: undefined,
            dir: SortDir.Asc,
        },
    }),
    removeTab: (tabId: string) => {
        store.removeTabs([tabId]);
    },
    removeTabs: (tabIds: string[]) => {
        const idsSet = new Set(tabIds);
        store.tabs = store.tabs.filter((t) => !idsSet.has(t.id));
        for (const id of idsSet) {
            store.selectedTabIds.delete(id);
        }
    },
    removeAllTabs: () => {
        store.tabs = [];
        store.selectedTabIds = proxySet();
    },
    toggleSelected: (tabId: string) => {
        toggle(store.selectedTabIds, tabId);
    },
    selectTabs: (tabIds?: Set<string>) => {
        store.selectedTabIds = proxySet(tabIds || store.viewTabIds);
    },
    selectAllTabs: () => {
        store.selectedTabIds = proxySet(store.filteredTabIds);
    },
    deselectAllTabs: () => {
        store.selectedTabIds = proxySet();
    },
    tagTabs: (tabIds: string[], tagIds: number[]) => {
        const idSet = new Set(tabIds);
        for (const t of store.tabs) {
            if (idSet.has(t.id)) {
                t.tagIds = Array.from(new Set([...t.tagIds, ...tagIds])).filter(
                    (t) => t !== unassignedTag.id,
                );
                if (t.tagIds.length === 0) {
                    t.tagIds = [unassignedTag.id];
                }
            }
        }
    },
    toggleAssignedTagId: (tagId: number) => {
        toggle(store.assignedTagIds, tagId);
    },
    clearAssignedTagIds: () => {
        store.assignedTagIds = proxySet();
    },
    setView(view: Partial<SavedStore["view"]>) {
        store.view = { ...store.view, ...view };
    },
    updateFilter: (filter: Partial<Filter>) => {
        store.view.filter = { ...store.view.filter, ...filter };
    },
    clearFilter: () => {
        store.view.filter = { tags: [], keywords: [] };
    },
    removeTabTag: (tabId: string, tagId: number) => {
        const tab = store.tabs.find((t) => t.id === tabId);
        if (!tab) {
            return;
        }
        tab.tagIds = tab.tagIds.filter((t) => t !== tagId);
        if (tab.tagIds.length === 0) {
            tab.tagIds = [unassignedTag.id];
        }
    },
    removeTags: (tagIds: number[]) => {
        const tagIdsSet = new Set(tagIds);
        for (const tab of store.tabs) {
            tab.tagIds = tab.tagIds.filter((t) => !tagIdsSet.has(t));
            if (tab.tagIds.length === 0) {
                tab.tagIds = [unassignedTag.id];
            }
        }
    },
    reorderTabs: (from: number, to: number) => {
        store.tabs = arrayMove(store.tabs, from, to);
    },
    import: (imported: ImportedTabStore) => {
        const existingById = new Map(store.tabs.map((t) => [t.id, t]));
        const existingByURLs = new Map(store.tabs.map((t) => [canonicalizeURL(t.url), t]));

        const newTabs = [];
        for (const tab of imported?.tabs || []) {
            const canonicalUrl = canonicalizeURL(tab.url);
            if (existingById.has(tab.id) || existingByURLs.has(canonicalUrl)) {
                const t = existingById.get(tab.id) || existingByURLs.get(canonicalUrl)!;
                t.tagIds = Array.from(new Set([...t.tagIds, ...tab.tagIds]));
            } else {
                newTabs.push(tab);
            }
        }

        store.tabs.push(...newTabs);
    },
    saveTabs: (tabs: Omit<SavedTab, "id">[]) => {
        const existingByURLs = new Map(store.tabs.map((t) => [canonicalizeURL(t.url), t]));

        const newTabs = [];
        for (const tab of tabs || []) {
            const canonicalUrl = canonicalizeURL(tab.url);
            if (existingByURLs.has(canonicalUrl)) {
                const t = existingByURLs.get(canonicalUrl)!;
                t.tagIds = Array.from(new Set([...t.tagIds, ...tab.tagIds]));
            } else {
                newTabs.push(tab);
            }
        }

        store.tabs.push(...newTabs.map((t) => ({ ...t, id: uuidv7() }) as SavedTab));
    },
    initStore: async () => {
        let stored = await ChromeLocalStorage.getItem(storageKey);
        if (stored) {
            try {
                const init = JSON.parse(stored as string) as PersistedTabStore;
                store.tabs = init.tabs || [];
                store.view = { ...store.view, ...init.view };
            } catch (e) {
                toast.error("Failed to load tags from local storage");
                console.error(e);
            }
        }
        store.initialized = true;
    },
}) as unknown as SavedStore;

const fuseOptions = {
    useExtendedSearch: true,
    keys: ["title", { name: "url", weight: 2 }],
};

const savedFuse = new Fuse(store.tabs, fuseOptions);

export function filterTabs(tabs: SavedTab[], filter: Filter) {
    if (filter.keywords.length + filter.tags.length === 0) {
        return new Set<string>();
    }

    const allIds = new Set(tabs.map((t) => t.id));

    const fuseIds = filter.keywords.length
        ? new Set(
              savedFuse
                  .search(filter.keywords.map((kw) => kw.trim()).join(" "))
                  .map((r) => r.item.id),
          )
        : new Set(allIds);
    const tagIds = filter.tags.length
        ? new Set(
              tabs
                  .filter((t) => t.tagIds.some((tag) => filter.tags.includes(tag)))
                  .map((t) => t.id),
          )
        : new Set(allIds);

    return intersection(fuseIds, tagIds);
}

derive(
    {
        filtersApplied: (get) => {
            const filter = get(store).view.filter;
            return filter.keywords.length + filter.tags.length > 0;
        },
        filteredTabIds: (get) => {
            const view = get(store).view;
            const tabs = get(store).tabs;

            const allIds = new Set(tabs.map((t) => t.id));

            if (!get(store).filtersApplied) {
                return proxySet(allIds);
            }

            return proxySet(filterTabs(tabs, view.filter));
        },
        viewTabsById: (get) => {
            const filteredIds = get(store).filteredTabIds;
            const tabs = get(store).tabs.filter((t) => filteredIds.has(t.id));

            const ids: Record<string, SavedTab> = {};
            for (const t of tabs) {
                ids[t.id] = t;
            }

            return ids;
        },
        filteredTabsByTagId: (get) => {
            const filteredIds = get(store).filteredTabIds;
            const tabs = get(store).tabs.filter((t) => filteredIds.has(t.id));

            const ids: Record<number, string[]> = {};
            for (const t of tabs) {
                for (const tagId of t.tagIds) {
                    if (!ids[tagId]) {
                        ids[tagId] = [];
                    }
                    ids[tagId].push(t.id);
                }
            }

            return ids;
        },
        viewTagIds: (get) => {
            const filteredTagIds = get(store).filteredTabsByTagId;
            const ids = Array.from(Object.keys(filteredTagIds)).map((t) => Number(t));
            const sort = get(store).view.sort;
            const tags = get(TagStore.tags);

            if (sort.prop === TabSortProp.TagName) {
                ids.sort((a, b) => {
                    const tagA = tags.get(a);
                    const tagB = tags.get(b);
                    if (!tagA || !tagB) {
                        return 0;
                    }
                    return stringComparator(tagA.name, tagB.name, sort.dir);
                });
            } else if (sort.prop === TabSortProp.TabCount) {
                ids.sort((a, b) =>
                    numberComparator(filteredTagIds[a].length, filteredTagIds[b].length, sort.dir),
                );
            }

            return ids;
        },
        viewTabIds: (get) => {
            const view = get(store).view;
            const tabs = get(store).tabs;
            const filteredIds = get(store).filteredTabIds;

            const tabsById = Object.fromEntries(tabs.map((t) => [t.id, t]));

            const filtered = Array.from(filteredIds);

            let sorted = filtered;
            if (view.sort.prop === TabSortProp.Title) {
                sorted.sort((a, b) =>
                    stringComparator(tabsById[a].title, tabsById[b].title, view.sort.dir),
                );
            } else if (view.sort.prop === TabSortProp.TagCount) {
                sorted.sort((a, b) =>
                    numberComparator(
                        tabsById[a].tagIds.length,
                        tabsById[b].tagIds.length,
                        view.sort.dir,
                    ),
                );
            }

            return sorted;
        },
    },
    { proxy: store },
);

subscribe(store, (ops) => {
    const savedTabsUpdated = ops.filter((op) => op[1][0] === "tabs");

    if (savedTabsUpdated.length) {
        savedFuse.setCollection(store.tabs);
    }

    if (store.initialized) {
        ChromeLocalStorage.setItem(
            storageKey,
            JSON.stringify({ tabs: store.tabs, view: store.view }),
        );
    }
});

store.initStore();

export function useSavedTabStore() {
    return useSnapshot(store) as typeof store;
}

export function useIsTabSelected(tabId: string) {
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

export default store;
