import { createReadStream, existsSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

declare const process: { readonly env: Readonly<Record<string, string | undefined>> };

/**
 * The textures whose rights do not allow public distribution, by file name. Each is declared `localOnly` in its body's record
 * (PROV-02); tests/publicBuild.test.ts keeps this list equal to those declarations.
 */
export const LOCAL_ONLY_TEXTURES: readonly string[] = [];

/**
 * The maps only the planets demo's other eight planets draw (src/assets/bodies/planetSystemMaps.ts). The public build offers Jupiter alone (T-136), so it swaps these
 * for the placeholder and their bytes stay out of the bundle; a local build keeps them. Not rights-restricted, so tests/publicBuild.test.ts keeps them apart from LOCAL_ONLY_TEXTURES.
 */
export const PLANETS_DEMO_ONLY_TEXTURES: readonly string[] = [
  "charon-2k.jpg", "dione-4k.jpg", "enceladus-4k.jpg", "iapetus-4k.jpg", "mimas-4k.jpg", "neptune-2k.jpg", "pluto-4k.jpg",
  "rhea-4k.jpg", "saturn-2k.jpg", "tethys-4k.jpg", "titan-4k.jpg", "triton-4k.jpg", "uranus-2k.jpg",
  // Only the planets demo opts in to desktop variants (T-141), and the public planets demo is Jupiter only (owner, 2026-10-22).
  "venus-8k-balanced.jpg",
];

/** A 1x1 white image: under the material colour it draws the body in its flat colour. */
const PLACEHOLDER = decodeURIComponent(new URL("../astraeus/src/assets/textures/public-placeholder.png", import.meta.url).pathname);

/**
 * Vite aliases that replace each local-only texture module with the placeholder at the import, so the original bytes never
 * enter the bundle even if some code path imports the module without drawing it. The list is empty while every texture has a
 * licence (the Earth and Moon maps are public-domain NASA products, I-029).
 */
export function publicBuildAliases(): readonly { readonly find: RegExp; readonly replacement: string }[] {
  return [...LOCAL_ONLY_TEXTURES, ...PLANETS_DEMO_ONLY_TEXTURES].map((file) => ({ find: new RegExp(`^.*/textures/${file.replace(/[.]/g, "\\.")}$`), replacement: PLACEHOLDER }));
}

/** Dev server only: serves the git-ignored /data/local/ files (the fetched measured orbits) from the Showers package, where the project root used to serve them. */
function localData(): Plugin {
  const folder = decodeURIComponent(new URL("../astraeus-demo-showers/data/local/", import.meta.url).pathname);
  return {
    name: "astraeus-local-data",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/data/local/", (request, response, next) => {
        const file = `${folder}${(request.url ?? "").split("?")[0]!.replace(/^\/+/, "")}`;
        if (file.includes("..") || !existsSync(file)) return next();
        response.setHeader("Content-Type", "application/json");
        createReadStream(file).pipe(response);
      });
    },
  };
}

// ASTRAEUS_PUBLIC_BUILD=1 swaps every local-only texture for the placeholder at its import (design C.3, output gate).
export default defineConfig({
  // Three pages: the pitch page (index.html), its assets sub-page, and the app (app.html).
  build: {
    // The site's root is its package folder; the build lands in the repository's dist folder, as vercel.json expects.
    outDir: decodeURIComponent(new URL("../../dist", import.meta.url).pathname),
    emptyOutDir: true,
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
  plugins: [localData()],
});
