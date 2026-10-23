// Written by tools/build-packages.mjs at build time: one literal `new URL("../data/<moon>/<year>.bin", import.meta.url).href` per chunk file,
// so a bundler copies exactly the chunk files of the systems a page imports and no others.
export const chunkUrls: Readonly<Record<string, string>>;
