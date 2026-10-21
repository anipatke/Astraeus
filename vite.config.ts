import { defineConfig } from "vitest/config";

declare const process: { readonly env: Readonly<Record<string, string | undefined>> };

/**
 * The textures whose rights do not allow public distribution, by file name. Each is declared `localOnly` in its body's record
 * (PROV-02); tests/publicBuild.test.ts keeps this list equal to those declarations.
 */
export const LOCAL_ONLY_TEXTURES: readonly string[] = [];

/** A 1x1 white image: under the material colour it draws the body in its flat colour. */
const PLACEHOLDER = decodeURIComponent(new URL("./src/assets/textures/public-placeholder.png", import.meta.url).pathname);

/**
 * Vite aliases that replace each local-only texture module with the placeholder at the import, so the original bytes never
 * enter the bundle even if some code path imports the module without drawing it. The list is empty while every texture has a
 * licence (the Earth and Moon maps are public-domain NASA products, I-029).
 */
export function publicBuildAliases(): readonly { readonly find: RegExp; readonly replacement: string }[] {
  return LOCAL_ONLY_TEXTURES.map((file) => ({ find: new RegExp(`^.*/textures/${file.replace(/[.]/g, "\\.")}$`), replacement: PLACEHOLDER }));
}

// ASTRAEUS_PUBLIC_BUILD=1 swaps every local-only texture for the placeholder at its import (design C.3, output gate).
export default defineConfig({
  // Three pages: the pitch page (index.html), its assets sub-page, and the app (app.html).
  build: {
    rollupOptions: {
      input: {
        index: decodeURIComponent(new URL("./index.html", import.meta.url).pathname),
        assets: decodeURIComponent(new URL("./assets.html", import.meta.url).pathname),
        app: decodeURIComponent(new URL("./app.html", import.meta.url).pathname),
      },
    },
  },
  // True in a public build: the made-up (synthetic) experiences are then left out of the entry, so no chunk of them is built (T-068).
  define: { __PUBLIC_BUILD__: JSON.stringify(process.env.ASTRAEUS_PUBLIC_BUILD === "1") },
  resolve: { alias: process.env.ASTRAEUS_PUBLIC_BUILD === "1" ? [...publicBuildAliases()] : [] },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["json", "text-summary"],
      include: [
        "src/**/*.{ts,tsx}",
        "tools/apollo11/**/*.ts",
        "tools/import/**/*.{ts,mjs}",
        "tools/data/**/*.mjs",
        "tools/site/**/*.mjs",
      ],
      exclude: ["src/main.tsx", "**/*.d.ts", "**/*.d.mts"],
    },
  },
});
