import type { DataSource } from "astraeus";
import { chunkUrls } from "./chunks.js";

/** Reads Neptune's index (the moons, their fits and the measured errors). A dynamic import, so a bundler keeps it as its own file. */
export const loadIndex = async (): Promise<unknown> => {
  const loaded = (await import("../data/neptune-moons/index.json", { with: { type: "json" } })) as { default?: unknown };
  return loaded.default ?? loaded; // Parcel hands back the JSON itself, Vite and webpack a module with a default
};

export { chunkUrls };

/** Hand this to `mount(element, scene, { data: [dataSource] })` to give Neptune's moons their positions. */
export const dataSource: DataSource = Object.freeze({
  name: "astraeus-data-neptune",
  provides: ["triton"],
  moonPositions: Object.freeze({ centre: "neptune", loadIndex, chunkUrls }),
});
