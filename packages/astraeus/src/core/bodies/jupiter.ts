import type { CelestialBodyDefinition } from "../body";
import type { IauRotationElements } from "../iauRotation";
import { createProvenance } from "../provenance";
import { IAU_REPORT, PLANET_VALIDATED_UTC, planetEphemeris, ROTATION_LIMITATION } from "./planetRecords";

export const JUPITER_EPHEMERIS = planetEphemeris("Jupiter", "599", "DE441 with the Jupiter satellite ephemeris jup365_merged", "With the Jupiter moon package loaded (it covers 1950 to 2029), within 0.5 km of Horizons' Jupiter on 2 January of each year 1972 to 2029 and 0.22 to 0.24 km at the Voyager 1 and 2 closest approaches (O-063 T-290).", "Until the Jupiter moon package is loaded for the date Jupiter sits at its system barycentre, up to 216 km from its centre (measured 1972 to 2044).");

/** Jupiter pole and prime meridian from the IAU 2015 report: degrees, pole per Julian century, W per day, from J2000 TDB. */
export const JUPITER_ROTATION: IauRotationElements = Object.freeze<IauRotationElements>({
  poleRaDeg: [268.056595, -0.006499],
  poleDecDeg: [64.495303, 0.002413],
  primeMeridianDeg: [284.95, 870.5360000],
  citation: IAU_REPORT,
});

/** Jupiter is gaseous and its cloud bands rotate at different rates, so no single prime meridian fits the whole map. */
export const JUPITER_BAND_LIMITATION =
  "Jupiter's cloud bands rotate at different rates, so any prime meridian is approximate: the texture's orientation is a visual stand-in, not a measured longitude.";

export const JUPITER: CelestialBodyDefinition = Object.freeze({
  id: "jupiter",
  label: "Jupiter",
  radiusKm: 69911,
  equatorialRadiusKm: 71492,
  polarRadiusKm: 66854,
  gmKm3S2: 126_686_531.9,
  parentId: "sun",
  orientation: "iau-rotation",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: [
        "NASA NSSDC Jupiter fact sheet (https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html), read 2026-10-12",
        "JPL Horizons physical data for Jupiter (gravitational parameter), read 2026-10-12",
      ],
      accuracy: "Fact-sheet volumetric mean radius and the 1-bar equatorial and polar radii; the 6.5% flattening is drawn as a spheroid. The cloud-top level is not a solid surface.",
      notes: "Gravitational parameter in km^3/s^2 from the Horizons physical-data header.",
    }),
    position: JUPITER_EPHEMERIS.provenance,
    validUtc: PLANET_VALIDATED_UTC,
    orientationLimitations: Object.freeze([
      ROTATION_LIMITATION,
      JUPITER_BAND_LIMITATION,
      `Constants: ${IAU_REPORT}.`,
    ]),
  }),
});
