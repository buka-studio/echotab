import { MessageBus } from "../messaging";
import { createLogger } from "./Logger";
import SnapshotStore from "./SnapshotStore";

const logger = createLogger("snapshot");

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
  const response = await MessageBus.sendToTab(tabId, "snapshot:capture", { timeout: timeoutMs });

  if (!response.success) {
    throw new Error(response.error || "Snapshot capture failed");
  }

  return response.dataUrl!;
}

export async function snapshotActiveTab(tab: chrome.tabs.Tab, options: SnapshotOptions = {}) {
  if (!isTabSnapshotable(tab)) return;

  const { quality = 80, notify = true } = options;
  const { windowId, id: tabId, url } = tab;

  if (!tabId || !url) {
    logger.error("Snapshot failed: missing tabId or url");
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
    logger.error("Snapshot failed: tab no longer exists", err);
    return;
  }

  try {
    const dataUrl = await captureViaContentScript(tabId);
    rawBlob = await fetch(dataUrl).then((r) => r.blob());
    source = "snapdom";
  } catch (err) {
    logger.warn("SnapDOM capture failed:", err);
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
      logger.error("Native capture failed:", nativeErr);
      return;
    }
  }

  if (!rawBlob) {
    logger.error("Snapshot failed: both capture methods failed");
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
      MessageBus.send("snapshot:ready", { tabId, url });
    }
  } catch (resizeErr) {
    logger.error("Snapshot failed: resize or save error", resizeErr);
  }
}
