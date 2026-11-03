import { defineConfig } from "vitest/config";

declare const process: { readonly env: Readonly<Record<string, string | undefined>> };

const COLD = "packages/astraeus/tests/cold/**/*.test.ts";

// One test run over the five packages (packages/*/tests). The made-up experiences are left in (the flag is false) unless a public build is being tested.
// Two projects: the ordinary one preloads the planet series and the moon fits (vitest.setup.ts); the cold one (packages/astraeus/tests/cold) does not, so it sees what a Node consumer sees (O-056).
const common = {
  define: { __PUBLIC_BUILD__: JSON.stringify(process.env.ASTRAEUS_PUBLIC_BUILD === "1") },
  test: {
    environment: "node" as const,
    clearMocks: true,
    // GitHub's runners are slower than a desk machine; the heavy data cases (showers, look-ahead) passed 5 s there only by luck (v0.1.1 publish runs).
    testTimeout: process.env.CI ? 30_000 : 5_000,
  },
};

export default defineConfig({
  ...common,
  test: {
    ...common.test,
    projects: [
      { ...common, test: { ...common.test, name: "preloaded", include: ["packages/*/tests/**/*.test.ts"], exclude: [COLD, "**/node_modules/**"], setupFiles: ["./packages/astraeus/vitest.setup.ts"] } },
      { ...common, test: { ...common.test, name: "cold", include: [COLD] } },
    ],
    coverage: {
      provider: "v8",
      reporter: ["json", "text-summary"],
      // Data-import tools (packages/*/tools/import) are left out: maintainer-run JPL import scripts, not in the npm package (owner, 2026-10-24).
      include: [
        "packages/*/src/**/*.{ts,tsx}",
        "packages/*/tools/apollo11/**/*.ts",
        "packages/*/tools/data/**/*.mjs",
        "packages/*/tools/site/**/*.mjs",
      ],
      exclude: ["packages/*/src/main.tsx", "**/*.d.ts", "**/*.d.mts"],
    },
  },
});
