export function isValidActiveTab(tab?: Partial<chrome.tabs.Tab>) {
  return tab && tab.url && tab.id && tab.title;
}
