import type { DataSource } from "astraeus";
import { PICTURES } from "./pictures.js";

export { PICTURES };

/**
 * Hand this to `mount(element, scene, { data: [dataSource] })` to give the moons their maps, Venus its 8k map, the sky its Milky Way, and Ceres its
 * positions (1950 to 2045, read only when the scene holds Ceres, in its own chunk) and map. Ceres is the one body it provides, so it is what a
 * missing-data error for `ceres` names; a moon also needs its planet's positions package.
 */
export const dataSource: DataSource = Object.freeze({
  name: "astraeus-data",
  provides: ["ceres"],
  pictures: PICTURES,
  bodyPositions: Object.freeze({ ceres: () => import("../data/positions/ceres.json") }),
});
