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

  // 16:9, 1024x576
  // may need to reduce size further if this clogs up IDB
  const targetWidth = width;
  const targetHeight = targetWidth / ratio;

  const scaleFactor = Math.max(targetWidth / originalWidth, targetHeight / originalHeight);

  const scaledWidth = originalWidth * scaleFactor;
  const scaledHeight = originalHeight * scaleFactor;

  // contain or cover?
  const x = targetWidth / 2 - scaledWidth / 2;
  const y = targetHeight / 2 - scaledHeight / 2;

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");

  ctx!.drawImage(imageBitmap, x, 0, scaledWidth, scaledHeight);

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

export async function snapshotActiveTab(tab: chrome.tabs.Tab, options: SnapshotOptions = {}) {
  if (!isTabSnapshotable(tab)) {
    return;
  }

  const { quality = 80, notify = true } = options;

  const { windowId, id, url } = tab;

  const image = await chrome.tabs.captureVisibleTab(windowId, {
    quality,
  });

  const blob = await fetch(image).then((r) => r.blob());

  const resizedBlob = await resizeSnapshot(blob);

  const snapshotStore = await SnapshotStore.init();
  await snapshotStore.saveTmp(id!, {
    blob: resizedBlob,
    url: url!,
    savedAt: new Date().toISOString(),
  });

  if (notify) {
    chrome.runtime.sendMessage({ type: "snapshot_tmp", tabId: id, url } as Message);
  }
}
