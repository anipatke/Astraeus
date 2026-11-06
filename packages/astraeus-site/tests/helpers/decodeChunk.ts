// A small reader for the position chunk files the home page's Io demo embeds (the "ACF1" format: a 20-byte header, then zig-zag base-128 varints of coefficient / quantum), so the page test needs nothing of the engine (O-059 T-272).
// The format belongs to the data packages' files, not to the engine's code; this reads one chunk as the page's own checks need.
const CHUNK_MAGIC = "ACF1";
const CHUNK_HEADER_BYTES = 20;

export interface Chunk {
  readonly startTdbS: number;
  readonly segmentSeconds: number;
  readonly segmentCount: number;
  readonly coefficientCount: number;
  /** Kilometres; length segmentCount * 3 * coefficientCount. */
  readonly coefficients: Float64Array;
}

export interface ChunkExpectation { readonly startTdbS: number; readonly segmentSeconds: number; readonly segmentCount: number; readonly coefficientCount: number; readonly quantumKm: number }

/** Reads a chunk file and checks its header against what the index says it holds. */
export function decodeChunk(bytes: Uint8Array, expected: ChunkExpectation): Chunk {
  if (bytes.byteLength < CHUNK_HEADER_BYTES) throw new TypeError("chunk is shorter than its header");
  const magic = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!);
  if (magic !== CHUNK_MAGIC) throw new TypeError(`chunk magic is "${magic}", not "${CHUNK_MAGIC}"`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const segmentCount = view.getUint32(4, true);
  const coefficientCount = view.getUint16(8, true);
  const startTdbS = view.getFloat64(12, true);
  if (segmentCount !== expected.segmentCount || coefficientCount !== expected.coefficientCount || startTdbS !== expected.startTdbS) throw new TypeError("chunk header does not match its index entry");
  const total = segmentCount * 3 * coefficientCount;
  const coefficients = new Float64Array(total);
  let position = CHUNK_HEADER_BYTES;
  for (let index = 0; index < total; index += 1) {
    let value = 0;
    let scale = 1;
    let byte: number;
    do {
      if (position >= bytes.byteLength) throw new TypeError("chunk ends inside a coefficient");
      byte = bytes[position]!;
      position += 1;
      value += (byte & 0x7f) * scale;
      scale *= 128;
    } while (byte & 0x80);
    coefficients[index] = (value % 2 === 0 ? value / 2 : -(value + 1) / 2) * expected.quantumKm;
  }
  if (position !== bytes.byteLength) throw new TypeError(`chunk has ${bytes.byteLength - position} bytes after its last coefficient`);
  return { startTdbS, segmentSeconds: expected.segmentSeconds, segmentCount, coefficientCount, coefficients };
}
