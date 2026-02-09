import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { getRootElement } from "~/util/dom";

import { StoragePersistence } from "./persistence";
import { accentColors, ClipboardFormat, Panel, Settings, Theme } from "./schema";

export interface RecentlyClosedStore {
  initialized: boolean;
  settings: Settings;
  activePanel: Panel;
}

export const storageKey = `echotab-settings`;

const persistence = new StoragePersistence<{
  settings: Settings;
  activePanel: Panel;
}>({ key: storageKey });

export const useSettingStore = create(
  subscribeWithSelector(() => ({
    settings: {
      profileLinkUrl: undefined,
      showOnboarding: true,
      hideFavicons: false,
      theme: Theme.System,
      clipboardFormat: ClipboardFormat.Text,
      clipboardIncludeTags: false,
      accentColor: accentColors.Orange,
      listPublishingEnabled: false,
      enableNewTab: false,
    } as Settings,
    activePanel: Panel.Tabs,
    open: false,
    initialized: false,
  })),
);

export const initStore = async () => {
  const stored = await persistence.load();
  if (stored) {
    useSettingStore.setState({ settings: stored.settings, activePanel: stored.activePanel });
  }
  useSettingStore.setState({ initialized: true });
};

useSettingStore.subscribe((store) => {
  if (store.initialized) {
    persistence.save({ settings: store.settings, activePanel: store.activePanel });
  }
});

export const updateSettings = (settings: Partial<Settings>) => {
  useSettingStore.setState((state) => ({ settings: { ...state.settings, ...settings } }));
};

export const activatePanel = (panel: Panel) => {
  useSettingStore.setState({ activePanel: panel });
};

export const setSettingsOpen = (open: boolean) => {
  useSettingStore.setState({ open });
};

// src https://github.com/pacocoursey/next-themes/blob/main/next-themes/src/index.tsx
const disableAnimation = () => {
  const css = document.createElement("style");
  css.appendChild(
    document.createTextNode(
      `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`,
    ),
  );
  document.head.appendChild(css);

  return () => {
    // Force restyle
    (() => window.getComputedStyle(document.body))();

    // Wait for next tick before removing
    setTimeout(() => {
      document.head.removeChild(css);
    }, 1);
  };
};

export function setTheme(theme: Theme) {
  const root = getRootElement();
  const enable = disableAnimation();

  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }

  enable();
}

export function subscribeSettingStore() {
  useSettingStore.subscribe(
    (s) => s.settings.theme,
    (theme) => {
      setTheme(theme);
    },
  );

  useSettingStore.subscribe(
    (s) => s.settings.accentColor,
    (accentColor) => {
      const root = getRootElement();
      root.style.setProperty("--primary", accentColor);
    },
  );
}

export const settingStoreActions = {
  updateSettings,
  activatePanel,
  setSettingsOpen,
};
