import type { CelestialBodyDefinition } from "../body";
import type { IauRotationElements } from "../iauRotation";
import { createProvenance } from "../provenance";
import { IAU_REPORT, PLANET_VALIDATED_UTC, planetEphemeris, ROTATION_LIMITATION } from "./planetRecords";

export const JUPITER_EPHEMERIS = planetEphemeris("Jupiter", "at most 1269 km (0.33 arcsec) from Horizons", ["The largest sampled difference from the Horizons body centre is about 1.3 thousand km, larger than the inner planets because the series is fitted to the planet as a system."]);

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
