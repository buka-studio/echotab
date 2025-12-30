import { IDBPDatabase, openDB } from "idb";

export type SnapshotSource = "snapdom" | "captureVisibleTab";

export interface Snapshot {
  blob: Blob;
  url: string;
  savedAt: string;
  source: SnapshotSource;
  tabId?: number;
  savedId?: string;
}

class SnapshotStore {
  private db: IDBPDatabase;

  private constructor(db: IDBPDatabase) {
    this.db = db;
  }

  static async init() {
    const db = await openDB("echotab_snapshots", 2, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains("snapshots_tmp")) {
          db.createObjectStore("snapshots_tmp");
        }
        if (!db.objectStoreNames.contains("snapshots")) {
          const snapshotsStore = db.createObjectStore("snapshots");
          snapshotsStore.createIndex("url", "url", { unique: false });
          snapshotsStore.createIndex("tabId", "tabId", { unique: false });
        } else if (oldVersion < 2) {
          const snapshotsStore = transaction.objectStore("snapshots");
          if (!snapshotsStore.indexNames.contains("url")) {
            snapshotsStore.createIndex("url", "url", { unique: false });
          }
          if (!snapshotsStore.indexNames.contains("tabId")) {
            snapshotsStore.createIndex("tabId", "tabId", { unique: false });
          }
        }
      },
    });

    return new SnapshotStore(db);
  }

  async getTmp(tabId: number) {
    return this.db.get("snapshots_tmp", tabId);
  }

  async saveTmp(tabId: number, snapshot: Snapshot) {
    await this.db.put("snapshots_tmp", snapshot, tabId);
  }

  async discardTmp(tabId: number) {
    await this.db.delete("snapshots_tmp", tabId);
  }

  async clearTmp() {
    await this.db.clear("snapshots_tmp");
  }

  async commitSnapshot(tabId: number, savedId: string, url?: string) {
    const tx = this.db.transaction(["snapshots_tmp", "snapshots"], "readwrite");

    const tmp = await tx.objectStore("snapshots_tmp").get(tabId);
    if (!tmp) {
      tx.abort();
      throw new Error("Snapshot not found");
    }

    if (url && tmp.url !== url) {
      tx.abort();
      throw new Error("Snapshot URL mismatch");
    }

    const snapshot: Snapshot = {
      ...tmp,
      tabId,
      savedId,
    };

    await tx.objectStore("snapshots").put(snapshot, savedId);
    await tx.objectStore("snapshots_tmp").delete(tabId);

    await tx.done;
  }

  async getSnapshot({
    id,
    url,
  }: {
    id: string | number;
    url?: string;
  }): Promise<Snapshot | undefined> {
    const isSavedId = typeof id === "string";

    if (isSavedId) {
      // For saved tabs, try by savedId first
      let snap = await this.db.get("snapshots", id);
      // If not found and URL provided, try by URL
      if (!snap && url) {
        snap = await this.getSnapshotByUrl(url);
      }
      return snap;
    } else {
      // For active tabs, try tmp first
      let snap = await this.getTmp(id);
      // Then try by tabId index
      if (!snap) {
        snap = await this.getSnapshotByTabId(id);
      }
      // If still not found and URL provided, try by URL
      if (!snap && url) {
        snap = await this.getSnapshotByUrl(url);
      }
      return snap;
    }
  }

  async getSnapshotBySavedId(savedId: string): Promise<Snapshot | undefined> {
    return this.db.get("snapshots", savedId);
  }

  async getSnapshotByUrl(url: string): Promise<Snapshot | undefined> {
    const tx = this.db.transaction("snapshots", "readonly");
    const index = tx.store.index("url");
    const cursor = await index.openCursor(IDBKeyRange.only(url));
    return cursor?.value;
  }

  async getSnapshotByTabId(tabId: number): Promise<Snapshot | undefined> {
    const tx = this.db.transaction("snapshots", "readonly");
    const index = tx.store.index("tabId");
    const cursor = await index.openCursor(IDBKeyRange.only(tabId));
    return cursor?.value;
  }

  async deleteSnapshot(savedId: string) {
    await this.db.delete("snapshots", savedId);
  }

  async clearSnapshots() {
    await this.db.clear("snapshots");
  }

  async getSnapshotsStorageSize() {
    let cursor = await this.db.transaction("snapshots").store.openCursor();

    const size = {
      items: 0,
      bytes: 0,
    };
    while (cursor) {
      size.items++;
      size.bytes += cursor.value.blob.size;
      cursor = await cursor.continue();
    }

    return size;
  }

  async downloadSnapshots() {
    throw new Error("Not implemented");
  }

  async clearAll() {
    await this.db.clear("snapshots");
    await this.db.clear("snapshots_tmp");
  }
}

export default SnapshotStore;
