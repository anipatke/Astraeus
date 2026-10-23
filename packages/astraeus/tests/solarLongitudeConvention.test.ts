// I-027: the IAU MDC peak solar longitudes are J2000.0 values ("All records on J2000"), so the fact helper must return the Sun's longitude in the
// J2000 ecliptic and equinox, not the longitude of date. Pinned against JPL Horizons geometric vectors of Earth about the Sun in the J2000 ecliptic,
// fetched live (VEC_CORR=NONE, REF_PLANE=ECLIPTIC, REF_SYSTEM=ICRF) and archived raw in tests/fixtures/earth-ecliptic-j2000-horizons.json.
import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import fixture from "./fixtures/earth-ecliptic-j2000-horizons.json";
import { solarLongitudeDeg } from "./helpers/streamFacts";

const adapter = createOrbAstronomyAdapter();
const toEqj = createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix();

const rows = [...fixture.result.split("$$SOE")[1].split("$$EOE")[0].matchAll(/^(\d+\.\d+) = A\.D\.[^\n]*\n\s*X =\s*(\S+)\s+Y =\s*(\S+)\s+Z =\s*(\S+)/gm)].map((m) => ({
  timeUtcMs: Math.round((Number(m[1]) - 2_440_587.5) * 86_400_000),
  x: Number(m[2]),
  y: Number(m[3]),
}));

describe("solar longitude convention (I-027)", () => {
  it("reads three archived Horizons vectors", () => {
    expect(rows).toHaveLength(3);
  });

  it("is the J2000 longitude: the Horizons J2000-ecliptic vector's longitude plus 180 degrees, within 0.005 degrees", () => {
    for (const r of rows) {
      const horizons = ((Math.atan2(-r.y, -r.x) * 180) / Math.PI + 360) % 360;
      expect(Math.abs(solarLongitudeDeg(adapter, toEqj, r.timeUtcMs) - horizons)).toBeLessThan(0.005);
    }
  });

  it("gives the known figures: 139.673 deg at 2027-08-13T00:00Z and 261.620 deg at 2026-12-14T00:00Z, not the of-date 140.06 and 262.00", () => {
    const at = (iso: string): number => solarLongitudeDeg(adapter, toEqj, Date.parse(iso));
    expect(at("2027-08-13T00:00:00Z")).toBeCloseTo(139.673, 2);
    expect(at("2026-12-14T00:00:00Z")).toBeCloseTo(261.62, 2);
  });
});
