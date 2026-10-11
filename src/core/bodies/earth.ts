import type { CelestialBodyDefinition, EphemerisRecord } from "../body";
import { createProvenance } from "../provenance";

/**
 * Provenance for the engine's own Earth, the ephemeris equivalent of a trajectory's Provenance.
 * The measured sample residuals live in docs/ASTRONOMY_VALIDATION.md and are not repeated here.
 */
export const EARTH_EPHEMERIS: EphemerisRecord = {
  provenance: createProvenance({
    sourceType: "ephemeris",
    sources: [
      "@lizard-isana/orb 3.1.1 frames: IAU 2006 precession, IAU 2000B nutation, IAU 1982 Greenwich sidereal time",
      "@lizard-isana/orb EPV00 model (ERFA, fitted to JPL DE405) for Earth–Sun geometry",
    ],
    accuracy: "Earth is the centre every position here is measured from. Its rotation follows the IAU models listed. The Sun direction was checked against JPL Horizons (DE441) samples; sample maxima are in docs/ASTRONOMY_VALIDATION.md and are not a guaranteed bound for every date.",
    notes: "Body size is the volumetric mean radius (NASA NSSDC fact sheet).",
  }),
  knownLimitations: ["Earth's orientation leaves out polar motion."],
};

export const EARTH: CelestialBodyDefinition = Object.freeze({
  id: "earth",
  label: "Earth",
  // Volumetric mean radius in km from the NASA NSSDC Earth fact sheet.
  radiusKm: 6371.0,
  gmKm3S2: 398_600.4418,
  parentId: "sun",
  orientation: "ecef",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: ["NASA NSSDC Earth fact sheet (volumetric mean radius)"],
      accuracy: "Mean radius only; Earth is drawn as a sphere and its flattening is not modelled.",
      notes: "Gravitational parameter matches the @lizard-isana/orb 3.1.1 table (a test asserts it).",
    }),
    position: EARTH_EPHEMERIS.provenance,
    // The EPV00 model's stated validity.
    validUtc: Object.freeze({ startUtcMs: Date.UTC(1900, 0, 1), endUtcMs: Date.UTC(2100, 0, 1) }),
    orientationLimitations: EARTH_EPHEMERIS.knownLimitations,
  }),
});
