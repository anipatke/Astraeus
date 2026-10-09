import { createProvenance, type Provenance } from "../core/provenance";

/**
 * Provenance for the engine's own Earth and Moon, the ephemeris equivalent of a trajectory's Provenance.
 * The measured sample residuals live in docs/ASTRONOMY_VALIDATION.md and are not repeated here.
 */
export interface EphemerisRecord {
  readonly provenance: Provenance;
  readonly knownLimitations: readonly string[];
}

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

export const MOON_EPHEMERIS: EphemerisRecord = {
  provenance: createProvenance({
    sourceType: "ephemeris",
    sources: ["@lizard-isana/orb 3.1.1 Luna: truncated Meeus-style lunar series, converted to Earth-centred J2000 equatorial"],
    accuracy: "Position checked against JPL Horizons (DE441) samples within the project's acceptance targets; targets and sample maxima are in docs/ASTRONOMY_VALIDATION.md. They are not a guaranteed bound for every date.",
    notes: "Body size is the volumetric mean radius (NASA NSSDC fact sheet).",
  }),
  knownLimitations: [
    "The Moon's orientation is an approximate tidal lock that keeps its near side towards Earth, with no libration, so surface features can sit several degrees from their true place.",
    "No velocity is modelled for the Moon, so it has no speed readout.",
  ],
};
