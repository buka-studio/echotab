import ChromeLocalStorage from "./ChromeLocalStorage";
import { debounce } from "./debounce";
import { LogFormatter } from "./LogFormatter";
import { createLogger } from "./Logger";

const DEFAULT_DEBOUNCE_MS = 300;

export interface StoragePersistenceOptions {
  key: string;
  debounceMs?: number;
}

const logger = createLogger("StoragePersistence");

export class StoragePersistence {
  private key: string;
  private instanceId = crypto.randomUUID();
  private lastKnownData: string | null = null;
  private debouncedSave: (serialized: string) => void;

  constructor(options: StoragePersistenceOptions) {
    this.key = options.key;
    this.debouncedSave = debounce((serialized: string) => {
      this.lastKnownData = serialized;
      const wrapper = JSON.stringify({ data: serialized, instanceId: this.instanceId });
      ChromeLocalStorage.setItem(this.key, wrapper);
      logger.debug("saved");
    }, options.debounceMs ?? DEFAULT_DEBOUNCE_MS);
  }

  async load(): Promise<string | null> {
    const stored = await ChromeLocalStorage.getItem(this.key);
    if (!stored) return null;

    try {
      const wrapper = JSON.parse(stored as string);
      const data = wrapper?.data ?? stored; // Support old format without wrapper
      this.lastKnownData = data;
      return data;
    } catch {
      return null;
    }
  }

  save(serialized: string): void {
    if (serialized === this.lastKnownData) {
      return;
    }
    this.debouncedSave(serialized);
  }

  subscribe(onChange: (data: string) => void): void {
    chrome.storage.local.onChanged.addListener((changes) => {
      const change = changes[this.key];
      if (!change) return;

      const diff = LogFormatter.jsonDiff(change.oldValue as string, change.newValue as string);
      logger.debug(
        `onChange:${LogFormatter.diff(diff ?? { added: {}, deleted: {}, updated: {} })}`,
      );

      try {
        const wrapper = JSON.parse(change.newValue as string);
        const { data, instanceId } = wrapper;

        if (instanceId === this.instanceId) {
          return;
        }
        this.lastKnownData = data;
        onChange(data);
      } catch (e) {
        logger.error("Failed to parse storage change", e);
      }
    });
  }
}
