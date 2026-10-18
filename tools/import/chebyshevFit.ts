// Least-squares Chebyshev fitting of state samples and the chunk file writer (O-025 T-096).
// The importer (horizons-moons.mjs) and tests/chebyshevFit.test.ts share it; the provider reads what it writes through
// src/core/chebyshevSeries.ts. Times are TDB seconds from J2000, positions km, velocities km/s.
import { CHUNK_HEADER_BYTES, CHUNK_MAGIC } from "../../src/core/chebyshevSeries";

export interface StateSample {
  readonly tdbS: number;
  readonly positionKm: readonly [number, number, number];
  readonly velocityKmS: readonly [number, number, number];
}

/** T_k(x) and T_k'(x) for k = 0 .. count - 1. */
function basis(x: number, count: number): { value: Float64Array; slope: Float64Array } {
  const value = new Float64Array(count);
  const slope = new Float64Array(count);
  value[0] = 1;
  if (count > 1) {
    value[1] = x;
    slope[1] = 1;
  }
  for (let k = 2; k < count; k += 1) {
    value[k] = 2 * x * value[k - 1] - value[k - 2];
    slope[k] = 2 * value[k - 1] + 2 * x * slope[k - 1] - slope[k - 2];
  }
  return { value, slope };
}

/**
 * Householder QR least squares for one design matrix (rows x columns, row-major) and several right-hand sides.
 * Returns one solution per right-hand side. Throws when the matrix is rank deficient.
 */
export function leastSquares(matrix: Float64Array, rows: number, columns: number, rightHandSides: Float64Array[]): Float64Array[] {
  if (rows < columns) throw new RangeError(`least squares needs at least ${columns} equations, got ${rows}`);
  const a = Float64Array.from(matrix);
  const sides = rightHandSides.map((side) => Float64Array.from(side));
  const diagonal = new Float64Array(columns);
  for (let k = 0; k < columns; k += 1) {
    let norm = 0;
    for (let i = k; i < rows; i += 1) norm += a[i * columns + k] ** 2;
    norm = Math.sqrt(norm);
    if (norm === 0) throw new RangeError("least-squares matrix is rank deficient");
    const alpha = a[k * columns + k] > 0 ? -norm : norm;
    a[k * columns + k] -= alpha;
    let vNorm = 0;
    for (let i = k; i < rows; i += 1) vNorm += a[i * columns + k] ** 2;
    for (let j = k + 1; j < columns; j += 1) {
      let dot = 0;
      for (let i = k; i < rows; i += 1) dot += a[i * columns + k] * a[i * columns + j];
      const factor = (2 * dot) / vNorm;
      for (let i = k; i < rows; i += 1) a[i * columns + j] -= factor * a[i * columns + k];
    }
    for (const side of sides) {
      let dot = 0;
      for (let i = k; i < rows; i += 1) dot += a[i * columns + k] * side[i];
      const factor = (2 * dot) / vNorm;
      for (let i = k; i < rows; i += 1) side[i] -= factor * a[i * columns + k];
    }
    diagonal[k] = alpha;
  }
  return sides.map((side) => {
    const solution = new Float64Array(columns);
    for (let k = columns - 1; k >= 0; k -= 1) {
      let sum = side[k];
      for (let j = k + 1; j < columns; j += 1) sum -= a[k * columns + j] * solution[j];
      solution[k] = sum / diagonal[k];
    }
    return solution;
  });
}

/**
 * Fits one segment [startS, startS + lengthS] of degree `degree` to the samples inside it (ends included), matching each
 * sample's position and its velocity (velocity rows scaled by the half-length so both are in km). Returns x, y, z blocks.
 */
export function fitSegment(samples: readonly StateSample[], startS: number, lengthS: number, degree: number): Float64Array {
  const count = degree + 1;
  const half = lengthS / 2;
  const inside = samples.filter((sample) => sample.tdbS >= startS - 1e-6 && sample.tdbS <= startS + lengthS + 1e-6);
  const rows = inside.length * 2;
  const matrix = new Float64Array(rows * count);
  const sides = [new Float64Array(rows), new Float64Array(rows), new Float64Array(rows)];
  inside.forEach((sample, index) => {
    const x = Math.max(-1, Math.min(1, ((sample.tdbS - startS) / lengthS) * 2 - 1));
    const { value, slope } = basis(x, count);
    matrix.set(value, 2 * index * count);
    matrix.set(slope, (2 * index + 1) * count);
    for (let axis = 0; axis < 3; axis += 1) {
      sides[axis][2 * index] = sample.positionKm[axis];
      sides[axis][2 * index + 1] = sample.velocityKmS[axis] * half;
    }
  });
  const [x, y, z] = leastSquares(matrix, rows, count, sides);
  const result = new Float64Array(3 * count);
  result.set(x, 0);
  result.set(y, count);
  result.set(z, 2 * count);
  return result;
}

/** Rounds each coefficient to a whole number of quanta, as the chunk file will hold it. */
export function quantize(coefficients: Float64Array, quantumKm: number): Float64Array {
  return coefficients.map((value) => Math.round(value / quantumKm) * quantumKm);
}

function pushVarint(bytes: number[], value: number): void {
  let zigzag = value >= 0 ? value * 2 : -value * 2 - 1;
  if (!Number.isSafeInteger(zigzag)) throw new RangeError(`coefficient ${value} quanta is too large to encode`);
  while (zigzag >= 128) {
    bytes.push((zigzag % 128) | 0x80);
    zigzag = Math.floor(zigzag / 128);
  }
  bytes.push(zigzag);
}

export interface ChunkInput {
  readonly startTdbS: number;
  readonly segmentCount: number;
  readonly coefficientCount: number;
  readonly quantumKm: number;
  /** segmentCount * 3 * coefficientCount values, km. */
  readonly coefficients: Float64Array;
}

/** The chunk file bytes (format in src/core/chebyshevSeries.ts). */
export function encodeChunk(input: ChunkInput): Uint8Array {
  const expected = input.segmentCount * 3 * input.coefficientCount;
  if (input.coefficients.length !== expected) throw new RangeError(`chunk needs ${expected} coefficients, got ${input.coefficients.length}`);
  const body: number[] = [];
  for (const value of input.coefficients) pushVarint(body, Math.round(value / input.quantumKm));
  const bytes = new Uint8Array(CHUNK_HEADER_BYTES + body.length);
  for (let i = 0; i < 4; i += 1) bytes[i] = CHUNK_MAGIC.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  view.setUint32(4, input.segmentCount, true);
  view.setUint16(8, input.coefficientCount, true);
  view.setUint16(10, 0, true);
  view.setFloat64(12, input.startTdbS, true);
  bytes.set(body, CHUNK_HEADER_BYTES);
  return bytes;
}
