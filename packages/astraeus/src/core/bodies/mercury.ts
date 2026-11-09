import type { CelestialBodyDefinition } from "../body";
import type { IauRotationElements } from "../iauRotation";
import { createProvenance } from "../provenance";
import { IAU_REPORT, PLANET_VALIDATED_UTC, planetEphemeris, ROTATION_LIMITATION } from "./planetRecords";

export const MERCURY_EPHEMERIS = planetEphemeris("Mercury", "199", "DE441 (Mercury has no moons: its barycentre, 1, is the planet)", "Within 0.4 km of Horizons' Mercury on 2 January of each year 1972 to 2044 (O-063 T-290); the fit is within 0.62 km of Horizons at independent dates 1950 to 2045.");

/** Mercury pole and prime meridian from the IAU 2015 report: degrees, pole per Julian century, W per day, from J2000 TDB. */
export const MERCURY_ROTATION: IauRotationElements = Object.freeze<IauRotationElements>({
  poleRaDeg: [281.0103, -0.0328],
  poleDecDeg: [61.4155, -0.0049],
  primeMeridianDeg: [329.5988, 6.1385108],
  citation: IAU_REPORT,
});

export const MERCURY: CelestialBodyDefinition = Object.freeze({
  id: "mercury",
  label: "Mercury",
  radiusKm: 2439.7,
  gmKm3S2: 22_031.86855,
  parentId: "sun",
  orientation: "iau-rotation",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: [
        "NASA NSSDC Mercury fact sheet (https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html), read 2026-10-12",
        "JPL Horizons physical data for Mercury (gravitational parameter), read 2026-10-12",
      ],
      accuracy: "Volumetric mean radius only (2439.7 km; the fact-sheet equatorial and polar radii differ by 2.2 km); drawn as a sphere.",
      notes: "Gravitational parameter in km^3/s^2 from the Horizons physical-data header.",
    }),
    position: MERCURY_EPHEMERIS.provenance,
    validUtc: PLANET_VALIDATED_UTC,
    orientationLimitations: Object.freeze([ROTATION_LIMITATION, `Constants: ${IAU_REPORT}.`]),
  }),
});
