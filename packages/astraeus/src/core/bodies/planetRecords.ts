import type { EphemerisRecord } from "../body";
import type { TimeBounds } from "../trajectory";
import { createProvenance } from "../provenance";

/** The dates the planets were compared with JPL Horizons (tests/fixtures/planets-horizons.json): 1969-07-21 to 2030-06-01. */
export const PLANET_VALIDATED_UTC: TimeBounds = Object.freeze({ startUtcMs: Date.UTC(1969, 6, 21), endUtcMs: Date.UTC(2030, 5, 1) });

export const IAU_REPORT = "Archinal et al., Report of the IAU Working Group on Cartographic Coordinates and Rotational Elements: 2015, Celestial Mechanics and Dynamical Astronomy 130, article 22 (2018), as transcribed in NAIF pck00011.tpc (2022-12-27)";

export const ROTATION_LIMITATION = "Orientation is the IAU pole direction (linear in time) and prime meridian (linear in time) only; the report's periodic nutation and libration terms are left out, and TT stands in for TDB.";

/** The date the Horizons states behind the planet series were retrieved (O-063 T-290). */
export const PLANET_SERIES_RETRIEVED = "2026-11-10";

/** Before 1972 the engine and Horizons label the same instant differently; measured 1950 to 1971 against Horizons (tests/planetAccuracyFlybys.test.ts). */
const PRE_1972_LIMITATION = "Before 1972 a date is read on the engine's smooth TT - UTC, while Horizons labels times in UT1 (to 1962) and in UTC's rubber seconds (to 1972): the same label can be up to 0.7 s apart, so a planet can sit up to that much travel away from Horizons' position for that label (measured 1950 to 1971: Mercury 34.5 km, Venus 24.3, Mars 16.8, Jupiter 8.5, Saturn 6.2, Uranus 4.7, Neptune 3.5).";

/**
 * Position provenance shared by the planets (O-063 T-290): the series is the planet's system barycentre as JPL Horizons reports the planet, and a
 * planet with a moon system adds its own offset from that barycentre from its moon package when that is loaded. `body` names the Horizons
 * target, `centreSource` how Horizons places it, `measured` the figures against Horizons, `withoutPackage` what changes without the package.
 */
export function planetEphemeris(label: string, body: string, centreSource: string, measured: string, withoutPackage?: string): EphemerisRecord {
  return {
    provenance: createProvenance({
      sourceType: "ephemeris",
      sources: [
        `JPL Horizons API 1.2 (https://ssd.jpl.nasa.gov/api/horizons.api), ${label} (${body}) about the Sun's centre (CENTER=500@10)${withoutPackage === undefined ? "" : " and about its system barycentre"}, VECTORS geometric ICRF km TDB, 6-hourly 1950 to 2046, retrieved ${PLANET_SERIES_RETRIEVED}: ${centreSource}; the system barycentre fitted as piecewise Chebyshev series within 1 km (tools/import/planet-fits.mjs). US Government work, credit NASA/JPL-Caltech Solar System Dynamics`,
      ],
      accuracy: measured,
      notes: "Geometric position about the Sun's centre; no light-time or aberration.",
    }),
    knownLimitations: ["No velocity is modelled for planets, so they have no speed readout.", ...(withoutPackage === undefined ? [] : [withoutPackage]), PRE_1972_LIMITATION],
  };
}
