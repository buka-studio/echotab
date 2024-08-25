const ChromeLocalStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await chrome.storage.local.get(name);
    return value[name] || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ [name]: value });
    } catch (e) {
      console.log(e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    await chrome.storage.local.remove(name);
  },
};

export default ChromeLocalStorage;
