import type { CelestialBodyDefinition } from "../body";
import type { IauRotationElements } from "../iauRotation";
import { createProvenance } from "../provenance";
import { IAU_REPORT, PLANET_VALIDATED_UTC, planetEphemeris, ROTATION_LIMITATION } from "./planetRecords";

export const MARS_EPHEMERIS = planetEphemeris("Mars", "at most 96 km (0.09 arcsec) from Horizons");

/** Mars pole and prime meridian from the IAU 2015 report: degrees, pole per Julian century, W per day, from J2000 TDB. */
export const MARS_ROTATION: IauRotationElements = Object.freeze<IauRotationElements>({
  poleRaDeg: [317.269202, -0.10927547],
  poleDecDeg: [54.432516, -0.05827105],
  primeMeridianDeg: [176.049863, 350.891982443297],
  citation: IAU_REPORT,
});

export const MARS: CelestialBodyDefinition = Object.freeze({
  id: "mars",
  label: "Mars",
  radiusKm: 3389.5,
  equatorialRadiusKm: 3396.2,
  polarRadiusKm: 3376.2,
  gmKm3S2: 42_828.375662,
  parentId: "sun",
  orientation: "iau-rotation",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: [
        "NASA NSSDC Mars fact sheet (https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html), read 2026-10-12",
        "JPL Horizons physical data for Mars (gravitational parameter), read 2026-10-12",
      ],
      accuracy: "Fact-sheet volumetric mean, equatorial and polar radii; the 20 km flattening is drawn as a spheroid.",
      notes: "Gravitational parameter in km^3/s^2 from the Horizons physical-data header.",
    }),
    position: MARS_EPHEMERIS.provenance,
    validUtc: PLANET_VALIDATED_UTC,
    orientationLimitations: Object.freeze([ROTATION_LIMITATION, `Constants: ${IAU_REPORT}.`]),
  }),
});
