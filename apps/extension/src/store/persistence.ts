import ChromeLocalStorage from "~/util/ChromeLocalStorage";
import { debounce } from "~/util/debounce";
import { LogFormatter } from "~/util/LogFormatter";
import { createLogger } from "~/util/Logger";

type Wrapper<T> = { data: T; instanceId: string; version: number };
type StoragePersistenceOptions = {
  key: string;
  version?: number;
  debounceMs?: number;
};

const DEFAULT_DEBOUNCE_MS = 300;

const logger = createLogger("StoragePersistence");
const instanceId = crypto.randomUUID();

export class StoragePersistence<T> {
  private key: string;
  private instanceId = instanceId;
  private version: number = 1;
  private lastKnownData: T | null = null;
  private debouncedSave: (data: T) => void;
  private persistLock = false;

  constructor(options: StoragePersistenceOptions & { version?: number }) {
    this.key = options.key;
    this.version = options.version ?? 1;

    this.debouncedSave = debounce((data: T) => {
      this.lastKnownData = data;
      ChromeLocalStorage.setItem(this.key, {
        data,
        instanceId: this.instanceId,
        version: this.version,
      } satisfies Wrapper<T>);
      logger.debug("saved");
    }, options.debounceMs ?? DEFAULT_DEBOUNCE_MS);
  }

  async load(): Promise<T | null> {
    const stored = await ChromeLocalStorage.getItem(this.key);
    if (!stored) return null;

    const wrapper = stored as unknown as Wrapper<T>;
    const data = (wrapper as any)?.data ?? (stored as T);
    this.lastKnownData = data;

    return data;
  }

  save(data: T, options?: { immediate?: boolean }): void {
    if (this.persistLock) return;
    if (data === this.lastKnownData) return;

    if (!options?.immediate) {
      this.debouncedSave(data);
    }
  }

  subscribe(onChange: (data: T) => void): void {
    chrome.storage.local.onChanged.addListener((changes) => {
      const change = changes[this.key];
      if (!change) return;

      const diff = LogFormatter.jsonDiff(change.oldValue as string, change.newValue as string);
      logger.debug(
        `onChange:${LogFormatter.diff(diff ?? { added: {}, deleted: {}, updated: {} })}`,
      );

      const wrapper = change.newValue as Wrapper<T>;
      if (wrapper?.instanceId === this.instanceId) return;

      this.lastKnownData = wrapper.data;

      this.persistLock = true;

      onChange(wrapper.data);

      this.persistLock = false;
    });
  }
}
