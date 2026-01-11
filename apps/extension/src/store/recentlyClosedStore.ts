import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { StoragePersistence } from "./persistence";
import { ActiveTab } from "./schema";

export interface RecentlyClosedStore {
  tabs: ActiveTab[];
  initialized: boolean;
}

const persistence = new StoragePersistence<{ tabs: ActiveTab[] }>({
  key: "echotab-recently-closed",
});

export const useRecentlyClosedStore = create(
  subscribeWithSelector(() => ({
    tabs: [] as ActiveTab[],
    initialized: false,
  })),
);

export const initStore = async () => {
  const stored = await persistence.load();
  if (stored) {
    useRecentlyClosedStore.setState({ tabs: stored.tabs });
  }
  useRecentlyClosedStore.setState({ initialized: true });
};

export const addRecentlyClosed = (tab: ActiveTab) => {
  useRecentlyClosedStore.setState((state) => ({ tabs: [tab, ...state.tabs] }));
};

export const clear = () => {
  useRecentlyClosedStore.setState({ tabs: [] });
};

useRecentlyClosedStore.subscribe((store) => {
  if (store.initialized) {
    persistence.save({ tabs: store.tabs });
  }
});

export const recentlyClosedActions = {
  addRecentlyClosed,
  clear,
};
