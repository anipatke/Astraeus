import { describe, expect, it } from "vitest";
import { chunkCovers, chunkPositionInto, decodeChunk } from "../src/core/chebyshevSeries";
import { utcMsToTdbSeconds, utcMsToTtSeconds, type TimeScaleTable } from "../src/core/timeScale";
import { encodeChunk } from "../tools/import/chebyshevFit";

// A fit's seconds are typed by their time scale (O-093 T-372). The slips below are compile-time checks (the typecheck gate), plus one runtime row.
const TABLE: TimeScaleTable = { pieces: [{ fromUtcMs: Date.UTC(1972, 0, 1), ttMinusUtcS: 42.184, driftSPerDay: 0 }], validToUtcMs: Date.UTC(2100, 0, 1) };
const timeUtcMs = Date.UTC(2016, 0, 1);
const START_S = utcMsToTdbSeconds(TABLE, timeUtcMs);
const SEGMENT_S = 86_400;
const coefficients = Float64Array.from([1000, 0, 0, 0, 0, 0, 0, 0, 0]);
const bytes = encodeChunk({ startTdbS: START_S, segmentCount: 1, coefficientCount: 3, quantumKm: 1e-3, coefficients });
const chunk = decodeChunk<"tdb">(bytes, { startTdbS: START_S, segmentSeconds: SEGMENT_S, segmentCount: 1, coefficientCount: 3, quantumKm: 1e-3 });
const out = new Float64Array(3);

describe("a fit is evaluated only at seconds in its own time scale", () => {
  it("refuses a UTC millisecond, a millisecond divided by nothing and TT seconds", () => {
    const noRun = (): void => {
      chunkPositionInto(chunk, utcMsToTdbSeconds(TABLE, timeUtcMs), out, 0);
      // @ts-expect-error a UTC millisecond is not TDB seconds
      chunkPositionInto(chunk, timeUtcMs, out, 0);
      // @ts-expect-error dividing by 1000 does not make UTC TDB seconds
      chunkPositionInto(chunk, timeUtcMs / 1000, out, 0);
      // @ts-expect-error TT seconds are not TDB seconds
      chunkPositionInto(chunk, utcMsToTtSeconds(TABLE, timeUtcMs), out, 0);
    };
    expect(typeof noRun).toBe("function");
  });

  it("evaluates a decoded chunk at a branded time", () => {
    const noon = utcMsToTdbSeconds(TABLE, timeUtcMs + 12 * 3_600_000);
    expect(chunkCovers(chunk, noon)).toBe(true);
    chunkPositionInto(chunk, noon, out, 0);
    expect(Number.isFinite(out[0])).toBe(true);
  });
});
