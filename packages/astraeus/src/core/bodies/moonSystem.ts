/**
 * One planet's moons from the core curve-fit set (`data/ephemerides/<planet>-moons/`, JPL Horizons, O-025 T-096 and O-033 T-114): the one loader
 * every system shares (index, only the chunks a window needs, a refusal for a chunk the build does not ship), the state source of a fitted moon, and
 * the definition of a mapped one. Jupiter is one configuration (`jupiterMoons.ts`), unchanged by test. Core data: any experience may load it; which
 * bodies it shows is the experience's choice (O-025 Decision 8).
 */
import type { BodyId, CelestialBodyDefinition, CenterId, OrientationModel, StateSourceBinding } from "../body";
import { moonOrientationFromOrbit } from "../bodyOrientation";
import { ChebyshevEphemeris, parseEphemerisIndex } from "../chebyshevEphemeris";
import { type IauRotationElements, iauOrientation } from "../iauRotation";
import { type BalancePoint, periodAboutBalanceS } from "../orbitPeriod";
import { NotLoadedError } from "../planetSeries";
import { sharedChunk, sharedDecoder, sharedIndex } from "../moonChunkCache";
import { fetchBytesOf } from "../readBytes";
import { createProvenance } from "../provenance";
import { assertUtcUnixMs, createState, type State } from "../state";
import type { TimeBounds, Trajectory } from "../trajectory";

/** The span the committed fits cover (T-096, T-114: 2010-01-01 to 2030-01-01 TDB, chunked per calendar year; the same for every system). */
export const MOON_FIT_SPAN: TimeBounds = Object.freeze({ startUtcMs: Date.UTC(2010, 0, 1, 0, 2), endUtcMs: Date.UTC(2029, 11, 31, 23, 58) });
/**
 * The span of the main moons fitted back to 1950 (O-047 T-200). A mapped moon names which span its data holds with `MappedMoonFacts.span`;
 * `tests/moonSpans.test.ts` compares every static span with the shipped index, so this is never a second source of truth that can drift.
 */
export const HISTORICAL_MOON_FIT_SPAN: TimeBounds = Object.freeze({ startUtcMs: Date.UTC(1950, 0, 1, 0, 2), endUtcMs: MOON_FIT_SPAN.endUtcMs });

const spanYears = (span: TimeBounds): string => `${new Date(span.startUtcMs + 300_000).getUTCFullYear()}-${new Date(span.endUtcMs + 300_000).getUTCFullYear()}`;

/** A scene's window reaches outside the years a loaded moon's positions cover (O-047 T-195): named once, at load, instead of a throw on every frame. */
export class MoonOutOfSpanError extends RangeError {
  readonly body: BodyId;
  readonly span: TimeBounds;
  readonly window: TimeBounds;
  constructor(body: BodyId, span: TimeBounds, window: TimeBounds) {
    const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
    super(`${body}'s positions cover ${iso(span.startUtcMs)} to ${iso(span.endUtcMs)}, but the scene runs ${iso(window.startUtcMs)} to ${iso(window.endUtcMs)}`);
    this.name = "MoonOutOfSpanError";
    this.body = body;
    this.span = span;
    this.window = window;
  }
}

/** What a system needs to be loaded and described: its centre and where its index is (a dynamic import, so the index is its own chunk). */
export interface MoonSystemConfig {
  readonly centre: BodyId;
  readonly centreLabel: string;
  readonly centreGmKm3S2: number;
  /** A big moon the centre circles with (Pluto and Charon): orbit periods and lines are worked out about their balance point (I-056). Absent: the centre. */
  readonly balancePoint?: BalancePoint;
  /** Horizons' name of the ephemeris the system's moons come from, for the position record. */
  readonly ephemerisName: string;
  readonly fitSource: string;
  /**
   * Where the index is read from. The index ships in the system's data package (`astraeus-data-<planet>`), not in the engine, so a caller hands it in
   * with `provideIndex`; `load` refuses, naming the missing data, until one is.
   */
  readonly loadIndex?: () => Promise<unknown>;
}

/** The fit source every system cites: Horizons state vectors about the planet's system barycentre, fitted as piecewise Chebyshev series. */
export const moonFitSource = (centreLabel: string): string =>
  `JPL Horizons API 1.2 (https://ssd.jpl.nasa.gov/api/horizons.api) state vectors about the ${centreLabel} system barycentre, ICRF, TDB, fitted as piecewise Chebyshev series; US Government work, credit NASA/JPL-Caltech Solar System Dynamics`;

export interface MoonSystemLoad {
  readonly window: TimeBounds;
  /** Bodies whose chunks to fetch; the centre's own series (the planet about the system barycentre) always comes too. */
  readonly bodies: readonly BodyId[];
  /** The chunk files the build ships, by path relative to the index (`<body>/<year>.bin`), to the URL they are served at. */
  readonly chunkUrls: Readonly<Record<string, string>>;
  readonly fetchBytes?: (url: string) => Promise<Uint8Array>;
  /**
   * Also load, for these bodies, the shipped chunks covering about one orbital period before the window starts (at most `maxMs`), so each
   * moon's orbit line can be drawn from its own fitted path. Chunks the build does not ship are skipped; the line then starts where the
   * loaded chunks start.
   */
  readonly history?: { readonly bodies: readonly BodyId[]; readonly maxMs: number };
}

/** The chunk paths `load` needs, and a refusal naming any the build does not ship. */
export function chunksNeeded(ephemeris: ChebyshevEphemeris, load: Pick<MoonSystemLoad, "window" | "bodies" | "chunkUrls">): { body: BodyId; path: string }[] {
  const needed = ephemeris.chunksFor(load.bodies, load.window.startUtcMs, load.window.endUtcMs);
  const missing = needed.filter(({ path }) => load.chunkUrls[path] === undefined).map(({ path }) => path);
  if (missing.length > 0) throw new Error(`the build does not ship the moon fit chunks this window needs: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ` and ${missing.length - 5} more` : ""}`);
  return needed;
}

/** Refuses a window that reaches outside the span any requested body's positions cover. */
function assertWithinSpan(set: ChebyshevEphemeris, request: Pick<MoonSystemLoad, "window" | "bodies">): void {
  for (const body of request.bodies) {
    const span = set.boundsOf(body);
    if (request.window.startUtcMs < span.startUtcMs || request.window.endUtcMs > span.endUtcMs) throw new MoonOutOfSpanError(body, span, request.window);
  }
}

/** How far past the window's end the loader also looks for shipped chunks (one chunk year; chunks the build does not ship are skipped). */
const AFTER_WINDOW_MS = 366 * 86_400_000;
/** The fraction of one period of history loaded beyond the period itself (so a line of one period always has its samples). */
const HISTORY_MARGIN = 1.05;
/** A slice of decoding at most this long runs before the loader yields, so the page keeps painting (the boot loader animates). */
const DECODE_SLICE_MS = 8;
/** Half the time step (s) the orbit-derived tidal-lock orientation looks along the orbit, as Io's mean-element orientation did. */
const ORIENTATION_STEP_S = 1800;

/** One system's installed set and everything made from it. Each `createMoonSystem` call holds its own set (a page loads the systems it shows). */
export interface MoonSystem {
  readonly config: MoonSystemConfig;
  /** The loaded set; throws before `load` resolved rather than drawing a moon from nothing. */
  ephemeris(): ChebyshevEphemeris;
  /** True once a set is installed (the planet's own placement adds its wobble about the barycentre only then). */
  isLoaded(): boolean;
  /** Hands in the reader of the system's index.json (from its data package). */
  provideIndex(loadIndex: () => Promise<unknown>): void;
  /** Hands in a set built elsewhere (tests read the committed chunks from disk). */
  install(ephemeris: ChebyshevEphemeris | null): void;
  /** Reads the index once, then fetches and decodes the chunks this request needs that the set does not hold or another request is not already fetching. */
  load(load: MoonSystemLoad): Promise<ChebyshevEphemeris>;
  /** One osculating orbital period (ms) of a body about the centre at `timeUtcMs`, from its fitted state; Infinity when unbound. */
  osculatingPeriodMs(ephemeris: ChebyshevEphemeris, body: BodyId, timeUtcMs: number): number;
  /**
   * A fitted moon, centre-relative. With IAU `rotation` its prime meridian follows the report's linear model (a synchronous rotator's near side
   * towards the centre, on average); without it the near side is held towards the centre from the fitted velocity, so it needs no chunk
   * outside the window.
   */
  trajectory(body: BodyId, adapter: { daysSinceJ2000Tt(timeUtcMs: number): number }, rotation?: IauRotationElements): Trajectory;
  binding(body: BodyId, rotation?: IauRotationElements): StateSourceBinding;
  /** What a mapped moon's record says about its position, with its own worst figure from the fit check. */
  position(label: string, worstM?: number, span?: TimeBounds): ReturnType<typeof createProvenance>;
  /**
   * The orientation label and card sentence of a moon of this system, from the one fact that decides the model: whether an IAU rotation record
   * turns it (`iau-rotation`) or its orbit does (`tidal-lock`). `binding` and `mappedMoon` take the same record, so label and model cannot drift.
   */
  orientationFacts(rotation?: IauRotationElements): { readonly orientation: OrientationModel; readonly orientationLimitations: readonly string[] };
  /** A mapped moon: sphere, valid for the fit span; its definition and state-source binding come from the one record of facts (`rotation` included). */
  mappedMoon(moon: MappedMoonFacts): MappedMoon;
}

export interface MappedMoon {
  readonly definition: CelestialBodyDefinition;
  readonly binding: StateSourceBinding;
}

export interface MappedMoonFacts {
  readonly id: BodyId;
  readonly label: string;
  readonly radiusKm: number;
  /** Absent when the source prints a mass only. */
  readonly gmKm3S2?: number;
  /** The fit check's worst figure (m) when the engine holds one; absent for a moon added by the generic rule, whose figures are in its data package's index. */
  readonly worstM?: number;
  /** Sidereal period about the centre, days, from the moon's mean-element record; absent where there is none. */
  readonly orbitPeriodDays?: number;
  /** The years this moon's committed fits cover; absent means `MOON_FIT_SPAN`. */
  readonly span?: TimeBounds;
  /** The moon's IAU rotation record as elements; absent when its orbit turns it (near side held towards the centre). */
  readonly rotation?: IauRotationElements;
  /** The physical-properties lines of the Horizons header the numbers are read from. */
  readonly header: string;
  /** Overrides the default dimensions sentence (a moon drawn at its mean radius that is not printed as one). */
  readonly dimensionsNote?: string;
}

export function createMoonSystem(config: MoonSystemConfig): MoonSystem {
  let installed: ChebyshevEphemeris | null = null;
  let loadIndex = config.loadIndex;
  /** The set built from the index, shared by every request (the index is read once); `held` is true when a set was handed in whole by `install`. */
  let building: Promise<ChebyshevEphemeris> | null = null;
  let held = false;
  /** Chunk paths already decoded into the set, and those being fetched now (shared by every request, so a path is fetched once). */
  let added = new Set<string>();
  let fetching = new Map<string, Promise<void>>();
  const orientationFacts = (rotation?: IauRotationElements): { orientation: OrientationModel; orientationLimitations: readonly string[] } => rotation === undefined
    ? { orientation: "tidal-lock", orientationLimitations: Object.freeze([`The orientation is an approximate tidal lock keeping the near side towards ${config.centreLabel}, with no libration.`]) }
    : { orientation: "iau-rotation", orientationLimitations: Object.freeze([`The orientation is the IAU rotation model (pole and prime meridian from the working group's report, with its periodic terms where the report gives them), not held to the direction of ${config.centreLabel}: the near side faces ${config.centreLabel} on average, and its libration is only as exact as that model.`]) };

  const ephemeris = (): ChebyshevEphemeris => {
    if (installed === null) throw new NotLoadedError(`${config.centreLabel}'s moon fits are not loaded: await the system's load before mounting a scene with its moons`);
    return installed;
  };

  const reset = (): void => { building = null; added = new Set(); fetching = new Map(); };

  const indexSet = (): Promise<ChebyshevEphemeris> => {
    building ??= (async () => {
      const reader = loadIndex;
      if (reader === undefined) throw new Error(`${config.centreLabel}'s moon positions are not provided: pass the astraeus-data-${config.centre} package to mount (data: [...]), or call provideIndex`);
      // The parsed index is shared by every system of this source; the set (what this system has loaded) is its own.
      return new ChebyshevEphemeris(await sharedIndex(reader, async () => parseEphemerisIndex(await reader())));
    })();
    const own = building;
    own.catch(() => { if (building === own) building = null; });
    return own;
  };

  /** Fetches and decodes the chunks of `items` the set does not hold and no request is already fetching; resolves when all of them are in. The decoded bytes come from the source's shared store. */
  const ensureChunks = async (set: ChebyshevEphemeris, items: readonly { body: BodyId; path: string }[], request: MoonSystemLoad): Promise<void> => {
    const fetchBytes = request.fetchBytes ?? fetchBytesOf;
    const source = loadIndex!;
    const waiting: Promise<void>[] = [];
    const mine: { body: BodyId; path: string }[] = [];
    for (const item of items) {
      const inFlight = fetching.get(item.path);
      if (inFlight !== undefined) waiting.push(inFlight);
      else if (!added.has(item.path) && !mine.some(({ path }) => path === item.path)) mine.push(item);
    }
    if (mine.length > 0) {
      const decoder = sharedDecoder(source, () => new ChebyshevEphemeris(set.index));
      let sliceStarted = performance.now();
      const batch = (async () => {
        const chunks = await Promise.all(mine.map(({ body, path }) => sharedChunk(source, request.chunkUrls[path]!, async () => {
          const bytes = await fetchBytes(request.chunkUrls[path]!);
          const chunk = decoder.decodeChunkFor(body, path, bytes);
          if (performance.now() - sliceStarted > DECODE_SLICE_MS) {
            await new Promise((resolve) => setTimeout(resolve, 0));
            sliceStarted = performance.now();
          }
          return chunk;
        })));
        mine.forEach(({ body, path }, i) => { set.adoptChunk(body, path, chunks[i]); added.add(path); });
      })();
      for (const { path } of mine) fetching.set(path, batch);
      const done = (): void => { for (const { path } of mine) if (fetching.get(path) === batch) fetching.delete(path); };
      batch.then(done, done);
      waiting.push(batch);
    }
    await Promise.all(waiting);
  };

  /** The chunks before the window the bodies' orbit lines need (about one period back, shipped ones only). */
  const historyChunks = (set: ChebyshevEphemeris, request: MoonSystemLoad, history: NonNullable<MoonSystemLoad["history"]>): { body: BodyId; path: string }[] => {
    const start = request.window.startUtcMs;
    const out: { body: BodyId; path: string }[] = [];
    for (const body of history.bodies) {
      const lookback = Math.min(history.maxMs, HISTORY_MARGIN * osculatingPeriodMs(set, body, start));
      const from = Math.floor(Math.max(start - lookback, set.boundsOf(body).startUtcMs));
      for (const chunk of set.chunksFor([body], from, start)) if (request.chunkUrls[chunk.path] !== undefined) out.push(chunk);
    }
    return out;
  };

  /** A moon's orbit ring is centred on the clock, so at the window's last instant it reads ahead of it: the year after the window, where the build ships it (never required). */
  const afterChunks = (set: ChebyshevEphemeris, request: MoonSystemLoad): { body: BodyId; path: string }[] => {
    const end = request.window.endUtcMs;
    const out: { body: BodyId; path: string }[] = [];
    for (const body of request.bodies) {
      const limit = set.boundsOf(body).endUtcMs;
      if (limit <= end) continue;
      for (const chunk of set.chunksFor([body], end, Math.min(limit, end + AFTER_WINDOW_MS))) if (request.chunkUrls[chunk.path] !== undefined) out.push(chunk);
    }
    return out;
  };

  const loadRequest = async (request: MoonSystemLoad): Promise<ChebyshevEphemeris> => {
    if (held) {
      assertWithinSpan(installed!, request);
      return installed!;
    }
    const set = await indexSet();
    assertWithinSpan(set, request);
    await ensureChunks(set, chunksNeeded(set, request), request);
    if (request.history !== undefined) await ensureChunks(set, historyChunks(set, request, request.history), request);
    await ensureChunks(set, afterChunks(set, request), request);
    if (!held) installed = set;
    return set;
  };

  const osculatingPeriodMs = (set: ChebyshevEphemeris, body: BodyId, timeUtcMs: number): number => {
    const state = set.stateOf(body, timeUtcMs);
    const partner = config.balancePoint === undefined ? state : set.stateOf(config.balancePoint.body, timeUtcMs);
    return 1000 * periodAboutBalanceS(state.positionKm, state.velocityKmS!, config.centreGmKm3S2, config.balancePoint, body === config.balancePoint?.body, partner.positionKm, partner.velocityKmS!);
  };

  const trajectory = (body: BodyId, adapter: { daysSinceJ2000Tt(timeUtcMs: number): number }, rotation?: IauRotationElements): Trajectory => Object.freeze({
    body,
    stateAt(timeUtcMs: number, center: CenterId = config.centre): State {
      assertUtcUnixMs(timeUtcMs);
      if (center !== config.centre) throw new RangeError(`${body} is ${config.centreLabel}-centred; centre "${center}" is not offered, the state resolver recentres it`);
      const fitted = ephemeris().stateOf(body, timeUtcMs);
      const p = fitted.positionKm;
      const v = fitted.velocityKmS!;
      let orientation;
      if (rotation !== undefined) {
        orientation = iauOrientation(rotation, adapter.daysSinceJ2000Tt(timeUtcMs));
      } else {
        const along = (sign: number) => [p[0] + sign * v[0] * ORIENTATION_STEP_S, p[1] + sign * v[1] * ORIENTATION_STEP_S, p[2] + sign * v[2] * ORIENTATION_STEP_S] as const;
        orientation = moonOrientationFromOrbit([p[0], p[1], p[2]], along(-1), along(1));
      }
      return createState({ body, center: config.centre, timeUtcMs, positionKm: p, velocityKmS: v, orientation });
    },
  });

  const binding = (body: BodyId, rotation?: IauRotationElements): StateSourceBinding => Object.freeze<StateSourceBinding>({ body, create: (adapter) => trajectory(body, adapter, rotation) });

  const position = (label: string, worstM: number | undefined, span: TimeBounds = MOON_FIT_SPAN) => createProvenance({
    sourceType: "ephemeris",
    sources: [config.fitSource],
    accuracy: `${label}'s position is JPL Horizons' (ephemeris ${config.ephemerisName}), reproduced by curve fits ${worstM === undefined ? `(the checked worst figure is in the data package's index)` : `to within ${worstM} m at independent checked dates`} over ${spanYears(span)}. Horizons' own uncertainty is not stated in its output.`,
    notes: `Geometric position about ${config.centreLabel}'s centre; no light-time. Valid ${spanYears(span)}, the span of this body's committed fits.`,
  });

  return Object.freeze({
    config,
    ephemeris,
    isLoaded: () => installed !== null,
    provideIndex(reader: () => Promise<unknown>) {
      loadIndex = reader;
    },
    install(set: ChebyshevEphemeris | null) {
      installed = set;
      held = set !== null;
      reset();
    },
    load: (request: MoonSystemLoad): Promise<ChebyshevEphemeris> => loadRequest(request),
    osculatingPeriodMs,
    trajectory,
    binding,
    position,
    orientationFacts,
    mappedMoon(moon: MappedMoonFacts): MappedMoon {
      const { orientation, orientationLimitations } = orientationFacts(moon.rotation);
      const definition: CelestialBodyDefinition = Object.freeze({
        id: moon.id,
        label: moon.label,
        radiusKm: moon.radiusKm,
        ...(moon.gmKm3S2 === undefined ? {} : { gmKm3S2: moon.gmKm3S2 }),
        parentId: config.centre,
        ...(moon.orbitPeriodDays === undefined ? {} : { orbitPeriodDays: moon.orbitPeriodDays }),
        orientation,
        accuracy: Object.freeze({
          dimensions: createProvenance({
            sourceType: "observed",
            sources: [`JPL Horizons satellite physical properties for ${moon.label} (Horizons header): ${moon.header}`],
            accuracy: moon.dimensionsNote ?? `Mean radius ${moon.radiusKm} km and GM ${moon.gmKm3S2} km^3/s^2 as printed in the Horizons header; ${moon.label} is drawn as a sphere.`,
            notes: "Gravitational parameter in km^3/s^2.",
          }),
          position: position(moon.label, moon.worstM, moon.span),
          validUtc: moon.span ?? MOON_FIT_SPAN,
          orientationLimitations,
        }),
      });
      return Object.freeze({ definition, binding: binding(moon.id, moon.rotation) });
    },
  });
}
