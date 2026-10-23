import type { DataSource } from "astraeus";
import { chunkUrls } from "./chunks.js";

/** Reads Uranus's index (the moons, their fits and the measured errors). A dynamic import, so a bundler keeps it as its own file. */
export const loadIndex = async (): Promise<unknown> => (await import("../data/uranus-moons/index.json", { with: { type: "json" } })).default as unknown;

export { chunkUrls };

/** Hand this to `mount(element, scene, { data: [dataSource] })` to give Uranus's moons their positions. */
export const dataSource: DataSource = Object.freeze({
  name: "astraeus-data-uranus",
  provides: [],
  moonPositions: Object.freeze({ centre: "uranus", loadIndex, chunkUrls }),
});
