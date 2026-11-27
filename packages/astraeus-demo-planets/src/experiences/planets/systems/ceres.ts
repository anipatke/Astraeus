// Ceres's system for the planets experience: Ceres alone (no moon), with its tagged places. The words and numbers are data/planets/ceres.json.
// Ceres is a built-in body whose positions and map ship in astraeus-data; the host mounts every planet with that package's data source (the site's `own`), so the system adds none.
import type { PlanetSystem } from "../planetScene";
import { packagesOf } from "../planetSystemParts";

/** The tagged places of Ceres and the map record that gives their longitude convention: its body package, read as it is stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus-data/data/bodies/ceres/{features,categories,map}.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

export const ceresSystem: PlanetSystem = {
  bodies: [{ id: "ceres" }],
  packages: packagesOf(PACKAGES, ["ceres"]),
  data: [],
};
