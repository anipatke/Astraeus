/**
 * One chunk of a piecewise Chebyshev position series: equal segments in TDB, each holding x, y and z coefficient blocks.
 * The file form is a 20-byte header (magic "ACF1", segment count, coefficients per axis, reserved, start TDB seconds) and then
 * every coefficient divided by the series' quantum, rounded, zig-zag and written as a little-endian base-128 varint, in the
 * order segment, axis, k. Dependency-free except the shared Chebyshev sum, so the browser speed probe loads it on its own.
 */
import { chebyshevValue, chebyshevValueAndSlope } from "./chebyshev";

export const CHUNK_MAGIC = "ACF1";
export const CHUNK_HEADER_BYTES = 20;

export interface SeriesChunk {
  /** TDB seconds from J2000 at the start of the first segment. */
  readonly startTdbS: number;
  readonly segmentSeconds: number;
  readonly segmentCount: number;
  /** Coefficients per axis per segment (degree + 1). */
  readonly coefficientCount: number;
  /** Kilometres; length segmentCount * 3 * coefficientCount. */
  readonly coefficients: Float64Array;
}

export class SeriesFormatError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "SeriesFormatError";
  }
}

export interface ChunkExpectation {
  readonly startTdbS: number;
  readonly segmentSeconds: number;
  readonly segmentCount: number;
  readonly coefficientCount: number;
  readonly quantumKm: number;
}

/** Reads a chunk file and checks it against what the index says it holds. */
export function decodeChunk(bytes: Uint8Array, expected: ChunkExpectation): SeriesChunk {
  if (bytes.byteLength < CHUNK_HEADER_BYTES) throw new SeriesFormatError("chunk is shorter than its header");
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (magic !== CHUNK_MAGIC) throw new SeriesFormatError(`chunk magic is "${magic}", not "${CHUNK_MAGIC}"`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const segmentCount = view.getUint32(4, true);
  const coefficientCount = view.getUint16(8, true);
  const startTdbS = view.getFloat64(12, true);
  if (segmentCount !== expected.segmentCount || coefficientCount !== expected.coefficientCount || startTdbS !== expected.startTdbS) {
    throw new SeriesFormatError(
      `chunk header (${segmentCount} segments, ${coefficientCount} coefficients, start ${startTdbS}) does not match its index entry`
      + ` (${expected.segmentCount}, ${expected.coefficientCount}, ${expected.startTdbS})`,
    );
  }
  const total = segmentCount * 3 * coefficientCount;
  const coefficients = new Float64Array(total);
  let position = CHUNK_HEADER_BYTES;
  for (let index = 0; index < total; index += 1) {
    let value = 0;
    let scale = 1;
    let byte: number;
    do {
      if (position >= bytes.byteLength) throw new SeriesFormatError("chunk ends inside a coefficient");
      byte = bytes[position];
      position += 1;
      value += (byte & 0x7f) * scale;
      scale *= 128;
    } while (byte & 0x80);
    const signed = value % 2 === 0 ? value / 2 : -(value + 1) / 2;
    coefficients[index] = signed * expected.quantumKm;
  }
  if (position !== bytes.byteLength) throw new SeriesFormatError(`chunk has ${bytes.byteLength - position} bytes after its last coefficient`);
  return {
    startTdbS,
    segmentSeconds: expected.segmentSeconds,
    segmentCount,
    coefficientCount,
    coefficients,
  };
}

/** True when `tdbS` lies in the chunk; the shared instant between two chunks belongs to both. */
export function chunkCovers(chunk: SeriesChunk, tdbS: number): boolean {
  return tdbS >= chunk.startTdbS && tdbS <= chunk.startTdbS + chunk.segmentCount * chunk.segmentSeconds;
}

/** Segment index and normalised argument for an instant inside the chunk. */
function locate(chunk: SeriesChunk, tdbS: number): { offset: number; x: number } {
  const elapsed = (tdbS - chunk.startTdbS) / chunk.segmentSeconds;
  const segment = Math.min(chunk.segmentCount - 1, Math.max(0, Math.floor(elapsed)));
  const x = 2 * (elapsed - segment) - 1;
  return { offset: segment * 3 * chunk.coefficientCount, x };
}

/** Position in km into out[outIndex .. outIndex + 2]. The caller has checked `chunkCovers`. */
export function chunkPositionInto(chunk: SeriesChunk, tdbS: number, out: Float64Array, outIndex: number): void {
  const { offset, x } = locate(chunk, tdbS);
  const n = chunk.coefficientCount;
  out[outIndex] = chebyshevValue(chunk.coefficients, offset, n, x);
  out[outIndex + 1] = chebyshevValue(chunk.coefficients, offset + n, n, x);
  out[outIndex + 2] = chebyshevValue(chunk.coefficients, offset + 2 * n, n, x);
}

/** Position (km) and velocity (km/s) into the two buffers. The caller has checked `chunkCovers`. */
export function chunkStateInto(chunk: SeriesChunk, tdbS: number, position: Float64Array, velocity: Float64Array): void {
  const { offset, x } = locate(chunk, tdbS);
  const n = chunk.coefficientCount;
  const pair = new Float64Array(2);
  const perSecond = 2 / chunk.segmentSeconds;
  for (let axis = 0; axis < 3; axis += 1) {
    chebyshevValueAndSlope(chunk.coefficients, offset + axis * n, n, x, pair, 0);
    position[axis] = pair[0];
    velocity[axis] = pair[1] * perSecond;
  }
}
