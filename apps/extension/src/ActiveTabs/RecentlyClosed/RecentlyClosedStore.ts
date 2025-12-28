import { proxy, subscribe, useSnapshot } from "valtio";

import { version } from "../../constants";
import { ActiveTab } from "../../models";
import ChromeLocalStorage from "../../util/ChromeLocalStorage";

const storageKey = `cmdtab-recently-closed-${version}`;
const MAX_RECENTLY_CLOSED = 10;

interface RecentlyClosedStore {
  tabs: ActiveTab[];
  addTab(tab: ActiveTab): void;
  clear(): void;
}

const Store = proxy<RecentlyClosedStore>({
  tabs: [],
  addTab: (tab: ActiveTab) => {
    // Remove if already exists (to move to front)
    Store.tabs = Store.tabs.filter((t) => t.id !== tab.id);
    // Add to front
    Store.tabs.unshift(tab);
    // Keep only last 10
    Store.tabs = Store.tabs.slice(0, MAX_RECENTLY_CLOSED);
  },
  clear: () => {
    Store.tabs = [];
  },
});

// Load from storage on init
ChromeLocalStorage.getItem(storageKey).then((stored) => {
  if (stored && Array.isArray(stored)) {
    Store.tabs = stored as ActiveTab[];
  }
});

// Save to storage on changes
subscribe(Store, () => {
  ChromeLocalStorage.setItem(storageKey, Store.tabs);
});

export function useRecentlyClosedStore() {
  return useSnapshot(Store) as typeof Store;
}

export default Store;
