import { FullConfig } from "@playwright/test";

import { chromeWithEchotab } from "./helpers";

async function globalSetup(config: FullConfig) {
  const browser = await chromeWithEchotab();
}

export default globalSetup;
