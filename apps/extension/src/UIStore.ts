import { toast } from "@echotab/ui/Toast";
import { proxy, subscribe, useSnapshot } from "valtio";

import { version } from "./constants";
import { Panel } from "./models";
import ChromeLocalStorage from "./util/ChromeLocalStorage";

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

export interface UIStore {
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
    enterToSearch: true,
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
    let stored = await ChromeLocalStorage.getItem(storageKey);
    if (stored) {
      try {
        const init = (JSON.parse(stored as string) as PersistedUIStore) || {};
        Store.settings = {
          ...Store.settings,
          ...init.settings,
        };
        Store.activePanel =
          init.activePanel && Object.values(Panel).includes(init.activePanel)
            ? init.activePanel
            : Store.activePanel;
      } catch (e) {
        toast.error("Failed to load stored settings");
        console.error(e);
      }
    }
    Store.initialized = true;
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
      ChromeLocalStorage.setItem(storageKey, JSON.stringify(Store));
    }

    const root = window.document.querySelector(".echotab-root") as HTMLElement;
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
      root.style.setProperty("--primary", Store.settings.primaryColor);
    }

    enable();
  });
}

export const useUIStore = () => useSnapshot(Store);

export default Store;
