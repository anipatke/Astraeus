// Earth's system for the planets experience: Earth and the Moon as Apollo draws them (the Moon from the astronomy adapter, with its monthly loop), with
// both bodies' tagged places. No moon list and no fitted data: nothing is downloaded beyond the page. The words and numbers are data/planets/earth.json.
import type { PlanetSystem } from "../planetScene";
import { packagesOf } from "../planetSystemParts";

/** The tagged places of Earth and the Moon: each body package's features and categories, read as they are stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus-data/data/bodies/{earth,moon}/{features,categories}.json", { eager: true, import: "default" }) as Record<string, unknown>;

export const earthSystem: PlanetSystem = {
  bodies: [{ id: "earth" }, { id: "moon", orbit: true }],
  packages: packagesOf(PACKAGES, ["earth", "moon"]),
  data: [],
};
