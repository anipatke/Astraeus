import type { DataSource, MoonIndex } from "astraeus";
import { chunkUrls } from "./chunks.js";

/** Reads Pluto's index (the moons, their fits and the measured errors). A dynamic import, so a bundler keeps it as its own file. */
export const loadIndex = async (): Promise<MoonIndex> => {
  const loaded = (await import("../data/pluto-moons/index.json", { with: { type: "json" } })) as { default?: MoonIndex };
  return loaded.default ?? (loaded as MoonIndex); // Parcel hands back the JSON itself, Vite and webpack a module with a default
};

export { chunkUrls };

/** Hand this to `mount(element, scene, { data: [dataSource] })` to give Pluto's moons their positions. */
export const dataSource: DataSource = Object.freeze({
  name: "astraeus-data-pluto",
  provides: ["charon"],
  moonPositions: Object.freeze({ center: "pluto", loadIndex, chunkUrls }),
});
