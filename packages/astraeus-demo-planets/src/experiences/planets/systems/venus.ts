// Venus's system for the planets experience: Venus alone (no moon), with its tagged places. The words and numbers are data/planets/venus.json.
import type { PlanetSystem } from "../planetScene";
import { packagesOf } from "../planetSystemParts";

/** The tagged places of Venus: its body package's features and categories, read as they are stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus-data/data/bodies/venus/{features,categories}.json", { eager: true, import: "default" }) as Record<string, unknown>;

export const venusSystem: PlanetSystem = {
  bodies: [{ id: "venus" }],
  packages: packagesOf(PACKAGES, ["venus"]),
  data: [],
};
