import { test as base, type BrowserContext } from "@playwright/test";

import { chromeWithEchotab } from "./helpers";

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const browser = await chromeWithEchotab();
    await use(browser);
    await browser.close();
  },
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent("serviceworker");

    const extensionId = background.url().split("/")[2]!;
    await use(extensionId);
  },
});

export const expect = test.expect;
