// O-088 T-408: a scene builds the same whether the planet series are already loaded (the normal test graph) or not (a consumer's first mount, a fresh module graph).
// Each good-scene case is built in both orders and the two are compared with each other (never with a file). The inputs are the scene pin's made-up scenes (ARCH-03), copied here
// because the pin is deleted in T-409. Fields that legitimately differ are listed in EXCLUDED, and a case shows each one really does differ, so a stale exclusion fails.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createState } from "../src/core/state";
import type { ExperienceDefinition } from "../src/app/experienceDefinition";
import type { DataSource, Scene } from "astraeus";

type Api = typeof import("astraeus");
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const T0 = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;
const NOW = Date.UTC(2026, 5, 15, 12);
const prov = {
  sourceType: "illustrative" as const,
  sources: ["Invented for the pin"],
  accuracy: "None claimed.",
  notes: "Made up.",
};
const stub = (name: string, provides: string[]): DataSource => ({ name, provides });
const DATA = [
  stub("astraeus-data-jupiter", ["io", "europa", "ganymede", "callisto"]),
  stub("astraeus-data-saturn", ["mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus"]),
  stub("astraeus-data-uranus", ["miranda", "ariel", "umbriel", "titania", "oberon"]),
];
const COMET = {
  id: "made-up-comet",
  label: "Made-up comet",
  elements: {
    semiMajorAxisAu: 6,
    eccentricity: 0.9,
    inclinationDeg: 40,
    ascendingNodeDeg: 100,
    argumentOfPerihelionDeg: 60,
    meanAnomalyDeg: 200,
  },
  epoch: { jd: 2_461_000.5, timeScale: "TDB" as const, ttMinusUtcSeconds: 69.184 },
  plane: "ecliptic-j2000" as const,
  source: {
    name: "Invented Survey",
    url: "https://example.invalid/comet",
    solution: "Solution A",
    accessed: "2026-10-24",
  },
  accuracy: {
    classification: "indicative" as const,
    statement: "Made up; no comparison was made.",
    valid: { start: "2025-01-01T00:00:00Z", end: "2027-01-01T00:00:00Z" },
    limitations: ["Invented for a test."],
  },
  marker: { color: "#ff9966", sizePx: 8 },
};
const orbit = (k: number) => ({
  id: `rock-${k}`,
  semiMajorAxisKm: 80_000 + 5_000 * k,
  eccentricity: 0.1 + 0.02 * k,
  inclinationDeg: 5 + k,
  raanDeg: 40 + 3 * k,
  argumentOfPeriapsisDeg: 70 + k,
});
const rocks = (n = 4) => Array.from({ length: n }, (_, k) => orbit(k));
const burst = (extra: object = {}) => ({
  id: "burst",
  label: "Burst",
  unit: "per hour",
  start: T0,
  end: T0 + 20 * DAY,
  peak: T0 + 10 * DAY,
  samples: [
    { time: T0, value: 2 },
    { time: T0 + 10 * DAY, value: 100 },
    { time: T0 + 20 * DAY, value: 4 },
  ],
  provenance: [
    { start: T0, end: T0 + 8 * DAY, provenance: prov },
    { start: T0 + 12 * DAY, end: T0 + 20 * DAY, provenance: { ...prov, sources: ["Another"] } },
  ],
  ...extra,
});
const line = (n: number, scale = 1) =>
  Array.from({ length: n }, (_, i) => ({
    time: T0 + i * DAY,
    positionKm: [scale * (1e5 + i * 3e4), scale * i * 1e4, scale * 5e3 * i],
    velocityKmS: [1 + i / 10, 0.5, 0.1],
  }));
const iso = (ms: number): string => new Date(ms).toISOString();
const panel = (id: string, at: { time?: number; event?: string; anchor?: string }, extra: object = {}) =>
  ({
    id,
    at: at.time === undefined ? at : { time: iso(at.time) },
    title: `Panel ${id}`,
    body: ["Made up."],
    provenance: {
      sourceType: "illustrative" as const,
      sources: ["Invented"],
      accuracy: "None claimed.",
      notes: "Made up.",
    },
    ...extra,
  }) as never;
const provider = (id: string, center: string) => ({
  stateAt: (t: number) =>
    createState({
      body: id,
      center,
      timeUtcMs: t,
      positionKm: [1.2e8 + (t - T0) * 0.1, 2e7, 5e6],
      velocityKmS: [1, 2, 3],
      orientation: null,
    }),
});

// ---------- turning a definition into stable plain data ----------

interface Ctx {
  readonly openMs: number;
}
const round = (value: number): number => (Number.isFinite(value) ? Number(value.toPrecision(12)) : value);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const hasFn = (value: Record<string, unknown>, name: string): boolean => typeof value[name] === "function";
const safe = <T>(read: () => T): Json | T => {
  try {
    return read();
  } catch (error) {
    return errorOf(error);
  }
};
function errorOf(error: unknown): Json {
  const e = error as { code?: unknown; name?: unknown; message?: unknown };
  return {
    error: {
      name: String(e?.name),
      ...(typeof e?.code === "string" ? { code: e.code } : {}),
      message: String(e?.message ?? error),
    },
  };
}

/** The data of a value: functions as a marker, the catalogue as its ids, a trajectory as its bounds and three states, a point group as its count and some positions. */
function plain(value: unknown, ctx: Ctx, depth = 0, seen = new WeakSet<object>()): Json {
  if (value === null) return null;
  if (typeof value !== "object") return primitive(value);
  if (seen.has(value)) return "[cycle]";
  if (depth > 14) return "[deep]";
  seen.add(value);
  try {
    return structured(value, ctx, depth, seen);
  } finally {
    seen.delete(value);
  }
}

function primitive(value: unknown): Json {
  if (value === undefined) return "[undefined]";
  if (typeof value === "number") return Number.isFinite(value) ? round(value) : String(value);
  if (typeof value === "string" || typeof value === "boolean") return value;
  return typeof value === "function" ? "[function]" : String(value);
}

function structured(value: object, ctx: Ctx, depth: number, seen: WeakSet<object>): Json {
  const next = (item: unknown): Json => plain(item, ctx, depth + 1, seen);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Map) return { "[Map]": [...value.entries()].map(([k, v]) => [next(k), next(v)]) };
  if (value instanceof Set) return { "[Set]": [...value].map(next) };
  if (ArrayBuffer.isView(value) || Array.isArray(value)) return list(Array.from(value as ArrayLike<unknown>), next);
  const object = value as Record<string, unknown>;
  if (hasFn(object, "ids") && hasFn(object, "definitions") && hasFn(object, "sources"))
    return { "[catalogue]": (object.ids as () => string[])() };
  if (hasFn(object, "stateAt") && isObject(object.bounds))
    return {
      "[trajectory]": {
        bounds: next(object.bounds),
        states: statesOf(object, object.bounds as Span, ctx, depth, seen),
      },
    };
  if (hasFn(object, "fillPositionsKm")) return { "[group]": groupOf(object, ctx, depth, seen) };
  return record(object, ctx, depth, seen);
}

function list(items: unknown[], next: (item: unknown) => Json): Json {
  if (items.length > 24 && items.every((item) => typeof item === "number")) {
    const numbers = items as number[];
    return {
      "[numbers]": numbers.length,
      head: numbers.slice(0, 3).map(round),
      tail: numbers.slice(-3).map(round),
      sum: round(numbers.reduce((a, b) => a + b, 0)),
    };
  }
  return items.map(next);
}

/** The own data of a plain object, keys sorted; a `farthestKm` function is called (it is how the scene hands over the zoom-out limit), and a path layer also records its source's states. */
function record(object: Record<string, unknown>, ctx: Ctx, depth: number, seen: WeakSet<object>): Json {
  const out: { [key: string]: Json } = {};
  for (const key of Object.keys(object).sort()) {
    const item = object[key];
    if (item === undefined) continue;
    out[key] =
      typeof item === "function" && key === "farthestKm"
        ? (safe(() => round((item as () => number)())) as Json)
        : plain(item, ctx, depth + 1, seen);
  }
  if (hasFn(object, "stateAt") && isObject(object.span) && "startUtcMs" in object.span)
    out["[sourceStates]"] = statesOf(
      object,
      object.span as Span,
      ctx,
      depth,
      seen,
      typeof object.center === "string" ? object.center : undefined,
    );
  return out;
}

type Span = { startUtcMs: number; endUtcMs: number };

function statesOf(
  source: Record<string, unknown>,
  bounds: Span,
  ctx: Ctx,
  depth: number,
  seen: WeakSet<object>,
  center?: string,
): Json {
  const times = [bounds.startUtcMs, Math.round((bounds.startUtcMs + bounds.endUtcMs) / 2), bounds.endUtcMs];
  return times.map(
    (time) =>
      safe(() =>
        plain((source.stateAt as (t: number, c?: string) => unknown)(time, center), ctx, depth + 1, seen),
      ) as Json,
  );
}

function groupOf(group: Record<string, unknown>, ctx: Ctx, depth: number, seen: WeakSet<object>): Json {
  const count = group.count as number;
  const { fillPositionsKm, fillPositionsRangeKm, keplerElements, stateAt, ...data } = group as Record<string, unknown>;
  void fillPositionsRangeKm;
  void keplerElements;
  void stateAt;
  const out = new Float64Array(3 * count);
  const at = safe(() => {
    (fillPositionsKm as (t: number, o: Float64Array) => void).call(group, ctx.openMs, out);
    return { first: Array.from(out.slice(0, 12)).map(round), sum: round(out.reduce((a, b) => a + b, 0)) };
  });
  return {
    data: plain(data, ctx, depth + 1, seen),
    atOpen: at as Json,
    member: safe(() =>
      plain((stateAt as (i: number, t: number) => unknown).call(group, 0, ctx.openMs), ctx, depth + 1, seen),
    ) as Json,
  };
}

// ---------- observing a scene ----------

interface Graph {
  readonly api: Api;
  readonly resolverFor: (definition: ExperienceDefinition) => Parameters<ExperienceDefinition["createMetrics"]>[0];
  readonly planetSeriesLoaded: () => boolean;
  /** The engine-only routes of the same module graph as `api` (the root does not export them). */
  readonly internals: {
    readonly definitionOf: (scene: Scene, data?: DataSource[]) => ExperienceDefinition;
    readonly missingDataOf: (scene: Scene, data?: DataSource[]) => readonly string[];
  };
  readonly synthetic: {
    probe: () => Promise<ExperienceDefinition>;
    views: () => Promise<ExperienceDefinition>;
    journey: () => Promise<Scene>;
  };
}
async function loadGraph(): Promise<Graph> {
  const api = await import("astraeus");
  const { createStateResolver } = await import("../src/core/stateResolver");
  const { createOrbAstronomyAdapter } = await import("../src/core/astronomyAdapter");
  const { catalogue } = await import("../src/assets/catalogue");
  const { planetSeriesLoaded } = await import("../src/core/planetSeries");
  const { definitionOf, missingDataOf } = await import("../src/api/definitionOf");
  return {
    api,
    planetSeriesLoaded,
    internals: { definitionOf, missingDataOf },
    resolverFor: (definition) => {
      const own = definition.catalogue ?? catalogue;
      return {
        resolver: createStateResolver(own.definitions(), own.sources(), createOrbAstronomyAdapter()),
        catalogue: own,
        clock: undefined as never,
      };
    },
    synthetic: {
      probe: async () => (await import("./synthetic/syntheticProbeDefinition")).syntheticProbeDefinition,
      views: async () => (await import("./synthetic/syntheticViewsDefinition")).syntheticViewsDefinition,
      journey: async () => (await import("./synthetic/syntheticJourneyScene")).buildSyntheticJourneyScene(),
    },
  };
}

interface Built {
  readonly scene?: Scene;
  readonly definition?: ExperienceDefinition;
  readonly data?: DataSource[];
}

/** Everything observable about one build, as plain data: the definition before and after `prepare`, `prepare`'s result, then the metrics, states and provenance of each object. */
async function observe(graph: Graph, built: Built): Promise<{ [key: string]: Json }> {
  const out: { [key: string]: Json } = {};
  const data = built.data ?? [];
  const definition = built.definition ?? graph.internals.definitionOf(built.scene!, data);
  const ctx: Ctx = { openMs: definition.clock.startUtcMs };
  out.seriesLoadedAtBuild = graph.planetSeriesLoaded();
  out.definitionBeforePrepare = plain(definition, ctx);
  try {
    await definition.prepare?.();
    out.prepare = "resolved";
  } catch (error) {
    out.prepare = errorOf(error);
  }
  out.definitionAfterPrepare = plain(definition, ctx);
  const { startUtcMs, endUtcMs } = definition.experience.window;
  const times = [definition.clock.startUtcMs, Math.round(startUtcMs + (endUtcMs - startUtcMs) * 0.75)];
  const ids = [
    ...definition.experience.objects.map((object) => object.id),
    ...(definition.groups ?? []).map((layer) => layer.object.id),
  ];
  out.metricTimes = times;
  const metrics = safe(() => definition.createMetrics(graph.resolverFor(definition)));
  out.metrics = Object.fromEntries(
    ids.map((id) => [
      id,
      times.map(
        (time) =>
          (typeof metrics === "function"
            ? safe(() => plain((metrics as (id: string, t: number) => unknown)(id, time), ctx))
            : metrics) as Json,
      ),
    ]),
  );
  if (built.scene !== undefined) {
    const scene = built.scene;
    out.stateOf = Object.fromEntries(
      ids.map((id) => [id, times.map((time) => safe(() => plain(scene.stateOf(id, time), ctx)) as Json)]),
    );
    out.provenanceOf = Object.fromEntries(
      ids.map((id) => [id, safe(() => plain(scene.provenanceOf(id), ctx)) as Json]),
    );
    out.missingData = [...graph.internals.missingDataOf(scene, []), "|", ...graph.internals.missingDataOf(scene, data)];
  }
  return out;
}

// ---------- the scenes ----------

type Case = (a: Api) => Built | Promise<Built>;
function sceneCases(g: Graph, withJourney: boolean): Record<string, Case> {
  return {
    ...(withJourney
      ? {
          "the made-up journey (synthetic)": async (): Promise<Built> => ({
            scene: await g.synthetic.journey(),
            data: DATA,
          }),
        }
      : {}),
    "sun scene: planets with each addBody option, orbit lines and the solar-system scale": (a) => ({
      scene: new a.Scene()
        .addBody(a.sun)
        .addBody(a.venus, { enlarge: 30, orbit: true, labelReachEarthRadii: 5_000 })
        .addBody(a.earth, {
          enlarge: 60,
          orbit: true,
          showLabel: false,
          description: "Our planet.",
          color: "#9fd8ff",
          knownLimitations: ["Pinned."],
        })
        .addBody(a.mars, { orbit: true })
        .addBody("jupiter")
        .setTime(T0)
        .setScale(a.solarSystemScale),
    }),
    "earth and moon, readable scale offered alone, moon orbit line": (a) => ({
      scene: new a.Scene()
        .addBody(a.earth)
        .addBody(a.moon, { orbit: true })
        .setTime(T0)
        .setScale(a.readableScale, { only: true }),
    }),
    "true scale, then switched": (a) => ({
      scene: new a.Scene().addBody(a.earth).addBody(a.moon).setScale(a.readableScale).setScale(a.trueScale).setTime(T0),
    }),
    "jupiter moons with their data package": (a) => ({
      scene: new a.Scene()
        .addBody(a.jupiter)
        .addBody(a.io, { orbit: true })
        .addBody(a.europa)
        .addBody("callisto")
        .setTime(Date.UTC(2016, 5, 1)),
      data: DATA,
    }),
    "a listed moon added by its id": (a) => ({
      scene: new a.Scene()
        .addBody(a.uranus)
        .addBody("miranda", { orbit: true })
        .setTime(Date.UTC(2016, 5, 1)),
      data: DATA,
    }),
    "own body from elements, fitOrbit and an ecliptic focus": (a) => {
      const scene = new a.Scene()
        .addBody(a.sun)
        .addBody(a.earth)
        .addBodyFromElements(COMET, { orbit: true, showLabel: false, labelReachEarthRadii: 700, color: "#ff9966" })
        .setTime(T0);
      scene.camera
        .focus("made-up-comet", { up: "ecliptic", azimuthDeg: 20, elevationDeg: 10, distance: 80 })
        .fitOrbit("made-up-comet");
      return { scene };
    },
    "a failed add leaves the scene as it was": (a) => {
      const scene = new a.Scene().addBody(a.sun).addBody(a.earth).setTime(T0);
      for (const call of [
        () => scene.addBodyFromElements(COMET, { enlarge: 0.5 }),
        () => scene.addBody("made-up-comet"),
        () => scene.addBody("nope"),
        () => scene.addBody(a.moon, { orbit: true, color: "red" }),
      ]) {
        try {
          call();
        } catch {
          /* recorded in the error pin */
        }
      }
      scene.addBodyFromElements(COMET);
      return { scene };
    },
    "paths about the Earth: samples, provider, plane, anchors, readouts, stretches, spans": (a) => ({
      scene: new a.Scene()
        .addBody(a.earth)
        .addBody(a.moon)
        .setTime(T0 + DAY)
        .addTrajectory({
          id: "probe",
          label: "Probe",
          color: "#ff00aa",
          samples: line(6),
          plane: "ecliptic-j2000",
          provenance: prov,
          provenanceSpans: [
            { start: T0, end: T0 + 2 * DAY, provenance: prov },
            { start: T0 + 3 * DAY, end: T0 + 5 * DAY, provenance: { ...prov, sources: ["Later"] } },
          ],
          description: "A probe.",
          knownLimitations: ["Made up."],
          anchors: [
            { id: "a2", time: T0 + 3 * DAY },
            { id: "a1", time: T0 + DAY },
          ],
          readouts: [
            { kind: "range", marker: "moon" },
            { kind: "speed" },
            { kind: "distance", to: "moon" },
            { kind: "altitude", above: "earth" },
          ],
          labelReachEarthRadii: 800,
          lineFixedTo: "moon",
        })
        .addTrajectory({
          id: "flyer",
          provider: provider("flyer", "earth"),
          bounds: { start: T0, end: T0 + 10 * DAY },
          lineFixedTo: [{ start: T0, end: T0 + 5 * DAY, body: "moon" }],
          plane: "ecliptic-j2000",
          readouts: [{ kind: "range" }],
        })
        .addTrajectory({ id: "plain-eqj", samples: line(4, 2), plane: "EQJ", center: "moon" }),
    }),
    "path added before any body follows the first body": (a) => ({
      scene: new a.Scene()
        .addTrajectory({ id: "early", samples: line(5) })
        .addBody(a.sun)
        .addBody(a.earth)
        .setTime(T0),
    }),
    "path added before any body keeps an own centre": (a) => ({
      scene: new a.Scene()
        .addTrajectory({ id: "early", samples: line(5), center: "moon" })
        .addBody(a.sun)
        .addBody(a.earth)
        .addBody(a.moon)
        .setTime(T0),
    }),
    "sun scene with a path: auto stretches, cover, labels": (a) => ({
      scene: new a.Scene()
        .addBody(a.sun)
        .addBody(a.earth, { enlarge: 60 })
        .addBody(a.jupiter)
        .setTime(T0 + 2 * DAY)
        .addTrajectory({
          id: "traveller",
          center: "sun",
          samples: Array.from({ length: 12 }, (_, i) => ({
            time: T0 + i * 10 * DAY,
            positionKm: [1.49e8 + i * 4e7, 3e7 * i, 1e7 * i],
          })),
          lineFixedTo: "auto",
          plane: "ecliptic-j2000",
          readouts: [
            { kind: "range", marker: "earth" },
            { kind: "distance", to: "jupiter" },
          ],
          provenanceSpans: [{ start: T0, end: T0 + 50 * DAY, provenance: prov }],
        })
        .setScale(a.solarSystemScale),
    }),
    "sun scene with a long path and a declared reach": (a) => {
      const scene = new a.Scene()
        .addBody(a.sun)
        .addBody(a.earth)
        .setTime(T0)
        .addTrajectory({
          id: "far",
          center: "sun",
          samples: [0, 100, 200].map((i) => ({ time: T0 + i * DAY, positionKm: [i * 5e9, 0, 0] })),
          lineFixedTo: "sun",
        });
      scene.camera.follow("far", { distance: 90 }).setReach(5_000);
      return { scene };
    },
    "groups: with and without a clump, a rate readout, an activity, an event, a panel": (a) => ({
      scene: new a.Scene()
        .addBody(a.sun)
        .addBody(a.earth)
        .addBody(a.jupiter)
        .setTime(T0 + 5 * DAY)
        .addActivity(burst())
        .addGroup({
          id: "ring",
          label: "Ring",
          orbits: rocks(),
          color: "#ff8800",
          dotSizePx: 4,
          seed: 7,
          clump: { near: "jupiter", fraction: 0.5, widthDeg: 20 },
          refillAfterMs: 600_000,
          refillSliceMs: 4,
          referenceTime: T0,
          description: "Four rocks.",
          knownLimitations: ["Invented."],
          provenance: prov,
          readouts: [{ kind: "rate" }],
          plane: "EQJ",
        })
        .addGroup({
          plane: "ecliptic-j2000",
          id: "belt",
          orbits: rocks(2).map((o) => ({ ...o, time: T0 + DAY })),
          center: "earth",
        })
        .addEvents([{ id: "peak", label: "Peak", time: T0 + 10 * DAY, type: "peak", object: "ring" }])
        .addStoryPanels([panel("p1", { time: T0 + 3 * DAY }, { object: "ring" }), panel("p2", { event: "peak" })])
        .setStoryPanelPlayback({ pauseSeconds: 2 }),
    }),
    "groups added before the planet series are needed (no clump)": (a) => ({
      scene: new a.Scene()
        .addBody(a.earth)
        .addBody(a.moon)
        .setTime(T0)
        .addGroup({
          plane: "ecliptic-j2000",
          id: "ring",
          orbits: rocks(3),
          readouts: [{ kind: "rate", activity: "burst" }],
        })
        .addActivity(burst()),
    }),
    "activities set the window, and a timeline span overrides it": (a) => ({
      scene: new a.Scene()
        .addBody(a.earth)
        .addActivity(burst())
        .addActivity(
          burst({
            id: "second",
            label: "Second",
            start: T0 + 30 * DAY,
            end: T0 + 40 * DAY,
            peak: undefined,
            provenance: undefined,
            type: "meteor-shower",
            peakLabel: "Top",
            samples: [
              { time: T0 + 30 * DAY, value: 1 },
              { time: T0 + 40 * DAY, value: 3 },
            ],
          }),
        )
        .setTimeline({ start: T0 - 5 * DAY, end: T0 + 50 * DAY })
        .setTime(T0 + 6 * DAY),
    }),
    "events with batch and own provenance, panels by utc, event and anchor": (a) => ({
      scene: new a.Scene()
        .addBody(a.earth)
        .addBody(a.moon)
        .setTime(T0)
        .addTrajectory({ id: "probe", samples: line(6), anchors: [{ id: "fix-a", time: T0 + 2 * DAY }] })
        .addEvents(
          [
            { id: "burn", label: "Burn", time: T0 + 2 * DAY, type: "burn", object: "probe", provenance: prov },
            { id: "late", label: "Late", time: T0 + 4 * DAY },
          ],
          { provenance: { ...prov, sources: ["Batch"] } },
        )
        .addEvents([{ id: "early", label: "Early", time: T0 + DAY, type: "burn", object: "moon" }])
        .addStoryPanels([
          panel("by-event", { event: "burn" }, { object: "probe" }),
          panel("by-utc", { time: T0 + DAY }, { details: ["More."] }),
          panel("by-anchor", { anchor: "fix-a" }),
        ])
        .setStoryPanelPlayback({ pauseSeconds: 0, autoOpen: false }),
    }),
    "timeline: span, rates, opening rate, pacing spans and event rules, loop": (a) => ({
      scene: new a.Scene()
        .addBody(a.earth)
        .addBody(a.moon)
        .setTime(T0 + DAY)
        .addEvents([
          { id: "e1", label: "E1", time: T0 + 3 * DAY, type: "encounter" },
          { id: "e2", label: "E2", time: T0 + 7 * DAY, type: "encounter" },
        ])
        .setTimeline({
          start: T0,
          end: T0 + 10 * DAY,
          rates: [10, 100, 1000],
          rate: 100,
          loop: true,
          pacing: [
            { start: T0, end: T0 + DAY, rate: 5000 },
            { start: T0 + 8 * DAY, end: T0 + 9 * DAY, rate: 7, rampSeconds: 600 },
            { near: { type: "encounter", withinSeconds: 3600 }, rate: 2 },
            { near: { type: "encounter", withinSeconds: 600 }, rate: 1, rampSeconds: 60 },
          ],
        }),
    }),
    "timeline: none, frozen at a moment": (a) => ({
      scene: new a.Scene().addBody(a.earth).setTimeline({ none: true, at: T0 + 3 * DAY }),
    }),
    "timeline: none, running at a rate": (a) => ({
      scene: new a.Scene().addBody(a.earth).setTime(T0).setTimeline({ none: true, rate: 3_600 }),
    }),
    "no time set: the opening time is now (fake clock)": (a) => ({
      scene: new a.Scene().addBody(a.earth).addBody(a.moon),
    }),
    "no time set with a path: opens at the path start": (a) => ({
      scene: new a.Scene().addBody(a.earth).addTrajectory({ id: "probe", samples: line(4) }),
    }),
    "display switches, called twice": (a) => ({
      scene: new a.Scene()
        .addBody(a.earth)
        .addBody(a.moon, { orbit: true })
        .setTime(T0)
        .setSwitches({ orbitLines: { place: "top-bar" }, labels: { place: "panel", on: false } })
        .setSwitches({ milkyWay: { place: "developer", on: false }, labels: { place: "top-bar" } }),
    }),
    "views with each camera rule": (a) => {
      const scene = new a.Scene()
        .addBody(a.earth)
        .addBody(a.moon)
        .setTime(T0)
        .addTrajectory({ id: "a", samples: line(5) })
        .addTrajectory({ id: "b", samples: line(5, 2) })
        .addEvents([
          { id: "ea", label: "EA", time: T0 + DAY },
          { id: "eb", label: "EB", time: T0 + 2 * DAY },
        ])
        .addStoryPanels([panel("pa", { time: T0 + DAY }), panel("pb", { time: T0 + 2 * DAY })])
        .setViews(
          [
            { id: "va", label: "A", objects: ["a"], events: ["ea"], panels: ["pa"], camera: { follow: "a" } },
            { id: "vb", label: "B", objects: ["b", "moon"], events: ["eb"], panels: ["pb"], camera: { focus: "b" } },
            { id: "vs", label: "Start", camera: "start" },
            { id: "vt", label: "Stay", camera: "stay" },
            { id: "vn", label: "Default" },
          ],
          { place: "panel", start: "vb" },
        );
      scene.camera.follow("a", { azimuthDeg: 10 });
      return { scene };
    },
    "camera: follow then focus, setReach then fitOrbit, ecliptic up": (a) => {
      const scene = new a.Scene().addBody(a.sun).addBody(a.earth).addBody(a.mars).setTime(T0);
      scene.camera
        .follow("earth", { distance: 12 })
        .focus("mars", { up: "ecliptic", elevationDeg: 5 })
        .setReach(900)
        .fitOrbit(a.mars);
      return { scene };
    },
    "camera: setReach alone, follow with a view": (a) => {
      const scene = new a.Scene().addBody(a.earth).addBody(a.moon).setTime(T0);
      scene.camera.follow("moon", { azimuthDeg: 45, elevationDeg: 15, distance: 60 }).setReach(400);
      return { scene };
    },
    "the made-up probe definition (synthetic)": async () => ({ definition: await g.synthetic.probe() }),
    "the made-up views definition (synthetic)": async () => ({ definition: await g.synthetic.views() }),
    // C-139 O3 pin gaps: the pacing base rate when `rate` is unset, and the path-cover sample count on a path whose farthest point is between its end samples.
    "timeline: pacing with no rate set (the base rate default)": (a) => ({
      scene: new a.Scene()
        .addBody(a.earth)
        .addBody(a.moon)
        .setTime(T0 + DAY)
        .setTimeline({
          start: T0,
          end: T0 + 10 * DAY,
          pacing: [{ start: T0 + 2 * DAY, end: T0 + 3 * DAY, rate: 5000 }],
        }),
    }),
    "sun scene with a path that peaks between its end samples (cover sample count)": (a) => ({
      scene: new a.Scene()
        .addBody(a.sun)
        .addBody(a.earth)
        .setTime(T0 + 5 * DAY)
        .addTrajectory({
          id: "bump",
          center: "sun",
          bounds: { start: T0, end: T0 + 10 * DAY },
          provider: {
            stateAt: (t: number) =>
              createState({
                body: "bump",
                center: "sun",
                timeUtcMs: t,
                positionKm: [1.5e8 + 4e9 * Math.exp(-(((t - T0) / DAY - 3.3) ** 2) / 0.02), 0, 0],
                velocityKmS: [1, 0, 0],
                orientation: null,
              }),
          },
        }),
    }),
  };
}

async function freshGraph(): Promise<Graph> {
  vi.resetModules();
  const graph = await loadGraph();
  expect(graph.planetSeriesLoaded()).toBe(false);
  return graph;
}

/** The fields that legitimately differ between the orders, each with its reason. A case below shows each really differs, so a stale entry fails. */
const EXCLUDED: Record<string, string> = {
  seriesLoadedAtBuild: "records the very thing that differs between the orders",
  definitionBeforePrepare:
    "a clump group, a sun-orbit path or a fit is built late in `prepare` when the series are not in yet",
};
const withoutExcluded = (observed: { [key: string]: Json }): { [key: string]: Json } =>
  Object.fromEntries(Object.entries(observed).filter(([key]) => !(key in EXCLUDED)));

describe("a scene is the same whether the planet series are loaded first or not (O-088 T-408)", () => {
  const loadedOrder: { [name: string]: { [key: string]: Json } } = {};
  const freshOrder: { [name: string]: { [key: string]: Json } } = {};
  const names = Object.keys(sceneCases({} as Graph, false));

  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    const loaded = await loadGraph();
    for (const name of names)
      loadedOrder[name] = await observe(loaded, await sceneCases(loaded, false)[name]!(loaded.api));
    for (const name of names) {
      const graph = await freshGraph();
      freshOrder[name] = await observe(graph, await sceneCases(graph, false)[name]!(graph.api));
    }
  }, 600_000);
  afterAll(() => {
    vi.useRealTimers();
  });

  it.each(names)("%s", (name) => {
    expect(withoutExcluded(freshOrder[name]!)).toEqual(withoutExcluded(loadedOrder[name]!));
  });

  it.each(Object.keys(EXCLUDED))("the excluded field %s really differs in some case", (field) => {
    expect(
      names.some((name) => JSON.stringify(freshOrder[name]![field]) !== JSON.stringify(loadedOrder[name]![field])),
    ).toBe(true);
  });
});
