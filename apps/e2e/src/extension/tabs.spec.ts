import { BrowserContext } from "@playwright/test";

import Cmdk from "./drivers/Cmdk";
import TabItem from "./drivers/TabItem";
import { expect, test } from "./fixtures";

function openTabs(tabs: string[], context: BrowserContext) {
  return Promise.all(tabs.map((tab) => context.newPage().then((page) => page.goto(tab))));
}

test.describe("tabs", () => {
  test("should load", async ({ page }) => {
    await page.goto("chrome://newtab");
    expect(page).toHaveTitle(/EchoTab/);
  });

  test("should save a tab by tagging it", async ({ context, page }) => {
    await openTabs(["https://example.com", "https://example.org"], context);
    await page.goto("chrome://newtab");
    await page.getByRole("button", { name: "Skip" }).click();

    let tabCount = await TabItem.getAll(page).then((items) => items.length);
    expect(tabCount).toBe(2);

    const cmdk = new Cmdk(page);
    await cmdk.open();
    await cmdk.select("Select All");
    await cmdk.select("Tag");

    await cmdk.type("test");
    await cmdk.getInput().then((i) => i.press("Enter"));
    await cmdk.getInput().then((i) => i.press("ControlOrMeta+Enter"));
    await cmdk.getInput().then((i) => i.press("Escape"));

    tabCount = await TabItem.getAll(page).then((items) => items.length);
    expect(tabCount).toBe(0);
  });
});
