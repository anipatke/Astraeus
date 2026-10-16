import { Jupiter, Mars, Mercury, Venus } from "@lizard-isana/orb/src/orb-planet.js";
import { registerVSOP87A } from "@lizard-isana/orb/src/orb-vsop87a-registry.js";
import { JUPITER_FULL_COEF } from "@lizard-isana/orb/vsop87a/jupiter";
import { MARS_FULL_COEF } from "@lizard-isana/orb/vsop87a/mars";
import { MERCURY_FULL_COEF } from "@lizard-isana/orb/vsop87a/mercury";
import { VENUS_FULL_COEF } from "@lizard-isana/orb/vsop87a/venus";
import type { PlanetModels } from "./planetSeries";

/** Registers the full VSOP87A series and builds the planet models. Only planetSeries.ts imports this, lazily. */
export function createPlanetModels(): PlanetModels {
  registerVSOP87A("Mercury", MERCURY_FULL_COEF);
  registerVSOP87A("Venus", VENUS_FULL_COEF);
  registerVSOP87A("Mars", MARS_FULL_COEF);
  registerVSOP87A("Jupiter", JUPITER_FULL_COEF);
  const full = { vsop87a: "full" } as const;
  return { mercury: new Mercury(full), venus: new Venus(full), mars: new Mars(full), jupiter: new Jupiter(full) };
}
