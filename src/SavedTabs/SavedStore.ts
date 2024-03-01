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

export const SelectionStore = proxy({
    selectedTabIds: proxySet<string>(),
    toggleSelected: (tabId: string) => {
        toggle(SelectionStore.selectedTabIds, tabId);
    },
    selectTabs: (tabIds?: Set<string>) => {
        SelectionStore.selectedTabIds = proxySet(tabIds || Store.viewTabIds);
    },
    selectAllTabs: () => {
        SelectionStore.selectedTabIds = proxySet(Store.filteredTabIds);
    },
    deselectAllTabs: () => {
        SelectionStore.selectedTabIds = proxySet();
    },
});

export interface SavedStore {
    initialized: boolean;
    assignedTagIds: Set<number>;
    tabs: SavedTab[];
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
    reorderTabs(from: number, to: number): void;
    saveTabs(tabs: Omit<SavedTab, "id">[]): void;
    tagTabs(tabsIds: string[], tagIds: number[]): void;
    import(store: { tabs: SavedTab[] }): void;
}

type PersistedTabStore = Pick<SavedStore, "tabs" | "view">;
type ImportedTabStore = Partial<Pick<SavedStore, "tabs" | "view">>;

const Store = proxy({
    initialized: false,
    assignedTagIds: proxySet<number>(),
    tabs: [] as SavedTab[],
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
        Store.removeTabs([tabId]);
    },
    removeTabs: (tabIds: string[]) => {
        const idsSet = new Set(tabIds);
        Store.tabs = Store.tabs.filter((t) => !idsSet.has(t.id));
        for (const id of idsSet) {
            SelectionStore.selectedTabIds.delete(id);
        }
    },
    removeAllTabs: () => {
        Store.tabs = [];
        SelectionStore.selectedTabIds = proxySet();
    },
    tagTabs: (tabIds: string[], tagIds: number[]) => {
        const idSet = new Set(tabIds);
        for (const t of Store.tabs) {
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
        toggle(Store.assignedTagIds, tagId);
    },
    clearAssignedTagIds: () => {
        Store.assignedTagIds = proxySet();
    },
    setView(view: Partial<SavedStore["view"]>) {
        Store.view = { ...Store.view, ...view };
    },
    updateFilter: (filter: Partial<Filter>) => {
        Store.view.filter = { ...Store.view.filter, ...filter };
    },
    clearFilter: () => {
        Store.view.filter = { tags: [], keywords: [] };
    },
    removeTabTag: (tabId: string, tagId: number) => {
        const tab = Store.tabs.find((t) => t.id === tabId);
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
        for (const tab of Store.tabs) {
            tab.tagIds = tab.tagIds.filter((t) => !tagIdsSet.has(t));
            if (tab.tagIds.length === 0) {
                tab.tagIds = [unassignedTag.id];
            }
        }
    },
    reorderTabs: (from: number, to: number) => {
        Store.tabs = arrayMove(Store.tabs, from, to);
    },
    import: (imported: ImportedTabStore) => {
        const existingById = new Map(Store.tabs.map((t) => [t.id, t]));
        const existingByURLs = new Map(Store.tabs.map((t) => [canonicalizeURL(t.url), t]));

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

        Store.tabs.push(...newTabs);
    },
    saveTabs: (tabs: Omit<SavedTab, "id">[]) => {
        const existingByURLs = new Map(Store.tabs.map((t) => [canonicalizeURL(t.url), t]));

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

        Store.tabs.push(...newTabs.map((t) => ({ ...t, id: uuidv7() }) as SavedTab));
    },
    initStore: async () => {
        let stored = await ChromeLocalStorage.getItem(storageKey);
        if (stored) {
            try {
                const init = JSON.parse(stored as string) as PersistedTabStore;
                Store.tabs = init.tabs || [];
                Store.view = { ...Store.view, ...init.view };
            } catch (e) {
                toast.error("Failed to load tags from local storage");
                console.error(e);
            }
        }
        Store.initialized = true;
    },
}) as unknown as SavedStore;

const fuseOptions = {
    useExtendedSearch: true,
    keys: ["title", { name: "url", weight: 2 }],
};

const savedFuse = new Fuse(Store.tabs, fuseOptions);

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
            const filter = get(Store).view.filter;
            return filter.keywords.length + filter.tags.length > 0;
        },
        filteredTabIds: (get) => {
            const view = get(Store).view;
            const tabs = get(Store).tabs;

            const allIds = new Set(tabs.map((t) => t.id));

            if (!get(Store).filtersApplied) {
                return proxySet(allIds);
            }

            return proxySet(filterTabs(tabs, view.filter));
        },
        viewTabsById: (get) => {
            const filteredIds = get(Store).filteredTabIds;
            const tabs = get(Store).tabs.filter((t) => filteredIds.has(t.id));

            const ids: Record<string, SavedTab> = {};
            for (const t of tabs) {
                ids[t.id] = t;
            }

            return ids;
        },
        filteredTabsByTagId: (get) => {
            const filteredIds = get(Store).filteredTabIds;
            const tabs = get(Store).tabs.filter((t) => filteredIds.has(t.id));

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
            const filteredTagIds = get(Store).filteredTabsByTagId;
            const ids = Array.from(Object.keys(filteredTagIds)).map((t) => Number(t));
            const sort = get(Store).view.sort;
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
            const view = get(Store).view;
            const tabs = get(Store).tabs;
            const filteredIds = get(Store).filteredTabIds;

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
    { proxy: Store },
);

subscribe(Store, (ops) => {
    const savedTabsUpdated = ops.filter((op) => op[1][0] === "tabs");

    if (savedTabsUpdated.length) {
        savedFuse.setCollection(Store.tabs);
    }

    if (Store.initialized) {
        ChromeLocalStorage.setItem(
            storageKey,
            JSON.stringify({ tabs: Store.tabs, view: Store.view }),
        );
    }
});

Store.initStore();

export function useSavedTabStore() {
    return useSnapshot(Store) as typeof Store;
}

export function useSavedSelectionStore() {
    return useSnapshot(SelectionStore);
}

export function useIsTabSelected(tabId: string) {
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

export default Store;
