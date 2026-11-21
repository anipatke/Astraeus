// Decoded moon chunks shared between the loaders of one data source (O-084 T-356, AH-03): immutable bytes keyed by source, then chunk URL. It holds no selection:
// each loader still asks for, and binds, only the chunks its own requests need. A dropped source (its reader) frees its entry.
import type { SeriesChunk } from "./chebyshevSeries";
import type { ChebyshevEphemeris, EphemerisIndex } from "./chebyshevEphemeris";

interface SourceEntry {
  /** The parsed index, read once; shared by every set built from it. */
  index: Promise<EphemerisIndex> | null;
  /** The decoded chunk per URL, or its fetch and decode in flight. A failed one is removed. */
  readonly chunks: Map<string, Promise<SeriesChunk>>;
  /** A set over the index that decodes chunks for every system of the source. */
  decoder: ChebyshevEphemeris | null;
}

const sources = new WeakMap<object, SourceEntry>();

function entryOf(source: object): SourceEntry {
  let entry = sources.get(source);
  if (entry === undefined) {
    entry = { index: null, chunks: new Map(), decoder: null };
    sources.set(source, entry);
  }
  return entry;
}

/** The parsed index of a source, read once (`read` runs only when no read is held; a failed read is not kept). */
export function sharedIndex(source: object, read: () => Promise<EphemerisIndex>): Promise<EphemerisIndex> {
  const entry = entryOf(source);
  const own = (entry.index ??= read());
  own.catch(() => {
    if (entry.index === own) entry.index = null;
  });
  return own;
}

/** The decoder set of a source (made once by `make` from the shared index). */
export function sharedDecoder(source: object, make: () => ChebyshevEphemeris): ChebyshevEphemeris {
  const entry = entryOf(source);
  return (entry.decoder ??= make());
}

/** The decoded chunk at `url`: held, in flight (shared), or produced by `produce` now. A failure is not kept. */
export function sharedChunk(source: object, url: string, produce: () => Promise<SeriesChunk>): Promise<SeriesChunk> {
  const { chunks } = entryOf(source);
  const held = chunks.get(url);
  if (held !== undefined) return held;
  const own = produce();
  chunks.set(url, own);
  own.catch(() => {
    if (chunks.get(url) === own) chunks.delete(url);
  });
  return own;
}
