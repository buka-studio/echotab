import { toast } from "@echotab/ui/Toast";
import Fuse from "fuse.js";
import { memoize } from "proxy-memoize";
import { uuidv7 } from "uuidv7";
import { proxy, subscribe, useSnapshot } from "valtio";
import { proxySet } from "valtio/utils";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { getUtcISO } from "~/util/date";
import { intersection, toggle } from "~/util/set";
import { numberComparator, SortDir, stringComparator } from "~/util/sort";
import { pluralize } from "~/util/string";
import { canonicalizeURL } from "~/util/url";

import { StoragePersistence } from "./persistence";
import { List, SavedTab } from "./schema";
import { deleteTag, unassignedTag, useTagStore } from "./tagStore";

export interface Filter {
  tags: number[];
  keywords: string[];
  looseMatch: boolean;
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

export interface BookmarkView {
  filter: Filter;
  grouping: TabGrouping;
  sort: {
    prop: TabSortProp | undefined;
    dir: SortDir;
  };
}

export interface BookmarkStore {
  tabs: SavedTab[];
  lists: List[];
  assignedTagIds: Set<number>;
  initialized: boolean;
}

const persistence = new StoragePersistence<{
  tabs: SavedTab[];
  lists: List[];
}>({ key: "echotab-bookmark-store" });

const fuseOptions = {
  useExtendedSearch: true,
  keys: [{ name: "title", weight: 2 }, "url"],
};

const bookmarkFuse = new Fuse([] as SavedTab[], fuseOptions);

export const useBookmarkStore = create(
  subscribeWithSelector(() => ({
    tabs: [] as SavedTab[],
    lists: [] as List[],
    initialized: false,
  })),
);

export const useBookmarkViewStore = create(
  subscribeWithSelector(() => ({
    filter: {
      tags: [] as number[],
      keywords: [] as string[],
      looseMatch: false,
    },
    grouping: TabGrouping.Tag,
    sort: {
      prop: undefined as TabSortProp | undefined,
      dir: SortDir.Asc,
    },
  })),
);

export const SelectionStore = proxy({
  selectedTabIds: proxySet<string>(),
});

const toggleSelected = (tabId: string) => {
  toggle(SelectionStore.selectedTabIds, tabId);
};

const selectTabs = (tabIds?: Set<string>) => {
  SelectionStore.selectedTabIds = proxySet(tabIds);
};

const selectAllTabs = () => {
  SelectionStore.selectedTabIds = proxySet(
    getFilteredTabIds(useBookmarkStore.getState().tabs, useBookmarkViewStore.getState().filter),
  );
};

const deselectAllTabs = () => {
  SelectionStore.selectedTabIds = proxySet();
};

export const initStore = async () => {
  const stored = await persistence.load();
  if (stored) {
    const deserializedTabs = deserializeTabs(stored.tabs);
    useBookmarkStore.setState({
      tabs: deserializedTabs,
      lists: stored.lists ?? [],
    });
    bookmarkFuse.setCollection(deserializedTabs);
  }

  persistence.subscribe((data) => {
    const deserializedTabs = deserializeTabs(data.tabs);
    useBookmarkStore.setState({
      tabs: deserializedTabs,
      lists: data.lists ?? [],
    });
    bookmarkFuse.setCollection(deserializedTabs);
  });

  useBookmarkStore.setState({ initialized: true });
};

const deserializeTabs = (tabs: SavedTab[]): SavedTab[] => {
  const tagStore = useTagStore.getState();
  const tagIds = new Set(tagStore.tags.map((t) => t.id));

  return (tabs || []).map((t) => {
    const validTags = t.tagIds.filter((tagId) => tagIds.has(tagId));
    t.tagIds = validTags;
    if (!t.tagIds.length) {
      t.tagIds = [unassignedTag.id];
    }
    return t;
  });
};

useBookmarkStore.subscribe(
  (store) => store.tabs,
  (tabs) => {
    bookmarkFuse.setCollection(tabs);
  },
);

useBookmarkStore.subscribe((store) => {
  if (store.initialized) {
    persistence.save({
      tabs: store.tabs,
      lists: store.lists,
    });
  }
});

export const generateId = () => uuidv7();

export function filterTabs(tabs: SavedTab[], filter: Filter): Set<string> {
  if (filter.keywords.length + filter.tags.length === 0) {
    return new Set<string>();
  }

  const allIds = new Set(tabs.filter((t) => !t.pinned).map((t) => t.id));
  const extendedPrefix = filter.looseMatch ? "" : "'";

  const fuseIds = filter.keywords.length
    ? new Set(
        bookmarkFuse
          .search(`${extendedPrefix}${filter.keywords.map((kw) => kw.trim()).join(" ")}`)
          .map((r) => r.item.id),
      )
    : new Set(allIds);

  const tagIds = filter.tags.length
    ? new Set(
        tabs.filter((t) => t.tagIds.some((tag) => filter.tags.includes(tag))).map((t) => t.id),
      )
    : new Set(allIds);

  return intersection(fuseIds, tagIds);
}

export const saveTabs = (
  tabs: Array<Omit<SavedTab, "id" | "savedAt"> & { id?: string }>,
): SavedTab[] => {
  const state = useBookmarkStore.getState();
  const existingByURLs = new Map(state.tabs.map((t) => [canonicalizeURL(t.url), t]));

  const newTabs: SavedTab[] = [];
  const updatedTabs = [...state.tabs];

  for (const tab of tabs || []) {
    const canonicalUrl = canonicalizeURL(tab.url);
    const existing = existingByURLs.get(canonicalUrl);

    if (existing) {
      const existingIndex = updatedTabs.findIndex((t) => t.id === existing.id);
      if (existingIndex !== -1) {
        const merged = {
          ...existing,
          tagIds: Array.from(new Set([...existing.tagIds, ...tab.tagIds])),
        };
        if (merged.tagIds.includes(unassignedTag.id) && merged.tagIds.length > 1) {
          merged.tagIds = merged.tagIds.filter((t) => t !== unassignedTag.id);
        }
        updatedTabs[existingIndex] = merged;
      }
    } else {
      const savedTab = {
        ...tab,
        id: tab.id || generateId(),
        savedAt: getUtcISO(),
      } as SavedTab;
      newTabs.push(savedTab);
    }
  }

  useBookmarkStore.setState({ tabs: [...updatedTabs, ...newTabs] });
  return newTabs;
};

export const updateTabs = (tabIds: string[], updates: Partial<SavedTab>) => {
  const tabIdsSet = new Set(tabIds);
  useBookmarkStore.setState((state) => ({
    tabs: state.tabs.map((tab) => (tabIdsSet.has(tab.id) ? { ...tab, ...updates } : tab)),
  }));
};

export const updateTab = (tabId: string, updates: Partial<SavedTab>) => {
  useBookmarkStore.setState((state) => ({
    tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)),
  }));
};

export const removeTab = (tabId: string) => {
  removeTabs([tabId]);
};

export const removeTabs = (tabIds: string[]) => {
  const idsSet = new Set(tabIds);
  const state = useBookmarkStore.getState();
  const removedTabs = state.tabs.filter((t) => idsSet.has(t.id));

  useBookmarkStore.setState((state) => ({
    tabs: state.tabs.filter((t) => !idsSet.has(t.id)),
  }));

  // Remove from selection
  const selectedTabIds = new Set(SelectionStore.selectedTabIds);
  for (const id of idsSet) {
    selectedTabIds.delete(id);
  }
  SelectionStore.selectedTabIds = proxySet(selectedTabIds);

  toast.success(`${pluralize(tabIds.length, "tab")} deleted`, {
    action: {
      label: "Undo",
      onClick: () => {
        useBookmarkStore.setState((state) => ({
          tabs: [...state.tabs, ...removedTabs],
        }));
      },
    },
  });
};

export const removeAllItems = () => {
  useBookmarkStore.setState({ tabs: [], lists: [] });
  SelectionStore.selectedTabIds = proxySet();
};

export const togglePinTab = (tabId: string) => {
  useBookmarkStore.setState((state) => ({
    tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, pinned: !t.pinned } : t)),
  }));
};

export const pinTabs = (tabIds: string[]) => {
  const idSet = new Set(tabIds);
  useBookmarkStore.setState((state) => ({
    tabs: state.tabs.map((t) => (idSet.has(t.id) ? { ...t, pinned: true } : t)),
  }));
};

export const tagTabs = (tabIds: string[], tagIds: number[], force = false) => {
  const idSet = new Set(tabIds);
  useBookmarkStore.setState((state) => ({
    tabs: state.tabs.map((t) => {
      if (!idSet.has(t.id)) return t;

      const newTagIds = (force ? tagIds : Array.from(new Set([...t.tagIds, ...tagIds]))).filter(
        (tagId) => tagId !== unassignedTag.id,
      );

      return {
        ...t,
        tagIds: newTagIds.length === 0 ? [unassignedTag.id] : newTagIds,
      };
    }),
  }));

  cleanupQuickTags();
};

export const removeTabTag = (tabId: string, tagId: number) => {
  removeTabTags(tabId, [tagId]);
};

export const removeTabTags = (tabId: string, tagIds: number[]) => {
  useBookmarkStore.setState((state) => ({
    tabs: state.tabs.map((t) => {
      if (t.id !== tabId) return t;
      const newTagIds = t.tagIds.filter((tagId) => !tagIds.includes(tagId));
      return {
        ...t,
        tagIds: newTagIds.length === 0 ? [unassignedTag.id] : newTagIds,
      };
    }),
  }));
};

export const removeTabsTag = (tabIds: string[], tagId: number) => {
  if (!tabIds.length) return;

  const tabIdsSet = new Set(tabIds);
  useBookmarkStore.setState((state) => ({
    tabs: state.tabs.map((t) => {
      if (!tabIdsSet.has(t.id)) return t;
      const newTagIds = t.tagIds.filter((id) => id !== tagId);
      return {
        ...t,
        tagIds: newTagIds.length === 0 ? [unassignedTag.id] : newTagIds,
      };
    }),
  }));
};

export const removeTags = (tagIds: number[]) => {
  const tagIdsSet = new Set(tagIds);
  useBookmarkStore.setState((state) => ({
    tabs: state.tabs.map((t) => {
      const newTagIds = t.tagIds.filter((tagId) => !tagIdsSet.has(tagId));
      return {
        ...t,
        tagIds: newTagIds.length === 0 ? [unassignedTag.id] : newTagIds,
      };
    }),
  }));
};

export const cleanupQuickTags = () => {
  const tagStore = useTagStore.getState();
  const { tabs } = useBookmarkStore.getState();

  const quickTags = new Set(tagStore.tags.filter((t) => t.isQuick).map((t) => t.id));
  const usedQuickTags = new Set<number>();

  for (const t of tabs) {
    for (const tagId of t.tagIds) {
      if (quickTags.has(tagId)) {
        usedQuickTags.add(tagId);
      }
    }
  }

  for (const tagId of quickTags) {
    if (!usedQuickTags.has(tagId)) {
      deleteTag(tagId);
    }
  }
};

export const setView = (view: Partial<BookmarkView>) => {
  useBookmarkViewStore.setState(view);
};

export const updateFilter = (filter: Partial<Filter>) => {
  useBookmarkViewStore.setState((state) => {
    const wipFilter = { ...filter };
    if (wipFilter.keywords?.length === 0) {
      wipFilter.looseMatch = false;
    }
    return {
      filter: { ...state.filter, ...wipFilter },
    };
  });
};

export const clearFilter = () => {
  useBookmarkViewStore.setState({
    filter: { tags: [], keywords: [], looseMatch: false },
  });
};

export const upsertList = (list?: Partial<List>): List | undefined => {
  if (!list) return undefined;

  const state = useBookmarkStore.getState();
  const existingIndex = state.lists.findIndex((l) => l.id === list.id);

  if (existingIndex !== -1) {
    const existing = state.lists[existingIndex];
    const updated = { ...existing, ...list, updatedAt: getUtcISO() } as List;

    useBookmarkStore.setState((state) => ({
      lists: state.lists.map((l, i) => (i === existingIndex ? updated : l)),
    }));

    return updated;
  } else {
    const newList: List = {
      id: generateId(),
      title: list.title || "",
      content: list.content || "",
      tabIds: list.tabIds || [],
      savedAt: getUtcISO(),
      updatedAt: getUtcISO(),
      publicId: list.publicId || undefined,
      published: list.published || false,
      ...list,
    };

    useBookmarkStore.setState((state) => ({
      lists: [...state.lists, newList],
    }));

    return newList;
  }
};

export const removeList = (listId: string) => {
  removeLists([listId]);
};

export const removeLists = (listIds: string[]) => {
  const idsSet = new Set(listIds);
  useBookmarkStore.setState((state) => ({
    lists: state.lists.filter((l) => !idsSet.has(l.id)),
  }));
};

export const importBookmarks = (imported: { tabs?: SavedTab[] }) => {
  const state = useBookmarkStore.getState();
  const existingById = new Map(state.tabs.map((t) => [t.id, t]));
  const existingByURLs = new Map(state.tabs.map((t) => [canonicalizeURL(t.url), t]));

  const newTabs: SavedTab[] = [];
  const updatedTabs = [...state.tabs];

  for (const tab of imported?.tabs || []) {
    const canonicalUrl = canonicalizeURL(tab.url);
    const existing = existingById.get(tab.id) || existingByURLs.get(canonicalUrl);

    if (existing) {
      const existingIndex = updatedTabs.findIndex((t) => t.id === existing.id);
      if (existingIndex !== -1) {
        updatedTabs[existingIndex] = {
          ...existing,
          tagIds: Array.from(new Set([...existing.tagIds, ...tab.tagIds])),
        };
      }
    } else {
      newTabs.push(tab);
    }
  }

  useBookmarkStore.setState({ tabs: [...updatedTabs, ...newTabs] });
};

export const useFiltersApplied = () => {
  const filter = useBookmarkViewStore((state) => state.filter);
  return filter.keywords.length + filter.tags.length > 0;
};

const getFiltersApplied = (filter: Filter) => {
  return filter.keywords.length + filter.tags.length > 0;
};

const getFilteredTabIds = (tabs: SavedTab[], filter: Filter) => {
  const filtersApplied = getFiltersApplied(filter);
  const allIds = new Set(tabs.filter((t) => !t.pinned).map((t) => t.id));

  if (!filtersApplied) {
    return allIds;
  }

  return filterTabs(tabs, filter);
};

type Tag = ReturnType<typeof useTagStore.getState>["tags"][number];

const selectFilteredTabIds = memoize((state: { tabs: SavedTab[]; filter: Filter }): Set<string> => {
  return getFilteredTabIds(state.tabs, state.filter);
});

const selectTabsById = memoize(
  (state: { tabs: SavedTab[]; filteredIds: Set<string> }): Record<string, SavedTab> => {
    const { tabs, filteredIds } = state;
    const filtered = tabs.filter((t) => filteredIds.has(t.id));
    const result: Record<string, SavedTab> = {};
    for (const t of filtered) {
      result[t.id] = t;
    }
    return result;
  },
);

const selectFilteredTabsByTagId = memoize(
  (state: { tabs: SavedTab[]; filteredIds: Set<string> }): Record<number, string[]> => {
    const { tabs, filteredIds } = state;
    const filtered = tabs.filter((t) => filteredIds.has(t.id));
    const result: Record<number, string[]> = {};

    for (const t of filtered) {
      for (const tagId of t.tagIds) {
        if (!result[tagId]) {
          result[tagId] = [];
        }
        result[tagId].push(t.id);
      }
    }

    return result;
  },
);

const selectViewTagIds = memoize(
  (state: {
    filteredTabsByTagId: Record<number, string[]>;
    sort: { prop: TabSortProp | undefined; dir: SortDir };
    tags: Tag[];
  }): number[] => {
    const { filteredTabsByTagId, sort, tags } = state;
    const ids = Object.keys(filteredTabsByTagId).map(Number);
    const tagsById = new Map(tags.map((t) => [t.id, t]));

    if (sort.prop === TabSortProp.TagName) {
      ids.sort((a, b) => {
        const tagA = tagsById.get(a);
        const tagB = tagsById.get(b);
        if (!tagA || !tagB) return 0;
        return stringComparator(tagA.name, tagB.name, sort.dir);
      });
    } else if (sort.prop === TabSortProp.TabCount) {
      ids.sort((a, b) =>
        numberComparator(
          filteredTabsByTagId[a]?.length ?? 0,
          filteredTabsByTagId[b]?.length ?? 0,
          sort.dir,
        ),
      );
    }

    ids.sort((a, b) => Number(tagsById.get(b)?.favorite) - Number(tagsById.get(a)?.favorite));

    return ids;
  },
);

const selectViewTabIds = memoize(
  (state: {
    tabs: SavedTab[];
    filteredIds: Set<string>;
    sort: { prop: TabSortProp | undefined; dir: SortDir };
  }): string[] => {
    const { tabs, filteredIds, sort } = state;
    const tabsById = new Map(tabs.map((t) => [t.id, t]));
    const filtered = Array.from(filteredIds);

    if (sort.prop === TabSortProp.Title) {
      filtered.sort((a, b) =>
        stringComparator(tabsById.get(a)!.title, tabsById.get(b)!.title, sort.dir),
      );
    } else if (sort.prop === TabSortProp.TagCount) {
      filtered.sort((a, b) =>
        numberComparator(tabsById.get(a)!.tagIds.length, tabsById.get(b)!.tagIds.length, sort.dir),
      );
    } else if (sort.prop === TabSortProp.SavedAt) {
      filtered.sort((a, b) =>
        numberComparator(
          new Date(tabsById.get(a)!.savedAt).getTime(),
          new Date(tabsById.get(b)!.savedAt).getTime(),
          sort.dir,
        ),
      );
    }

    return filtered;
  },
);

export const getUnusedTagIds = (): number[] => {
  const tabs = useBookmarkStore.getState().tabs;
  const allTagIds = useTagStore.getState().tags.map((t) => t.id);
  const usedTagIds = new Set(tabs.flatMap((t) => t.tagIds));

  return allTagIds.filter((id) => id !== unassignedTag.id && !usedTagIds.has(id));
};

const selectPinnedTabs = memoize((state: { tabs: SavedTab[] }): SavedTab[] => {
  return state.tabs.filter((t) => t.pinned);
});

const selectItems = memoize((state: { tabs: SavedTab[]; lists: List[] }): (SavedTab | List)[] => {
  return [...state.tabs, ...state.lists];
});

export const useFilteredTabIds = () => {
  const tabs = useBookmarkStore((state) => state.tabs);
  const filter = useBookmarkViewStore((state) => state.filter);
  return selectFilteredTabIds({ tabs, filter });
};

export const useViewTabsById = () => {
  const tabs = useBookmarkStore((state) => state.tabs);
  const filteredIds = useFilteredTabIds();
  return selectTabsById({ tabs, filteredIds });
};

export const useFilteredTabsByTagId = () => {
  const tabs = useBookmarkStore((state) => state.tabs);
  const filteredIds = useFilteredTabIds();
  return selectFilteredTabsByTagId({ tabs, filteredIds });
};

export const useViewTagIds = () => {
  const filteredTabsByTagId = useFilteredTabsByTagId();
  const sort = useBookmarkViewStore((state) => state.sort);
  const tags = useTagStore((state) => state.tags);
  return selectViewTagIds({ filteredTabsByTagId, sort, tags });
};

export const useViewTabIds = () => {
  const tabs = useBookmarkStore((state) => state.tabs);
  const sort = useBookmarkViewStore((state) => state.sort);
  const filteredIds = useFilteredTabIds();
  return selectViewTabIds({ tabs, filteredIds, sort });
};

export const usePinnedTabs = () => {
  const tabs = useBookmarkStore((state) => state.tabs);
  return selectPinnedTabs({ tabs });
};

export const useItems = () => {
  const tabs = useBookmarkStore((state) => state.tabs);
  const lists = useBookmarkStore((state) => state.lists);
  return selectItems({ tabs, lists });
};

export function useBookmarkSelectionStore() {
  return useSnapshot(SelectionStore);
}

export function useIsTabSelected(tabId: string = "") {
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

export const bookmarkStoreActions = {
  saveTabs,
  updateTabs,
  removeTab,
  removeTabs,
  removeAllItems,
  togglePinTab,
  pinTabs,
  tagTabs,
  removeTabTag,
  removeTabTags,
  removeTabsTag,
  removeTags,
  importBookmarks,
  upsertList,
  removeList,
  removeLists,
  getUnusedTagIds,
  updateTab,
};

export const bookmarkStoreViewActions = {
  setView,
  updateFilter,
  clearFilter,
};

export const bookmarkStoreSelectionActions = {
  deselectAllTabs,
  selectAllTabs,
  selectTabs,
  toggleSelected,
};
