import { initStore as initBookmarkStore, useBookmarkStore } from "./bookmarkStore";
import { initStore as initCurateStore, useCurateStore } from "./curateStore";
import {
  initStore as initRecentlyClosedStore,
  useRecentlyClosedStore,
} from "./recentlyClosedStore";
import {
  initStore as initSettingStore,
  initStore as initUIStore,
  useSettingStore,
} from "./settingStore";
import { initStore as initTabStore, useTabStore } from "./tabStore";
import { initStore as initTagStore, useTagStore } from "./tagStore";

export const init = {
  initBookmarkStore,
  initCurateStore,
  initRecentlyClosedStore,
  initSettingStore,
  initTagStore,
  initTabStore,
  initUIStore,
};

export const useStoresInitialized = () => {
  const statuses = [
    useSettingStore((s) => s.initialized),
    useTagStore((s) => s.initialized),
    useTabStore((s) => s.initialized),
    useBookmarkStore((s) => s.initialized),
    useCurateStore((s) => s.initialized),
    useRecentlyClosedStore((s) => s.initialized),
  ];

  return statuses.every(Boolean);
};
