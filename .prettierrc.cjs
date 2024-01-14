/**
 * @type {import('prettier').Options}
 */
module.exports = {
    printWidth: 100,
    tabWidth: 4,
    useTabs: false,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    bracketSpacing: true,
    bracketSameLine: true,
    plugins: [
        require.resolve("@ianvs/prettier-plugin-sort-imports"),        "prettier-plugin-tailwindcss",
    ],
    importOrder: ["<THIRD_PARTY_MODULES>", "", "^~/(.*)$", "", "^[./]"],
    importOrderSortSpecifiers: true
};
