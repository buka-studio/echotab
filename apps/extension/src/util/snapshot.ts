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

// export async function snapshotActiveTab(tab: chrome.tabs.Tab, options: SnapshotOptions = {}) {
//   if (!isTabSnapshotable(tab)) {
//     return;
//   }

//   const { quality = 80, notify = true } = options;

//   const { windowId, id, url } = tab;

//   const image = await chrome.tabs.captureVisibleTab(windowId, {
//     quality,
//   });

//   const blob = await fetch(image).then((r) => r.blob());

//   const resizedBlob = await resizeSnapshot(blob);

//   const snapshotStore = await SnapshotStore.init();
//   await snapshotStore.saveTmp(id!, {
//     blob: resizedBlob,
//     url: url!,
//     savedAt: new Date().toISOString(),
//   });

//   if (notify) {
//     chrome.runtime.sendMessage({ type: "snapshot_tmp", tabId: id, url } as Message);
//   }
// }




async function captureViaContentScript(tabId: number, timeoutMs = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    let hasResolved = false;

    // 1. Timeout Timer
    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        reject(new Error("TIMEOUT"));
      }
    }, timeoutMs);

    // 2. Send message to content script
    chrome.tabs.sendMessage(
      tabId, 
      { type: "REQUEST_SNAPDOM_SNAPSHOT" }, // Updated Message Type
      (response) => {
        clearTimeout(timer);
        
        // Handle runtime errors (e.g., content script not injected yet)
        if (chrome.runtime.lastError || !response || !response.success) {
           if (!hasResolved) {
             hasResolved = true;
             reject(new Error("FAILED_OR_NO_RESPONSE"));
           }
           return;
        }

        if (!hasResolved) {
          hasResolved = true;
          resolve(response.dataUrl);
        }
      }
    );
  });
}

export async function snapshotActiveTab(tab: chrome.tabs.Tab, options: SnapshotOptions = {}) {
  // 1. Basic checks
  if (!isTabSnapshotable(tab)) return;

  const { quality = 80, notify = true } = options;
  const { windowId, id: tabId, url } = tab;
  
  let rawBlob: Blob | null = null;

  // --- STRATEGY 1: SNAPDOM (Content Script) ---
  try {
    // We try SnapDOM first because it captures full page content (if you scrolled)
    // and works without permissions warnings in some contexts.
    const dataUrl = await captureViaContentScript(tabId!);
    rawBlob = await fetch(dataUrl).then((r) => r.blob());
  } catch (err) {
    // console.debug(`SnapDOM failed/timed out, switching to native: ${err}`);
  }

  // --- STRATEGY 2: FALLBACK (Native API) ---
  if (!rawBlob) {
    try {
      // Safety Check: user might have switched tabs during the 1s timeout
      const currentTab = await chrome.tabs.get(tabId!);
      if (!currentTab.active) {
        return; // Abort to avoid screenshotting the wrong tab
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

  // --- SAVE ---
  const resizedBlob = await resizeSnapshot(rawBlob);
  const snapshotStore = await SnapshotStore.init();
  
  await snapshotStore.saveTmp(tabId!, {
    blob: resizedBlob,
    url: url!,
    savedAt: new Date().toISOString(),
  });

  if (notify) {
    chrome.runtime.sendMessage({ type: "snapshot_tmp", tabId: tabId, url } as Message);
  }
}