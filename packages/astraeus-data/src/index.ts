import type { DataSource } from "astraeus";
import { PICTURES } from "./pictures.js";

export { PICTURES };

/**
 * Hand this to `mount(element, scene, { data: [dataSource] })` to give the moons their maps, Venus its 8k map and the sky its Milky Way.
 * It provides no bodies of its own (a moon also needs its planet's positions package), so it is never what a missing-data error names.
 */
export const dataSource: DataSource = Object.freeze({ name: "astraeus-data", provides: [], pictures: PICTURES });
