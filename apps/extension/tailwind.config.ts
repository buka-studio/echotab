import sharedConfig from "@echotab/ui/tailwind.config";
import type { Config } from "tailwindcss";

export default {
    content: ["./src/**/*.{html,ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
    presets: [sharedConfig],
} satisfies Config;
