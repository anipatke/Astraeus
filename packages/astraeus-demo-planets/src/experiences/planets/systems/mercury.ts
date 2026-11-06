// Mercury's system for the planets experience: Mercury alone (no moon), with its tagged places. The words and numbers are data/planets/mercury.json.
import type { PlanetSystem } from "../planetScene";
import { packagesOf } from "../planetSystemParts";

/** The tagged places of Mercury: its body package's features and categories, read as they are stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus-data/data/bodies/mercury/{features,categories}.json", { eager: true, import: "default" }) as Record<string, unknown>;

export const mercurySystem: PlanetSystem = {
  bodies: [{ id: "mercury" }],
  packages: packagesOf(PACKAGES, ["mercury"]),
  data: [],
};
