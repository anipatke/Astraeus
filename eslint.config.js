import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "**/node_modules",
      "dist",
      "**/dist",
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
  {
    // One home for the shared astronomical and calendar constants (T-371, STYLE-07): engine source imports them.
    files: ["packages/astraeus/src/**/*.ts", "packages/astraeus/src/**/*.tsx"],
    ignores: ["packages/astraeus/src/core/constants.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...[149597870.7, 946728000000, 2451545, 2440587.5, 86400000].map((value) => ({
          selector: `Literal[value=${value}]`,
          message: `${value} is a shared constant: import it from core/constants.ts instead of writing it again.`,
        })),
      ],
    },
  },
];
