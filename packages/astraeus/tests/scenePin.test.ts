// O-058 T-231: a characterisation test of the scene builder. It records what `Scene` produces today (the definition's data, the layers `prepare` adds, the metrics and
// states, and the code and message of every build error) so each later step of the split can show it changed nothing. It is a snapshot of behaviour, not a specification:
// when the pin and a deliberate change disagree, the change is reviewed and the fixture rewritten by hand, never to make a refactor pass.
// Made-up scenes only (ARCH-03). Two orders are pinned: the planet series already loaded (the normal test graph) and not yet loaded (a fresh module graph, as a consumer's mount).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createState } from "../src/core/state";
import type { ExperienceDefinition } from "../src/app/experienceDefinition";
import type { DataSource, Scene } from "astraeus";

type Api = typeof import("astraeus");
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const T0 = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;
const NOW = Date.UTC(2026, 5, 15, 12);
const prov = { sourceType: "illustrative" as const, sources: ["Invented for the pin"], accuracy: "None claimed.", notes: "Made up." };
const stub = (name: string, provides: string[]): DataSource => ({ name, provides });
const DATA = [stub("astraeus-data-jupiter", ["io", "europa", "ganymede", "callisto"]), stub("astraeus-data-saturn", ["mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus"]), stub("astraeus-data-uranus", ["miranda", "ariel", "umbriel", "titania", "oberon"])];
const COMET = {
  id: "made-up-comet",
  label: "Made-up comet",
  elements: { semiMajorAxisAu: 6, eccentricity: 0.9, inclinationDeg: 40, ascendingNodeDeg: 100, argumentOfPerihelionDeg: 60, meanAnomalyDeg: 200 },
  epoch: { jd: 2_461_000.5, timeScale: "TDB" as const, ttMinusUtcSeconds: 69.184 },
  plane: "ecliptic-j2000" as const,
  source: { name: "Invented Survey", url: "https://example.invalid/comet", solution: "Solution A", accessed: "2026-10-24" },
  accuracy: { classification: "indicative" as const, statement: "Made up; no comparison was made.", valid: { start: "2025-01-01T00:00:00Z", end: "2027-01-01T00:00:00Z" }, limitations: ["Invented for a test."] },
  marker: { color: "#ff9966", sizePx: 8 },
};
const orbit = (k: number) => ({ id: `rock-${k}`, semiMajorAxisKm: 80_000 + 5_000 * k, eccentricity: 0.1 + 0.02 * k, inclinationDeg: 5 + k, raanDeg: 40 + 3 * k, argumentOfPeriapsisDeg: 70 + k });
const rocks = (n = 4) => Array.from({ length: n }, (_, k) => orbit(k));
const burst = (extra: object = {}) => ({ id: "burst", label: "Burst", unit: "per hour", start: T0, end: T0 + 20 * DAY, peak: T0 + 10 * DAY, samples: [{ time: T0, value: 2 }, { time: T0 + 10 * DAY, value: 100 }, { time: T0 + 20 * DAY, value: 4 }], provenance: [{ start: T0, end: T0 + 8 * DAY, provenance: prov }, { start: T0 + 12 * DAY, end: T0 + 20 * DAY, provenance: { ...prov, sources: ["Another"] } }], ...extra });
const line = (n: number, scale = 1) => Array.from({ length: n }, (_, i) => ({ time: T0 + i * DAY, positionKm: [scale * (1e5 + i * 3e4), scale * i * 1e4, scale * 5e3 * i], velocityKmS: [1 + i / 10, 0.5, 0.1] }));
const iso = (ms: number): string => new Date(ms).toISOString();
const panel = (id: string, at: { utc?: number; event?: string; anchor?: string }, extra: object = {}) => ({ id, at: at.utc === undefined ? at : { utc: iso(at.utc) }, title: `Panel ${id}`, body: ["Made up."], badge: "illustrative", sources: ["Invented"], ...extra });
const provider = (id: string, center: string) => ({ stateAt: (t: number) => createState({ body: id, center, timeUtcMs: t, positionKm: [1.2e8 + (t - T0) * 0.1, 2e7, 5e6], velocityKmS: [1, 2, 3], orientation: null }) });

// ---------- turning a definition into stable plain data ----------

interface Ctx { readonly openMs: number }
const round = (value: number): number => (Number.isFinite(value) ? Number(value.toPrecision(12)) : value);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const hasFn = (value: Record<string, unknown>, name: string): boolean => typeof value[name] === "function";
const safe = <T>(read: () => T): Json | T => { try { return read(); } catch (error) { return errorOf(error); } };
function errorOf(error: unknown): Json {
  const e = error as { code?: unknown; name?: unknown; message?: unknown };
  return { error: { name: String(e?.name), ...(typeof e?.code === "string" ? { code: e.code } : {}), message: String(e?.message ?? error) } };
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
  if (hasFn(object, "ids") && hasFn(object, "definitions") && hasFn(object, "sources")) return { "[catalogue]": (object.ids as () => string[])() };
  if (hasFn(object, "stateAt") && isObject(object.bounds)) return { "[trajectory]": { bounds: next(object.bounds), states: statesOf(object, object.bounds as Span, ctx, depth, seen) } };
  if (hasFn(object, "fillPositionsKm")) return { "[group]": groupOf(object, ctx, depth, seen) };
  return record(object, ctx, depth, seen);
}

function list(items: unknown[], next: (item: unknown) => Json): Json {
  if (items.length > 24 && items.every((item) => typeof item === "number")) {
    const numbers = items as number[];
    return { "[numbers]": numbers.length, head: numbers.slice(0, 3).map(round), tail: numbers.slice(-3).map(round), sum: round(numbers.reduce((a, b) => a + b, 0)) };
  }
  return items.map(next);
}

/** The own data of a plain object, keys sorted; a `farthestKm` function is called (it is how the scene hands over the zoom-out limit), and a path layer also records its source's states. */
function record(object: Record<string, unknown>, ctx: Ctx, depth: number, seen: WeakSet<object>): Json {
  const out: { [key: string]: Json } = {};
  for (const key of Object.keys(object).sort()) {
    const item = object[key];
    if (item === undefined) continue;
    out[key] = typeof item === "function" && key === "farthestKm" ? (safe(() => round((item as () => number)())) as Json) : plain(item, ctx, depth + 1, seen);
  }
  if (hasFn(object, "stateAt") && isObject(object.span) && "startUtcMs" in object.span) out["[sourceStates]"] = statesOf(object, object.span as Span, ctx, depth, seen, typeof object.center === "string" ? object.center : undefined);
  return out;
}

type Span = { startUtcMs: number; endUtcMs: number };

function statesOf(source: Record<string, unknown>, bounds: Span, ctx: Ctx, depth: number, seen: WeakSet<object>, center?: string): Json {
  const times = [bounds.startUtcMs, Math.round((bounds.startUtcMs + bounds.endUtcMs) / 2), bounds.endUtcMs];
  return times.map((time) => safe(() => plain((source.stateAt as (t: number, c?: string) => unknown)(time, center), ctx, depth + 1, seen)) as Json);
}

function groupOf(group: Record<string, unknown>, ctx: Ctx, depth: number, seen: WeakSet<object>): Json {
  const count = group.count as number;
  const { fillPositionsKm, fillPositionsRangeKm, keplerElements, stateAt, ...data } = group as Record<string, unknown>;
  void fillPositionsRangeKm; void keplerElements; void stateAt;
  const out = new Float64Array(3 * count);
  const at = safe(() => { (fillPositionsKm as (t: number, o: Float64Array) => void).call(group, ctx.openMs, out); return { first: Array.from(out.slice(0, 12)).map(round), sum: round(out.reduce((a, b) => a + b, 0)) }; });
  return { data: plain(data, ctx, depth + 1, seen), atOpen: at as Json, member: safe(() => plain((stateAt as (i: number, t: number) => unknown).call(group, 0, ctx.openMs), ctx, depth + 1, seen)) as Json };
}

// ---------- observing a scene ----------

interface Graph {
  readonly api: Api;
  readonly resolverFor: (definition: ExperienceDefinition) => Parameters<ExperienceDefinition["createMetrics"]>[0];
  readonly planetSeriesLoaded: () => boolean;
  /** The engine-only routes of the same module graph as `api` (the root does not export them). */
  readonly internals: { readonly definitionOf: (scene: Scene, data?: DataSource[]) => ExperienceDefinition; readonly missingDataOf: (scene: Scene, data?: DataSource[]) => readonly string[] };
  readonly synthetic: { probe: () => Promise<ExperienceDefinition>; views: () => Promise<ExperienceDefinition>; journey: () => Promise<Scene> };
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
      return { resolver: createStateResolver(own.definitions(), own.sources(), createOrbAstronomyAdapter()), catalogue: own, clock: undefined as never };
    },
    synthetic: {
      probe: async () => (await import("../src/synthetic/syntheticProbeDefinition")).syntheticProbeDefinition,
      views: async () => (await import("../src/synthetic/syntheticViewsDefinition")).syntheticViewsDefinition,
      journey: async () => (await import("../src/synthetic/syntheticJourneyScene")).buildSyntheticJourneyScene(),
    },
  };
}

interface Built { readonly scene?: Scene; readonly definition?: ExperienceDefinition; readonly data?: DataSource[] }

/** Everything observable about one build: the definition before and after `prepare`, `prepare`'s own result, then the metrics, states and provenance of each object. */
async function observe(graph: Graph, built: Built): Promise<Json> {
  const out: { [key: string]: Json } = {};
  const data = built.data ?? [];
  let definition: ExperienceDefinition;
  try {
    definition = built.definition ?? graph.internals.definitionOf(built.scene!, data);
  } catch (error) {
    return { toDefinition: errorOf(error) };
  }
  const ctx: Ctx = { openMs: definition.clock.startUtcMs };
  out.seriesLoadedAtBuild = graph.planetSeriesLoaded();
  out.definitionBeforePrepare = plain(definition, ctx);
  try { await definition.prepare?.(); out.prepare = "resolved"; } catch (error) { out.prepare = errorOf(error); }
  const after = plain(definition, ctx);
  out.definitionAfterPrepare = JSON.stringify(after) === JSON.stringify(out.definitionBeforePrepare) ? "[same as before prepare]" : after;
  const { startUtcMs, endUtcMs } = definition.experience.window;
  const times = [definition.clock.startUtcMs, Math.round(startUtcMs + (endUtcMs - startUtcMs) * 0.75)];
  const ids = [...definition.experience.objects.map((object) => object.id), ...(definition.groups ?? []).map((layer) => layer.object.id)];
  out.metricTimes = times;
  const metrics = safe(() => definition.createMetrics(graph.resolverFor(definition)));
  out.metrics = Object.fromEntries(ids.map((id) => [id, times.map((time) => (typeof metrics === "function" ? safe(() => plain((metrics as (id: string, t: number) => unknown)(id, time), ctx)) : metrics) as Json)]));
  if (built.scene !== undefined) {
    const scene = built.scene;
    out.stateOf = Object.fromEntries(ids.map((id) => [id, times.map((time) => safe(() => plain(scene.stateOf(id, time), ctx)) as Json)]));
    out.provenanceOf = Object.fromEntries(ids.map((id) => [id, safe(() => plain(scene.provenanceOf(id), ctx)) as Json]));
    out.missingData = [...graph.internals.missingDataOf(scene, []), "|", ...graph.internals.missingDataOf(scene, data)];
  }
  return out;
}

/** What a build does: the stage that threw (the call, `toDefinition` or `prepare`) and the error's code and message, or that nothing threw. */
async function outcome(graph: Graph, build: () => Scene, data: DataSource[] = []): Promise<Json> {
  let stage = "call";
  try {
    const scene = build();
    stage = "toDefinition";
    const definition = graph.internals.definitionOf(scene, data);
    stage = "prepare";
    await definition.prepare?.();
    return { stage: "none" };
  } catch (error) {
    return { stage, ...(errorOf(error) as { error: Json }) };
  }
}

// ---------- the scenes ----------

type Case = (a: Api) => Built | Promise<Built>;
function sceneCases(g: Graph, withJourney: boolean): Record<string, Case> {
  return {
    ...(withJourney ? { "the made-up journey (synthetic)": async (): Promise<Built> => ({ scene: await g.synthetic.journey(), data: DATA }) } : {}),
    "sun scene: planets with each addBody option, orbit lines and the solar-system scale": (a) => ({ scene: new a.Scene().addBody(a.sun).addBody(a.venus, { enlarge: 30, orbit: true, labelReachEarthRadii: 5_000 }).addBody(a.earth, { enlarge: 60, orbit: true, showLabel: false, description: "Our planet.", color: "#9fd8ff", knownLimitations: ["Pinned."] }).addBody(a.mars, { orbit: true }).addBody("jupiter").setTime(T0).setScale(a.solarSystemScale) }),
    "earth and moon, readable scale offered alone, moon orbit line": (a) => ({ scene: new a.Scene().addBody(a.earth).addBody(a.moon, { orbit: true }).setTime(T0).setScale(a.readableScale, { only: true }) }),
    "true scale, then switched": (a) => ({ scene: new a.Scene().addBody(a.earth).addBody(a.moon).setScale(a.readableScale).setScale(a.trueScale).setTime(T0) }),
    "jupiter moons with their data package": (a) => ({ scene: new a.Scene().addBody(a.jupiter).addBody(a.io, { orbit: true }).addBody(a.europa).addBody("callisto").setTime(Date.UTC(2016, 5, 1)), data: DATA }),
    "a listed moon added by its id": (a) => ({ scene: new a.Scene().addBody(a.uranus).addBody("miranda", { orbit: true }).setTime(Date.UTC(2016, 5, 1)), data: DATA }),
    "own body from elements, fitOrbit and an ecliptic focus": (a) => {
      const scene = new a.Scene().addBody(a.sun).addBody(a.earth).addBodyFromElements(COMET, { orbit: true, showLabel: false, labelReachEarthRadii: 700, color: "#ff9966" }).setTime(T0);
      scene.camera.focus("made-up-comet", { up: "ecliptic", azimuthDeg: 20, elevationDeg: 10, distance: 80 }).fitOrbit("made-up-comet");
      return { scene };
    },
    "a failed add leaves the scene as it was": (a) => {
      const scene = new a.Scene().addBody(a.sun).addBody(a.earth).setTime(T0);
      for (const call of [() => scene.addBodyFromElements(COMET, { enlarge: 0.5 }), () => scene.addBody("made-up-comet"), () => scene.addBody("nope"), () => scene.addBody(a.moon, { orbit: true, color: "red" })]) { try { call(); } catch { /* recorded in the error pin */ } }
      scene.addBodyFromElements(COMET);
      return { scene };
    },
    "paths about the Earth: samples, provider, plane, anchors, readouts, stretches, spans": (a) => ({
      scene: new a.Scene().addBody(a.earth).addBody(a.moon).setTime(T0 + DAY)
        .addTrajectory({ id: "probe", label: "Probe", color: "#ff00aa", samples: line(6), plane: "ecliptic-j2000", provenance: prov, provenanceSpans: [{ start: T0, end: T0 + 2 * DAY, provenance: prov }, { start: T0 + 3 * DAY, end: T0 + 5 * DAY, provenance: { ...prov, sources: ["Later"] } }], description: "A probe.", knownLimitations: ["Made up."], anchors: [{ id: "a2", time: T0 + 3 * DAY }, { id: "a1", time: T0 + DAY }], readouts: [{ kind: "range", marker: "moon" }, { kind: "speed" }, { kind: "distance", to: "moon" }, { kind: "altitude", above: "earth" }], labelReachEarthRadii: 800, lineFixedTo: "moon" })
        .addTrajectory({ id: "flyer", provider: provider("flyer", "earth"), bounds: { start: T0, end: T0 + 10 * DAY }, lineFixedTo: [{ start: T0, end: T0 + 5 * DAY, body: "moon" }], plane: "ecliptic-j2000", readouts: [{ kind: "range" }] })
        .addTrajectory({ id: "plain-eqj", samples: line(4, 2), plane: "EQJ", center: "moon" }),
    }),
    "path added before any body follows the first body": (a) => ({ scene: new a.Scene().addTrajectory({ id: "early", samples: line(5) }).addBody(a.sun).addBody(a.earth).setTime(T0) }),
    "path added before any body keeps an own centre": (a) => ({ scene: new a.Scene().addTrajectory({ id: "early", samples: line(5), center: "moon" }).addBody(a.sun).addBody(a.earth).addBody(a.moon).setTime(T0) }),
    "sun scene with a path: auto stretches, cover, labels": (a) => ({ scene: new a.Scene().addBody(a.sun).addBody(a.earth, { enlarge: 60 }).addBody(a.jupiter).setTime(T0 + 2 * DAY).addTrajectory({ id: "traveller", center: "sun", samples: Array.from({ length: 12 }, (_, i) => ({ time: T0 + i * 10 * DAY, positionKm: [1.49e8 + i * 4e7, 3e7 * i, 1e7 * i] })), lineFixedTo: "auto", plane: "ecliptic-j2000", readouts: [{ kind: "range", marker: "earth" }, { kind: "distance", to: "jupiter" }], provenanceSpans: [{ start: T0, end: T0 + 50 * DAY, provenance: prov }] }).setScale(a.solarSystemScale) }),
    "sun scene with a long path and a declared reach": (a) => {
      const scene = new a.Scene().addBody(a.sun).addBody(a.earth).setTime(T0).addTrajectory({ id: "far", center: "sun", samples: [0, 100, 200].map((i) => ({ time: T0 + i * DAY, positionKm: [i * 5e9, 0, 0] })), lineFixedTo: "sun" });
      scene.camera.follow("far", { distance: 90 }).setReach(5_000);
      return { scene };
    },
    "groups: with and without a clump, a rate readout, an activity, an event, a panel": (a) => ({
      scene: new a.Scene().addBody(a.sun).addBody(a.earth).addBody(a.jupiter).setTime(T0 + 5 * DAY)
        .addActivity(burst())
        .addGroup({ id: "ring", label: "Ring", orbits: rocks(), color: "#ff8800", dotSizePx: 4, seed: 7, clump: { near: "jupiter", fraction: 0.5, widthDeg: 20 }, refillAfterMs: 600_000, refillSliceMs: 4, referenceTime: T0, description: "Four rocks.", knownLimitations: ["Invented."], provenance: prov, readouts: [{ kind: "rate" }], plane: "EQJ" })
        .addGroup({ plane: "ecliptic-j2000", id: "belt", orbits: rocks(2).map((o) => ({ ...o, time: T0 + DAY })), center: "earth" })
        .addEvents([{ id: "peak", label: "Peak", time: T0 + 10 * DAY, type: "peak", object: "ring" }])
        .addStoryPanels({ pauseSeconds: 2, panels: [panel("p1", { utc: T0 + 3 * DAY }, { object: "ring" }), panel("p2", { event: "peak" })] }),
    }),
    "groups added before the planet series are needed (no clump)": (a) => ({ scene: new a.Scene().addBody(a.earth).addBody(a.moon).setTime(T0).addGroup({ plane: "ecliptic-j2000", id: "ring", orbits: rocks(3), readouts: [{ kind: "rate", activity: "burst" }] }).addActivity(burst()) }),
    "activities set the window, and a timeline span overrides it": (a) => ({ scene: new a.Scene().addBody(a.earth).addActivity(burst()).addActivity(burst({ id: "second", label: "Second", start: T0 + 30 * DAY, end: T0 + 40 * DAY, peak: undefined, provenance: undefined, type: "meteor-shower", peakLabel: "Top", samples: [{ time: T0 + 30 * DAY, value: 1 }, { time: T0 + 40 * DAY, value: 3 }] })).setTimeline({ start: T0 - 5 * DAY, end: T0 + 50 * DAY }).setTime(T0 + 6 * DAY) }),
    "events with batch and own provenance, panels by utc, event and anchor": (a) => ({
      scene: new a.Scene().addBody(a.earth).addBody(a.moon).setTime(T0)
        .addTrajectory({ id: "probe", samples: line(6), anchors: [{ id: "fix-a", time: T0 + 2 * DAY }] })
        .addEvents([{ id: "burn", label: "Burn", time: T0 + 2 * DAY, type: "burn", object: "probe", provenance: prov }, { id: "late", label: "Late", time: T0 + 4 * DAY }], { provenance: { ...prov, sources: ["Batch"] } })
        .addEvents([{ id: "early", label: "Early", time: T0 + DAY, type: "burn", object: "moon" }])
        .addStoryPanels({ pauseSeconds: 0, autoOpen: false, panels: [panel("by-event", { event: "burn" }, { object: "probe" }), panel("by-utc", { utc: T0 + DAY }, { details: ["More."] }), panel("by-anchor", { anchor: "fix-a" })] }),
    }),
    "timeline: span, rates, opening rate, pacing spans and event rules, loop": (a) => ({
      scene: new a.Scene().addBody(a.earth).addBody(a.moon).setTime(T0 + DAY).addEvents([{ id: "e1", label: "E1", time: T0 + 3 * DAY, type: "encounter" }, { id: "e2", label: "E2", time: T0 + 7 * DAY, type: "encounter" }])
        .setTimeline({ start: T0, end: T0 + 10 * DAY, rates: [10, 100, 1000], rate: 100, loop: true, pacing: [{ start: T0, end: T0 + DAY, rate: 5000 }, { start: T0 + 8 * DAY, end: T0 + 9 * DAY, rate: 7, rampSeconds: 600 }, { near: { type: "encounter", withinSeconds: 3600 }, rate: 2 }, { near: { type: "encounter", withinSeconds: 600 }, rate: 1, rampSeconds: 60 }] }),
    }),
    "timeline: none, frozen at a moment": (a) => ({ scene: new a.Scene().addBody(a.earth).setTimeline({ none: true, at: T0 + 3 * DAY }) }),
    "timeline: none, running at a rate": (a) => ({ scene: new a.Scene().addBody(a.earth).setTime(T0).setTimeline({ none: true, rate: 3_600 }) }),
    "no time set: the opening time is now (fake clock)": (a) => ({ scene: new a.Scene().addBody(a.earth).addBody(a.moon) }),
    "no time set with a path: opens at the path start": (a) => ({ scene: new a.Scene().addBody(a.earth).addTrajectory({ id: "probe", samples: line(4) }) }),
    "display switches, called twice": (a) => ({ scene: new a.Scene().addBody(a.earth).addBody(a.moon, { orbit: true }).setTime(T0).setSwitches({ orbitLines: { place: "top-bar" }, labels: { place: "panel", on: false } }).setSwitches({ milkyWay: { place: "developer", on: false }, labels: { place: "top-bar" } }) }),
    "views with each camera rule": (a) => {
      const scene = new a.Scene().addBody(a.earth).addBody(a.moon).setTime(T0).addTrajectory({ id: "a", samples: line(5) }).addTrajectory({ id: "b", samples: line(5, 2) }).addEvents([{ id: "ea", label: "EA", time: T0 + DAY }, { id: "eb", label: "EB", time: T0 + 2 * DAY }])
        .addStoryPanels({ panels: [panel("pa", { utc: T0 + DAY }), panel("pb", { utc: T0 + 2 * DAY })] })
        .setViews([{ id: "va", label: "A", objects: ["a"], events: ["ea"], panels: ["pa"], camera: { follow: "a" } }, { id: "vb", label: "B", objects: ["b", "moon"], events: ["eb"], panels: ["pb"], camera: { focus: "b" } }, { id: "vs", label: "Start", camera: "start" }, { id: "vt", label: "Stay", camera: "stay" }, { id: "vn", label: "Default" }], { place: "panel", start: "vb" });
      scene.camera.follow("a", { azimuthDeg: 10 });
      return { scene };
    },
    "camera: follow then focus, setReach then fitOrbit, ecliptic up": (a) => {
      const scene = new a.Scene().addBody(a.sun).addBody(a.earth).addBody(a.mars).setTime(T0);
      scene.camera.follow("earth", { distance: 12 }).focus("mars", { up: "ecliptic", elevationDeg: 5 }).setReach(900).fitOrbit(a.mars);
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
    "timeline: pacing with no rate set (the base rate default)": (a) => ({ scene: new a.Scene().addBody(a.earth).addBody(a.moon).setTime(T0 + DAY).setTimeline({ start: T0, end: T0 + 10 * DAY, pacing: [{ start: T0 + 2 * DAY, end: T0 + 3 * DAY, rate: 5000 }] }) }),
    "sun scene with a path that peaks between its end samples (cover sample count)": (a) => ({
      scene: new a.Scene().addBody(a.sun).addBody(a.earth).setTime(T0 + 5 * DAY).addTrajectory({
        id: "bump", center: "sun", bounds: { start: T0, end: T0 + 10 * DAY },
        provider: { stateAt: (t: number) => createState({ body: "bump", center: "sun", timeUtcMs: t, positionKm: [1.5e8 + 4e9 * Math.exp(-((((t - T0) / DAY) - 3.3) ** 2) / 0.02), 0, 0], velocityKmS: [1, 0, 0], orientation: null }) },
      }),
    }),
  };
}

// ---------- the bad builds ----------

type Build = (a: Api) => Scene;
interface Bad { readonly build: Build; readonly data?: DataSource[] }
function badBuilds(): Record<string, Bad> {
  const earthMoon = (a: Api) => new a.Scene().addBody(a.earth).addBody(a.moon).setTime(T0);
  const sunScene = (a: Api) => new a.Scene().addBody(a.sun).addBody(a.earth).setTime(T0);
  const withPath = (a: Api, extra: object) => earthMoon(a).addTrajectory({ id: "p", samples: line(5), ...extra } as never);
  const b = (build: Build, data?: DataSource[]): Bad => ({ build, ...(data === undefined ? {} : { data }) });
  const tl = (a: Api, timeline: unknown) => earthMoon(a).setTimeline(timeline as never);
  const view = (a: Api, views: unknown, options: unknown = { place: "panel" }) => earthMoon(a).setViews(views as never, options as never);
  const bodyOpt = (a: Api, options: object) => new a.Scene().addBody(a.earth, options as never);
  const grp = (a: Api, extra: object) => earthMoon(a).addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(2), ...extra } as never);
  const act = (a: Api, extra: object) => earthMoon(a).addActivity(burst(extra) as never);
  const ev = (a: Api, events: unknown, options?: unknown) => earthMoon(a).addEvents(events as never, options as never);
  const panels = (a: Api, ...list: object[]) => earthMoon(a).addStoryPanels({ panels: list });
  return {
    // addBody and addBodyFromElements
    "addBody: orbit on a body with no orbit": b((a) => new a.Scene().addBody(a.sun, { orbit: true })),
    "addBody: unknown id": b((a) => new a.Scene().addBody("nope")),
    "addBody: repeated id": b((a) => new a.Scene().addBody(a.earth).addBody(a.earth)),
    "addBody: labelReach not positive": b((a) => bodyOpt(a, { labelReachEarthRadii: 0 })),
    "addBody: enlarge below 1": b((a) => bodyOpt(a, { enlarge: 0.5 })),
    "addBody: showLabel not a boolean": b((a) => bodyOpt(a, { showLabel: "yes" })),
    "addBody: colour not hex": b((a) => bodyOpt(a, { color: "red" })),
    "addBody: knownLimitations with an empty text": b((a) => bodyOpt(a, { knownLimitations: ["ok", ""] })),
    "addBody: moon orbit with its planet absent": b((a) => new a.Scene().addBody(a.moon, { orbit: true }).setTime(T0)),
    "addBody: Sun orbit with the Sun absent": b((a) => new a.Scene().addBody(a.earth, { orbit: true }).setTime(T0)),
    "addBody: Sun orbit line id taken by a path (path added second)": b((a) => sunScene(a).addBody(a.venus, { orbit: true }).addTrajectory({ id: "venus-orbit", samples: line(4), center: "sun" })),
    "addBody: Sun orbit line id taken (path added first)": b((a) => new a.Scene().addBody(a.sun).addTrajectory({ id: "venus-orbit", samples: line(4), center: "sun" }).addBody(a.venus, { orbit: true }).setTime(T0)),
    "addBodyFromElements: reserved id auto": b((a) => sunScene(a).addBodyFromElements({ ...COMET, id: "auto" })),
    "addBodyFromElements: bad record": b((a) => sunScene(a).addBodyFromElements({ ...COMET, elements: { ...COMET.elements, eccentricity: 3 } })),
    "addBodyFromElements: record not an object": b((a) => sunScene(a).addBodyFromElements(undefined as never)),
    "addBodyFromElements: id already in the catalogue": b((a) => sunScene(a).addBodyFromElements({ ...COMET, id: "mars" })),
    "addBodyFromElements: id already in the scene": b((a) => sunScene(a).addBodyFromElements(COMET).addBodyFromElements(COMET)),
    "addBodyFromElements: a bad option": b((a) => sunScene(a).addBodyFromElements(COMET, { enlarge: 0 })),
    "addBodyFromElements: orbit asked, then the Sun is absent": b((a) => new a.Scene().addBody(a.earth).addBodyFromElements(COMET, { orbit: true }).setTime(T0)),
    // addTrajectory
    "addTrajectory: empty id": b((a) => earthMoon(a).addTrajectory({ id: "", samples: line(3) })),
    "addTrajectory: id of a body": b((a) => earthMoon(a).addTrajectory({ id: "moon", samples: line(3) })),
    "addTrajectory: id of a group": b((a) => earthMoon(a).addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1) }).addTrajectory({ id: "g", samples: line(3) })),
    "addTrajectory: repeated id": b((a) => withPath(a, {}).addTrajectory({ id: "p", samples: line(3) })),
    "addTrajectory: centre not catalogued": b((a) => withPath(a, { center: "nowhere" })),
    "addTrajectory: first body not built-in (centre falls back to earth)": b((a) => new a.Scene().addBodyFromElements(COMET).addTrajectory({ id: "p", samples: line(3), readouts: [{ kind: "range", marker: "earth" }] }).addBody(a.earth)),
    "addTrajectory: labelReach not positive": b((a) => withPath(a, { labelReachEarthRadii: -1 })),
    "addTrajectory: plane not known": b((a) => withPath(a, { plane: "galactic" })),
    "addTrajectory: sample time not a moment": b((a) => withPath(a, { samples: [{ time: "soon", positionKm: [1, 2, 3] }, { time: T0, positionKm: [1, 2, 3] }] })),
    "addTrajectory: samples too few": b((a) => withPath(a, { samples: line(1) })),
    "addTrajectory: samples out of order": b((a) => withPath(a, { samples: [...line(3)].reverse() })),
    "addTrajectory: sample position not three numbers": b((a) => withPath(a, { samples: [{ time: T0, positionKm: [1, 2] }, { time: T0 + DAY, positionKm: [1, 2, 3] }] })),
    "addTrajectory: samples not a list": b((a) => withPath(a, { samples: 5 })),
    "addTrajectory: provider without stateAt": b((a) => earthMoon(a).addTrajectory({ id: "p", provider: {} as never, bounds: { start: T0, end: T0 + DAY } })),
    "addTrajectory: provider bounds not moments": b((a) => earthMoon(a).addTrajectory({ id: "p", provider: provider("p", "earth"), bounds: { start: "x", end: T0 } })),
    "addTrajectory: provider bounds missing": b((a) => earthMoon(a).addTrajectory({ id: "p", provider: provider("p", "earth") } as never)),
    "addTrajectory: provider bounds end before start": b((a) => earthMoon(a).addTrajectory({ id: "p", provider: provider("p", "earth"), bounds: { start: T0 + DAY, end: T0 } })),
    "addTrajectory: provenanceSpans not a list": b((a) => withPath(a, { provenanceSpans: "x" })),
    "addTrajectory: provenanceSpans bad time": b((a) => withPath(a, { provenanceSpans: [{ start: "x", end: T0, provenance: prov }] })),
    "addTrajectory: provenanceSpans bad provenance": b((a) => withPath(a, { provenanceSpans: [{ start: T0, end: T0 + DAY, provenance: { sourceType: "nope" } }] })),
    "addTrajectory: provenanceSpans end before start": b((a) => withPath(a, { provenanceSpans: [{ start: T0 + DAY, end: T0, provenance: prov }] })),
    "addTrajectory: provenanceSpans outside the path": b((a) => withPath(a, { provenanceSpans: [{ start: T0 - DAY, end: T0 + DAY, provenance: prov }] })),
    "addTrajectory: provenanceSpans overlapping": b((a) => withPath(a, { provenanceSpans: [{ start: T0, end: T0 + 2 * DAY, provenance: prov }, { start: T0 + DAY, end: T0 + 3 * DAY, provenance: prov }] })),
    "addTrajectory: lineFixedTo a number": b((a) => withPath(a, { lineFixedTo: 5 })),
    "addTrajectory: lineFixedTo a stretch without a body": b((a) => withPath(a, { lineFixedTo: [{ start: T0, end: T0 + DAY, body: "" }] })),
    "addTrajectory: lineFixedTo stretches overlapping": b((a) => withPath(a, { lineFixedTo: [{ start: T0, end: T0 + 2 * DAY, body: "moon" }, { start: T0 + DAY, end: T0 + 3 * DAY, body: "moon" }] })),
    "addTrajectory: lineFixedTo a body the scene lacks (at toDefinition)": b((a) => withPath(a, { lineFixedTo: "mars" })),
    "addTrajectory: lineFixedTo a stretch body the scene lacks": b((a) => withPath(a, { lineFixedTo: [{ start: T0, end: T0 + DAY, body: "mars" }] })),
    "addTrajectory: readouts not a list": b((a) => withPath(a, { readouts: "x" })),
    "addTrajectory: readout of an unknown kind": b((a) => withPath(a, { readouts: [{ kind: "colour" }] })),
    "addTrajectory: readout distance without a body": b((a) => withPath(a, { readouts: [{ kind: "distance" }] })),
    "addTrajectory: readout altitude without a body": b((a) => withPath(a, { readouts: [{ kind: "altitude" }] })),
    "addTrajectory: readout names an uncatalogued body": b((a) => withPath(a, { readouts: [{ kind: "range", marker: "nope" }] })),
    "addTrajectory: readout names a body the scene lacks": b((a) => withPath(a, { readouts: [{ kind: "distance", to: "mars" }] })),
    "addTrajectory: anchors not a list": b((a) => withPath(a, { anchors: "x" })),
    "addTrajectory: anchor without an id": b((a) => withPath(a, { anchors: [{ time: T0 }] })),
    "addTrajectory: anchor twice": b((a) => withPath(a, { anchors: [{ id: "a", time: T0 }, { id: "a", time: T0 + DAY }] })),
    "addTrajectory: anchor time not a moment": b((a) => withPath(a, { anchors: [{ id: "a", time: "x" }] })),
    "addTrajectory: anchor outside the path": b((a) => withPath(a, { anchors: [{ id: "a", time: T0 + 100 * DAY }] })),
    // addGroup and addActivity
    "addGroup: no id": b((a) => grp(a, { id: "" })),
    "addGroup: no orbits": b((a) => grp(a, { orbits: [] })),
    "addGroup: an orbit without an id": b((a) => grp(a, { orbits: [{ ...orbit(0), id: "" }] })),
    "addGroup: an orbit twice": b((a) => grp(a, { orbits: [orbit(0), orbit(0)] })),
    "addGroup: colour not hex": b((a) => grp(a, { color: "green" })),
    "addGroup: dot size not positive": b((a) => grp(a, { dotSizePx: 0 })),
    "addGroup: refillAfterMs not positive": b((a) => grp(a, { refillAfterMs: -1 })),
    "addGroup: refillSliceMs negative": b((a) => grp(a, { refillSliceMs: -1 })),
    "addGroup: knownLimitations with an empty text": b((a) => grp(a, { knownLimitations: [""] })),
    "addGroup: clump near an uncatalogued body": b((a) => grp(a, { clump: { near: "nope", fraction: 0.5, widthDeg: 10 } })),
    "addGroup: clump fraction above 1": b((a) => grp(a, { clump: { near: "moon", fraction: 2, widthDeg: 10 } })),
    "addGroup: clump width above 180": b((a) => grp(a, { clump: { near: "moon", fraction: 0.5, widthDeg: 200 } })),
    "addGroup: readouts not a list": b((a) => grp(a, { readouts: "x" })),
    "addGroup: readout of an unknown kind": b((a) => grp(a, { readouts: [{ kind: "speed" }] })),
    "addGroup: readout activity not a text": b((a) => grp(a, { readouts: [{ kind: "rate", activity: 5 }] })),
    "addGroup: centre not catalogued": b((a) => grp(a, { center: "nowhere" })),
    "addGroup: id of a body": b((a) => grp(a, { id: "moon" })),
    "addGroup: id of a path": b((a) => withPath(a, {}).addGroup({ plane: "ecliptic-j2000", id: "p", orbits: rocks(1) })),
    "addGroup: centre the scene lacks (at toDefinition)": b((a) => grp(a, { center: "mars" })),
    "addGroup: clump body the scene lacks": b((a) => grp(a, { clump: { near: "mars", fraction: 0.5, widthDeg: 10 } })),
    "addGroup: clump near its own centre": b((a) => grp(a, { clump: { near: "earth", fraction: 0.5, widthDeg: 10 } })),
    "addGroup: rate readout with no activity": b((a) => grp(a, { readouts: [{ kind: "rate" }] })),
    "addGroup: rate readout naming a missing activity": b((a) => grp(a, { readouts: [{ kind: "rate", activity: "ghost" }] }).addActivity(burst())),
    "addGroup: an orbit the engine refuses": b((a) => grp(a, { orbits: [{ ...orbit(0), eccentricity: 1.5 }] })),
    "addGroup: reference time not a moment": b((a) => grp(a, { referenceTime: "x" })),
    "addGroup: an orbit time not a moment": b((a) => grp(a, { orbits: [{ ...orbit(0), time: "x" }] })),
    "addGroup: reads the planet series but the window is outside them": b((a) => new a.Scene().addBody(a.earth).addBody(a.mars).setTimeline({ start: "1500-01-01", end: "1500-02-01" }).addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(2), clump: { near: "mars", fraction: 0.5, widthDeg: 10 }, center: "earth" })),
    "addActivity: no id": b((a) => act(a, { id: "" })),
    "addActivity: no label": b((a) => act(a, { label: "" })),
    "addActivity: no unit": b((a) => act(a, { unit: "" })),
    "addActivity: one sample": b((a) => act(a, { samples: [{ time: T0, value: 1 }] })),
    "addActivity: empty peakLabel": b((a) => act(a, { peakLabel: "" })),
    "addActivity: repeated id": b((a) => earthMoon(a).addActivity(burst()).addActivity(burst())),
    "addActivity: sample time not a moment": b((a) => act(a, { samples: [{ time: "x", value: 1 }, { time: T0, value: 1 }] })),
    "addActivity: negative rate": b((a) => act(a, { samples: [{ time: T0, value: -1 }, { time: T0 + DAY, value: 1 }] })),
    "addActivity: peak outside": b((a) => act(a, { peak: T0 + 100 * DAY })),
    "addActivity: start not a moment": b((a) => act(a, { start: "x" })),
    "addActivity: provenance span not a moment": b((a) => act(a, { provenance: [{ start: "x", end: T0, provenance: prov }] })),
    "addActivity: provenance malformed": b((a) => act(a, { provenance: [{ start: T0, end: T0 + DAY, provenance: { sourceType: "nope" } }] })),
    "addActivity: samples not a list": b((a) => act(a, { samples: 3 })),
    // time, scale, events, panels
    "setTime: not a moment": b((a) => earthMoon(a).setTime("soon")),
    "setTime: invalid Date": b((a) => earthMoon(a).setTime(new Date("x"))),
    "setScale: not a scale": b((a) => earthMoon(a).setScale({ id: "other" } as never)),
    "setScale: nothing": b((a) => earthMoon(a).setScale(undefined as never)),
    "setScale: solar-system without a Sun-centred scene": b((a) => earthMoon(a).setScale(a.solarSystemScale)),
    "setScale: solar-system without an enlarged body": b((a) => sunScene(a).setScale(a.solarSystemScale)),
    "addEvents: not a list": b((a) => ev(a, undefined)),
    "addEvents: no id": b((a) => ev(a, [{ id: "", label: "x", time: T0 }])),
    "addEvents: no label": b((a) => ev(a, [{ id: "a", label: "", time: T0 }])),
    "addEvents: repeated id": b((a) => ev(a, [{ id: "a", label: "A", time: T0 }, { id: "a", label: "B", time: T0 }])),
    "addEvents: repeated across calls": b((a) => ev(a, [{ id: "a", label: "A", time: T0 }]).addEvents([{ id: "a", label: "B", time: T0 }])),
    "addEvents: time not a moment": b((a) => ev(a, [{ id: "a", label: "A", time: "x" }])),
    "addEvents: object not a text": b((a) => ev(a, [{ id: "a", label: "A", time: T0, object: 5 }])),
    "addEvents: own provenance malformed": b((a) => ev(a, [{ id: "a", label: "A", time: T0, provenance: { sourceType: "nope" } }])),
    "addEvents: batch provenance malformed": b((a) => ev(a, [{ id: "a", label: "A", time: T0 }], { provenance: { sourceType: "nope" } })),
    "addEvents: object not in the scene (at toDefinition)": b((a) => ev(a, [{ id: "a", label: "A", time: T0, object: "ghost" }])),
    "addStoryPanels: event not there": b((a) => panels(a, panel("p1", { event: "ghost" }))),
    "addStoryPanels: anchor not there": b((a) => panels(a, panel("p2", { anchor: "ghost" }))),
    "addStoryPanels: object not in the scene": b((a) => panels(a, panel("p3", { utc: T0 + 3_600_000 }, { object: "ghost" }))),
    "addStoryPanels: time outside the timeline": b((a) => panels(a, panel("p4", { utc: T0 + 400 * DAY }))),
    "addStoryPanels: badge not one": b((a) => panels(a, panel("p5", { utc: T0 + 3_600_000 }, { badge: "guess" }))),
    "addStoryPanels: no sources": b((a) => panels(a, panel("p6", { utc: T0 + 3_600_000 }, { sources: [] }))),
    "addStoryPanels: repeated id": b((a) => panels(a, panel("p7", { utc: T0 + 3_600_000 }), panel("p7", { utc: T0 + 7_200_000 }))),
    "addStoryPanels: panels not a list": b((a) => earthMoon(a).addStoryPanels({ panels: 5 as never })),
    "addStoryPanels: pauseSeconds out of range": b((a) => earthMoon(a).addStoryPanels({ pauseSeconds: 99, panels: [panel("p", { utc: T0 })] })),
    "addStoryPanels: no body": b((a) => earthMoon(a).addStoryPanels({ panels: [panel("p", { utc: T0 }, { body: [] })] })),
    "addStoryPanels: undefined": b((a) => earthMoon(a).addStoryPanels(undefined as never)),
    // timeline
    "setTimeline: not an object": b((a) => tl(a, 5)),
    "setTimeline: rate zero": b((a) => tl(a, { start: T0, end: T0 + DAY, rate: 0 })),
    "setTimeline: loop not a boolean": b((a) => tl(a, { start: T0, end: T0 + DAY, loop: "yes" })),
    "setTimeline: none with a bad moment": b((a) => tl(a, { none: true, at: "x" })),
    "setTimeline: start not a moment": b((a) => tl(a, { start: "x", end: T0 })),
    "setTimeline: end before start": b((a) => tl(a, { start: T0 + DAY, end: T0 })),
    "setTimeline: rates empty": b((a) => tl(a, { start: T0, end: T0 + DAY, rates: [] })),
    "setTimeline: a rate not positive": b((a) => tl(a, { start: T0, end: T0 + DAY, rates: [1, -2] })),
    "setTimeline: pacing not a list": b((a) => tl(a, { start: T0, end: T0 + DAY, pacing: 5 })),
    "setTimeline: pacing piece not an object": b((a) => tl(a, { start: T0, end: T0 + DAY, pacing: [5] })),
    "setTimeline: pacing rate not positive": b((a) => tl(a, { start: T0, end: T0 + DAY, pacing: [{ start: T0, end: T0 + 100, rate: 0 }] })),
    "setTimeline: pacing ramp negative": b((a) => tl(a, { start: T0, end: T0 + DAY, pacing: [{ start: T0, end: T0 + 100, rate: 1, rampSeconds: -1 }] })),
    "setTimeline: pacing near without a type": b((a) => tl(a, { start: T0, end: T0 + DAY, pacing: [{ near: { withinSeconds: 5 }, rate: 1 }] })),
    "setTimeline: pacing near within not positive": b((a) => tl(a, { start: T0, end: T0 + DAY, pacing: [{ near: { type: "x", withinSeconds: 0 }, rate: 1 }] })),
    "setTimeline: pacing piece without from and to": b((a) => tl(a, { start: T0, end: T0 + DAY, pacing: [{ rate: 1 }] })),
    "setTimeline: pacing to before from": b((a) => tl(a, { start: T0, end: T0 + DAY, pacing: [{ start: T0 + 100, end: T0, rate: 1 }] })),
    "setTimeline: pacing spans overlapping": b((a) => tl(a, { start: T0, end: T0 + DAY, pacing: [{ start: T0, end: T0 + 100, rate: 1 }, { start: T0 + 50, end: T0 + 200, rate: 1 }] })),
    "setTimeline: pacing rule matching no event (at toDefinition)": b((a) => tl(a, { start: T0, end: T0 + DAY, pacing: [{ near: { type: "ghost", withinSeconds: 5 }, rate: 1 }] })),
    "setTime outside the timeline (at toDefinition)": b((a) => tl(a, { start: T0 + DAY, end: T0 + 2 * DAY })),
    "setTime outside a frozen-at timeline": b((a) => earthMoon(a).setTimeline({ none: true, at: T0 })),
    // switches and views
    "setSwitches: not an object": b((a) => earthMoon(a).setSwitches(5 as never)),
    "setSwitches: unknown switch": b((a) => earthMoon(a).setSwitches({ colour: { place: "panel" } } as never)),
    "setSwitches: bad place": b((a) => earthMoon(a).setSwitches({ labels: { place: "sidebar" } } as never)),
    "setSwitches: on not a boolean": b((a) => earthMoon(a).setSwitches({ labels: { place: "panel", on: 1 } } as never)),
    "setViews: not a list": b((a) => view(a, undefined)),
    "setViews: empty": b((a) => view(a, [])),
    "setViews: bad place": b((a) => view(a, [{ id: "a", label: "A" }], { place: "left" })),
    "setViews: options missing": b((a) => view(a, [{ id: "a", label: "A" }], null)),
    "setViews: view not an object": b((a) => view(a, [5])),
    "setViews: no id": b((a) => view(a, [{ id: "", label: "A" }])),
    "setViews: no label": b((a) => view(a, [{ id: "a", label: "" }])),
    "setViews: repeated id": b((a) => view(a, [{ id: "a", label: "A" }, { id: "a", label: "B" }])),
    "setViews: ids not a list": b((a) => view(a, [{ id: "a", label: "A", objects: "x" }])),
    "setViews: camera malformed": b((a) => view(a, [{ id: "a", label: "A", camera: { follow: "x", focus: "y" } }])),
    "setViews: camera a string that is not a rule": b((a) => view(a, [{ id: "a", label: "A", camera: "orbit" }])),
    "setViews: start not a view": b((a) => view(a, [{ id: "a", label: "A" }], { place: "panel", start: "z" })),
    "setViews: id the scene lacks (at toDefinition)": b((a) => view(a, [{ id: "a", label: "A", objects: ["ghost"] }])),
    "setViews: body the scene lacks": b((a) => view(a, [{ id: "a", label: "A", objects: ["ghost"] }])),
    "setViews: event the scene lacks": b((a) => view(a, [{ id: "a", label: "A", events: ["ghost"] }])),
    "setViews: panel the scene lacks": b((a) => view(a, [{ id: "a", label: "A", panels: ["ghost"] }])),
    "setViews: camera target the view does not show": b((a) => earthMoon(a).addTrajectory({ id: "x", samples: line(3) }).setViews([{ id: "a", label: "A", objects: ["x"] }, { id: "b", label: "B", objects: ["moon"], camera: { follow: "x" } }], { place: "panel" })),
    // camera
    "camera.follow: unknown id": b((a) => { const s = earthMoon(a); s.camera.follow("ghost"); return s; }),
    "camera.focus: unknown id": b((a) => { const s = earthMoon(a); s.camera.focus("ghost"); return s; }),
    "camera.follow: up not known": b((a) => { const s = earthMoon(a); s.camera.follow("moon", { up: "north" as never }); return s; }),
    "camera.setReach: zero": b((a) => { const s = earthMoon(a); s.camera.setReach(0); return s; }),
    "camera.setReach: not a number": b((a) => { const s = earthMoon(a); s.camera.setReach("far" as never); return s; }),
    "camera.setReach: infinite": b((a) => { const s = earthMoon(a); s.camera.setReach(Infinity); return s; }),
    "camera.fitOrbit: unknown id": b((a) => { const s = earthMoon(a); s.camera.fitOrbit("ghost"); return s; }),
    "camera.fitOrbit: a body that does not circle the Sun": b((a) => { const s = earthMoon(a); s.camera.fitOrbit(a.moon); return s; }),
    "camera.fitOrbit: the Sun itself": b((a) => { const s = sunScene(a); s.camera.fitOrbit(a.sun); return s; }),
    // scene-level
    "toDefinition: empty scene": b((a) => new a.Scene()),
    "toDefinition: a data package not passed": b((a) => new a.Scene().addBody(a.jupiter).addBody(a.io).setTime(T0)),
    "toDefinition: a listed moon's data package not passed": b((a) => new a.Scene().addBody(a.uranus).addBody("miranda").setTime(T0)),
    "stateOf: unknown id": b((a) => { earthMoon(a).stateOf("ghost", T0); return earthMoon(a); }),
    "stateOf: time not a moment": b((a) => { earthMoon(a).stateOf("moon", "x"); return earthMoon(a); }),
    "stateOf: outside a path": b((a) => { withPath(a, {}).stateOf("p", T0 + 100 * DAY); return earthMoon(a); }),
    "provenanceOf: unknown id": b((a) => { earthMoon(a).provenanceOf("ghost"); return earthMoon(a); }),
    "planet series: stateOf a planet before they are loaded": b((a) => { new a.Scene().addBody(a.sun).addBody(a.mars).stateOf("mars", T0); return sunScene(a); }),
    "out-of-span: planets and a window outside the planet series (prepare rejects)": b((a) => new a.Scene().addBody(a.sun).addBody(a.earth).addBody(a.mars).setTimeline({ start: "1500-01-01", end: "1500-02-01" })),
    "out-of-span: orbit lines and a window outside the series": b((a) => new a.Scene().addBody(a.sun).addBody(a.mars, { orbit: true }).setTimeline({ start: "1500-01-01", end: "1500-02-01" })),
    "out-of-span: a fit and a window outside the series": b((a) => { const s = new a.Scene().addBody(a.sun).addBody(a.mars).setTimeline({ start: "1500-01-01", end: "1500-02-01" }); s.camera.fitOrbit("mars"); return s; }),
    // which error wins when a scene has two faults, in the order toDefinition checks
    "two faults: empty scene and a bad group readout": b((a) => new a.Scene().addActivity(burst())),
    "two faults: missing data package and a bad group readout": b((a) => new a.Scene().addBody(a.jupiter).addBody(a.io).setTime(T0).addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1), readouts: [{ kind: "rate" }] }), DATA.slice(1)),
    "two faults: bad group readout and a moon orbit with no planet": b((a) => new a.Scene().addBody(a.moon, { orbit: true }).setTime(T0).addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1), readouts: [{ kind: "rate" }] })),
    "two faults: moon orbit with no planet and a bad scale": b((a) => new a.Scene().addBody(a.moon, { orbit: true }).setTime(T0).setScale(a.solarSystemScale)),
    "two faults: bad scale and a path line fixed to a missing body": b((a) => withPath(a, { lineFixedTo: "mars" }).setScale(a.solarSystemScale)),
    "two faults: path line fixed to a missing body and a readout naming a missing body": b((a) => withPath(a, { lineFixedTo: "mars", readouts: [{ kind: "distance", to: "venus" }] })),
    "two faults: readout naming a missing body and setTime outside the timeline": b((a) => withPath(a, { readouts: [{ kind: "distance", to: "venus" }] }).setTimeline({ start: T0 + 100 * DAY, end: T0 + 200 * DAY }).setTime(T0)),
    "two faults: setTime outside the timeline and a Sun orbit with no Sun": b((a) => new a.Scene().addBody(a.earth, { orbit: true }).setTimeline({ start: T0 + DAY, end: T0 + 2 * DAY }).setTime(T0)),
    "two faults: Sun orbit with no Sun and a bad story panel": b((a) => new a.Scene().addBody(a.earth, { orbit: true }).setTime(T0).addStoryPanels({ panels: [panel("p", { event: "ghost" })] })),
    "two faults: bad story panel and a group centre the scene lacks": b((a) => earthMoon(a).addStoryPanels({ panels: [panel("p", { event: "ghost" })] }).addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1), center: "mars" })),
    "two faults: group centre the scene lacks and an event object the scene lacks": b((a) => earthMoon(a).addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1), center: "mars" }).addEvents([{ id: "e", label: "E", time: T0, object: "ghost" }])),
    "two faults: event object the scene lacks and a view id the scene lacks": b((a) => earthMoon(a).addEvents([{ id: "e", label: "E", time: T0, object: "ghost" }]).setViews([{ id: "a", label: "A", objects: ["ghost"] }], { place: "panel" })),
    "two faults: view id the scene lacks and a pacing rule matching no event": b((a) => earthMoon(a).setViews([{ id: "a", label: "A", objects: ["ghost"] }], { place: "panel" }).setTimeline({ start: T0, end: T0 + DAY, pacing: [{ near: { type: "ghost", withinSeconds: 5 }, rate: 1 }] })),
    "two faults: out-of-span and a group centre the scene lacks": b((a) => new a.Scene().addBody(a.sun).addBody(a.mars).setTimeline({ start: "1500-01-01", end: "1500-02-01" }).addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1), center: "venus" })),
    "two faults: out-of-span and an event object the scene lacks": b((a) => new a.Scene().addBody(a.sun).addBody(a.mars).setTimeline({ start: "1500-01-01", end: "1500-02-01" }).addEvents([{ id: "e", label: "E", time: "1500-01-15", object: "ghost" }])),
    "two faults at the call: the first throws": b((a) => new a.Scene().addBody("nope").addBody("nada")),
  };
}

// ---------- the test ----------

/** A fresh module graph: the planet series are not loaded in it, as in a consumer's mount. */
async function freshGraph(): Promise<Graph> {
  vi.resetModules();
  const graph = await loadGraph();
  expect(graph.planetSeriesLoaded()).toBe(false);
  return graph;
}
/** The bad builds whose outcome can depend on whether the planet series are loaded. */
const DEFERRED = /out-of-span|Sun orbit|fitOrbit|clump|planet series/;

describe("what the scene builder produces today (O-058 T-231)", () => {
  beforeAll(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(NOW); });
  afterAll(() => { vi.useRealTimers(); });

  it("builds the same definitions, metrics, states and errors in both orders", async () => {
    const seriesLoaded: { [key: string]: Json } = {};
    const errorsSeriesLoaded: { [key: string]: Json } = {};
    const seriesNotLoaded: { [key: string]: Json } = {};
    const errorsSeriesNotLoaded: { [key: string]: Json } = {};

    // Order one: the planet series are already loaded (the normal test graph).
    const loaded = await loadGraph();
    const cases = sceneCases(loaded, true);
    for (const [name, make] of Object.entries(cases)) seriesLoaded[name] = await observe(loaded, await make(loaded.api));
    const bad = badBuilds();
    for (const [name, one] of Object.entries(bad)) errorsSeriesLoaded[name] = await outcome(loaded, () => one.build(loaded.api), one.data);

    // Order two: a fresh module graph for each build, so the planet series are not loaded when the definition is built.
    for (const name of Object.keys(sceneCases(loaded, false))) {
      const graph = await freshGraph();
      seriesNotLoaded[name] = await observe(graph, await sceneCases(graph, false)[name]!(graph.api));
    }
    for (const [name, one] of Object.entries(bad)) {
      if (!DEFERRED.test(name)) continue;
      const graph = await freshGraph();
      errorsSeriesNotLoaded[name] = await outcome(graph, () => one.build(graph.api), one.data);
    }

    const pin = { seriesLoaded, errorsSeriesLoaded, seriesNotLoaded, errorsSeriesNotLoaded };
    await expect(`${JSON.stringify(pin, null, 1)}\n`).toMatchFileSnapshot("./fixtures/scenePin.json");
  }, 600_000);
});
