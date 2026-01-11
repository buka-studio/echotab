import { createLogger } from "./Logger";

const logger = createLogger("ChromeLocalStorage");

export class ChromeLocalStorage {
  async getItem(name: string): Promise<string | null> {
    const value = await chrome.storage.local.get(name);
    return (value[name] as string) ?? null;
  }

  async setItem<T>(name: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [name]: value });
    } catch (e) {
      logger.error("Failed to set item", e);
    }
  }

  async removeItem(name: string): Promise<void> {
    await chrome.storage.local.remove(name);
  }

  addListener(callback: (changes: Record<string, unknown>) => void): void {
    chrome.storage.local.onChanged.addListener(callback);
  }

  removeListener(callback: (changes: Record<string, unknown>) => void): void {
    chrome.storage.local.onChanged.removeListener(callback);
  }
}

export default new ChromeLocalStorage();
