import { Page } from "@playwright/test";

class TabItem {
  constructor(private page: Page) {}

  static async getAll(page: Page) {
    return page.$$eval(".echo-item", (elements) => Array.from(elements));
  }
}

export default TabItem;
