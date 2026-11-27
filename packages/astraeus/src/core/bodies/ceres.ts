/**
 * Ceres (O-102 T-467), the dwarf planet: a sphere placed Sun-centred from the fit of JPL Horizons' vectors that `astraeus-data` carries
 * (`data/positions/ceres.json`, T-464) and handed in through `DataSource.bodyPositions` (T-465), turned by the IAU pole and prime meridian.
 * It is not in the first download: without `astraeus-data` a scene holding Ceres fails at mount with `missing-data`.
 */
import type { CelestialBodyDefinition, EphemerisRecord, StateSourceBinding } from "../body";
import type { IauRotationElements } from "../iauRotation";
import { createProvenance } from "../provenance";
import { IAU_REPORT, ROTATION_LIMITATION } from "./planetRecords";
import { packageSeriesBinding } from "./planetTrajectory";

/** Pole and prime meridian from the IAU 2015 report as transcribed in NAIF pck00011.tpc: degrees, pole per Julian century, W per day. */
export const CERES_ROTATION: IauRotationElements = Object.freeze<IauRotationElements>({
  poleRaDeg: [291.418, 0],
  poleDecDeg: [66.764, 0],
  primeMeridianDeg: [170.65, 952.1532],
  citation: IAU_REPORT,
});

const POSITION = createProvenance({
  sourceType: "ephemeris",
  sources: [
    "JPL Horizons API 1.2, COMMAND '1;' (1 Ceres (A801 AA), small-body solution JPL#48), about the Sun's centre (CENTER=500@10), VECTORS geometric ICRF km TDB, accessed 2026-11-27; fitted by tools/import/planet-fits.mjs --small ceres. US Government work, credit NASA/JPL-Caltech Solar System Dynamics",
  ],
  accuracy: "Within 0.774 km of Horizons' Ceres at independent dates 1950 to 2045 (the fit's measured worst error).",
  notes: "Geometric position about the Sun's centre; no light-time or aberration.",
});

/** Ceres's position record, the kind each planet has: its provenance and what the fit does not do. */
export const CERES_EPHEMERIS: EphemerisRecord = Object.freeze({
  provenance: POSITION,
  knownLimitations: Object.freeze([
    "Dates outside 1950 to 2045 have no position: the fit stops there and the scene reports out-of-span.",
    "No velocity is modelled, so Ceres has no speed readout.",
  ]),
});

/** Ceres is a solid sphere (IAU mean radius 469.7 km). */
export const CERES: CelestialBodyDefinition = Object.freeze({
  id: "ceres",
  label: "Ceres",
  radiusKm: 469.7,
  gmKm3S2: 62.6284,
  parentId: "sun",
  orientation: "iau-rotation",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: [
        "JPL Horizons physical data for 1 Ceres (the header of the vectors reply), accessed 2026-11-27: RAD = 469.7 km, GM = 62.6284 km^3/s^2",
      ],
      accuracy: "Mean radius (the IAU value) and GM as printed in the Horizons header; Ceres is drawn as a sphere.",
      notes: "Gravitational parameter in km^3/s^2 from the same header.",
    }),
    position: CERES_EPHEMERIS.provenance,
    positionLimitations: CERES_EPHEMERIS.knownLimitations,
    validUtc: Object.freeze({ startUtcMs: Date.UTC(1950, 0, 1), endUtcMs: Date.UTC(2045, 0, 1) }),
    orientationLimitations: Object.freeze([ROTATION_LIMITATION, `Constants: ${IAU_REPORT}.`]),
  }),
});

/** Ceres's one state source: its series arrives with `astraeus-data` (`packageSeriesBinding`). */
export const CERES_BINDING: StateSourceBinding = packageSeriesBinding(CERES.id, CERES_ROTATION);
