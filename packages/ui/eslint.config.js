import { base, ignores } from "@echotab/eslint/base";
import { react } from "@echotab/eslint/react";
import storybookPlugin from "eslint-plugin-storybook";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ignores,
  ...base,
  ...react,
  {
    files: ["**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)"],
    plugins: {
      storybook: storybookPlugin,
    },
    rules: {
      ...storybookPlugin.configs.recommended.rules,
    },
  },
];
