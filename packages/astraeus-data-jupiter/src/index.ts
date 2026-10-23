import type { DataSource } from "astraeus";
import { chunkUrls } from "./chunks.js";

/** Reads Jupiter's index (the moons, their fits and the measured errors). A dynamic import, so a bundler keeps it as its own file. */
export const loadIndex = async (): Promise<unknown> => (await import("../data/jupiter-moons/index.json", { with: { type: "json" } })).default as unknown;

export { chunkUrls };

/** Hand this to `mount(element, scene, { data: [dataSource] })` to give Jupiter's moons their positions. */
export const dataSource: DataSource = Object.freeze({
  name: "astraeus-data-jupiter",
  provides: ["io", "europa", "ganymede", "callisto"],
  moonPositions: Object.freeze({ centre: "jupiter", loadIndex, chunkUrls }),
});
