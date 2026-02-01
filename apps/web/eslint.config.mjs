import { base, ignores } from "@echotab/eslint/base";
import nextVitals from "eslint-config-next/core-web-vitals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ignores,
  ...base,
  ...nextVitals,
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];
