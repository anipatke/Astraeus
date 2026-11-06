// O-056 T-260: what a scene holds, as plain read-only properties (no `toDefinition`). One made-up scene holds every kind of item; each property is checked against what was added,
// is frozen, and still answers once a viewer has taken the scene (ARCH-03: made-up data, public entry points).
import { describe, expect, it } from "vitest";
import { Scene, earth, moon, readableScale, solarSystemScale, sun, type Provenance } from "astraeus";
import { markMounted } from "../src/api/sceneFreeze";

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const batch: Provenance = { sourceType: "observed", sources: ["A made-up log"], accuracy: "To the minute.", notes: "Invented." };
const own: Provenance = { sourceType: "modelled", sources: ["A made-up model"], accuracy: "Computed.", notes: "Invented." };
const pathProvenance: Provenance = { sourceType: "reconstructed", sources: ["A made-up track"], accuracy: "Rough.", notes: "Invented." };
const samples = [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [10_000 + i * 1_000, 0, 0] }));
const orbit = (k: number) => ({ id: `rock-${k}`, semiMajorAxisKm: 80_000_000 + 5_000_000 * k, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 40, argumentOfPeriapsisDeg: 70 });
const groupSource: Provenance = { sourceType: "observed", sources: ["A made-up catalogue"], accuracy: "As listed.", notes: "Invented." };

const build = () => new Scene()
  .addBody(sun).addBody(earth, { orbit: true, enlarge: 3 }).addBody(moon, { orbit: true })
  .addTrajectory({ id: "probe", label: "Probe", center: "earth", samples, provenance: pathProvenance, anchors: [{ id: "fix-a", time: T0 + 10 * MIN }] })
  .addGroup({ id: "ring", label: "Ring", orbits: [0, 1, 2].map(orbit), plane: "EQJ", provenance: groupSource })
  .addGroup({ id: "swarm", orbits: [0, 1].map(orbit), clump: { near: "earth", fraction: 0.5, widthDeg: 20 } })
  .addEvents([{ id: "late", label: "Late", time: T0 + 20 * MIN, type: "burn", object: "probe", provenance: own }, { id: "early", label: "Early", time: "2026-03-01T00:05:00Z" }], { provenance: batch })
  .addStoryPanels({ pauseSeconds: 3, panels: [
    { id: "by-event", at: { event: "late" }, title: "Late one", body: ["A line."], details: ["A figure."], badge: "modelled", sources: ["Source B"], object: "probe" },
    { id: "by-anchor", at: { anchor: "fix-a" }, title: "First fix", body: ["One.", "Two."], badge: "observed", sources: ["Source A"] },
  ] })
  .setViews([{ id: "a", label: "A", paths: ["probe"] }, { id: "all", label: "All" }], { place: "panel", start: "all" })
  .setScale(solarSystemScale)
  .setTimeline({ start: "2026-03-01T00:00:00Z", end: "2026-03-01T01:00:00Z", rates: [10, 100], rate: 100, loop: true });

const plain = (list: readonly object[]) => list.map(({ provenance: _p, description: _d, knownLimitations: _k, texture: _t, ...rest }: { provenance?: unknown; description?: unknown; knownLimitations?: unknown; texture?: unknown }) => rest);

const READS: readonly (readonly [string, (scene: Scene) => unknown, unknown])[] = [
  ["bodies", (scene) => plain(scene.bodies), [
    { id: "sun", label: "Sun", orbit: false, enlarge: 1, listed: true },
    { id: "earth", label: "Earth", parent: "sun", orbit: true, enlarge: 3, listed: true },
    { id: "moon", label: "Moon", parent: "earth", orbit: true, enlarge: 1, listed: true },
  ]],
  ["paths", (scene) => plain(scene.paths), [{ id: "probe", label: "Probe", center: "earth" }]],
  ["groups", (scene) => plain(scene.groups), [
    { id: "ring", label: "Ring", count: 3, center: "sun", plane: "EQJ" },
    { id: "swarm", label: "swarm", count: 2, center: "sun", plane: "ecliptic-j2000" },
  ]],
  ["events", (scene) => scene.events.map(({ provenance: _ignored, ...rest }) => rest), [
    { id: "early", label: "Early", timeUtcMs: T0 + 5 * MIN },
    { id: "late", label: "Late", timeUtcMs: T0 + 20 * MIN, type: "burn", object: "probe" },
  ]],
  ["panels", (scene) => scene.panels, [
    { id: "by-anchor", timeUtcMs: T0 + 10 * MIN, title: "First fix", body: ["One.", "Two."], badge: "observed", details: [], sources: ["Source A"] },
    { id: "by-event", timeUtcMs: T0 + 20 * MIN, title: "Late one", body: ["A line."], badge: "modelled", details: ["A figure."], sources: ["Source B"], object: "probe" },
  ]],
  ["views", (scene) => scene.views, { startId: "all", place: "panel", items: [{ id: "a", label: "A" }, { id: "all", label: "All" }] }],
  ["scales", (scene) => scene.scales, ["solar-system", "true-scale"]],
  ["timeline", (scene) => scene.timeline, { windowStartUtcMs: T0, windowEndUtcMs: T0 + 60 * MIN, openUtcMs: T0, rates: [10, 100], rate: 100, loop: true }],
];

describe("what a scene holds", () => {
  it.each(READS)("%s lists what was added", (_name, read, expected) => { expect(read(build())).toEqual(expected); });

  it.each(["bodies", "paths", "groups", "events", "panels", "scales"] as const)("%s is a frozen list of frozen items, fresh on every read", (name) => {
    const scene = build();
    const list = scene[name] as readonly object[];
    expect(Object.isFrozen(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    for (const item of list) expect(typeof item === "string" || Object.isFrozen(item)).toBe(true);
    expect(scene[name]).not.toBe(list);
  });

  it("views and timeline are frozen objects", () => {
    const scene = build();
    for (const read of [scene.views!, scene.views!.items, scene.timeline, scene.timeline.rates]) expect(Object.isFrozen(read)).toBe(true);
  });

  it("carries provenance: a path's own, an event's own else the batch's, and the group card's illustrative statement over the source", () => {
    const scene = build();
    expect(scene.paths[0]!.provenance).toEqual(pathProvenance);
    expect(scene.events.map((event) => [event.id, event.provenance])).toEqual([["early", batch], ["late", own]]);
    const [ring, swarm] = scene.groups;
    expect(ring!.provenance).toMatchObject({ sourceType: "illustrative", sources: ["A made-up catalogue"] });
    expect(ring!.provenance.accuracy).toContain("Orbit elements are as listed (observed)");
    expect(swarm!.provenance.notes).toContain("A stated share of the dots is placed near");
    expect(ring!.provenance.notes).not.toContain("A stated share of the dots is placed near");
  });

  it("carries the words and known limits of each info card: given, else the catalogue's or the engine's", () => {
    const scene = new Scene().addBody(sun, { description: "The star.", knownLimitations: ["A made-up limit."] }).addBody(earth)
      .addTrajectory({ id: "probe", samples, description: "A probe.", knownLimitations: ["Rough."] }).addTrajectory({ id: "plain", samples })
      .addGroup({ id: "ring", orbits: [orbit(0), orbit(1)], knownLimitations: ["Short list."] }).addGroup({ id: "one", orbits: [orbit(0)], description: "Mine.", clump: { near: "earth", fraction: 0.5, widthDeg: 20 } });
    const [star, planet] = scene.bodies;
    expect([star!.description, star!.knownLimitations]).toEqual(["The star.", ["A made-up limit."]]);
    expect(planet!.description).toBeUndefined();
    expect(planet!.knownLimitations.length).toBeGreaterThan(0);
    expect(scene.paths.map((path) => [path.description, path.knownLimitations])).toEqual([["A probe.", ["Rough."]], [undefined, []]]);
    const [ring, one] = scene.groups;
    expect(ring!.description).toMatch(/^2 listed orbits, each drawn as one dot/);
    expect(ring!.knownLimitations[0]).toBe("Short list.");
    expect(ring!.knownLimitations).toHaveLength(3);
    expect(one!.description).toBe("Mine.");
    expect(one!.knownLimitations).toHaveLength(3);
    expect(one!.knownLimitations[1]).toContain("50% of the dots are drawn near Earth");
  });

  it("answers the same on a scene a viewer has taken", () => {
    const scene = build();
    const before = READS.map(([, read]) => read(scene));
    markMounted(scene);
    expect(READS.map(([, read]) => read(scene))).toEqual(before);
    expect(() => scene.addBody("mars")).toThrow(/viewer took it/);
  });

  it.each([
    ["an empty scene", () => new Scene(), { bodies: [], paths: [], groups: [], events: [], panels: [], views: undefined, scales: ["true-scale", "readable-scale"] }],
    ["a scene with no enlarged body asked for the readable scale first", () => new Scene().addBody(sun).setScale(readableScale), { scales: ["readable-scale", "true-scale"] }],
    ["the readable scale offered alone", () => new Scene().addBody(sun).setScale(readableScale, { only: true }), { scales: ["readable-scale"] }],
  ])("%s", (_name, make, expected) => {
    const scene = make();
    for (const [key, value] of Object.entries(expected)) expect(scene[key as keyof typeof expected], key).toEqual(value);
  });

  it("states a timeline with no span or moment set as a month about the read, running at the default speeds", () => {
    const timeline = new Scene().addBody(sun).timeline;
    expect(timeline.windowEndUtcMs - timeline.windowStartUtcMs).toBe(30 * 86_400_000);
    expect(timeline).toMatchObject({ rates: [60, 3_600, 86_400], rate: 60, loop: false });
  });
});
