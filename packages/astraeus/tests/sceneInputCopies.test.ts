// O-059 repair of I-143 (API-04): every `Scene` call that takes an object keeps its own copy of it. One row per call, each input alone, on made-up data (ARCH-03):
// editing the caller's object after the call changes nothing the scene reads, checks or builds, and one object given to two scenes keeps them apart.
import { describe, expect, it } from "vitest";
import { Scene, earth, moon, solarSystemScale, sun } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createStateResolver } from "../src/core/stateResolver";
import { SceneCamera } from "../src/api/planCamera";
import { definitionOf, missingDataOf } from "../src/api/definitionOf";

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const prov = () => ({ sourceType: "illustrative" as const, sources: ["Made up for a test"], accuracy: "Not real.", notes: "Invented." });
const orbit = (k: number) => ({ id: `rock-${k}`, semiMajorAxisKm: 80_000_000 + 5_000_000 * k, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 40, argumentOfPeriapsisDeg: 70 });
const samples = () => [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [10_000 + i * 1_000, 0, 0] }));
const swarm = () => ({
  id: "swarm", families: [{ id: "inner", label: "Inner swarm" }], provenance: prov(),
  members: [0, 1, 2].map((k) => ({ id: `bit-${k}`, label: `Bit ${k}`, radiusKm: 4, family: "inner", elements: { semiMajorAxisKm: 30_000 + 4_000 * k, eccentricity: 0.05, inclinationDeg: 3, raanDeg: 20, argumentOfPeriapsisDeg: 40, trueAnomalyDeg: 10 + 30 * k } })),
  centerGmKm3S2: 4.0e5,
});
const record = () => ({
  id: "rock", label: "Rock",
  elements: { semiMajorAxisAu: 2.5, eccentricity: 0.3, inclinationDeg: 10, ascendingNodeDeg: 40, argumentOfPerihelionDeg: 70, meanAnomalyDeg: 20 },
  epoch: { jd: 2461000.5, timeScale: "TDB" as const, ttMinusUtcSeconds: 69.184 },
  frame: "ecliptic-j2000" as const,
  source: { name: "Made up", url: "https://example.org/rock", solution: "S1", accessed: "2026-10-28" },
  accuracy: { classification: "indicative" as const, statement: "Made up.", validFromUtc: "2020-01-01T00:00:00Z", validToUtc: "2030-01-01T00:00:00Z", limitations: [] },
  marker: { color: "#aabbcc", sizePx: 6 },
});
const panel = (id: string, at: object) => ({ id, at, title: `Panel ${id}`, body: ["A line."], details: ["A figure."], badge: "modelled" as const, sources: ["Source"] });

/** The scene every row starts from; `center` bodies and a path so the inputs below have something to name. */
const base = () => new Scene().setTime(T0).addBody(sun).addBody(earth).addBody(moon).addTrajectory({ id: "probe", center: "earth", samples: samples(), anchors: [{ id: "fix-a", time: T0 + 10 * MIN }] }).addEvents([{ id: "ev", label: "Event", time: T0 + 20 * MIN }]);
/** Every option `addBody` and `addBodyFromElements` take, each with a value, so the walk edits all of them (the lap form of `orbit` has its own row). */
const allBodyOptions = () => ({
  orbit: true, enlarge: 2, showLabel: false, labelReachEarthRadii: 900, description: "A line.", color: "#9fd8ff", knownLimitations: ["A made-up limit."], listed: true, labelPriority: 40,
  readouts: [{ kind: "range" }, { kind: "distance", to: "sun" }], facts: [{ label: "Found", value: "1610" }], sources: ["A made-up source"],
});
const cameraView = () => ({ azimuthDeg: 10, elevationDeg: 20, distance: 30, up: "ecliptic" as const });
const withSwarm = () => base().addBodySet(swarm());

interface Row { readonly name: string; readonly scene: () => Scene; readonly input: () => unknown; readonly apply: (scene: Scene, input: never) => Scene }
const ROWS: readonly Row[] = [
  { name: "addBody (options)", scene: () => new Scene().setTime(T0).addBody(sun), input: allBodyOptions, apply: (s, o) => s.addBody(earth, o) },
  { name: "addBody (lap orbit option)", scene: () => new Scene().setTime(T0).addBody(sun).addBody(earth), input: () => ({ orbit: { lapDays: 27, fades: true } }), apply: (s, o) => s.addBody(moon, o) },
  { name: "addBodyFromElements (record, options)", scene: () => new Scene().setTime(T0).addBody(sun), input: () => ({ record: record(), options: allBodyOptions() }), apply: (s, i: { record: never; options: never }) => s.addBodyFromElements(i.record, i.options) },
  { name: "addTrajectory", scene: () => new Scene().setTime(T0).addBody(earth), input: () => ({ id: "track", label: "Track", center: "earth", samples: samples(), provenance: prov(), anchors: [{ id: "a1", time: T0 + 10 * MIN }] }), apply: (s, i) => s.addTrajectory(i) },
  { name: "addGroup", scene: () => base(), input: () => ({ id: "ring", label: "Ring", plane: "ecliptic-j2000" as const, orbits: [0, 1, 2].map(orbit), provenance: prov(), clump: { near: "earth", fraction: 0.5, widthDeg: 20 } }), apply: (s, i) => s.addGroup(i) },
  { name: "addBodySet", scene: () => base(), input: swarm, apply: (s, i) => s.addBodySet(i) },
  { name: "setMoonPanel", scene: withSwarm, input: () => ({ label: "Tarn", families: [{ id: "big", label: "Big", description: "One.", moons: [{ id: "moon" }] }, { id: "small", label: "Small", description: "Three.", moons: [{ id: "bit-0" }, { id: "bit-1" }] }], featuredFamily: "big", listSource: "A made-up list", listDate: "2026-10-18" }), apply: (s, i) => s.setMoonPanel(i) },
  { name: "setPicker", scene: () => base(), input: () => ({ id: "world", label: "World", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }], value: "a" }), apply: (s, i) => s.setPicker(i) },
  { name: "addPlaces", scene: () => base(), input: () => ({ categories: [{ key: "pit", label: "Pits", color: "#9de3a8" }], places: [{ id: "deep", name: "Deep Pit", kind: "Pit", category: "pit", latitudeDeg: 12, longitudeDeg: -40, description: "A made-up pit.", details: [{ label: "Depth", value: "3 km" }] }], provenance: prov(), knownLimitations: ["Made up."] }), apply: (s, i) => s.addPlaces("moon", i) },
  { name: "addActivity", scene: () => base(), input: () => ({ id: "burst", label: "Burst", unit: "per hour", start: T0, end: T0 + 40 * MIN, peak: T0 + 20 * MIN, samples: [{ time: T0, value: 2 }, { time: T0 + 20 * MIN, value: 100 }, { time: T0 + 40 * MIN, value: 4 }], provenance: [{ start: T0, end: T0 + 40 * MIN, provenance: prov() }] }), apply: (s, i) => s.addActivity(i) },
  { name: "setTime", scene: () => base(), input: () => new Date(T0 + 5 * MIN), apply: (s, i) => s.setTime(i) },
  { name: "setScale (scale, options)", scene: () => new Scene().setTime(T0).addBody(sun).addBody(earth, { enlarge: 3 }), input: () => ({ scale: { ...solarSystemScale }, options: { only: true } }), apply: (s, i: { scale: never; options: never }) => s.setScale(i.scale, i.options) },
  { name: "setLook", scene: () => base(), input: () => ({ starBrightness: 1.4, markerSwapRadiusPx: 5, loadFadeSeconds: 1 }), apply: (s, i) => s.setLook(i) },
  { name: "setBodyReadouts", scene: () => base(), input: () => ["distance", "phase"], apply: (s, i) => s.setBodyReadouts(i) },
  { name: "addEvents (events, options)", scene: () => base(), input: () => ({ events: [{ id: "e1", label: "E1", time: T0 + 5 * MIN, type: "burn", object: "probe" }], options: { provenance: prov() } }), apply: (s, i: { events: never; options: never }) => s.addEvents(i.events, i.options) },
  { name: "addStoryPanels", scene: () => base(), input: () => ({ pauseSeconds: 3, panels: [panel("by-event", { event: "ev" }), panel("by-anchor", { anchor: "fix-a" })] }), apply: (s, i) => s.addStoryPanels(i) },
  { name: "setTimeline", scene: () => base(), input: () => ({ start: T0, end: T0 + 60 * MIN, rates: [10, 100], rate: 100, loop: true }), apply: (s, i) => s.setTimeline(i) },
  { name: "setSwitches", scene: () => base(), input: () => ({ orbitLines: { place: "top-bar" }, labels: { place: "panel", on: false } }), apply: (s, i) => s.setSwitches(i) },
  { name: "setViews (views, options)", scene: () => base(), input: () => ({ views: [{ id: "a", label: "A", objects: ["probe"] }, { id: "all", label: "All" }], options: { place: "panel", start: "all" } }), apply: (s, i: { views: never; options: never }) => s.setViews(i.views, i.options) },
  { name: "camera.follow", scene: () => base(), input: cameraView, apply: (s, i) => { s.camera.follow("earth", i); return s; } },
  { name: "camera.focus", scene: () => base(), input: cameraView, apply: (s, i) => { s.camera.focus("earth", i); return s; } },
  { name: "camera.setStartView", scene: () => base(), input: () => ({ focus: "earth", azimuthDeg: 20, elevationDeg: 30, distance: 40 }), apply: (s, i) => { s.camera.setStartView(i); return s; } },
  { name: "camera.setFollowChoices", scene: () => base(), input: () => ["earth", { id: "moon" }], apply: (s, i) => { s.camera.setFollowChoices(i); return s; } },
  { name: "camera.setReach (distance, options)", scene: () => base(), input: () => ({ distance: 800, options: { farEarthRadii: 2000 } }), apply: (s, i: { distance: number; options: never }) => { s.camera.setReach(i.distance, i.options); return s; } },
  { name: "camera.fitOrbit", scene: () => base(), input: () => ({ id: "earth" }), apply: (s, i) => { s.camera.fitOrbit(i); return s; } },
];

/** Edits every part of `value` in place: numbers, texts and flags change, lists grow and their items change, dates move. Functions and built-in bodies are left. */
function scribble(value: unknown): void {
  if (value instanceof Date) { value.setTime(value.getTime() + 1_000_000); return; }
  if (typeof value !== "object" || value === null) return;
  if (Array.isArray(value)) {
    for (const item of value) scribble(item);
    value.push(typeof value[0] === "object" && value[0] !== null ? structuredClone(value[0]) : "extra");
    return;
  }
  const proto = Object.getPrototypeOf(value) as unknown;
  if (proto !== Object.prototype && proto !== null) return;
  const record = value as Record<string, unknown>;
  for (const [key, item] of Object.entries(record)) {
    if (typeof item === "number") record[key] = item * 3 + 1;
    else if (typeof item === "string") record[key] = `${item}!`;
    else if (typeof item === "boolean") record[key] = !item;
    else scribble(item);
  }
}

type Path = readonly (string | number)[];
const EDITS = { count: 0, rows: new Set<string>() };
const plain = (value: object): boolean => { const proto = Object.getPrototypeOf(value) as unknown; return proto === Object.prototype || proto === null; };
/** Every leaf of a plain input: a number, text, flag or date, and each list (edited as a whole). Functions and built-in bodies are not walked. */
function leavesOf(value: unknown, path: Path = []): Path[] {
  if (value instanceof Date) return [path];
  if (typeof value !== "object" || value === null) return typeof value === "function" ? [] : [path];
  if (ArrayBuffer.isView(value) || !(Array.isArray(value) || plain(value))) return [];
  const own = Array.isArray(value) ? [...path.length === 0 ? [] : [path]] : [];
  return [...own, ...Object.entries(value).flatMap(([key, item]) => leavesOf(item, [...path, Array.isArray(value) ? Number(key) : key]))];
}
/** A valid value for a leaf on its own, by the leaf's name (a kind that exists, a body that exists), beside the generic ones. */
const VALID_ALTS: Readonly<Record<string, readonly unknown[]>> = { kind: ["speed", "range"], to: ["moon", "earth"], color: ["#000000"], above: ["moon"], value: ["b"], place: ["panel", "top-bar"], up: ["ecliptic"], 0: ["range", "phase"], 1: ["speed"] };
/** The one-leaf edits of a leaf: each edit changes only that leaf (in place) and says whether it changed anything. Valid-on-its-own values come first, then bad ones. */
function editsOf(sample: unknown, path: Path): ((root: unknown) => boolean)[] {
  const read = (root: unknown): { parent: Record<string | number, unknown>; key: string | number; value: unknown } | undefined => {
    let at = root as Record<string | number, unknown>;
    for (const step of path.slice(0, -1)) at = at[step] as Record<string | number, unknown>;
    const key = path[path.length - 1];
    return key === undefined ? undefined : { parent: at, key, value: at[key] };
  };
  const target = read(sample);
  if (target === undefined) return [];
  const { value, key } = target;
  const replacements: unknown[] = [];
  if (Array.isArray(value)) {
    return [(root) => { const t = read(root)!; const list = t.parent[t.key] as unknown[]; list.push(typeof list[0] === "object" && list[0] !== null ? structuredClone(list[0]) : "extra"); return true; },
      (root) => { const t = read(root)!; (t.parent[t.key] as unknown[]).push(null); return true; },
      (root) => { const t = read(root)!; const list = t.parent[t.key] as unknown[]; if (list.length === 0) return false; list.pop(); return true; },
      (root) => { const t = read(root)!; const list = t.parent[t.key] as unknown[]; if (list.length < 2) return false; list.reverse(); return JSON.stringify(list) !== JSON.stringify([...list].reverse()); }];
  }
  if (value instanceof Date) replacements.push(new Date(value.getTime() + 1_000_000), new Date(Number.NaN));
  else if (typeof value === "number") replacements.push(value * 3 + 1, value + 1, -1, 0, "bad");
  else if (typeof value === "string") replacements.push(...(VALID_ALTS[String(key)] ?? []), `${value}!`, "", 7);
  else if (typeof value === "boolean") replacements.push(!value, "yes");
  const edits = replacements.map((next) => (root: unknown): boolean => { const t = read(root)!; if (Object.is(t.parent[t.key], next)) return false; t.parent[t.key] = next; return true; });
  if (!Array.isArray(target.parent) && typeof key === "string") edits.push((root) => { const t = read(root)!; return delete t.parent[t.key]; });
  return edits;
}

/** Everything a scene reads, checks and builds, as text that changes when any of it does (functions and caches by name only). */
function observe(scene: Scene): Record<string, string> {
  const seen = new WeakSet<object>();
  const text = (value: unknown): string => JSON.stringify(value, (_key, item: unknown) => {
    if (typeof item === "function") return "fn";
    if (item instanceof Map) return { map: [...item] };
    if (item instanceof Set) return { set: [...item] };
    if (typeof item === "object" && item !== null) {
      if (seen.has(item)) return "cycle";
      seen.add(item);
    }
    return item;
  });
  const reads = { bodies: scene.bodies, paths: scene.paths, groups: scene.groups, bodySets: scene.bodySets, moonPanel: scene.moonPanel, places: scene.places, events: scene.events, panels: scene.panels, views: scene.views, scales: scene.scales, timeline: scene.timeline, picker: scene.picker, camera: { target: scene.camera.target, following: scene.camera.following, view: scene.camera.view, pose: scene.camera.pose, followChoices: scene.camera.followChoices, reach: scene.camera.reachEarthRadii, far: scene.camera.farEarthRadii, fitted: scene.camera.fitted } };
  const attempt = (build: () => unknown): string => { try { return text(build()); } catch (error) { return `error ${(error as { code?: string }).code ?? String(error)}`; } };
  const definitionRest = (): unknown => { const { catalogue: _catalogue, ...rest } = definitionOf(scene) as unknown as Record<string, unknown>; return rest; };
  const resolver = createStateResolver(catalogue.definitions(), catalogue.sources(), createOrbAstronomyAdapter());
  const rows = (): unknown => { const metrics = (definitionOf(scene) as unknown as { createMetrics: (r: unknown) => (id: string, t: number) => unknown }).createMetrics({ resolver, catalogue, clock: undefined as never }); return ["sun", "earth", "moon", "rock", "probe", "bit-0", "ring", "swarm"].map((id) => { try { return [id, metrics(id, T0 + 5 * MIN)]; } catch (error) { return [id, `error ${(error as { code?: string }).code ?? String(error)}`]; } }); };
  return { metrics: attempt(rows), reads: attempt(() => reads), check: attempt(() => scene.check()), definition: attempt(definitionRest), probeState: attempt(() => scene.stateOf("probe", T0 + 5 * MIN)), rockState: attempt(() => scene.stateOf("rock", T0)) };
}

/** The names of the parts of two observations that differ; empty when the scene is unchanged. */
const changed = (before: Record<string, string>, after: Record<string, string>): string[] => Object.keys(before).filter((key) => before[key] !== after[key]);

/** The public calls of a class: its own methods, found by name so a call added later is seen. Getters and the constructor are not calls. */
const callsOf = (proto: object): string[] => Object.getOwnPropertyNames(proto).filter((name) => name !== "constructor" && typeof Object.getOwnPropertyDescriptor(proto, name)?.value === "function").sort();
const rowCalls = (owner: "scene" | "camera"): string[] => ROWS.filter((row) => row.name.startsWith("camera.") === (owner === "camera")).map((row) => row.name.replace(/^camera\./, "").split(" ")[0]!);

/** The calls that take no object to keep, each with why. A name here must not look like a mutator, and the walk below fails a call that is on neither this list nor in ROWS. */
const KEEPS_NOTHING: Readonly<Record<"scene" | "camera", Readonly<Record<string, string>>>> = {
  scene: {
    stateOf: "a read: takes an id and a time, converted to a number during the call",
    provenanceOf: "a read: takes an id text",
    load: "builds the definition for this call from the data sources it is given and keeps none of them",
    check: "builds the definition for this call from the data sources it is given and keeps none of them",
  },
  camera: {},
};
const MUTATOR = /^(add|set|follow|focus|fitOrbit)/;

describe("every object-taking call is covered by the walk (API-04)", () => {
  it.each([["scene", Scene.prototype], ["camera", SceneCamera.prototype]] as const)("every public %s call has a row or is named as keeping nothing", (owner, proto) => {
    const rows = new Set(rowCalls(owner));
    const listed = KEEPS_NOTHING[owner];
    expect(callsOf(proto).filter((name) => !rows.has(name) && !(name in listed)), "calls with no row and no reason").toEqual([]);
  });

  it.each([["scene", Scene.prototype], ["camera", SceneCamera.prototype]] as const)("%s: no row or listed name is stale, none is listed twice, and a listed call is not a mutator", (owner, proto) => {
    const calls = new Set(callsOf(proto));
    const listed = Object.entries(KEEPS_NOTHING[owner]);
    expect(rowCalls(owner).filter((name) => !calls.has(name)), "rows for a call that is not there").toEqual([]);
    expect(listed.map(([name]) => name).filter((name) => !calls.has(name)), "listed names that are not calls").toEqual([]);
    expect(listed.map(([name]) => name).filter((name) => rowCalls(owner).includes(name)), "listed and also a row").toEqual([]);
    expect(listed.map(([name]) => name).filter((name) => MUTATOR.test(name)), "a mutator cannot be exempt").toEqual([]);
    expect(listed.filter(([, why]) => why.trim().length < 10).map(([name]) => name), "listed with no reason").toEqual([]);
  });
});

describe("the calls named as keeping nothing really keep nothing", () => {
  // `missingData` and `toDefinition` are no longer on the scene; the engine's own routes to the same work (definitionOf, missingDataOf) keep the same promise.
  it.each(["load", "check", "missingDataOf", "definitionOf"] as const)("%s: editing the data sources afterwards changes nothing the scene reads or builds", async (call) => {
    const scene = base();
    const data = [{ name: "made-up", provides: ["earth"] }];
    if (call === "load") await scene.load({ data });
    else if (call === "check") scene.check({ data });
    else if (call === "missingDataOf") missingDataOf(scene, data);
    else definitionOf(scene, data);
    const before = observe(scene);
    scribble(data);
    expect(changed(before, observe(scene))).toEqual([]);
  });
});

describe("every Scene call that takes an object keeps its own copy (API-04)", () => {
  it.each(ROWS)("$name: a later edit of the caller's object changes nothing", ({ scene: make, input: makeInput, apply }) => {
    const input = makeInput();
    const scene = apply(make(), input as never);
    const before = observe(scene);
    scribble(input);
    expect(changed(before, observe(scene))).toEqual([]);
  });

  it.each(ROWS)("$name: each leaf edited alone, one at a time, changes nothing", (row) => {
    const leaks: string[] = [];
    const paths = leavesOf(row.input());
    expect(paths.length, "the row has leaves to edit").toBeGreaterThan(0);
    for (const path of paths) {
      for (const edit of editsOf(row.input(), path)) {
        // a fresh scene per edit: the call is made with the input, then the one leaf is edited, then the scene is compared with itself
        const fresh = row.input();
        const scene = row.apply(row.scene(), fresh as never);
        const before = observe(scene);
        const applied = edit(fresh);
        if (!applied) continue;
        EDITS.count += 1;
        const moved = changed(before, observe(scene));
        if (moved.length > 0) leaks.push(`${path.join(".")} -> ${moved.join("+")}`);
      }
    }
    expect(leaks, `${row.name}: single-leaf edits after the call that changed the scene`).toEqual([]);
    EDITS.rows.add(row.name);
  }, 60_000);

  it.each(ROWS)("$name: one object given to two scenes keeps them apart", ({ scene: make, input: makeInput, apply }) => {
    const input = makeInput();
    const first = apply(make(), input as never);
    const firstBefore = observe(first);
    scribble(input);
    try { apply(make(), input as never); } catch { /* the edited input may be refused; the first scene is what is checked */ }
    expect(changed(firstBefore, observe(first))).toEqual([]);
  });

  it.each(ROWS)("$name: the row really reads something (the scribble changes the input)", ({ input: makeInput }) => {
    const input = makeInput();
    const before = JSON.stringify(input);
    scribble(input);
    expect(JSON.stringify(input)).not.toBe(before);
  });

  it("addTrajectory: a number array of positions (a typed array) is copied too", () => {
    const positionKm = new Float64Array([10_000, 0, 0]);
    const scene = new Scene().setTime(T0).addBody(earth).addTrajectory({ id: "typed", center: "earth", samples: [{ time: T0, positionKm }, { time: T0 + MIN, positionKm: [11_000, 0, 0] }] });
    const before = scene.stateOf("typed", T0).positionKm[0];
    positionKm[0] = 99_999;
    expect(scene.stateOf("typed", T0).positionKm[0]).toBe(before);
  });
});

describe("the one-leaf walk ran over every row", () => {
  it("edited a leaf at a time across all rows (count printed)", () => {
    // runs after the per-row tests of this file in order; the totals are the proof, not a guard against a number
    expect(EDITS.rows.size).toBe(ROWS.length);
    console.log(`single-leaf edits: ${EDITS.count} over ${EDITS.rows.size} rows`);
  });
});
