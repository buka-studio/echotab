import { uuidv7 } from "uuidv7";

import { getPublicList } from "./Bookmarks/Lists/api";
import { snapshotActiveTab } from "./util/snapshot";
import SnapshotStore from "./util/SnapshotStore";
import { isValidActiveTab } from "./util/tab";

chrome.action.onClicked.addListener(async (tab) => {
  chrome.runtime.sendMessage({ action: "open-popup" });
  if (tab.id && tab.active) {
    await chrome.tabs.sendMessage(tab.id, { type: "open-popup" });
  }
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

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "version") {
    sendResponse({ version: chrome.runtime.getManifest().version });
  }
  if (message.action === "import-list") {
    const listId = message.data.listId;

    if (!listId) {
      sendResponse({ success: false });
    } else {
      handleImportList(listId)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((e) => {
          console.error(e);
          sendResponse({ success: false });
        });
    }
  }
  if (message.action === "tab-info") {
    if (isValidActiveTab(sender.tab)) {
      sendResponse({ tab: sender.tab });
    }
  }
  if (message.action === "tab-close") {
    if (message.saveId && message.tabId) {
      const snapshotStore = await SnapshotStore.init();
      await snapshotStore.commitSnapshot(message.tabId, message.saveId);
    }

    if (message.tabId) {
      chrome.tabs.remove(message.tabId);
    }
  }

  return true;
});

chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  const tab = await chrome.tabs.get(tabId);
  await chrome.storage.session.set({ activeTabId: tabId, activeWindowId: windowId });

  try {
    await snapshotActiveTab(tab);
  } catch (e) {
    console.error(e);
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
      console.error(e);
    }
  }
});
