import type { EphemerisRecord } from "../body";
import type { TimeBounds } from "../trajectory";
import { createProvenance } from "../provenance";

/** The dates the planets were compared with JPL Horizons (tests/fixtures/planets-horizons.json): 1969-07-21 to 2030-06-01. */
export const PLANET_VALIDATED_UTC: TimeBounds = Object.freeze({ startUtcMs: Date.UTC(1969, 6, 21), endUtcMs: Date.UTC(2030, 5, 1) });

export const IAU_REPORT = "Archinal et al., Report of the IAU Working Group on Cartographic Coordinates and Rotational Elements: 2015, Celestial Mechanics and Dynamical Astronomy 130, article 22 (2018), as transcribed in NAIF pck00011.tpc (2022-12-27)";

export const ROTATION_LIMITATION = "Orientation is the IAU pole direction (linear in time) and prime meridian (linear in time) only; the report's periodic nutation and libration terms are left out, and TT stands in for TDB.";

/** Position provenance shared by the four VSOP87A planets; `measured` is the sample maximum quoted from docs/ASTRONOMY_VALIDATION.md. */
export function planetEphemeris(label: string, measured: string, extraLimitations: readonly string[] = []): EphemerisRecord {
  return {
    provenance: createProvenance({
      sourceType: "ephemeris",
      sources: [
        "@lizard-isana/orb 3.1.1 VSOP87A full series (Bretagnon and Francou 1988), heliocentric ecliptic J2000, converted to Earth-equatorial J2000",
      ],
      accuracy: `${label} position was compared with JPL Horizons (DE441) at six dates from 1969 to 2030: ${measured}. Sample maxima, not a bound for every date.`,
      notes: "Geometric position about the Sun's centre; no light-time or aberration.",
    }),
    knownLimitations: ["No velocity is modelled for planets, so they have no speed readout.", ...extraLimitations],
  };
}
