import path from "path";
import { chromium } from "@playwright/test";

export const chromeWithEchotab = async () => {
  const pathToExtension = path.resolve(__dirname, "../../../extension/build/chrome-mv3-prod");
  console.log(pathToExtension);
  const browser = await chromium.launchPersistentContext("", {
    headless: false,
    locale: "en-US",
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      "--disable-gpu",
    ],
  });

  return browser;
};
