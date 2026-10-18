import { describe, expect, it } from "vitest";
import { chebyshevValue, chebyshevValueAndSlope } from "../src/core/chebyshev";
import { chunkPositionInto, chunkStateInto, decodeChunk, SeriesFormatError } from "../src/core/chebyshevSeries";
import { encodeChunk, fitSegment, leastSquares, quantize, type StateSample } from "../tools/import/chebyshevFit";

const DAY = 86_400;

/** A made-up eccentric, precessing orbit with a small fast wobble: smooth, known exactly, and not a polynomial. */
function synthetic(tdbS: number): { p: [number, number, number]; v: [number, number, number] } {
  const w = (2 * Math.PI) / (1.77 * DAY);
  const wobble = (2 * Math.PI) / (0.9 * DAY);
  const r = 421_800;
  const p: [number, number, number] = [
    r * Math.cos(w * tdbS) + 3_000 * Math.cos(2 * w * tdbS) + 20 * Math.sin(wobble * tdbS),
    r * Math.sin(w * tdbS) + 1_500 * Math.sin(2 * w * tdbS),
    900 * Math.sin(w * tdbS + 0.3),
  ];
  const v: [number, number, number] = [
    -r * w * Math.sin(w * tdbS) - 6_000 * w * Math.sin(2 * w * tdbS) + 20 * wobble * Math.cos(wobble * tdbS),
    r * w * Math.cos(w * tdbS) + 3_000 * w * Math.cos(2 * w * tdbS),
    900 * w * Math.cos(w * tdbS + 0.3),
  ];
  return { p, v };
}

function samplesOn(startS: number, endS: number, stepS: number): StateSample[] {
  const samples: StateSample[] = [];
  for (let t = startS; t <= endS + 1e-6; t += stepS) {
    const { p, v } = synthetic(t);
    samples.push({ tdbS: t, positionKm: p, velocityKmS: v });
  }
  return samples;
}

describe("Chebyshev evaluation (src/core/chebyshev.ts)", () => {
  it("sums T_k(x) and its derivative as the closed forms do", () => {
    const c = [0.5, -1.25, 2, 0.75, -0.3, 0.1];
    for (const x of [-1, -0.62, 0, 0.31, 0.999, 1]) {
      const theta = Math.acos(x);
      const direct = c.reduce((sum, ck, k) => sum + ck * Math.cos(k * theta), 0);
      expect(chebyshevValue(c, 0, c.length, x)).toBeCloseTo(direct, 12);
      const out = new Float64Array(2);
      chebyshevValueAndSlope(c, 0, c.length, x, out, 0);
      expect(out[0]).toBeCloseTo(direct, 12);
      const h = 1e-6;
      const lo = Math.max(-1, x - h);
      const hi = Math.min(1, x + h);
      const numeric = (chebyshevValue(c, 0, c.length, hi) - chebyshevValue(c, 0, c.length, lo)) / (hi - lo);
      expect(out[1]).toBeCloseTo(numeric, 4);
    }
  });

  it("reads a block at an offset without touching its neighbours", () => {
    const block = [99, 99, 1, 2, 3, 99];
    expect(chebyshevValue(block, 2, 3, 0.5)).toBeCloseTo(1 + 2 * 0.5 + 3 * (2 * 0.25 - 1), 12);
  });
});

describe("least-squares fitting (tools/import/chebyshevFit.ts)", () => {
  it("solves an overdetermined system exactly when the data fit the model", () => {
    const rows = 7;
    const matrix = new Float64Array(rows * 3);
    const side = new Float64Array(rows);
    for (let i = 0; i < rows; i += 1) {
      const x = i / 3 - 1;
      matrix.set([1, x, x * x], i * 3);
      side[i] = 2 - 3 * x + 0.5 * x * x;
    }
    const [solution] = leastSquares(matrix, rows, 3, [side]);
    expect([...solution].map((v) => Number(v.toFixed(12)))).toEqual([2, -3, 0.5]);
  });

  it("refuses an underdetermined or rank-deficient system", () => {
    expect(() => leastSquares(new Float64Array(4), 2, 2, [new Float64Array(2)])).toThrow(RangeError);
    expect(() => leastSquares(new Float64Array(6), 2, 3, [new Float64Array(2)])).toThrow(/at least 3/);
  });

  it("reproduces a polynomial track of the fitted degree to rounding", () => {
    const start = 1_000;
    const length = 2 * DAY;
    const samples: StateSample[] = [];
    for (let i = 0; i <= 10; i += 1) {
      const t = start + (i * length) / 10;
      const u = (t - start) / DAY;
      samples.push({ tdbS: t, positionKm: [u ** 3, 2 - u, 5 * u * u], velocityKmS: [(3 * u * u) / DAY, -1 / DAY, (10 * u) / DAY] });
    }
    const block = fitSegment(samples, start, length, 5);
    for (const u of [0.137, 0.5, 1.21, 1.9]) {
      const x = u - 1;
      expect(chebyshevValue(block, 0, 6, x)).toBeCloseTo(u ** 3, 9);
      expect(chebyshevValue(block, 6, 6, x)).toBeCloseTo(2 - u, 9);
      expect(chebyshevValue(block, 12, 6, x)).toBeCloseTo(5 * u * u, 9);
    }
  });
});

describe("synthetic round trip: fit, quantise, encode, decode, evaluate", () => {
  const lengthS = 1.125 * DAY;
  const degree = 24;
  const startS = 5e8;
  const segments = 6;
  const samples = samplesOn(startS, startS + segments * lengthS, 3_600);
  const blocks = Array.from({ length: segments }, (_, k) =>
    fitSegment(samples.filter((s) => s.tdbS >= startS + k * lengthS - 1e-6 && s.tdbS <= startS + (k + 1) * lengthS + 1e-6), startS + k * lengthS, lengthS, degree));
  const n = degree + 1;
  const quantumKm = 1e-5;
  const coefficients = new Float64Array(segments * 3 * n);
  blocks.forEach((block, k) => coefficients.set(quantize(block, quantumKm), k * 3 * n));
  const bytes = encodeChunk({ startTdbS: startS, segmentCount: segments, coefficientCount: n, quantumKm, coefficients });
  const expectation = { startTdbS: startS, segmentSeconds: lengthS, segmentCount: segments, coefficientCount: n, quantumKm };
  const chunk = decodeChunk(bytes, expectation);

  it("decodes exactly the quantised coefficients it encoded", () => {
    const mismatch = [...chunk.coefficients].findIndex((value, index) => value !== coefficients[index]);
    expect(mismatch, `first mismatch at ${mismatch}: ${chunk.coefficients[mismatch]} vs ${coefficients[mismatch]}`).toBe(-1);
    expect(bytes.byteLength).toBeLessThan(20 + coefficients.length * 8);
  });

  it("matches the made-up orbit at times that were never fit nodes: a millimetre before quantising, centimetres after", () => {
    const out = new Float64Array(3);
    const unquantised = { ...chunk, coefficients: Float64Array.from(blocks.flatMap((block) => [...block])) };
    let worst = 0;
    let worstUnquantised = 0;
    for (let t = startS + 1_234.5; t < startS + segments * lengthS; t += 1_777.25) {
      const { p } = synthetic(t);
      chunkPositionInto(chunk, t, out, 0);
      worst = Math.max(worst, Math.hypot(out[0] - p[0], out[1] - p[1], out[2] - p[2]));
      chunkPositionInto(unquantised, t, out, 0);
      worstUnquantised = Math.max(worstUnquantised, Math.hypot(out[0] - p[0], out[1] - p[1], out[2] - p[2]));
    }
    expect(worstUnquantised).toBeLessThan(1e-6);
    // 75 coefficients each within half a quantum (5 mm) of the fit.
    expect(worst).toBeLessThan(5e-5);
  });

  it("gives velocity from the derivative of the same series", () => {
    const position = new Float64Array(3);
    const velocity = new Float64Array(3);
    const t = startS + 2.3 * lengthS;
    chunkStateInto(chunk, t, position, velocity);
    const { v } = synthetic(t);
    for (let axis = 0; axis < 3; axis += 1) expect(velocity[axis]).toBeCloseTo(v[axis], 7);
  });

  it("joins segments continuously", () => {
    const before = new Float64Array(3);
    const after = new Float64Array(3);
    for (let k = 1; k < segments; k += 1) {
      const join = startS + k * lengthS;
      chunkPositionInto(chunk, join - 1e-3, before, 0);
      chunkPositionInto(chunk, join + 1e-3, after, 0);
      const { v } = synthetic(join);
      // The body moves |v| * 2 ms between the two instants; any step at the join must hide inside 5 cm on top of that.
      const moved = Math.hypot(v[0], v[1], v[2]) * 2e-3;
      expect(Math.hypot(after[0] - before[0], after[1] - before[1], after[2] - before[2])).toBeLessThan(moved + 5e-5);
    }
  });

  it("rejects a chunk that does not match its index entry or is damaged", () => {
    expect(() => decodeChunk(bytes, { ...expectation, segmentCount: 5 })).toThrow(SeriesFormatError);
    expect(() => decodeChunk(bytes, { ...expectation, startTdbS: startS + 1 })).toThrow(/does not match/);
    expect(() => decodeChunk(bytes.slice(0, bytes.length - 1), expectation)).toThrow(/ends inside/);
    const extra = new Uint8Array(bytes.length + 1);
    extra.set(bytes);
    expect(() => decodeChunk(extra, expectation)).toThrow(/after its last/);
    const wrongMagic = bytes.slice();
    wrongMagic[0] = 0x58;
    expect(() => decodeChunk(wrongMagic, expectation)).toThrow(/magic/);
    expect(() => decodeChunk(new Uint8Array(4), expectation)).toThrow(/header/);
  });

  it("refuses to encode the wrong number of coefficients or one too large to hold exactly", () => {
    expect(() => encodeChunk({ startTdbS: 0, segmentCount: 1, coefficientCount: 2, quantumKm: 1, coefficients: new Float64Array(5) })).toThrow(/needs 6/);
    expect(() => encodeChunk({ startTdbS: 0, segmentCount: 1, coefficientCount: 1, quantumKm: 1e-20, coefficients: new Float64Array([1, 1, 1]) })).toThrow(/too large/);
  });
});
