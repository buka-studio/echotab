import { ActiveTab } from "../models";

export async function getMetadata(
  tabs: ActiveTab[],
): Promise<Map<number, Record<string, string | null>>> {
  const metadataByTabId = new Map<number, Record<string, string | null>>(
    tabs.map((tab) => [tab.id, {}]),
  );

  const executions = await Promise.all(
    tabs.map((tab) =>
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          func: () => {
            return {
              description: document
                .querySelector("meta[name='description']")
                ?.getAttribute("content"),
            };
          },
        })
        .then((injectionResult) => {
          return injectionResult.map((result) => {
            return {
              tabId: tab.id,
              frameId: result.frameId,
              metadata: result.result,
            };
          });
        })
        .catch((e) => {
          console.error(e);
          return [
            {
              tabId: tab.id,
              frameId: 0,
              metadata: null,
            },
          ];
        }),
    ),
  );

  for (const e of executions) {
    for (const result of e) {
      metadataByTabId.set(result.tabId, {
        ...metadataByTabId.get(result.tabId),
        description: result.metadata?.description || null,
      });
    }
  }

  return metadataByTabId;
}
