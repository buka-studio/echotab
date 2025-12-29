export function isValidActiveTab(tab?: Partial<chrome.tabs.Tab>) {
  if (!tab || !tab.url || !tab.id || !tab.title) {
    return false;
  }

  try {
    const url = new URL(tab.url);
    if (url.protocol === "chrome-extension:") {
      return false;
    }
  } catch {
    // pass
  }

  return true;
}
