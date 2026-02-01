import { base, ignores } from "@echotab/eslint/base";
import { react } from "@echotab/eslint/react";
import valtioPlugin from "eslint-plugin-valtio";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ignores,
  ...base,
  ...react,
  {
    plugins: {
      valtio: valtioPlugin,
    },
    rules: {
      ...valtioPlugin.configs.recommended.rules,
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        chrome: "readonly",
      },
    },
  },
];
