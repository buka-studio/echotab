import { Page } from "@playwright/test";

class Cmdk {
  constructor(
    private page: Page,
    private placeholder = "Type a command or search...",
  ) {}

  async open() {
    await this.page.getByRole("button", { name: "Command Menu ⌘ K" }).click();
  }

  async select(option: string) {
    await this.page.getByRole("option", { name: option }).click();
  }

  async type(text: string) {
    await this.getInput().then((i) => i.click());
    await this.getInput().then((i) => i.fill(text));
  }

  async getInput() {
    return this.page.getByPlaceholder(this.placeholder);
  }
}

export default Cmdk;
