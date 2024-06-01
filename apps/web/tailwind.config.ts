import sharedConfig from "@echotab/ui/tailwind.config";
import type { Config } from "tailwindcss";

export default {
    content: ["./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
    presets: [sharedConfig],
} satisfies Config;
