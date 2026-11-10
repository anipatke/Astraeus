import { pathToFileURL } from "node:url";
import { defineConfig } from "vitest/config";

declare const process: { readonly env: Readonly<Record<string, string | undefined>> };

const COLD = "packages/astraeus/tests/cold/**/*.test.ts";

// One test run over the five packages (packages/*/tests). The made-up experiences are left in (the flag is false) unless a public build is being tested.
// Two projects: the ordinary one preloads the planet series and the moon fits (vitest.setup.ts); the cold one (packages/astraeus/tests/cold) does not, so it sees what a Node consumer sees (O-056).
// A `.json?url` import is the file's own `file:` address under test, as the packed package gives (build-packages), so the engine's one bundled-file reader reads it from disk in Node (I-167).
const jsonFileUrls = {
  name: "json-file-urls",
  enforce: "pre" as const,
  async resolveId(this: { resolve(id: string, importer?: string, options?: { skipSelf: boolean }): Promise<{ id: string } | null> }, id: string, importer?: string) {
    if (!id.endsWith(".json?url")) return null;
    const resolved = await this.resolve(id.slice(0, -"?url".length), importer, { skipSelf: true });
    return resolved === null ? null : `\0json-file-url:${resolved.id}.js`;
  },
  load(id: string) {
    return id.startsWith("\0json-file-url:") ? `export default ${JSON.stringify(pathToFileURL(id.slice("\0json-file-url:".length, -".js".length)).href)};` : null;
  },
};

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
  plugins: [jsonFileUrls],
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
