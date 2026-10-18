/**
 * Jupiter's moons from the core curve-fit set (`data/ephemerides/jupiter-moons/`, JPL Horizons, T-096): the one set every Jupiter moon's
 * position comes from, the bindings of the four mapped moons, and the loader that fetches only the chunks a window needs. Core data:
 * any experience may load it; which bodies it shows is the experience's choice (O-025 Decision 8).
 */
import type { BodyId, CelestialBodyDefinition, CenterId, StateSourceBinding } from "../body";
import { moonOrientationFromOrbit } from "../bodyOrientation";
import { ChebyshevEphemeris, parseEphemerisIndex } from "../chebyshevEphemeris";
import { createProvenance } from "../provenance";
import { assertUtcUnixMs, createState, type State } from "../state";
import type { TimeBounds, Trajectory } from "../trajectory";
import { osculatingPeriodS } from "../orbitPeriod";
import { JUPITER } from "./jupiter";

/** The span the committed fits cover (T-096: 2010-01-01 to 2030-01-01 TDB, chunked per calendar year). */
export const JUPITER_MOON_FIT_SPAN: TimeBounds = Object.freeze({ startUtcMs: Date.UTC(2010, 0, 1, 0, 2), endUtcMs: Date.UTC(2029, 11, 31, 23, 58) });

export const JUPITER_MOON_FIT_SOURCE =
  "JPL Horizons API 1.2 (https://ssd.jpl.nasa.gov/api/horizons.api) state vectors about the Jupiter system barycentre, ICRF, TDB, fitted as piecewise Chebyshev series (data/ephemerides/jupiter-moons/, T-096); US Government work, credit NASA/JPL-Caltech Solar System Dynamics";

let installed: ChebyshevEphemeris | null = null;
let loading: Promise<ChebyshevEphemeris> | null = null;

/** The loaded set; throws before `loadJupiterMoons` resolved rather than drawing a moon from nothing. */
export function jupiterMoonEphemeris(): ChebyshevEphemeris {
  if (installed === null) throw new Error("Jupiter's moon fits are not loaded: await loadJupiterMoons() before mounting a scene with Jupiter's moons");
  return installed;
}

/** Hands in a set built elsewhere (tests read the committed chunks from disk). */
export function installJupiterMoonEphemeris(ephemeris: ChebyshevEphemeris | null): void {
  installed = ephemeris;
  loading = null;
}

export interface JupiterMoonLoad {
  readonly window: TimeBounds;
  /** Bodies whose chunks to fetch; Jupiter's own series (the centre) always comes too. */
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

/** One osculating orbital period (ms) of a body at `timeUtcMs` about Jupiter, from its fitted state; Infinity when unbound. */
export function osculatingPeriodMs(ephemeris: ChebyshevEphemeris, body: BodyId, timeUtcMs: number): number {
  const state = ephemeris.stateOf(body, timeUtcMs);
  return 1000 * osculatingPeriodS(state.positionKm, state.velocityKmS!, JUPITER.gmKm3S2!);
}

/** The fraction of one period of history loaded beyond the period itself (so a line of one period always has its samples). */
const HISTORY_MARGIN = 1.05;

const fetchBytesOf = async (url: string): Promise<Uint8Array> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`moon fit chunk ${url}: HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
};

/** The chunk paths `load` needs, and a refusal naming any the build does not ship. */
export function chunksNeeded(ephemeris: ChebyshevEphemeris, load: Pick<JupiterMoonLoad, "window" | "bodies" | "chunkUrls">): { body: BodyId; path: string }[] {
  const needed = ephemeris.chunksFor(load.bodies, load.window.startUtcMs, load.window.endUtcMs);
  const missing = needed.filter(({ path }) => load.chunkUrls[path] === undefined).map(({ path }) => path);
  if (missing.length > 0) throw new Error(`the build does not ship the moon fit chunks this window needs: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ` and ${missing.length - 5} more` : ""}`);
  return needed;
}

/** A slice of decoding at most this long runs before the loader yields, so the page keeps painting (the boot loader animates). */
const DECODE_SLICE_MS = 8;

/**
 * Loads the index (its own chunk) and only the fit chunks the window needs for the given bodies, decoding them a slice at a time.
 * Once per page: a second call returns the first one's promise.
 */
export function loadJupiterMoons(load: JupiterMoonLoad): Promise<ChebyshevEphemeris> {
  if (installed !== null) return Promise.resolve(installed);
  loading ??= (async () => {
    const raw = (await import("../../../data/ephemerides/jupiter-moons/index.json")).default as unknown;
    const ephemeris = new ChebyshevEphemeris(parseEphemerisIndex(raw));
    const needed = chunksNeeded(ephemeris, load);
    const fetchBytes = load.fetchBytes ?? fetchBytesOf;
    const bytes = await Promise.all(needed.map(({ path }) => fetchBytes(load.chunkUrls[path]!)));
    let sliceStarted = performance.now();
    for (let i = 0; i < needed.length; i += 1) {
      ephemeris.addChunk(needed[i].body, needed[i].path, bytes[i]);
      if (performance.now() - sliceStarted > DECODE_SLICE_MS) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        sliceStarted = performance.now();
      }
    }
    if (load.history !== undefined) {
      const loaded = new Set(needed.map(({ path }) => path));
      const start = load.window.startUtcMs;
      const extra: { body: BodyId; path: string }[] = [];
      for (const body of load.history.bodies) {
        const lookback = Math.min(load.history.maxMs, HISTORY_MARGIN * osculatingPeriodMs(ephemeris, body, start));
        const from = Math.floor(Math.max(start - lookback, JUPITER_MOON_FIT_SPAN.startUtcMs));
        for (const chunk of ephemeris.chunksFor([body], from, start)) {
          if (loaded.has(chunk.path) || load.chunkUrls[chunk.path] === undefined) continue;
          loaded.add(chunk.path);
          extra.push(chunk);
        }
      }
      const extraBytes = await Promise.all(extra.map(({ path }) => fetchBytes(load.chunkUrls[path]!)));
      sliceStarted = performance.now();
      for (let i = 0; i < extra.length; i += 1) {
        ephemeris.addChunk(extra[i].body, extra[i].path, extraBytes[i]);
        if (performance.now() - sliceStarted > DECODE_SLICE_MS) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          sliceStarted = performance.now();
        }
      }
    }
    installed = ephemeris;
    return ephemeris;
  })();
  return loading;
}

/** Half the time step (s) the tidal-lock orientation looks along the orbit, as Io's mean-element orientation did. */
const ORIENTATION_STEP_S = 1800;

/**
 * A moon from the fits, Jupiter-centred, tidally locked: its near side faces Jupiter and its prime meridian follows the orbit. The
 * orientation looks along the fitted velocity (not at neighbouring times), so it needs no chunk outside the window.
 */
export function createFittedMoonTrajectory(body: BodyId): Trajectory {
  return Object.freeze({
    body,
    stateAt(timeUtcMs: number, center: CenterId = "jupiter"): State {
      assertUtcUnixMs(timeUtcMs);
      if (center !== "jupiter") throw new RangeError(`${body} is Jupiter-centred; centre "${center}" is not offered, the state resolver recentres it`);
      const fitted = jupiterMoonEphemeris().stateOf(body, timeUtcMs);
      const p = fitted.positionKm;
      const v = fitted.velocityKmS!;
      const along = (sign: number) => [p[0] + sign * v[0] * ORIENTATION_STEP_S, p[1] + sign * v[1] * ORIENTATION_STEP_S, p[2] + sign * v[2] * ORIENTATION_STEP_S] as const;
      const orientation = moonOrientationFromOrbit([p[0], p[1], p[2]], along(-1), along(1));
      return createState({ body, center: "jupiter", timeUtcMs, positionKm: p, velocityKmS: v, orientation });
    },
  });
}

export const FITTED_MOON_TIDAL_LOCK = "The orientation is an approximate tidal lock keeping the near side towards Jupiter, with no libration.";

/** What every mapped Jupiter moon's record says about its position, with its own worst figure from T-096. */
export function fittedMoonPosition(label: string, worstM: number) {
  return createProvenance({
    sourceType: "ephemeris",
    sources: [JUPITER_MOON_FIT_SOURCE],
    accuracy: `${label}'s position is JPL Horizons' (ephemeris jup365_merged), reproduced by curve fits to within ${worstM} m at 1,001 checked dates 2010-2030 (T-096). Horizons' own uncertainty is not stated in its output.`,
    notes: "Geometric position about Jupiter's centre; no light-time. Valid 2010-2030, the span of the committed fits.",
  });
}

function mappedMoon(id: BodyId, label: string, radiusKm: number, gmKm3S2: number, worstM: number, header: string): CelestialBodyDefinition {
  return Object.freeze({
    id,
    label,
    radiusKm,
    gmKm3S2,
    parentId: "jupiter",
    orientation: "tidal-lock",
    accuracy: Object.freeze({
      dimensions: createProvenance({
        sourceType: "observed",
        sources: [`JPL Horizons satellite physical properties for ${label} (header in data/ephemerides/jupiter-moons/index.json): ${header}`],
        accuracy: `Mean radius ${radiusKm} km and GM ${gmKm3S2} km^3/s^2 as printed in the Horizons header; ${label} is drawn as a sphere.`,
        notes: "Gravitational parameter in km^3/s^2.",
      }),
      position: fittedMoonPosition(label, worstM),
      validUtc: JUPITER_MOON_FIT_SPAN,
      orientationLimitations: Object.freeze([FITTED_MOON_TIDAL_LOCK]),
    }),
  });
}

export const EUROPA = mappedMoon("europa", "Europa", 1560.8, 3202.7121, 0.0755, "Mean radius (km) = 1560.8 +- 0.3, GM (km^3/s^2) = 3202.7121 +- 0.0054");
export const GANYMEDE = mappedMoon("ganymede", "Ganymede", 2631.2, 9887.8328, 0.0662, "Mean radius (km) = 2631.2 +- 1.7, GM (km^3/s^2) = 9887.8328 +- 0.0074");
export const CALLISTO = mappedMoon("callisto", "Callisto", 2410.3, 7179.2834, 0.0521, "Mean radius (km) = 2410.3 +- 1.5, GM (km^3/s^2) = 7179.2834 +- 0.0097");

export const MAPPED_MOON_BINDINGS: readonly StateSourceBinding[] = Object.freeze([EUROPA, GANYMEDE, CALLISTO].map((moon) => Object.freeze<StateSourceBinding>({ body: moon.id, create: () => createFittedMoonTrajectory(moon.id) })));
