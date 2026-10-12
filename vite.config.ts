import { defineConfig } from "vitest/config";

declare const process: { readonly env: Readonly<Record<string, string | undefined>> };

/**
 * The textures whose rights do not allow public distribution, by file name. Each is declared `localOnly` in its body's record
 * (PROV-02); tests/publicBuild.test.ts keeps this list equal to those declarations.
 */
export const LOCAL_ONLY_TEXTURES: readonly string[] = ["earth-2k.jpg", "moon-orig-2k.jpg"];

/** A 1x1 white image: under the material colour it draws the body in its flat colour. */
const PLACEHOLDER = decodeURIComponent(new URL("./src/assets/textures/public-placeholder.png", import.meta.url).pathname);

/**
 * Vite aliases that replace each local-only texture module with the placeholder at the import, so the original bytes never
 * enter the bundle even if some code path imports the module without drawing it. The Moon's declared replacement (a public-domain
 * map held in another repository) is not copied here, so until it is, the public Moon is its flat material colour as well.
 */
export function publicBuildAliases(): readonly { readonly find: RegExp; readonly replacement: string }[] {
  return LOCAL_ONLY_TEXTURES.map((file) => ({ find: new RegExp(`^.*/textures/${file.replace(/[.]/g, "\\.")}$`), replacement: PLACEHOLDER }));
}

// ASTRAEUS_PUBLIC_BUILD=1 swaps every local-only texture for the placeholder at its import (design C.3, output gate).
export default defineConfig({
  resolve: { alias: process.env.ASTRAEUS_PUBLIC_BUILD === "1" ? [...publicBuildAliases()] : [] },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
  },
});
