import { defineConfig } from "vitest/config";

declare const process: { readonly env: Readonly<Record<string, string | undefined>> };

// One test run over the five packages (packages/*/tests). The made-up experiences are left in (the flag is false) unless a public build is being tested.
export default defineConfig({
  define: { __PUBLIC_BUILD__: JSON.stringify(process.env.ASTRAEUS_PUBLIC_BUILD === "1") },
  test: {
    environment: "node",
    include: ["packages/*/tests/**/*.test.ts"],
    clearMocks: true,
    setupFiles: ["./packages/astraeus/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["json", "text-summary"],
      include: [
        "packages/*/src/**/*.{ts,tsx}",
        "packages/*/tools/apollo11/**/*.ts",
        "packages/*/tools/import/**/*.{ts,mjs}",
        "packages/*/tools/data/**/*.mjs",
        "packages/*/tools/site/**/*.mjs",
      ],
      exclude: ["packages/*/src/main.tsx", "**/*.d.ts", "**/*.d.mts"],
    },
  },
});
