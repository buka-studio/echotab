import { Message } from "../models";
import SnapshotStore from "./SnapshotStore";

interface ResizeOptions {
  width?: number;
  ratio?: number;
}

export async function resizeSnapshot(blob: Blob, options: ResizeOptions = {}) {
  const { width = 1024, ratio = 16 / 9 } = options;

  const imageBitmap = await createImageBitmap(blob);

  const { width: originalWidth, height: originalHeight } = imageBitmap;

  const targetWidth = width;
  const targetHeight = targetWidth / ratio;

  const scaleFactor = Math.max(targetWidth / originalWidth, targetHeight / originalHeight);

  const scaledWidth = originalWidth * scaleFactor;
  const scaledHeight = originalHeight * scaleFactor;

  const x = targetWidth / 2 - scaledWidth / 2;
  const y = targetHeight / 2 - scaledHeight / 2;

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");

  ctx!.drawImage(imageBitmap, x, y, scaledWidth, scaledHeight);

  const resizedBlob = await canvas.convertToBlob();

  return resizedBlob;
}

export function isTabSnapshotable(tab: chrome.tabs.Tab) {
  return tab.status === "complete" && tab.url?.startsWith("http");
}

interface SnapshotOptions {
  quality?: number;
  notify?: boolean;
}

async function captureViaContentScript(tabId: number, timeoutMs = 2000): Promise<string> {
  return new Promise((resolve, reject) => {
    let hasResolved = false;

    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        reject(new Error(`SnapDOM capture timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    try {
      chrome.tabs.sendMessage(tabId, { type: "snapdom_snapshot" }, (response) => {
        clearTimeout(timer);

        if (hasResolved) {
          return;
        }

        if (chrome.runtime.lastError) {
          hasResolved = true;
          const errorMsg = chrome.runtime.lastError.message || "Unknown error";
          if (
            errorMsg.includes("Receiving end does not exist") ||
            errorMsg.includes("message channel closed")
          ) {
            reject(new Error("Content script not available"));
          } else {
            reject(new Error(`SnapDOM capture failed: ${errorMsg}`));
          }
          return;
        }

        if (!response || !response.success) {
          hasResolved = true;
          const errorMsg = response?.error || "No response from content script";
          reject(new Error(`SnapDOM capture failed: ${errorMsg}`));
          return;
        }

        hasResolved = true;
        resolve(response.dataUrl);
      });
    } catch (err) {
      clearTimeout(timer);
      if (!hasResolved) {
        hasResolved = true;
        reject(
          new Error(`SnapDOM capture failed: ${err instanceof Error ? err.message : String(err)}`),
        );
      }
    }
  });
}

export async function snapshotActiveTab(tab: chrome.tabs.Tab, options: SnapshotOptions = {}) {
  if (!isTabSnapshotable(tab)) return;

  const { quality = 80, notify = true } = options;
  const { windowId, id: tabId, url } = tab;

  if (!tabId || !url) {
    console.error("Snapshot failed: missing tabId or url");
    return;
  }

  let rawBlob: Blob | null = null;
  let source: "snapdom" | "captureVisibleTab" = "captureVisibleTab";

  try {
    const currentTab = await chrome.tabs.get(tabId);
    if (!currentTab.active) {
      return;
    }
  } catch (err) {
    console.error("Snapshot failed: tab no longer exists", err);
    return;
  }

  try {
    const dataUrl = await captureViaContentScript(tabId);
    rawBlob = await fetch(dataUrl).then((r) => r.blob());
    source = "snapdom";
  } catch (err) {
    console.error("SnapDOM capture failed:", err);
  }

  if (!rawBlob) {
    try {
      const currentTab = await chrome.tabs.get(tabId);
      if (!currentTab.active) {
        return;
      }

      const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
        format: "jpeg",
        quality,
      });
      rawBlob = await fetch(dataUrl).then((r) => r.blob());
    } catch (nativeErr) {
      console.error("Native capture failed:", nativeErr);
      return;
    }
  }

  if (!rawBlob) {
    console.error("Snapshot failed: both capture methods failed");
    return;
  }

  try {
    const resizedBlob = await resizeSnapshot(rawBlob);
    const snapshotStore = await SnapshotStore.init();

    await snapshotStore.saveTmp(tabId, {
      blob: resizedBlob,
      url,
      savedAt: new Date().toISOString(),
      source,
    });

    if (notify) {
      chrome.runtime.sendMessage({ type: "snapshot_tmp", tabId, url } as Message);
    }
  } catch (resizeErr) {
    console.error("Snapshot failed: resize or save error", resizeErr);
  }
}
