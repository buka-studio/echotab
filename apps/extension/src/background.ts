import { uuidv7 } from "uuidv7";

import { getPublicList } from "./Bookmarks/Lists/api";
import { snapshotActiveTab } from "./util/snapshot";
import SnapshotStore from "./util/SnapshotStore";

chrome.action.onClicked.addListener(async () => {
  chrome.tabs.create({ url: "chrome://newtab", active: true });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("userId", ({ userId }) => {
    if (!userId) {
      chrome.storage.local.set({ userId: uuidv7() });
    }
  });
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "version") {
    sendResponse({ version: chrome.runtime.getManifest().version });
  }
  if (message.action === "import-list") {
    const listId = message.data.listId;

    if (!listId) {
      sendResponse({ success: false });
      return;
    }

    handleImportList(listId)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((e) => {
        console.error(e);
        sendResponse({ success: false });
      });

    return true;
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  const tab = await chrome.tabs.get(tabId);
  await chrome.storage.session.set({ activeTabId: tabId, activeWindowId: windowId });

  await snapshotActiveTab(tab);
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
    await snapshotActiveTab(tab);
  }
});
