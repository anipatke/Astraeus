import type { CelestialBodyDefinition } from "../body";
import type { IauRotationElements } from "../iauRotation";
import { createProvenance } from "../provenance";
import { IAU_REPORT, PLANET_VALIDATED_UTC, planetEphemeris, ROTATION_LIMITATION } from "./planetRecords";

export const VENUS_EPHEMERIS = planetEphemeris("Venus", "at most 50 km (0.10 arcsec) from Horizons");

/** Venus pole and prime meridian from the IAU 2015 report: degrees, pole per Julian century, W per day, from J2000 TDB. */
export const VENUS_ROTATION: IauRotationElements = Object.freeze<IauRotationElements>({
  poleRaDeg: [272.76, 0],
  poleDecDeg: [67.16, 0],
  primeMeridianDeg: [160.20, -1.4813688],
  citation: IAU_REPORT,
});

export const VENUS: CelestialBodyDefinition = Object.freeze({
  id: "venus",
  label: "Venus",
  radiusKm: 6051.8,
  equatorialRadiusKm: 6051.8,
  polarRadiusKm: 6051.8,
  gmKm3S2: 324_858.592,
  parentId: "sun",
  orientation: "iau-rotation",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: [
        "NASA NSSDC Venus fact sheet (https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html), read 2026-10-12",
        "JPL Horizons physical data for Venus (gravitational parameter), read 2026-10-12",
      ],
      accuracy: "Fact-sheet radii; Venus has no measurable flattening (equatorial and polar radii are both 6051.8 km).",
      notes: "Gravitational parameter in km^3/s^2 from the Horizons physical-data header.",
    }),
    position: VENUS_EPHEMERIS.provenance,
    validUtc: PLANET_VALIDATED_UTC,
    orientationLimitations: Object.freeze([ROTATION_LIMITATION, `Constants: ${IAU_REPORT}.`]),
  }),
});
