import { uuidv7 } from "uuidv7";

import { MessageBus } from "~/messaging";
import { createLogger } from "~/util/Logger";

import { getPublicList } from "../../Bookmarks/Lists/api";
import { snapshotActiveTab } from "../../util/snapshot";
import SnapshotStore from "../../util/SnapshotStore";
import { isValidActiveTab } from "../../util/tab";

const logger = createLogger("background");

export default defineBackground({
  main() {
    chrome.contextMenus.create(
      {
        id: "open",
        title: "Open EchoTab",
        contexts: ["action", "page"],
      },
      () => {
        if (chrome.runtime.lastError) {
          logger.error("Error creating context menu:", chrome.runtime.lastError.message);
        } else {
          logger.info("Context menu created");
        }
      },
    );

    chrome.action.onClicked.addListener(async (tab) => {
      if (tab.id && tab.url) {
        try {
          const url = new URL(tab.url);
          const canHaveContentScript =
            url.protocol !== "chrome:" && url.protocol !== "chrome-extension:";

          if (canHaveContentScript) {
            MessageBus.sendToTab(tab.id, "widget:toggle").catch(() => {});
          }
        } catch {
          // Invalid URL or other error, ignore
        }
      }
    });

    chrome.runtime.onInstalled.addListener(() => {
      chrome.storage.local.get("userId", ({ userId }) => {
        if (!userId) {
          chrome.storage.local.set({ userId: uuidv7() });
        }
      });
    });

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (info.menuItemId === "open") {
        const url = chrome.runtime.getURL("home.html");

        const tabs = await chrome.tabs.query({ pinned: true });
        const echotab = tabs.find((t) => t.url === url);

        if (echotab && echotab.id) {
          await chrome.tabs.update(echotab.id, { active: true });

          if (echotab.windowId) {
            await chrome.windows.update(echotab.windowId, { focused: true });
          }
        } else {
          await chrome.tabs.create({ url, pinned: true, active: true });
        }
      }
    });

    const importStorageKey = "echo-tab-import-queue";

    async function handleImportList(listId: string) {
      const list = await getPublicList(listId);
      if (!list) {
        throw new Error("List not found");
      }

      let queue = [];
      const storage = await chrome.storage.local.get(importStorageKey);
      if (storage[importStorageKey] && Array.isArray(storage[importStorageKey])) {
        queue = storage[importStorageKey];
      }

      queue.push({
        title: `${list.title} Copy`,
        content: list.content,
        links: list.links,
      });

      await chrome.storage.local.set({ [importStorageKey]: queue });
    }

    const listener = MessageBus.createListener({
      "version:get": () => ({ version: chrome.runtime.getManifest().version }),

      "list:import": async ({ listId }) => {
        if (!listId) {
          return { success: false };
        }
        try {
          await handleImportList(listId);
          return { success: true };
        } catch (e) {
          logger.error("Failed to import list", e);
          return { success: false };
        }
      },

      "tab:info": (_, sender) => {
        if (isValidActiveTab(sender.tab)) {
          return { tab: sender.tab! };
        }
        throw new Error("Invalid tab");
      },

      "tab:close": async ({ tabId, saveId }) => {
        if (saveId) {
          const snapshotStore = await SnapshotStore.init();
          await snapshotStore.commitSnapshot(tabId, saveId);
        }
        await chrome.tabs.remove(tabId);
      },
    });

    chrome.runtime.onMessage.addListener(listener);

    chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
      const tab = await chrome.tabs.get(tabId);
      await chrome.storage.session.set({ activeTabId: tabId, activeWindowId: windowId });

      try {
        await snapshotActiveTab(tab);
      } catch (e) {
        logger.error("Snapshot failed on tab activated", e);
      }
    });

    chrome.tabs.onRemoved.addListener(async (tabId) => {
      const snapshotStore = await SnapshotStore.init();
      await snapshotStore.discardTmp(tabId);
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      const { activeTabId, activeWindowId } = await chrome.storage.session.get([
        "activeTabId",
        "activeWindowId",
      ]);

      if (tab.id === activeTabId && tab.windowId === activeWindowId) {
        try {
          await snapshotActiveTab(tab);
        } catch (e) {
          logger.error("Snapshot failed on tab updated", e);
        }
      }
    });
  },
});
