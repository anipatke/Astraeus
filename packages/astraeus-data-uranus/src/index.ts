import type { DataSource, MoonIndex } from "astraeus";
import { chunkUrls } from "./chunks.js";

/** Reads Uranus's index (the moons, their fits and the measured errors). A dynamic import, so a bundler keeps it as its own file. */
export const loadIndex = async (): Promise<MoonIndex> => {
  const loaded = (await import("../data/uranus-moons/index.json", { with: { type: "json" } })) as { default?: MoonIndex };
  return loaded.default ?? (loaded as MoonIndex); // Parcel hands back the JSON itself, Vite and webpack a module with a default
};

export { chunkUrls };

/** Hand this to `mount(element, scene, { data: [dataSource] })` to give Uranus's moons their positions. */
export const dataSource: DataSource = Object.freeze({
  name: "astraeus-data-uranus",
  provides: [],
  moonPositions: Object.freeze({ center: "uranus", loadIndex, chunkUrls }),
});
