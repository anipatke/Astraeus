/**
 * A set of bodies whose positions are piecewise Chebyshev fits, chunked by body and time span, all relative to one common
 * origin; one of them is the centre, and a body's centre-relative position is its series less the centre's. The index (JSON)
 * names the bodies, their fit parameters, chunks and provenance; the caller fetches only the chunks a window needs and hands
 * the bytes in. Answers `stateAt(time)` through the ordinary Trajectory contract, in EQJ km with velocity in km/s.
 */
import { assertCenterId, type BodyId, type CenterId } from "./body";
import { chunkCovers, chunkPositionInto, chunkStateInto, decodeChunk, type SeriesChunk } from "./chebyshevSeries";
import { createProvenance, type Provenance } from "./provenance";
import { TrajectoryOutOfRangeError } from "./sampledTrajectory";
import { assertUtcUnixMs, createState, EQJ, type State } from "./state";
import { assertTimeScaleTable, tdbMinusTtSeconds, ttMinusUtcSeconds, utcMsToTdbSeconds, type TimeScaleTable } from "./timeScale";
import type { TimeBounds, Trajectory } from "./trajectory";

export const EPHEMERIS_INDEX_FORMAT = "astraeus.chebyshev-ephemeris/1";

export interface EphemerisChunkEntry {
  /** Relative to the index file. */
  readonly path: string;
  readonly startTdbS: number;
  readonly segmentCount: number;
  readonly bytes: number;
}

export interface EphemerisBodyEntry {
  readonly id: BodyId;
  readonly label: string;
  readonly fit: {
    readonly segmentSeconds: number;
    readonly degree: number;
    readonly quantumKm: number;
  };
  readonly chunks: readonly EphemerisChunkEntry[];
  readonly provenance: Provenance;
}

export interface EphemerisIndex {
  readonly format: typeof EPHEMERIS_INDEX_FORMAT;
  readonly id: string;
  readonly frame: typeof EQJ;
  /** The body every centre-relative position is measured from; its own series is one of `bodies`. */
  readonly centre: BodyId;
  readonly timeScale: TimeScaleTable;
  readonly bodies: readonly EphemerisBodyEntry[];
}

export class EphemerisIndexError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "EphemerisIndexError";
  }
}

export class UnknownEphemerisBodyError extends RangeError {
  constructor(body: BodyId, setId: string) {
    super(`ephemeris set "${setId}" holds no body "${body}"`);
    this.name = "UnknownEphemerisBodyError";
  }
}

/** The time is inside the body's span, but the chunk that covers it has not been handed in. */
export class EphemerisChunkMissingError extends RangeError {
  readonly body: BodyId;
  readonly path: string;
  constructor(body: BodyId, path: string, timeUtcMs: number) {
    super(`chunk "${path}" of "${body}" is needed for time ${timeUtcMs} but has not been loaded`);
    this.name = "EphemerisChunkMissingError";
    this.body = body;
    this.path = path;
  }
}

function fail(message: string): never {
  throw new EphemerisIndexError(message);
}

function finiteNumber(value: unknown, where: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(`${where} must be a finite number`);
  return value;
}

function text(value: unknown, where: string): string {
  if (typeof value !== "string" || value.length === 0) fail(`${where} must be a non-empty string`);
  return value;
}

function parseBody(raw: unknown, index: number): EphemerisBodyEntry {
  const where = `bodies[${index}]`;
  if (typeof raw !== "object" || raw === null) fail(`${where} must be an object`);
  const body = raw as Record<string, unknown>;
  const fit = body.fit as Record<string, unknown> | undefined;
  if (typeof fit !== "object" || fit === null) fail(`${where}.fit must be an object`);
  const segmentSeconds = finiteNumber(fit.segmentSeconds, `${where}.fit.segmentSeconds`);
  const degree = finiteNumber(fit.degree, `${where}.fit.degree`);
  const quantumKm = finiteNumber(fit.quantumKm, `${where}.fit.quantumKm`);
  if (segmentSeconds <= 0 || quantumKm <= 0 || !Number.isInteger(degree) || degree < 0) fail(`${where}.fit has a non-positive length, quantum or degree`);
  if (!Array.isArray(body.chunks) || body.chunks.length === 0) fail(`${where}.chunks must be a non-empty array`);
  const chunks = body.chunks.map((chunk: Record<string, unknown>, chunkIndex: number): EphemerisChunkEntry => {
    const at = `${where}.chunks[${chunkIndex}]`;
    const segmentCount = finiteNumber(chunk.segmentCount, `${at}.segmentCount`);
    if (!Number.isInteger(segmentCount) || segmentCount < 1) fail(`${at}.segmentCount must be a positive integer`);
    return {
      path: text(chunk.path, `${at}.path`),
      startTdbS: finiteNumber(chunk.startTdbS, `${at}.startTdbS`),
      segmentCount,
      bytes: finiteNumber(chunk.bytes, `${at}.bytes`),
    };
  });
  chunks.forEach((chunk, chunkIndex) => {
    if (chunkIndex === 0) return;
    const previous = chunks[chunkIndex - 1];
    const previousEnd = previous.startTdbS + previous.segmentCount * segmentSeconds;
    if (Math.abs(chunk.startTdbS - previousEnd) > 1e-6) fail(`${where}.chunks[${chunkIndex}] does not start where the previous chunk ends`);
  });
  let provenance: Provenance;
  try {
    provenance = createProvenance(body.provenance as Provenance);
  } catch (error) {
    fail(`${where}.provenance: ${(error as Error).message}`);
  }
  return { id: text(body.id, `${where}.id`), label: text(body.label, `${where}.label`), fit: { segmentSeconds, degree, quantumKm }, chunks, provenance };
}

/** Validates an index read from JSON (STYLE-06: external data is checked here, once). */
export function parseEphemerisIndex(raw: unknown): EphemerisIndex {
  if (typeof raw !== "object" || raw === null) fail("ephemeris index must be an object");
  const index = raw as Record<string, unknown>;
  if (index.format !== EPHEMERIS_INDEX_FORMAT) fail(`ephemeris index format must be "${EPHEMERIS_INDEX_FORMAT}"`);
  if (index.frame !== EQJ) fail(`ephemeris index frame must be "${EQJ}"`);
  const timeScale = index.timeScale as TimeScaleTable;
  try {
    assertTimeScaleTable(timeScale);
  } catch (error) {
    fail(`timeScale: ${(error as Error).message}`);
  }
  if (!Array.isArray(index.bodies) || index.bodies.length === 0) fail("ephemeris index bodies must be a non-empty array");
  const bodies = index.bodies.map(parseBody);
  const ids = new Set(bodies.map((body) => body.id));
  if (ids.size !== bodies.length) fail("ephemeris index body ids must be unique");
  const centre = text(index.centre, "centre");
  if (!ids.has(centre)) fail(`centre "${centre}" is not one of the bodies`);
  return { format: EPHEMERIS_INDEX_FORMAT, id: text(index.id, "id"), frame: EQJ, centre, timeScale, bodies };
}

const J2000_NOON_UNIX_MS = 946_728_000_000;

/** The UTC millisecond whose TDB is closest to `tdbS` from inside the span (rounded toward the inside). */
function utcMsForTdb(table: TimeScaleTable, tdbS: number, inward: "up" | "down"): number {
  let guess = J2000_NOON_UNIX_MS + tdbS * 1000;
  for (let pass = 0; pass < 3; pass += 1) {
    const tt = tdbS - tdbMinusTtSeconds(tdbS);
    guess = J2000_NOON_UNIX_MS + (tt - ttMinusUtcSeconds(table, Math.round(guess))) * 1000;
  }
  let ms = inward === "up" ? Math.ceil(guess) : Math.floor(guess);
  while (inward === "up" ? utcMsToTdbSeconds(table, ms) < tdbS : utcMsToTdbSeconds(table, ms) > tdbS) ms += inward === "up" ? 1 : -1;
  return ms;
}

interface LoadedBody {
  readonly entry: EphemerisBodyEntry;
  readonly startTdbS: number;
  readonly endTdbS: number;
  readonly chunks: (SeriesChunk | null)[];
  last: SeriesChunk | null;
}

export class ChebyshevEphemeris {
  readonly index: EphemerisIndex;
  readonly #bodies = new Map<BodyId, LoadedBody>();
  readonly #centre: LoadedBody;
  readonly #scratch = new Float64Array(3);

  constructor(index: EphemerisIndex) {
    this.index = index;
    for (const entry of index.bodies) {
      const last = entry.chunks[entry.chunks.length - 1];
      this.#bodies.set(entry.id, {
        entry,
        startTdbS: entry.chunks[0].startTdbS,
        endTdbS: last.startTdbS + last.segmentCount * entry.fit.segmentSeconds,
        chunks: entry.chunks.map(() => null),
        last: null,
      });
    }
    this.#centre = this.#body(index.centre);
  }

  /** Every body id in the set, the centre included. */
  get bodyIds(): readonly BodyId[] {
    return this.index.bodies.map((body) => body.id);
  }

  #body(id: BodyId): LoadedBody {
    const body = this.#bodies.get(id);
    if (body === undefined) throw new UnknownEphemerisBodyError(id, this.index.id);
    return body;
  }

  /** The chunk paths (with their bodies) covering [startUtcMs, endUtcMs] for these bodies, the centre's included once. */
  chunksFor(bodies: readonly BodyId[], startUtcMs: number, endUtcMs: number): { body: BodyId; path: string }[] {
    assertUtcUnixMs(startUtcMs);
    assertUtcUnixMs(endUtcMs);
    if (endUtcMs < startUtcMs) throw new RangeError("window end is before its start");
    const start = utcMsToTdbSeconds(this.index.timeScale, startUtcMs);
    const end = utcMsToTdbSeconds(this.index.timeScale, endUtcMs);
    const wanted = new Set([...bodies, this.index.centre]);
    const result: { body: BodyId; path: string }[] = [];
    for (const id of wanted) {
      const { entry } = this.#body(id);
      for (const chunk of entry.chunks) {
        const chunkEnd = chunk.startTdbS + chunk.segmentCount * entry.fit.segmentSeconds;
        if (chunkEnd >= start && chunk.startTdbS <= end) result.push({ body: id, path: chunk.path });
      }
    }
    return result;
  }

  /** Hands in one chunk file's bytes; checked against the index entry. */
  addChunk(bodyId: BodyId, path: string, bytes: Uint8Array): void {
    const body = this.#body(bodyId);
    const slot = body.entry.chunks.findIndex((chunk) => chunk.path === path);
    if (slot < 0) throw new RangeError(`"${bodyId}" has no chunk "${path}"`);
    const chunk = body.entry.chunks[slot];
    body.chunks[slot] = decodeChunk(bytes, {
      startTdbS: chunk.startTdbS,
      segmentSeconds: body.entry.fit.segmentSeconds,
      segmentCount: chunk.segmentCount,
      coefficientCount: body.entry.fit.degree + 1,
      quantumKm: body.entry.fit.quantumKm,
    });
  }

  /** The body's span in UTC, intersected with the centre's. */
  boundsOf(bodyId: BodyId): TimeBounds {
    const body = this.#body(bodyId);
    const start = Math.max(body.startTdbS, this.#centre.startTdbS);
    const end = Math.min(body.endTdbS, this.#centre.endTdbS);
    return Object.freeze({
      startUtcMs: utcMsForTdb(this.index.timeScale, start, "up"),
      endUtcMs: utcMsForTdb(this.index.timeScale, end, "down"),
    });
  }

  /** The start (TDB s) of the run of loaded chunks of `body` that covers `tdbS`, or null when the chunk covering it is not loaded. */
  #loadedRunStart(body: LoadedBody, tdbS: number): number | null {
    const { entry } = body;
    let index = -1;
    for (let i = 0; i < entry.chunks.length; i += 1) if (entry.chunks[i].startTdbS <= tdbS) index = i;
    if (index < 0 || body.chunks[index] === null) return null;
    while (index > 0 && body.chunks[index - 1] !== null) index -= 1;
    return entry.chunks[index].startTdbS;
  }

  /**
   * The earliest UTC time from which a body's centre-relative position can be asked for continuously up to `timeUtcMs` with the chunks
   * loaded now (its own and the centre's), or null when `timeUtcMs` itself is not covered. For drawing a body's recent path.
   */
  loadedFromUtcMs(bodyId: BodyId, timeUtcMs: number): number | null {
    assertUtcUnixMs(timeUtcMs);
    const tdbS = utcMsToTdbSeconds(this.index.timeScale, timeUtcMs);
    const own = this.#loadedRunStart(this.#body(bodyId), tdbS);
    const centre = this.#loadedRunStart(this.#centre, tdbS);
    if (own === null || centre === null) return null;
    return utcMsForTdb(this.index.timeScale, Math.max(own, centre), "up");
  }

  #chunkAt(body: LoadedBody, tdbS: number, timeUtcMs: number): SeriesChunk {
    if (body.last !== null && chunkCovers(body.last, tdbS)) return body.last;
    const { entry } = body;
    let low = 0;
    let high = entry.chunks.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >>> 1;
      if (entry.chunks[middle].startTdbS <= tdbS) low = middle;
      else high = middle - 1;
    }
    const chunk = body.chunks[low];
    // The span was checked first and chunks are contiguous (parseEphemerisIndex), so this chunk covers tdbS.
    if (chunk === null) throw new EphemerisChunkMissingError(entry.id, entry.chunks[low].path, timeUtcMs);
    body.last = chunk;
    return chunk;
  }

  #checkSpan(body: LoadedBody, tdbS: number, timeUtcMs: number): void {
    if (tdbS < body.startTdbS || tdbS > body.endTdbS || tdbS < this.#centre.startTdbS || tdbS > this.#centre.endTdbS) {
      throw new TrajectoryOutOfRangeError(timeUtcMs, this.boundsOf(body.entry.id));
    }
  }

  /**
   * Centre-relative EQJ km positions of `bodies` at one time, written three by three into `out` from index 0; no allocation.
   * The batch path for drawing many bodies each frame.
   */
  positionsKmInto(timeUtcMs: number, bodies: readonly BodyId[], out: Float64Array): void {
    assertUtcUnixMs(timeUtcMs);
    if (out.length < bodies.length * 3) throw new RangeError(`output needs ${bodies.length * 3} values, has ${out.length}`);
    const tdbS = utcMsToTdbSeconds(this.index.timeScale, timeUtcMs);
    const centre = this.#centre;
    const scratch = this.#scratch;
    this.#checkSpan(centre, tdbS, timeUtcMs);
    chunkPositionInto(this.#chunkAt(centre, tdbS, timeUtcMs), tdbS, scratch, 0);
    for (let i = 0; i < bodies.length; i += 1) {
      const body = this.#body(bodies[i]);
      const at = 3 * i;
      if (body === centre) {
        out[at] = 0;
        out[at + 1] = 0;
        out[at + 2] = 0;
        continue;
      }
      this.#checkSpan(body, tdbS, timeUtcMs);
      chunkPositionInto(this.#chunkAt(body, tdbS, timeUtcMs), tdbS, out, at);
      out[at] -= scratch[0];
      out[at + 1] -= scratch[1];
      out[at + 2] -= scratch[2];
    }
  }

  /** One body's centre-relative State (position and velocity). */
  stateOf(bodyId: BodyId, timeUtcMs: number): State {
    assertUtcUnixMs(timeUtcMs);
    const body = this.#body(bodyId);
    const centre = this.#centre;
    const tdbS = utcMsToTdbSeconds(this.index.timeScale, timeUtcMs);
    this.#checkSpan(body, tdbS, timeUtcMs);
    const position = new Float64Array(3);
    const velocity = new Float64Array(3);
    if (body !== centre) {
      const centrePosition = new Float64Array(3);
      const centreVelocity = new Float64Array(3);
      chunkStateInto(this.#chunkAt(body, tdbS, timeUtcMs), tdbS, position, velocity);
      chunkStateInto(this.#chunkAt(centre, tdbS, timeUtcMs), tdbS, centrePosition, centreVelocity);
      for (let axis = 0; axis < 3; axis += 1) {
        position[axis] -= centrePosition[axis];
        velocity[axis] -= centreVelocity[axis];
      }
    }
    return createState({ body: bodyId, center: this.index.centre, timeUtcMs, frame: EQJ, positionKm: position, velocityKmS: velocity, orientation: null });
  }

  /** The ordinary Trajectory for one body, valid inside `boundsOf(body)`, in the set's one centre. */
  trajectory(bodyId: BodyId): Trajectory & { readonly bounds: TimeBounds; readonly provenance: Provenance } {
    const body = this.#body(bodyId);
    const bounds = this.boundsOf(bodyId);
    const centre = this.index.centre;
    return Object.freeze({
      body: bodyId,
      bounds,
      provenance: body.entry.provenance,
      stateAt: (timeUtcMs: number, center: CenterId = centre): State => {
        assertCenterId(center);
        if (center !== centre) throw new RangeError(`ephemeris set holds centre "${centre}", not "${center}"; the state resolver recentres it`);
        return this.stateOf(bodyId, timeUtcMs);
      },
    });
  }
}

/** Fetches only the chunks [startUtcMs, endUtcMs] needs for `bodies` (and the centre), through the caller's byte loader. */
export async function loadEphemerisWindow(
  ephemeris: ChebyshevEphemeris,
  bodies: readonly BodyId[],
  startUtcMs: number,
  endUtcMs: number,
  fetchBytes: (path: string) => Promise<Uint8Array>,
): Promise<number> {
  const needed = ephemeris.chunksFor(bodies, startUtcMs, endUtcMs);
  await Promise.all(needed.map(async ({ body, path }) => ephemeris.addChunk(body, path, await fetchBytes(path))));
  return needed.length;
}
