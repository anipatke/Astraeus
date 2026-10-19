import type { CelestialBodyDefinition } from "../body";
import { createProvenance } from "../provenance";

/** The root of the catalogue: every other body's chain ends here, and it has no provider of its own. */
export const SUN: CelestialBodyDefinition = Object.freeze({
  id: "sun",
  label: "Sun",
  radiusKm: 695_700,
  gmKm3S2: 132_712_440_018,
  orientation: "none",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: ["IAU 2015 Resolution B3 nominal solar radius", "NASA NSSDC Sun fact sheet"],
      accuracy: "Nominal photospheric radius; the Sun is drawn as a sphere.",
      notes: "Gravitational parameter matches the @lizard-isana/orb 3.1.1 table (a test asserts it).",
    }),
    position: createProvenance({
      sourceType: "ephemeris",
      sources: ["@lizard-isana/orb 3.1.1 EPV00 model (ERFA, fitted to JPL DE405): the Sun's position is the negated Earth–Sun geometry"],
      accuracy: "The geocentric direction was checked against JPL Horizons (DE441) samples.",
      notes: "Stated EPV00 model validity is 1900–2100.",
    }),
    validUtc: Object.freeze({ startUtcMs: Date.UTC(1900, 0, 1), endUtcMs: Date.UTC(2100, 0, 1) }),
    orientationLimitations: Object.freeze(["The Sun's orientation is not modelled: the surface map is a visual stand-in at a fixed orientation, and the real solar rotation axis and longitude are not drawn."]),
  }),
});
