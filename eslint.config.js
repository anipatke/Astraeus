import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "**/node_modules",
      "dist",
      "coverage",
      "docs",
      "**/data",
      ".savepoint",
      "**/tools/import/.horizons-cache",
    ],
  },
  {
    linterOptions: { reportUnusedDisableDirectives: "off" },
    files: ["**/*.ts", "**/*.tsx", "**/*.mjs", "**/*.mts"],
    languageOptions: { parser: tseslint.parser },
    // The plugin is registered only so the repo's existing exhaustive-deps disable
    // comments name a known rule; the rule stays off (T-127 recorded choice).
    plugins: { "react-hooks": reactHooks },
    rules: {
      complexity: ["error", 20],
      "react-hooks/exhaustive-deps": "off",
    },
  },
];
