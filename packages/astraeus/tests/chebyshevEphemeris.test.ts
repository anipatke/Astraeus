import { describe, expect, it } from "vitest";
import {
  ChebyshevEphemeris,
  EphemerisChunkMissingError,
  EphemerisIndexError,
  loadEphemerisWindow,
  parseEphemerisIndex,
  UnknownEphemerisBodyError,
} from "../src/core/chebyshevEphemeris";
import { SeriesFormatError } from "../src/core/chebyshevSeries";
import { TrajectoryOutOfRangeError } from "../src/core/sampledTrajectory";
import { tdbMinusTtSeconds, TimeScaleOutOfRangeError, ttMinusUtcSeconds, utcMsToTdbSeconds, type TimeScaleTable } from "../src/core/timeScale";
import { encodeChunk, fitSegment, quantize, type StateSample } from "../tools/import/chebyshevFit";

const DAY = 86_400;
const J2000_NOON_UNIX_MS = 946_728_000_000;

/** Leap second at the start of 2017, as the real table has it. */
const TABLE: TimeScaleTable = {
  pieces: [
    { fromUtcMs: Date.UTC(2015, 6, 1), ttMinusUtcS: 68.184, driftSPerDay: 0 },
    { fromUtcMs: Date.UTC(2017, 0, 1), ttMinusUtcS: 69.184, driftSPerDay: 0 },
  ],
  validToUtcMs: Date.UTC(2018, 0, 1),
};

/** Made-up barycentric tracks: a slow wobbling centre and two bodies about it. Units km, km/s, TDB seconds. */
const TRACKS: Record<string, (t: number) => { p: [number, number, number]; v: [number, number, number] }> = {
  hub: (t) => {
    const w = (2 * Math.PI) / (1.77 * DAY);
    return { p: [80 * Math.cos(w * t), 80 * Math.sin(w * t), 5], v: [-80 * w * Math.sin(w * t), 80 * w * Math.cos(w * t), 0] };
  },
  fast: (t) => {
    const w = (2 * Math.PI) / (0.8 * DAY);
    return { p: [300_000 * Math.cos(w * t), 300_000 * Math.sin(w * t), 1_000 * Math.sin(w * t)], v: [-300_000 * w * Math.sin(w * t), 300_000 * w * Math.cos(w * t), 1_000 * w * Math.cos(w * t)] };
  },
  slow: (t) => {
    const w = (2 * Math.PI) / (200 * DAY);
    return { p: [9e6 * Math.cos(w * t), 9e6 * Math.sin(w * t), 1e6], v: [-9e6 * w * Math.sin(w * t), 9e6 * w * Math.cos(w * t), 0] };
  },
};

const SPAN_START = utcMsToTdbSeconds(TABLE, Date.UTC(2016, 9, 1));
const QUANTUM = 1e-6;

interface Built {
  index: unknown;
  files: Map<string, Uint8Array>;
}

/** Two chunks per body, the first ending exactly where the second starts. */
function build(): Built {
  const files = new Map<string, Uint8Array>();
  const plan: Record<string, { lengthS: number; degree: number; segmentsPerChunk: number }> = {
    hub: { lengthS: DAY, degree: 14, segmentsPerChunk: 60 },
    fast: { lengthS: 0.5 * DAY, degree: 16, segmentsPerChunk: 100 },
    slow: { lengthS: 8 * DAY, degree: 10, segmentsPerChunk: 8 },
  };
  const bodies = Object.entries(plan).map(([id, { lengthS, degree, segmentsPerChunk }]) => {
    const n = degree + 1;
    const chunks = [0, 1].map((c) => {
      const startTdbS = SPAN_START + c * segmentsPerChunk * lengthS;
      const coefficients = new Float64Array(segmentsPerChunk * 3 * n);
      for (let k = 0; k < segmentsPerChunk; k += 1) {
        const a = startTdbS + k * lengthS;
        const samples: StateSample[] = [];
        for (let i = 0; i <= 2 * n; i += 1) {
          const t = a + (i * lengthS) / (2 * n);
          const { p, v } = TRACKS[id](t);
          samples.push({ tdbS: t, positionKm: p, velocityKmS: v });
        }
        coefficients.set(quantize(fitSegment(samples, a, lengthS, degree), QUANTUM), k * 3 * n);
      }
      const bytes = encodeChunk({ startTdbS, segmentCount: segmentsPerChunk, coefficientCount: n, quantumKm: QUANTUM, coefficients });
      const path = `${id}/${c}.bin`;
      files.set(path, bytes);
      return { path, startTdbS, segmentCount: segmentsPerChunk, bytes: bytes.byteLength };
    });
    return {
      id,
      label: id,
      fit: { segmentSeconds: lengthS, degree, quantumKm: QUANTUM },
      chunks,
      provenance: { sourceType: "ephemeris", sources: ["made-up test tracks"], accuracy: "exact by construction", notes: "" },
    };
  });
  return { index: { format: "astraeus.chebyshev-ephemeris/1", id: "test-set", frame: "EQJ", centre: "hub", timeScale: TABLE, bodies }, files };
}

const built = build();

function loaded(): ChebyshevEphemeris {
  const ephemeris = new ChebyshevEphemeris(parseEphemerisIndex(built.index));
  for (const [path, bytes] of built.files) ephemeris.addChunk(path.split("/")[0], path, bytes);
  return ephemeris;
}

function expected(body: string, timeUtcMs: number): { p: number[]; v: number[] } {
  const t = utcMsToTdbSeconds(TABLE, timeUtcMs);
  const a = TRACKS[body](t);
  const c = TRACKS.hub(t);
  return { p: a.p.map((value, i) => value - c.p[i]), v: a.v.map((value, i) => value - c.v[i]) };
}

describe("time scale (src/core/timeScale.ts)", () => {
  it("steps TT - UTC at the leap second and holds it between steps", () => {
    expect(ttMinusUtcSeconds(TABLE, Date.UTC(2016, 11, 31, 23, 59, 59, 999))).toBe(68.184);
    expect(ttMinusUtcSeconds(TABLE, Date.UTC(2017, 0, 1))).toBe(69.184);
  });

  it("interpolates a drifting piece (UTC before 1972) along its line", () => {
    const table: TimeScaleTable = { pieces: [{ fromUtcMs: 0, ttMinusUtcS: 40, driftSPerDay: 0.001 }], validToUtcMs: 100 * DAY * 1000 };
    expect(ttMinusUtcSeconds(table, 10 * DAY * 1000)).toBeCloseTo(40.01, 12);
  });

  it("puts J2000 TDB at 2000-01-01 11:58:55.816 UTC to within the series' 2 ms periodic term", () => {
    const table: TimeScaleTable = { pieces: [{ fromUtcMs: Date.UTC(1999, 0, 1), ttMinusUtcS: 64.184, driftSPerDay: 0 }], validToUtcMs: Date.UTC(2001, 0, 1) };
    expect(Math.abs(utcMsToTdbSeconds(table, J2000_NOON_UNIX_MS - 64_184))).toBeLessThan(2e-3);
  });

  it("matches Horizons' TDB - UT (VEC_DELTA_T) less the leap seconds to a few microseconds", () => {
    // Horizons API, COMMAND=599 CENTER=500@5 VECTORS VEC_DELTA_T=YES TIME_TYPE=UT, monthly; these three rows as printed.
    const rows: [string, number][] = [["2016-11-01", 68.18253], ["2017-05-01", 69.185475], ["2024-08-01", 69.183292]];
    for (const [date, horizons] of rows) {
      const utc = Date.parse(`${date}T00:00:00Z`);
      const tt = (utc - J2000_NOON_UNIX_MS) / 1000 + (utc >= Date.UTC(2017, 0, 1) ? 69.184 : 68.184);
      const model = (utc >= Date.UTC(2017, 0, 1) ? 69.184 : 68.184) + tdbMinusTtSeconds(tt);
      expect(Math.abs(model - horizons)).toBeLessThan(1e-5);
    }
  });

  it("refuses a time outside the table with a named error", () => {
    expect(() => ttMinusUtcSeconds(TABLE, Date.UTC(2015, 0, 1))).toThrow(TimeScaleOutOfRangeError);
    expect(() => utcMsToTdbSeconds(TABLE, Date.UTC(2019, 0, 1))).toThrow(TimeScaleOutOfRangeError);
  });
});

describe("ChebyshevEphemeris provider", () => {
  it("answers centre-relative EQJ km with velocity, matching the tracks it was fitted to", () => {
    const ephemeris = loaded();
    const trajectory = ephemeris.trajectory("fast");
    for (const time of [Date.UTC(2016, 9, 3, 7, 13, 2, 517), Date.UTC(2016, 11, 31, 23, 59, 59), Date.UTC(2017, 0, 1, 0, 0, 1)]) {
      const state = trajectory.stateAt(time);
      const truth = expected("fast", time);
      expect(state.center).toBe("hub");
      expect(state.frame).toBe("EQJ");
      expect(state.orientation).toBeNull();
      expect(Math.hypot(...truth.p.map((value, i) => state.positionKm[i] - value))).toBeLessThan(1e-4);
      expect(Math.hypot(...truth.v.map((value, i) => state.velocityKmS![i] - value))).toBeLessThan(1e-7);
    }
  });

  it("is deterministic: the same time gives bit-identical states", () => {
    const time = Date.UTC(2016, 10, 4, 12);
    expect([...loaded().stateOf("slow", time).positionKm]).toEqual([...loaded().stateOf("slow", time).positionKm]);
  });

  it("gives the centre itself at exactly zero", () => {
    const state = loaded().stateOf("hub", Date.UTC(2016, 10, 4));
    expect([...state.positionKm]).toEqual([0, 0, 0]);
  });

  it("batch positions equal the single-body states", () => {
    const ephemeris = loaded();
    const time = Date.UTC(2016, 10, 20, 3, 4, 5);
    const out = new Float64Array(9);
    ephemeris.positionsKmInto(time, ["fast", "hub", "slow"], out);
    expect([...out.slice(0, 3)]).toEqual([...ephemeris.stateOf("fast", time).positionKm]);
    expect([...out.slice(3, 6)]).toEqual([0, 0, 0]);
    expect(Math.hypot(...[0, 1, 2].map((i) => out[6 + i] - ephemeris.stateOf("slow", time).positionKm[i]))).toBeLessThan(1e-9);
    expect(() => ephemeris.positionsKmInto(time, ["fast", "slow"], new Float64Array(5))).toThrow(/needs 6/);
  });

  it("is continuous across segment joins and the chunk join", () => {
    const ephemeris = loaded();
    const index = parseEphemerisIndex(built.index);
    for (const body of index.bodies.filter((entry) => entry.id !== "hub")) {
      const { segmentSeconds } = body.fit;
      const joins = [body.chunks[0].startTdbS + segmentSeconds, body.chunks[1].startTdbS, body.chunks[1].startTdbS + 2 * segmentSeconds];
      for (const joinTdb of joins) {
        // The UTC millisecond just before the join, and the next one.
        let ms = Math.floor(J2000_NOON_UNIX_MS + joinTdb * 1000 - 69_184);
        while (utcMsToTdbSeconds(TABLE, ms) > joinTdb) ms -= 1;
        while (utcMsToTdbSeconds(TABLE, ms + 1) <= joinTdb) ms += 1;
        const before = ephemeris.stateOf(body.id, ms);
        const after = ephemeris.stateOf(body.id, ms + 1);
        const speed = Math.hypot(...before.velocityKmS!);
        const step = Math.hypot(...[0, 1, 2].map((i) => after.positionKm[i] - before.positionKm[i]));
        expect(step).toBeLessThan(speed * 1e-3 + 1e-4);
      }
    }
  });

  it("states its bounds and answers exactly at them, refusing a millisecond outside", () => {
    const ephemeris = loaded();
    const trajectory = ephemeris.trajectory("slow");
    const { startUtcMs, endUtcMs } = trajectory.bounds;
    expect(() => trajectory.stateAt(startUtcMs)).not.toThrow();
    expect(() => trajectory.stateAt(endUtcMs)).not.toThrow();
    expect(() => trajectory.stateAt(startUtcMs - 1)).toThrow(TrajectoryOutOfRangeError);
    expect(() => trajectory.stateAt(endUtcMs + 1)).toThrow(TrajectoryOutOfRangeError);
    // A body's bounds are also limited by the centre's span (the hub ends before the slow body here).
    expect(ephemeris.boundsOf("slow").endUtcMs).toBe(ephemeris.boundsOf("hub").endUtcMs);
  });

  it("names its errors: unknown body, missing chunk, wrong centre, bad time", () => {
    const ephemeris = new ChebyshevEphemeris(parseEphemerisIndex(built.index));
    expect(() => ephemeris.trajectory("nobody")).toThrow(UnknownEphemerisBodyError);
    ephemeris.addChunk("hub", "hub/0.bin", built.files.get("hub/0.bin")!);
    const error = (() => {
      try {
        ephemeris.stateOf("fast", Date.UTC(2016, 9, 5));
      } catch (caught) {
        return caught;
      }
      return null;
    })();
    expect(error).toBeInstanceOf(EphemerisChunkMissingError);
    expect((error as EphemerisChunkMissingError).path).toBe("fast/0.bin");
    expect(() => loaded().trajectory("fast").stateAt(Date.UTC(2016, 10, 1), "elsewhere")).toThrow(/holds centre "hub"/);
    expect(() => loaded().stateOf("fast", 1.5)).toThrow(RangeError);
    expect(() => ephemeris.addChunk("fast", "fast/9.bin", new Uint8Array(30))).toThrow(/no chunk/);
    expect(() => ephemeris.addChunk("fast", "fast/0.bin", built.files.get("slow/0.bin")!)).toThrow(SeriesFormatError);
  });

  it("lists only the chunks a window needs, and loads only those", async () => {
    const ephemeris = new ChebyshevEphemeris(parseEphemerisIndex(built.index));
    const start = Date.UTC(2016, 9, 2);
    const end = Date.UTC(2016, 9, 10);
    expect(ephemeris.chunksFor(["fast"], start, end)).toEqual([{ body: "fast", path: "fast/0.bin" }, { body: "hub", path: "hub/0.bin" }]);
    const asked: string[] = [];
    const count = await loadEphemerisWindow(ephemeris, ["slow"], start, end, async (path) => {
      asked.push(path);
      return built.files.get(path)!;
    });
    expect(count).toBe(2);
    expect(asked.sort()).toEqual(["hub/0.bin", "slow/0.bin"]);
    expect(() => ephemeris.stateOf("slow", Date.UTC(2016, 9, 5))).not.toThrow();
    expect(() => ephemeris.chunksFor(["fast"], end, start)).toThrow(/before its start/);
  });
});

describe("ephemeris index validation (STYLE-06)", () => {
  const base = built.index as Record<string, unknown>;
  const bodies = base.bodies as Record<string, unknown>[];
  const variants: [string, unknown][] = [
    ["wrong format", { ...base, format: "other" }],
    ["wrong frame", { ...base, frame: "ECLIPJ2000" }],
    ["centre not a body", { ...base, centre: "elsewhere" }],
    ["duplicate ids", { ...base, bodies: [bodies[0], bodies[0]] }],
    ["chunks not contiguous", { ...base, bodies: [{ ...bodies[0], chunks: [(bodies[0].chunks as Record<string, unknown>[])[0], { ...(bodies[0].chunks as Record<string, unknown>[])[1], startTdbS: 0 }] }, ...bodies.slice(1)] }],
    ["bad degree", { ...base, bodies: [{ ...bodies[0], fit: { segmentSeconds: DAY, degree: 1.5, quantumKm: 1 } }, ...bodies.slice(1)] }],
    ["bad provenance", { ...base, bodies: [{ ...bodies[0], provenance: { sourceType: "guess", sources: [], accuracy: "", notes: "" } }, ...bodies.slice(1)] }],
    ["unsorted time scale", { ...base, timeScale: { pieces: [...TABLE.pieces].reverse(), validToUtcMs: TABLE.validToUtcMs } }],
    ["not an object", 42],
  ];
  for (const [label, raw] of variants) {
    it(`rejects an index with ${label}`, () => {
      expect(() => parseEphemerisIndex(raw)).toThrow(EphemerisIndexError);
    });
  }
});

describe("a span per body (O-047 T-195)", () => {
  const base = built.index as { bodies: Record<string, unknown>[] } & Record<string, unknown>;
  const withSpans = (_unused: undefined, own: Record<string, { fromUtc: string; toUtc: string }>) =>
    parseEphemerisIndex({ ...base, bodies: base.bodies.map((body) => (own[body.id as string] === undefined ? body : { ...body, span: own[body.id as string] })) });
  const fill = (index: ReturnType<typeof parseEphemerisIndex>): ChebyshevEphemeris => {
    const set = new ChebyshevEphemeris(index);
    for (const [path, bytes] of built.files) set.addChunk(path.split("/")[0], path, bytes);
    return set;
  };
  const day = (month: number, d: number) => Date.UTC(2016, month - 1, d);

  it("answers only inside its own span, whatever the siblings hold, and a body without one keeps its chunks' extent", () => {
    const set = fill(withSpans(undefined, { slow: { fromUtc: "2016-10-10", toUtc: "2016-10-20" } }));
    expect(set.boundsOf("slow").startUtcMs).toBeGreaterThanOrEqual(day(10, 10));
    expect(set.boundsOf("slow").endUtcMs).toBeLessThanOrEqual(day(10, 20));
    expect(set.boundsOf("fast").startUtcMs).toBeLessThanOrEqual(day(10, 3));
    expect(set.boundsOf("fast").endUtcMs).toBeGreaterThan(day(11, 20));
    expect(() => set.stateOf("slow", day(10, 7))).toThrow(TrajectoryOutOfRangeError);
    expect(() => set.stateOf("slow", day(10, 15))).not.toThrow();
    expect(() => set.stateOf("fast", day(10, 7))).not.toThrow();
    expect(() => set.stateOf("fast", day(9, 30))).toThrow(TrajectoryOutOfRangeError);
  });

  it("limits a body whose own span is wider than its chunks to the chunks", () => {
    const plain = fill(parseEphemerisIndex(base));
    const wide = fill(withSpans(undefined, { slow: { fromUtc: "2016-01-01", toUtc: "2017-06-01" } }));
    expect(wide.boundsOf("slow")).toEqual(plain.boundsOf("slow"));
  });

  it("rejects a malformed or reversed span", () => {
    expect(() => withSpans(undefined, { slow: { fromUtc: "2016-10-20", toUtc: "2016-10-10" } })).toThrow(EphemerisIndexError);
    expect(() => withSpans(undefined, { slow: { fromUtc: "never", toUtc: "2016-10-10" } })).toThrow(EphemerisIndexError);
  });
});
