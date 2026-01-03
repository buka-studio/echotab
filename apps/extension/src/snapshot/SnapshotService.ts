import { MessageBus } from "~/messaging";
import { createLogger } from "~/util/Logger";

import SnapshotStore, { Snapshot, SnapshotSource } from "./SnapshotStore";

const logger = createLogger("SnapshotService");

interface ResizeOptions {
  width?: number;
  ratio?: number;
}

interface CaptureOptions {
  quality?: number;
}

interface CaptureResult {
  blob: Blob;
  source: SnapshotSource;
}

export interface SnapshotAndSaveOptions {
  quality?: number;
}

export class SnapshotService {
  static async captureAndSave(
    tab: chrome.tabs.Tab,
    savedId: string,
    options: SnapshotAndSaveOptions = {},
  ): Promise<boolean> {
    if (!this.isTabSnapshotable(tab)) {
      logger.warn("Tab is not snapshotable:", tab.url);
      return false;
    }

    const { id: tabId, url } = tab;
    if (!tabId || !url) {
      logger.error("Snapshot failed: missing tabId or url");
      return false;
    }

    try {
      const result = await this.captureTab(tab, options);
      if (!result) {
        logger.error("Snapshot failed: capture returned null");
        return false;
      }

      const snapshotStore = await SnapshotStore.init();
      const snapshot: Snapshot = {
        blob: result.blob,
        url,
        savedAt: new Date().toISOString(),
        source: result.source,
        tabId,
        savedId,
      };

      await snapshotStore.saveSnapshot(savedId, snapshot);
      logger.info(`Snapshot saved for ${savedId}`);
      return true;
    } catch (err) {
      logger.error("Snapshot failed:", err);
      return false;
    }
  }

  static async captureToTmp(tab: chrome.tabs.Tab, options: CaptureOptions = {}): Promise<boolean> {
    if (!this.isTabSnapshotable(tab)) {
      return false;
    }

    const { id: tabId, url } = tab;
    if (!tabId || !url) {
      logger.error("Snapshot failed: missing tabId or url");
      return false;
    }

    try {
      const currentTab = await chrome.tabs.get(tabId);
      if (!currentTab.active) {
        return false;
      }
    } catch (err) {
      logger.error("Snapshot failed: tab no longer exists", err);
      return false;
    }

    try {
      const result = await this.captureTab(tab, options);
      if (!result) {
        logger.error("Snapshot failed: capture returned null");
        return false;
      }

      const snapshotStore = await SnapshotStore.init();
      await snapshotStore.saveTmp(tabId, {
        blob: result.blob,
        url,
        savedAt: new Date().toISOString(),
        source: result.source,
      });

      return true;
    } catch (err) {
      logger.error("Snapshot failed:", err);
      return false;
    }
  }

  static isTabSnapshotable(tab: chrome.tabs.Tab): boolean {
    return tab.status === "complete" && !!tab.url?.startsWith("http");
  }

  private static async captureTab(
    tab: chrome.tabs.Tab,
    options: CaptureOptions = {},
  ): Promise<CaptureResult | null> {
    const { quality = 80 } = options;
    const { windowId, id: tabId } = tab;

    if (!tabId) {
      return null;
    }

    let rawBlob: Blob | null = null;
    let source: SnapshotSource = "captureVisibleTab";

    try {
      const dataUrl = await this.captureViaContentScript(tabId);
      rawBlob = await fetch(dataUrl).then((r) => r.blob());
      source = "snapdom";
    } catch (err) {
      logger.warn("SnapDOM capture failed:", err);
    }

    if (!rawBlob) {
      try {
        const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
          format: "jpeg",
          quality,
        });
        rawBlob = await fetch(dataUrl).then((r) => r.blob());
        source = "captureVisibleTab";
      } catch (nativeErr) {
        logger.error("Native capture failed:", nativeErr);
        return null;
      }
    }

    if (!rawBlob) {
      return null;
    }

    const resizedBlob = await this.resizeSnapshot(rawBlob);
    return { blob: resizedBlob, source };
  }

  private static async captureViaContentScript(tabId: number, timeoutMs = 2000): Promise<string> {
    const response = await MessageBus.sendToTab(tabId, "snapshot:capture", { timeout: timeoutMs });

    if (!response.success) {
      throw new Error(response.error || "Snapshot capture failed");
    }

    return response.dataUrl!;
  }

  private static async resizeSnapshot(blob: Blob, options: ResizeOptions = {}): Promise<Blob> {
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

    return canvas.convertToBlob();
  }
}
