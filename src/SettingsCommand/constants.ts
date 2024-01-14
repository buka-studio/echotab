import resolveConfig from "tailwindcss/resolveConfig";

import tailwindConfig from "../../tailwind.config";

const twConfig = resolveConfig(tailwindConfig);

export const tagColors = Object.entries(twConfig.theme!.colors!)
    .filter(
        ([k, v]) =>
            typeof v !== "string" &&
            !["stone", "zinc", "gray", "rose", "sky", "purple"].includes(k),
    )
    .map(([k, v]) => v["600"])
    .filter(Boolean);
