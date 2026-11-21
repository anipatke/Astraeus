import { describe, expect, it } from "vitest";
import { SUN } from "../src/core/bodies/sun";
import { buildElementsBody, type ElementsBodyRecord } from "../src/core/elementsBody";

// T-342 (O-082, AH-02, AH-08): an orbit's epoch is one instant whichever time scale it is written in, and its two-body motion uses the
// centre's own mass. The probe case is Codex's: a = 1 AU, e = 0.2, perihelion JD 2451500 TDB, epoch JD 2451545 in UTC versus the same
// instant in TT (+64.184 s). Before the fix the UTC epoch was subtracted from a TDB perihelion unconverted, 2,154 km apart.

const JD_J2000 = 2_451_545;
const TT_MINUS_UTC_S = 64.184;
const UNIX_AT_JD_J2000_UTC = 946_728_000_000;
const centre = { id: SUN.id, gmKm3S2: SUN.gmKm3S2! };
const norm = (v: ArrayLike<number>) => Math.hypot(v[0], v[1], v[2]);

function record(epoch: ElementsBodyRecord["epoch"], placement: { perihelionJdTdb: number } | { meanAnomalyDeg: number }): ElementsBodyRecord {
  return {
    id: "probe",
    label: "Probe",
    elements: { semiMajorAxisAu: 1, eccentricity: 0.2, inclinationDeg: 10, ascendingNodeDeg: 20, argumentOfPerihelionDeg: 30, ...placement },
    epoch,
    plane: "ecliptic-j2000",
    source: { name: "test", url: "https://example.test", solution: "probe", accessed: "2026-11-21" },
    accuracy: { classification: "approximate", statement: "test", valid: { start: "2000-01-01T00:00:00Z", end: "2001-01-01T00:00:00Z" }, limitations: [] },
    marker: { color: "#9fe3ff", sizePx: 7 },
  };
}

const gapMetres = (a: ElementsBodyRecord, b: ElementsBodyRecord, times: readonly number[]) => {
  const first = buildElementsBody(a, centre).create();
  const second = buildElementsBody(b, centre).create();
  return Math.max(...times.map((t) => {
    const p = first.stateAt(t).positionKm;
    const q = second.stateAt(t).positionKm;
    return norm([p[0] - q[0], p[1] - q[1], p[2] - q[2]]) * 1000;
  }));
};

const TIMES = [0, 10, 100].map((days) => UNIX_AT_JD_J2000_UTC + days * 86_400_000);
// The same instant written in TDB. A record's documented convention takes TDB as TT for the clock (under 2 ms apart), so a TDB epoch is
// the TT one under another name; the perihelion time, in TDB, is subtracted from it as written.
const tdbJdOfUtcNoon = JD_J2000 + TT_MINUS_UTC_S / 86_400;

describe("an orbit's epoch is one instant in any time scale (T-342)", () => {
  const cases: readonly [string, { perihelionJdTdb: number } | { meanAnomalyDeg: number }][] = [
    ["a perihelion time (TDB)", { perihelionJdTdb: 2_451_500 }],
    ["a mean anomaly", { meanAnomalyDeg: 123.4 }],
  ];
  for (const [label, placement] of cases) {
    it(`UTC and TT epochs of the same instant agree within a metre, with ${label}`, () => {
      const utc = record({ jd: JD_J2000, timeScale: "UTC" }, placement);
      const tt = record({ jd: JD_J2000 + TT_MINUS_UTC_S / 86_400, timeScale: "TT", ttMinusUtcSeconds: TT_MINUS_UTC_S }, placement);
      expect(gapMetres(utc, tt, TIMES)).toBeLessThan(1);
    });
    // The record documents TDB as TT for the clock (their difference is under 2 ms, about 60 m of motion at most; here TDB - TT is 0.1 ms,
    // about 3 m), and the engine's epoch is a whole millisecond, so a TDB epoch agrees to that convention, not to a metre.
    it(`UTC and TDB epochs of the same instant agree within the TDB-as-TT convention (5 m here), with ${label}`, () => {
      const utc = record({ jd: JD_J2000, timeScale: "UTC" }, placement);
      const tdb = record({ jd: tdbJdOfUtcNoon, timeScale: "TDB", ttMinusUtcSeconds: TT_MINUS_UTC_S }, placement);
      expect(gapMetres(utc, tdb, TIMES)).toBeLessThan(5);
    });
  }

  it("moves the body by its true mean motion about the given centre's mass", () => {
    const heavy = { id: SUN.id, gmKm3S2: SUN.gmKm3S2! * 4 };
    const rec = record({ jd: JD_J2000, timeScale: "UTC" }, { meanAnomalyDeg: 0 });
    const body = buildElementsBody(rec, heavy);
    // At perihelion the speed is sqrt(GM (1+e) / (a (1-e))): four times the mass doubles it.
    const a = 149_597_870.7;
    const expected = Math.sqrt((heavy.gmKm3S2 * 1.2) / (a * 0.8));
    const t = body.epochUtcMs;
    const [p, q] = [body.create().stateAt(t - 500).positionKm, body.create().stateAt(t + 500).positionKm];
    expect(norm([q[0] - p[0], q[1] - p[1], q[2] - p[2]])).toBeCloseTo(expected, 3);
  });
});
