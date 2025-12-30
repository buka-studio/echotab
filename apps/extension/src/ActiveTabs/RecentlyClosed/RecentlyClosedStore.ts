import { proxy, subscribe, useSnapshot } from "valtio";

import { version } from "../../constants";
import { ActiveTab } from "../../models";
import { StoragePersistence } from "../../util/StoragePersistence";

const storageKey = `cmdtab-recently-closed-${version}`;
const persistence = new StoragePersistence({ key: storageKey });
const MAX_RECENTLY_CLOSED = 10;

interface RecentlyClosedStore {
  tabs: ActiveTab[];
  initialized: boolean;
  initStore(): Promise<void>;
  addTab(tab: ActiveTab): void;
  clear(): void;
}

const Store = proxy<RecentlyClosedStore>({
  tabs: [],
  initialized: false,
  initStore: async () => {
    const stored = await persistence.load();
    if (stored) {
      try {
        const tabs = JSON.parse(stored) as ActiveTab[];
        if (Array.isArray(tabs)) {
          Store.tabs = tabs;
        }
      } catch {
        // ignore parse errors
      }
    }

    persistence.subscribe((data) => {
      try {
        const tabs = JSON.parse(data) as ActiveTab[];
        if (Array.isArray(tabs)) {
          Store.tabs = tabs;
        }
      } catch {
        // ignore parse errors
      }
    });

    Store.initialized = true;
  },
  addTab: (tab: ActiveTab) => {
    Store.tabs = Store.tabs.filter((t) => t.id !== tab.id);
    Store.tabs.unshift(tab);
    Store.tabs = Store.tabs.slice(0, MAX_RECENTLY_CLOSED);
  },
  clear: () => {
    Store.tabs = [];
  },
});

subscribe(Store, () => {
  if (Store.initialized) {
    persistence.save(JSON.stringify(Store.tabs));
  }
});

export function useRecentlyClosedStore() {
  return useSnapshot(Store) as typeof Store;
}

export default Store;
