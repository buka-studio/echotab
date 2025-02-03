import { IDBPDatabase, openDB } from "idb";

export interface Snapshot {
  blob: Blob;
  url: string;
  savedAt: string;
}

class SnapshotStore {
  private db: IDBPDatabase;

  private constructor(db: IDBPDatabase) {
    this.db = db;
  }

  static async init() {
    const db = await openDB("echotab_snapshots", 1, {
      upgrade(db, oldVersion, newVersion, transaction) {
        db.createObjectStore("snapshots_tmp");
        db.createObjectStore("snapshots");
      },
    });

    return new SnapshotStore(db);
  }

  async getTmp(tabId: number) {
    return this.db.get("snapshots_tmp", tabId);
  }

  async saveTmp(tabId: number, { blob, url, savedAt }: Snapshot) {
    await this.db.put("snapshots_tmp", { blob, url, savedAt }, tabId);
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
    console.log(tmp, url);
    if (url && tmp.url !== url) {
      tx.abort();

      throw new Error("Snapshot URL mismatch");
    }

    await tx.objectStore("snapshots").put(tmp, savedId);

    await tx.done;
  }

  async getSnapshot(tabId: string): Promise<Snapshot | undefined> {
    return this.db.get("snapshots", tabId);
  }

  async deleteSnapshot(tabId: string) {
    await this.db.delete("snapshots", tabId);
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
