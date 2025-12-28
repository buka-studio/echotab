import { toast } from "@echotab/ui/Toast";
import { proxy, subscribe, useSnapshot } from "valtio";

import { version } from "./constants";
import { Panel, Serializable } from "./models";
import ChromeLocalStorage from "./util/ChromeLocalStorage";
import { getRootElement } from "./util/dom";

export enum Orientation {
  Vertical = "Vertical",
  Horizontal = "Horizontal",
}

export enum CardSize {
  Large = "Large",
  Medium = "Medium",
  Small = "Small",
  XSmall = "XSmall",
}

export enum ClipboardFormat {
  Text = "Text",
  Markdown = "Markdown",
  JSON = "JSON",
  HTML = "HTML",
}

export enum Theme {
  System = "system",
  Dark = "dark",
  Light = "light",
}

export interface Settings {
  showOnboarding: boolean;
  orientation: Orientation;
  cardSize: CardSize;
  hideBookmarkFavicons: boolean;
  hideTabsFavicons: boolean;
  clipboardFormat: ClipboardFormat;
  clipboardIncludeTags: boolean;
  theme: Theme;
  primaryColor?: string;
  disableListSharing: boolean;
  aiApiProvider?: "openai" | "custom";
  aiApiKey?: string;
  aiApiBaseURL?: string;
  aiApiModel?: string;
  enterToSearch: boolean;
}

const storageKey = `cmdtab-ui-store-${version}`;

export interface UIStore extends Serializable<PersistedUIStore> {
  settings: Settings;
  activePanel: Panel;
  initialized: boolean;
  updateSettings(update: Partial<Settings>): void;
  activatePanel(panel: Panel): void;
  initStore(): Promise<void>;
}

type PersistedUIStore = Pick<UIStore, "settings" | "activePanel">;

const Store = proxy({
  settings: {
    showOnboarding: true,
    cardSize: CardSize.Large,
    hideBookmarkFavicons: false,
    hideTabsFavicons: false,
    orientation: Orientation.Vertical,
    clipboardFormat: ClipboardFormat.Text,
    clipboardIncludeTags: true,
    theme: Theme.System,
    primaryColor: undefined,
    disableListSharing: false,
    aiApiProvider: undefined,
    aiApiKey: undefined,
    aiApiBaseURL: undefined,
    aiApiModel: undefined,
    enterToSearch: false,
  } as Settings,
  initialized: false,
  activePanel: Panel.Tabs,
  updateSettings: (update: Partial<Settings>) => {
    Store.settings = { ...Store.settings, ...update };
  },
  activatePanel: (panel: Panel) => {
    Store.activePanel = panel;
  },
  initStore: async () => {
    const stored = await ChromeLocalStorage.getItem(storageKey);

    if (stored) {
      const deserialized = Store.deserialize(stored as string);
      Object.assign(Store, deserialized);
    }

    chrome.storage.local.onChanged.addListener((changes) => {
      if (changes[storageKey]) {
        const deserialized = Store.deserialize(changes[storageKey].newValue as string);
        Object.assign(Store, deserialized);
      }
    });

    Store.initialized = true;
  },
  serialize: () => {
    return JSON.stringify({
      settings: Store.settings,
      activePanel: Store.activePanel,
    });
  },
  deserialize: (serialized: string): PersistedUIStore | undefined => {
    try {
      const init = (JSON.parse(serialized) as PersistedUIStore) || {};

      return {
        settings: { ...Store.settings, ...init.settings },
        activePanel: Object.values(Panel).includes(init.activePanel)
          ? init.activePanel
          : Panel.Tabs,
      };
    } catch (e) {
      toast.error("Failed to load stored settings");
      console.error(e);
    }
  },
});

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

export function subscribeUIStore() {
  subscribe(Store, () => {
    if (Store.initialized) {
      const serialized = Store.serialize();
      ChromeLocalStorage.setItem(storageKey, serialized);
    }

    const root = getRootElement();
    const enable = disableAnimation();

    root.classList.remove("light", "dark");

    if (Store.settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
    } else {
      root.classList.add(Store.settings.theme);
    }

    if (Store.settings.primaryColor) {
      root.style.setProperty("--primary", `oklch(${Store.settings.primaryColor})`);
    }

    enable();
  });
}

export const useUIStore = () => useSnapshot(Store);

export default Store;
