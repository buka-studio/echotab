import { toast } from "@echotab/ui/Toast";
import Fuse from "fuse.js";
import { useEffect, useState } from "react";
import { uuidv7 } from "uuidv7";
import { proxy, subscribe, useSnapshot } from "valtio";
import { derive, proxySet } from "valtio/utils";

import { BookmarkStore } from ".";
import { version } from "../constants";
import { List, SavedTab } from "../models";
import TagStore, { unassignedTag } from "../TagStore";
import { pluralize } from "../util";
import ChromeLocalStorage from "../util/ChromeLocalStorage";
import { getUtcISO } from "../util/date";
import { intersection, toggle } from "../util/set";
import { numberComparator, SortDir, stringComparator } from "../util/sort";
import { canonicalizeURL } from "../util/url";

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
  SavedAt = "SavedAt",
}

const storageKey = `cmdtab-tab-store-${version}`;

export const SelectionStore = proxy({
  selectedItemIds: proxySet<string>(),
  toggleSelected: (tabId: string) => {
    toggle(SelectionStore.selectedItemIds, tabId);
  },
  selectItems: (tabIds?: Set<string>) => {
    SelectionStore.selectedItemIds = proxySet(tabIds || Store.viewTabIds);
  },
  selectAllTabs: () => {
    SelectionStore.selectedItemIds = proxySet(Store.filteredTabIds);
  },
  deselectAllTabs: () => {
    SelectionStore.selectedItemIds = proxySet();
  },
});

export interface BookmarkStore {
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
  pinnedTabs: SavedTab[];

  lists: List[];
  upsertList: (list?: Partial<List>) => List;
  removeList: (listId: string) => void;
  removeLists: (listIds: string[]) => void;

  initStore(): Promise<void>;
  toggleAssignedTagId(tagId: number): void;
  clearAssignedTagIds(): void;
  setView(view: Partial<BookmarkStore["view"]>): void;
  updateFilter(filter: Partial<Filter>): void;
  clearFilter(): void;
  initStorage(): void;
  removeTab(tabId: string): void;
  removeTabs(tabIds: string[]): void;
  removeAllItems(): void;
  removeTabTag(tabId: string, tagId: number): void;
  removeTabsTag(tabIds: string[], tagId: number): void;
  removeTabTags(tabId: string, tagIds: number[]): void;
  removeTags(tagIds: number[]): void;
  saveTabs(tabs: Omit<SavedTab, "id" | "savedAt">[]): SavedTab[];
  tagTabs(tabsIds: string[], tagIds: number[]): void;
  togglePinTab(tabId: string): void;
  pinTabs(tabIds: string[]): void;
  import(store: { tabs: SavedTab[] }): void;
}

type PersistedTabStore = Pick<BookmarkStore, "tabs" | "lists" | "view">;
type ImportedTabStore = Partial<Pick<BookmarkStore, "tabs" | "view">>;

const Store = proxy({
  initialized: false,
  assignedTagIds: proxySet<number>(),
  tabs: [] as SavedTab[],
  lists: [] as List[],
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
  upsertList: (list?: List) => {
    if (list) {
      const existingIndex = Store.lists.findIndex((n) => n.id === list.id);
      if (existingIndex !== -1) {
        const existing = Store.lists[existingIndex];
        const updated = Object.assign(existing, { ...list, updatedAt: getUtcISO() });
        Store.lists.splice(existingIndex, 1, updated);

        return updated;
      } else {
        const newList = {
          ...list,
          id: uuidv7(),
          savedAt: getUtcISO(),
          updatedAt: getUtcISO(),
        };
        Store.lists.push(newList);

        return newList;
      }
    }
  },
  removeList: (listId: string) => {
    Store.removeLists([listId]);
  },
  removeLists: (listIds: string[]) => {
    const idsSet = new Set(listIds);
    Store.lists = Store.lists.filter((l) => !idsSet.has(l.id));
  },
  removeTab: (tabId: string) => {
    Store.removeTabs([tabId]);
  },
  removeTabs: (tabIds: string[]) => {
    const idsSet = new Set(tabIds);
    const removedTabs = Store.tabs.filter((t) => idsSet.has(t.id));

    Store.tabs = Store.tabs.filter((t) => !idsSet.has(t.id));
    for (const id of idsSet) {
      SelectionStore.selectedItemIds.delete(id);
    }

    toast.success(`Deleted ${pluralize(tabIds.length, "tab")}`, {
      action: {
        label: "Undo",
        onClick: () => {
          Store.tabs.push(...removedTabs);
        },
      },
    });
  },
  removeAllItems: () => {
    Store.tabs = [];
    Store.lists = [];
    SelectionStore.selectedItemIds = proxySet();
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
  setView(view: Partial<BookmarkStore["view"]>) {
    Store.view = { ...Store.view, ...view };
  },
  updateFilter: (filter: Partial<Filter>) => {
    Store.view.filter = { ...Store.view.filter, ...filter };
  },
  clearFilter: () => {
    Store.view.filter = { tags: [], keywords: [] };
  },
  removeTabTags: (tabId: string, tagIds: number[]) => {
    const tab = Store.tabs.find((t) => t.id === tabId);
    if (!tab) {
      return;
    }
    tab.tagIds = tab.tagIds.filter((t) => !tagIds.includes(t));
    if (tab.tagIds.length === 0) {
      tab.tagIds = [unassignedTag.id];
    }
  },
  removeTabsTag: (tabIds: string[], tagId: number) => {
    if (!tabIds.length) {
      return;
    }
    const tabIdsSet = new Set(tabIds);
    for (const tab of Store.tabs) {
      if (tabIdsSet.has(tab.id)) {
        tab.tagIds = tab.tagIds.filter((t) => t !== tagId);
        if (tab.tagIds.length === 0) {
          tab.tagIds = [unassignedTag.id];
        }
      }
    }
  },
  removeTabTag: (tabId: string, tagId: number) => {
    BookmarkStore.removeTabTags(tabId, [tagId]);
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
  togglePinTab: (tabId: string) => {
    const tab = Store.tabs.find((t) => t.id === tabId);
    if (!tab) {
      return;
    }
    tab.pinned = !tab.pinned;
  },
  pinTabs: (tabIds: string[]) => {
    const idSet = new Set(tabIds);
    const tabs = Store.tabs.filter((t) => idSet.has(t.id));

    for (const tab of tabs) {
      tab.pinned = true;
    }
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
        if (t.tagIds.includes(unassignedTag.id) && t.tagIds.length > 1) {
          t.tagIds = t.tagIds.filter((t) => t !== unassignedTag.id);
        }
      } else {
        newTabs.push(tab);
      }
    }

    const savedTabs = newTabs.map(
      (t) => ({ ...t, id: uuidv7(), savedAt: getUtcISO() }) as SavedTab,
    );

    Store.tabs.push(...savedTabs);

    return savedTabs;
  },
  initStore: async () => {
    let stored = await ChromeLocalStorage.getItem(storageKey);
    if (stored) {
      try {
        const init = JSON.parse(stored as string) as PersistedTabStore;

        // repair on init
        // todo: figure out why sometimes tags are missing
        const tabs = (init.tabs || []).map((t) => {
          const validTags = t.tagIds.filter((tagId) => TagStore.tags.has(tagId));
          t.tagIds = validTags;
          if (!t.tagIds.length) {
            t.tagIds = [unassignedTag.id];
          }
          return t;
        });
        Store.tabs = tabs;
        Store.lists = init.lists || [];

        Store.view = { ...Store.view, ...init.view };
      } catch (e) {
        toast.error("Failed to load tags from local storage");
        console.error(e);
      }
    }
    Store.initialized = true;
  },
}) as unknown as BookmarkStore;

const fuseOptions = {
  useExtendedSearch: true,
  keys: [{ name: "title", weight: 2 }, "url"],
};

const savedFuse = new Fuse(Store.tabs || [], fuseOptions);

export function filterTabs(tabs: SavedTab[], filter: Filter) {
  if (filter.keywords.length + filter.tags.length === 0) {
    return new Set<string>();
  }

  const allIds = new Set(tabs.filter((t) => !t.pinned).map((t) => t.id));

  const fuseIds = filter.keywords.length
    ? new Set(
        savedFuse.search(filter.keywords.map((kw) => kw.trim()).join(" ")).map((r) => r.item.id),
      )
    : new Set(allIds);

  const tagIds = filter.tags.length
    ? new Set(
        tabs.filter((t) => t.tagIds.some((tag) => filter.tags.includes(tag))).map((t) => t.id),
      )
    : new Set(allIds);

  return intersection(fuseIds, tagIds);
}

derive(
  {
    items: (get) => {
      const tabs = get(Store).tabs;
      const notes = get(Store).lists;

      return [...tabs, ...notes];
    },
    filtersApplied: (get) => {
      const filter = get(Store).view.filter;
      return filter.keywords.length + filter.tags.length > 0;
    },
    filteredTabIds: (get) => {
      const view = get(Store).view;
      const tabs = get(Store).tabs;

      const allIds = new Set(tabs.filter((t) => !t.pinned).map((t) => t.id));

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

      // keep favorites at the top
      ids.sort((a, b) => Number(tags.get(b)?.favorite) - Number(tags.get(a)?.favorite));

      return ids;
    },
    viewTabIds: (get) => {
      const view = get(Store).view;
      const items = get(Store).tabs;
      const filteredIds = get(Store).filteredTabIds;

      const tabsById = Object.fromEntries(items.map((t) => [t.id, t]));

      const filtered = Array.from(filteredIds);

      let sorted = filtered;
      if (view.sort.prop === TabSortProp.Title) {
        sorted.sort((a, b) =>
          stringComparator(tabsById[a].title, tabsById[b].title, view.sort.dir),
        );
      } else if (view.sort.prop === TabSortProp.TagCount) {
        sorted.sort((a, b) =>
          numberComparator(tabsById[a].tagIds.length, tabsById[b].tagIds.length, view.sort.dir),
        );
      } else if (view.sort.prop === TabSortProp.SavedAt) {
        sorted.sort((a, b) =>
          numberComparator(
            new Date(tabsById[a].savedAt).getTime(),
            new Date(tabsById[b].savedAt).getTime(),
            view.sort.dir,
          ),
        );
      }

      return sorted;
    },
    pinnedTabs: (get) => {
      return get(Store).tabs.filter((t) => t.pinned);
    },
  },
  { proxy: Store },
);

subscribe(Store, (ops) => {
  const tabsUpdated = ops.filter((op) => op[1][0] === "tabs");

  if (tabsUpdated.length) {
    savedFuse.setCollection(Store.tabs);
    // reconcile lists
  }

  if (Store.initialized) {
    ChromeLocalStorage.setItem(
      storageKey,
      JSON.stringify({
        tabs: Store.tabs,
        lists: Store.lists,
        view: Store.view,
      }),
    );
  }
});

export function useBookmarkStore() {
  return useSnapshot(Store) as typeof Store;
}

export function useBookmarkSelectionStore() {
  return useSnapshot(SelectionStore);
}

export function useIsTabSelected(tabId: string) {
  const [selected, setSelected] = useState(SelectionStore.selectedItemIds.has(tabId));

  useEffect(() => {
    const callback = () => {
      setSelected(SelectionStore.selectedItemIds.has(tabId));
    };
    const unsubscribe = subscribe(SelectionStore, callback);
    callback();

    return unsubscribe;
  }, [tabId]);

  return selected;
}

export default Store;
