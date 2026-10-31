/**
 * One planet's moons from the core curve-fit set (`data/ephemerides/<planet>-moons/`, JPL Horizons, O-025 T-096 and O-033 T-114): the one loader
 * every system shares (index, only the chunks a window needs, a refusal for a chunk the build does not ship), the state source of a fitted moon, and
 * the definition of a mapped one. Jupiter is one configuration (`jupiterMoons.ts`), unchanged by test. Core data: any experience may load it; which
 * bodies it shows is the experience's choice (O-025 Decision 8).
 */
import type { BodyId, CelestialBodyDefinition, CenterId, StateSourceBinding } from "../body";
import { moonOrientationFromOrbit } from "../bodyOrientation";
import { ChebyshevEphemeris, parseEphemerisIndex } from "../chebyshevEphemeris";
import { type IauRotationElements, iauOrientation } from "../iauRotation";
import { type BalancePoint, periodAboutBalanceS } from "../orbitPeriod";
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

/** The fraction of one period of history loaded beyond the period itself (so a line of one period always has its samples). */
const HISTORY_MARGIN = 1.05;
/** A slice of decoding at most this long runs before the loader yields, so the page keeps painting (the boot loader animates). */
const DECODE_SLICE_MS = 8;
/** Half the time step (s) the orbit-derived tidal-lock orientation looks along the orbit, as Io's mean-element orientation did. */
const ORIENTATION_STEP_S = 1800;

const fetchBytesOf = async (url: string): Promise<Uint8Array> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`moon fit chunk ${url}: HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
};

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
  /** Loads the index and only the chunks the window needs, once per page: a second call returns the first one's promise. */
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
  position(label: string, worstM: number, span?: TimeBounds): ReturnType<typeof createProvenance>;
  /** The note said of every mapped moon whose face is held towards the centre. */
  readonly tidalLockNote: string;
  /** A mapped moon: sphere, tidal lock, valid for the fit span. */
  mappedMoon(moon: MappedMoonFacts): CelestialBodyDefinition;
}

export interface MappedMoonFacts {
  readonly id: BodyId;
  readonly label: string;
  readonly radiusKm: number;
  /** Absent when the source prints a mass only. */
  readonly gmKm3S2?: number;
  readonly worstM: number;
  /** The years this moon's committed fits cover; absent means `MOON_FIT_SPAN`. */
  readonly span?: TimeBounds;
  /** The physical-properties lines of the Horizons header the numbers are read from. */
  readonly header: string;
  /** Overrides the default dimensions sentence (a moon drawn at its mean radius that is not printed as one). */
  readonly dimensionsNote?: string;
}

export function createMoonSystem(config: MoonSystemConfig): MoonSystem {
  let installed: ChebyshevEphemeris | null = null;
  let loadIndex = config.loadIndex;
  let loading: Promise<ChebyshevEphemeris> | null = null;
  const tidalLockNote = `The orientation is an approximate tidal lock keeping the near side towards ${config.centreLabel}, with no libration.`;

  const ephemeris = (): ChebyshevEphemeris => {
    if (installed === null) throw new Error(`${config.centreLabel}'s moon fits are not loaded: await the system's load before mounting a scene with its moons`);
    return installed;
  };

  const decodeInto = async (target: ChebyshevEphemeris, items: readonly { body: BodyId; path: string }[], bytes: readonly Uint8Array[]): Promise<void> => {
    let sliceStarted = performance.now();
    for (let i = 0; i < items.length; i += 1) {
      target.addChunk(items[i].body, items[i].path, bytes[i]);
      if (performance.now() - sliceStarted > DECODE_SLICE_MS) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        sliceStarted = performance.now();
      }
    }
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

  const position = (label: string, worstM: number, span: TimeBounds = MOON_FIT_SPAN) => createProvenance({
    sourceType: "ephemeris",
    sources: [config.fitSource],
    accuracy: `${label}'s position is JPL Horizons' (ephemeris ${config.ephemerisName}), reproduced by curve fits to within ${worstM} m at independent checked dates over ${spanYears(span)}. Horizons' own uncertainty is not stated in its output.`,
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
      loading = null;
    },
    load(request: MoonSystemLoad): Promise<ChebyshevEphemeris> {
      if (installed !== null) {
        try {
          assertWithinSpan(installed, request);
        } catch (error) {
          return Promise.reject(error);
        }
        return Promise.resolve(installed);
      }
      loading ??= (async () => {
        if (loadIndex === undefined) throw new Error(`${config.centreLabel}'s moon positions are not provided: pass the astraeus-data-${config.centre} package to mount (data: [...]), or call provideIndex`);
        const set = new ChebyshevEphemeris(parseEphemerisIndex(await loadIndex()));
        assertWithinSpan(set, request);
        const needed = chunksNeeded(set, request);
        const fetchBytes = request.fetchBytes ?? fetchBytesOf;
        await decodeInto(set, needed, await Promise.all(needed.map(({ path }) => fetchBytes(request.chunkUrls[path]!))));
        if (request.history !== undefined) {
          const loaded = new Set(needed.map(({ path }) => path));
          const start = request.window.startUtcMs;
          const extra: { body: BodyId; path: string }[] = [];
          for (const body of request.history.bodies) {
            const lookback = Math.min(request.history.maxMs, HISTORY_MARGIN * osculatingPeriodMs(set, body, start));
            const from = Math.floor(Math.max(start - lookback, set.boundsOf(body).startUtcMs));
            for (const chunk of set.chunksFor([body], from, start)) {
              if (loaded.has(chunk.path) || request.chunkUrls[chunk.path] === undefined) continue;
              loaded.add(chunk.path);
              extra.push(chunk);
            }
          }
          await decodeInto(set, extra, await Promise.all(extra.map(({ path }) => fetchBytes(request.chunkUrls[path]!))));
        }
        installed = set;
        return set;
      })();
      return loading;
    },
    osculatingPeriodMs,
    trajectory,
    binding: (body: BodyId, rotation?: IauRotationElements): StateSourceBinding => Object.freeze<StateSourceBinding>({ body, create: (adapter) => trajectory(body, adapter, rotation) }),
    position,
    tidalLockNote,
    mappedMoon(moon: MappedMoonFacts): CelestialBodyDefinition {
      return Object.freeze({
        id: moon.id,
        label: moon.label,
        radiusKm: moon.radiusKm,
        ...(moon.gmKm3S2 === undefined ? {} : { gmKm3S2: moon.gmKm3S2 }),
        parentId: config.centre,
        orientation: "tidal-lock",
        accuracy: Object.freeze({
          dimensions: createProvenance({
            sourceType: "observed",
            sources: [`JPL Horizons satellite physical properties for ${moon.label} (Horizons header): ${moon.header}`],
            accuracy: moon.dimensionsNote ?? `Mean radius ${moon.radiusKm} km and GM ${moon.gmKm3S2} km^3/s^2 as printed in the Horizons header; ${moon.label} is drawn as a sphere.`,
            notes: "Gravitational parameter in km^3/s^2.",
          }),
          position: position(moon.label, moon.worstM, moon.span),
          validUtc: moon.span ?? MOON_FIT_SPAN,
          orientationLimitations: Object.freeze([tidalLockNote]),
        }),
      });
    },
  });
}
