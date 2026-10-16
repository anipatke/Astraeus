import type { CelestialBodyDefinition, EphemerisRecord } from "../body";
import { createProvenance } from "../provenance";

const TIDAL_LOCK_LIMITATION = "The Moon's orientation is an approximate tidal lock that keeps its near side towards Earth, with no libration, so surface features can sit several degrees from their true place.";
const LANDING_SITE_OFFSET = "Because there is no libration, an IAU-placed landing site (measured at the Sea of Tranquility in Spike 02) sits 254 km (8.4°) from the same selenographic coordinates on this Moon at touchdown (docs/ASTRAEUS_SPIKE_02.md).";

export const MOON_EPHEMERIS: EphemerisRecord = {
  provenance: createProvenance({
    sourceType: "ephemeris",
    sources: ["@lizard-isana/orb 3.1.1 Luna: truncated Meeus-style lunar series, converted to Earth-centred J2000 equatorial"],
    accuracy: "Position checked against JPL Horizons (DE441) samples within the project's acceptance targets; targets and sample maxima are in docs/ASTRONOMY_VALIDATION.md. They are not a guaranteed bound for every date.",
    notes: "Body size is the volumetric mean radius (NASA NSSDC fact sheet).",
  }),
  knownLimitations: [
    TIDAL_LOCK_LIMITATION,
    "No velocity is modelled for the Moon, so it has no speed readout.",
  ],
};

export const MOON: CelestialBodyDefinition = Object.freeze({
  id: "moon",
  label: "Moon",
  // Volumetric mean radius in km from the NASA NSSDC Moon fact sheet.
  radiusKm: 1737.4,
  gmKm3S2: 4902.800066,
  parentId: "earth",
  orientation: "tidal-lock",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: ["NASA NSSDC Moon fact sheet (volumetric mean radius)"],
      accuracy: "Mean radius only; the Moon is drawn as a sphere.",
      notes: "Gravitational parameter matches the @lizard-isana/orb 3.1.1 table (a test asserts it).",
    }),
    position: MOON_EPHEMERIS.provenance,
    // The sampled Horizons comparison range (tests/fixtures/moon-horizons.json); the truncated series states no validity range of its own.
    validUtc: Object.freeze({ startUtcMs: Date.UTC(2022, 5, 1), endUtcMs: Date.UTC(2025, 5, 1) }),
    orientationLimitations: Object.freeze([TIDAL_LOCK_LIMITATION, LANDING_SITE_OFFSET]),
  }),
});
