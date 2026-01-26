import { uuidv7 } from "uuidv7";

import { MessageBus } from "~/messaging";
import { SnapshotService, SnapshotStore } from "~/snapshot";
import { cleanupValtioKeys, migrateFromValtio } from "~/store/migrate";
import { MetadataParser } from "~/TabInfo/MetadataParser";
import type { TabMetadataRequest } from "~/TabInfo/models";
import { createLogger } from "~/util/Logger";

import { getPublicList } from "../../Bookmarks/Lists/api";
import { isValidActiveTab } from "../../util/tab";

const logger = createLogger("background");

const AUTO_SNAPSHOT_ENABLED = false;

async function openOrCreateEchoTab() {
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

export default defineBackground({
  main() {
    const extensionUrl = chrome.runtime.getURL("home.html");

    chrome.runtime.onInstalled.addListener(async (details) => {
      try {
        const migrated = await migrateFromValtio();
        if (migrated) {
          logger.info("Migration from old storage format completed");
          setTimeout(() => {
            cleanupValtioKeys().catch((e) => logger.error("Failed to cleanup old keys:", e));
          }, 5000);
        }
      } catch (e) {
        logger.error("Migration failed:", e);
      }

      chrome.storage.local.get("userId", ({ userId }) => {
        if (!userId) {
          chrome.storage.local.set({ userId: uuidv7() });
        }
      });

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

      if (details.reason === "update") {
        logger.info(
          `Extension updated from ${details.previousVersion} to ${chrome.runtime.getManifest().version}`,
        );
      } else if (details.reason === "install") {
        logger.info("Extension installed");
      }
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.url === extensionUrl && !tab.pinned) {
        const pinnedTabs = await chrome.tabs.query({ pinned: true });
        const existingPinnedTab = pinnedTabs.find((t) => t.url === extensionUrl);

        if (existingPinnedTab && existingPinnedTab.id) {
          await chrome.tabs.remove(tabId);
          await chrome.tabs.update(existingPinnedTab.id, { active: true });

          if (existingPinnedTab.windowId) {
            await chrome.windows.update(existingPinnedTab.windowId, { focused: true });
          }
        } else {
          await chrome.tabs.update(tabId, { pinned: true });
        }
      }
    });

    chrome.action.onClicked.addListener(async (tab) => {
      if (tab.id && tab.url) {
        try {
          const url = new URL(tab.url);
          const canHaveContentScript =
            url.protocol !== "chrome:" && url.protocol !== "chrome-extension:";

          if (canHaveContentScript) {
            MessageBus.sendToTab(tab.id, "widget:toggle", {}).catch(() => {});
          } else {
            await openOrCreateEchoTab();
          }
        } catch {
          // Invalid URL or other error, ignore
        }
      }
    });

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (info.menuItemId === "open") {
        await openOrCreateEchoTab();
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

    async function handleMetadataFetch({ tabId: _tabId, url }: TabMetadataRequest) {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: "text/html",
            "User-Agent": "Mozilla/5.0 (compatible; EchoTab/1.0)",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("text/html")) {
          throw new Error(`Invalid content type: ${contentType}`);
        }

        const html = await response.text();
        const metadata = MetadataParser.parseFromHtml(html, url);

        return { success: true, metadata };
      } catch (error) {
        logger.error(`Failed to fetch metadata for ${url}:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
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

      "tab:close": async ({ tabId }) => {
        if (tabId !== undefined) {
          await chrome.tabs.remove(tabId);
        }
      },

      "snapshot:save": async ({ tabId, url }) => {
        if (!tabId || !url) {
          return { success: false, error: "Missing tabId or url" };
        }
        try {
          const tab = await chrome.tabs.get(tabId);
          if (!tab || tab.url !== url) {
            return { success: false, error: "Tab not found or URL mismatch" };
          }
          const result = await SnapshotService.captureAndSave(tab);
          return result;
        } catch (error) {
          logger.error("Failed to save snapshot:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },

      "metadata:fetch": async (payload) => {
        return handleMetadataFetch(payload);
      },
      "echotab:open": async () => {
        await openOrCreateEchoTab();
      },
    });

    chrome.runtime.onMessage.addListener(listener);

    if (AUTO_SNAPSHOT_ENABLED) {
      chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
        const tab = await chrome.tabs.get(tabId);
        await chrome.storage.session.set({ activeTabId: tabId, activeWindowId: windowId });

        try {
          await SnapshotService.captureToTmp(tab);
        } catch (e) {
          logger.error("Snapshot failed on tab activated", e);
        }
      });

      chrome.tabs.onUpdated.addListener(async (tabId, _changeInfo, tab) => {
        const { activeTabId, activeWindowId } = await chrome.storage.session.get([
          "activeTabId",
          "activeWindowId",
        ]);

        if (tab.id === activeTabId && tab.windowId === activeWindowId) {
          try {
            await SnapshotService.captureToTmp(tab);
          } catch (e) {
            logger.error("Snapshot failed on tab updated", e);
          }
        }
      });
    }

    chrome.tabs.onRemoved.addListener(async (tabId) => {
      const snapshotStore = await SnapshotStore.init();
      await snapshotStore.discardTmp(tabId);
    });
  },
});
