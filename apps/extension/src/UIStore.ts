import { toast } from "@echotab/ui/Toast";
import { proxy, subscribe, useSnapshot } from "valtio";

import ChromeLocalStorage from "./ChromeLocalStorage";
import { version } from "./constants";
import { Panel } from "./models";

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
    orientation: Orientation;
    cardSize: CardSize;
    clipboardFormat: ClipboardFormat;
    clipboardIncludeTags: boolean;
    theme: Theme;
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

const store = proxy({
    settings: {
        cardSize: CardSize.Large,
        orientation: Orientation.Vertical,
        clipboardFormat: ClipboardFormat.Text,
        clipboardIncludeTags: true,
        theme: Theme.System,
    },
    initialized: false,
    activePanel: Panel.Active,
    updateSettings: (update: Partial<Settings>) => {
        store.settings = { ...store.settings, ...update };
    },
    activatePanel: (panel: Panel) => {
        store.activePanel = panel;
    },
    initStore: async () => {
        ChromeLocalStorage.getItem(storageKey).then((value) => {
            try {
                const init = (JSON.parse(value as string) as PersistedUIStore) || {};
                store.settings = {
                    ...store.settings,
                    ...init.settings,
                };
                store.activePanel = init.activePanel || store.activePanel;
            } catch (e) {
                toast.error("Failed to load stored settings");
                console.error(e);
            }
        });
        store.initialized = true;
    },
});

subscribe(store, () => {
    if (store.initialized) {
        ChromeLocalStorage.setItem(storageKey, JSON.stringify(store));
    }

    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (store.settings.theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

        root.classList.add(systemTheme);
        return;
    }

    root.classList.add(store.settings.theme);
});

store.initStore();

export const useUIStore = () => useSnapshot(store);

export default store;
