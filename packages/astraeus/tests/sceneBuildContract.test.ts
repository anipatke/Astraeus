// O-088 T-407: what a host can observe of each good scene the scene pin (scenePin.test.ts `sceneCases`) builds, as named outcome checks. Inputs are the pin's made-up ones (ARCH-03).
// The public route is used throughout; `definitionOf` (engine-only) is read where the fact is only on the definition, as the existing publicApi tests do.
import { describe, expect, it } from "vitest";
import { Scene, earth, jupiter, mars, moon, readableScale, solarSystemScale, sun, trueScale } from "astraeus";
import { createState } from "../src/core/state";
import { definitionOf, missingDataOf } from "../src/api/definitionOf";

const T0 = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;
const prov = {
  sourceType: "illustrative" as const,
  sources: ["Invented"],
  accuracy: "None claimed.",
  notes: "Made up.",
};
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
const line = (n: number, scale = 1) =>
  Array.from({ length: n }, (_, i) => ({
    time: T0 + i * DAY,
    positionKm: [scale * (1e5 + i * 3e4), scale * i * 1e4, scale * 5e3 * i],
    velocityKmS: [1 + i / 10, 0.5, 0.1],
  }));
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
  ...extra,
});
const panel = (id: string, at: { time?: string; event?: string; anchor?: string }) =>
  ({ id, at, title: `Panel ${id}`, body: ["Made up."], provenance: prov }) as never;
const rocks = (n: number) =>
  Array.from({ length: n }, (_, k) => ({
    id: `rock-${k}`,
    semiMajorAxisKm: 80_000 + 5_000 * k,
    eccentricity: 0.1 + 0.02 * k,
    inclinationDeg: 5 + k,
    raanDeg: 40 + 3 * k,
    argumentOfPeriapsisDeg: 70 + k,
  }));
const ids = (scene: Scene): string[] => definitionOf(scene).experience.objects.map((object) => object.id);

describe("scene builds, case by case (the pin's good scenes)", () => {
  it("a failed add leaves the scene as it was: the same objects as a scene that never tried", () => {
    const scene = new Scene().addBody(sun).addBody(earth).setTime(T0);
    for (const call of [
      () => scene.addBodyFromElements(COMET, { enlarge: 0.5 }),
      () => scene.addBody("made-up-comet"),
      () => scene.addBody("nope"),
      () => scene.addBody(moon, { orbit: true, color: "red" }),
    ]) {
      expect(call).toThrow();
    }
    expect(ids(scene)).toEqual(["sun", "earth"]);
    scene.addBodyFromElements(COMET);
    expect(ids(scene)).toEqual(["sun", "earth", "made-up-comet"]);
  });

  it("a path added before any body is drawn about the first body, or about its own centre when it names one", () => {
    const follows = new Scene()
      .addTrajectory({ id: "early", samples: line(5) })
      .addBody(sun)
      .addBody(earth)
      .setTime(T0);
    expect(follows.stateOf("early", T0 + DAY).center).toBe("sun");
    const own = new Scene()
      .addTrajectory({ id: "early", samples: line(5), center: "moon" })
      .addBody(sun)
      .addBody(earth)
      .addBody(moon)
      .setTime(T0);
    expect(own.stateOf("early", T0 + DAY).center).toBe("moon");
  });

  it("a path's state is its samples about its centre at a sample time, and refuses a time outside the span", () => {
    const scene = new Scene()
      .addBody(earth)
      .addBody(moon)
      .setTime(T0)
      .addTrajectory({ id: "probe", samples: line(6) });
    const state = scene.stateOf("probe", T0 + 2 * DAY);
    expect(state.center).toBe("earth");
    expect(state.positionKm[0]).toBeCloseTo(1e5 + 2 * 3e4, 3);
    expect(state.positionKm[1]).toBeCloseTo(2e4, 3);
    expect(() => scene.stateOf("probe", T0 + 20 * DAY)).toThrow();
  });

  it("a provider path is valid inside its bounds only", () => {
    const flyer = {
      stateAt: (t: number) =>
        createState({
          body: "flyer",
          center: "earth",
          timeUtcMs: t,
          positionKm: [1.2e8, 2e7, 5e6],
          velocityKmS: [1, 2, 3],
          orientation: null,
        }),
    };
    const scene = new Scene()
      .addBody(earth)
      .setTime(T0)
      .addTrajectory({ id: "flyer", provider: flyer, bounds: { start: T0, end: T0 + 10 * DAY } });
    expect(scene.stateOf("flyer", T0 + 5 * DAY).positionKm[0]).toBeCloseTo(1.2e8, 0);
    expect(() => scene.stateOf("flyer", T0 + 11 * DAY)).toThrow();
  });

  it("two activities span the earliest start to the latest end, and a timeline span overrides that window", () => {
    const second = burst({
      id: "second",
      start: T0 + 30 * DAY,
      end: T0 + 40 * DAY,
      peak: undefined,
      samples: [
        { time: T0 + 30 * DAY, value: 1 },
        { time: T0 + 40 * DAY, value: 3 },
      ],
    });
    const make = () =>
      new Scene()
        .addBody(earth)
        .addActivity(burst())
        .addActivity(second)
        .setTime(T0 + 6 * DAY);
    const spanned = definitionOf(make()).experience.window;
    expect(spanned).toEqual({ startUtcMs: T0, endUtcMs: T0 + 40 * DAY });
    const overridden = definitionOf(make().setTimeline({ start: T0 - 5 * DAY, end: T0 + 50 * DAY })).experience.window;
    expect(overridden).toEqual({ startUtcMs: T0 - 5 * DAY, endUtcMs: T0 + 50 * DAY });
  });

  it("panels resolve by event, by UTC and by anchor to a time, and playback settings are kept", () => {
    const scene = new Scene()
      .addBody(earth)
      .addBody(moon)
      .setTime(T0)
      .addTrajectory({ id: "probe", samples: line(6), anchors: [{ id: "fix-a", time: T0 + 2 * DAY }] })
      .addEvents([{ id: "burn", label: "Burn", time: T0 + 2 * DAY, type: "burn", object: "probe" }])
      .addStoryPanels([
        panel("by-event", { event: "burn" }),
        panel("by-utc", { time: new Date(T0 + DAY).toISOString() }),
        panel("by-anchor", { anchor: "fix-a" }),
      ])
      .setStoryPanelPlayback({ pauseSeconds: 0, autoOpen: false });
    const story = definitionOf(scene).experience.storyPanels!;
    expect(story.panels.map((p) => [p.id, p.timeUtcMs])).toEqual([
      ["by-utc", T0 + DAY],
      ["by-event", T0 + 2 * DAY],
      ["by-anchor", T0 + 2 * DAY],
    ]);
    expect(story.pauseSeconds).toBe(0);
    expect(story.autoOpen).toBe(false);
  });

  it("events are kept in time order across calls", () => {
    const scene = new Scene()
      .addBody(earth)
      .setTime(T0)
      .addEvents([
        { id: "burn", label: "Burn", time: T0 + 2 * DAY },
        { id: "late", label: "Late", time: T0 + 4 * DAY },
      ])
      .addEvents([{ id: "early", label: "Early", time: T0 + DAY }]);
    expect(definitionOf(scene).experience.events.map((event) => event.id)).toEqual(["early", "burn", "late"]);
  });

  it("pacing with no rate set paces over the default base rate of 60", () => {
    const scene = new Scene()
      .addBody(earth)
      .setTime(T0 + DAY)
      .setTimeline({ start: T0, end: T0 + 10 * DAY, pacing: [{ start: T0 + 2 * DAY, end: T0 + 3 * DAY, rate: 5000 }] });
    const definition = definitionOf(scene);
    expect(definition.clock.rate).toBe(60);
    expect(definition.pacing!.baseRate).toBe(60);
    expect(definition.pacing!.zones).toHaveLength(1);
    expect(definition.pacing!.zones[0]!.rate).toBe(5000);
  });

  it("a timeline sets the span, the opening rate, loop, and event rules become a zone round each event", () => {
    const scene = new Scene()
      .addBody(earth)
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
        pacing: [{ near: { type: "encounter", withinSeconds: 3600 }, rate: 2 }],
      });
    const definition = definitionOf(scene);
    expect(definition.experience.window).toEqual({ startUtcMs: T0, endUtcMs: T0 + 10 * DAY });
    expect(definition.experience.rates).toEqual([10, 100, 1000]);
    expect(definition.clock.rate).toBe(100);
    expect(definition.loop).toBe(true);
    const zones = definition.pacing!.zones.map((zone) => [zone.eventId, zone.fromUtcMs, zone.toUtcMs]);
    expect(zones).toEqual([
      ["e1", T0 + 3 * DAY - 3_600_000, T0 + 3 * DAY + 3_600_000],
      ["e2", T0 + 7 * DAY - 3_600_000, T0 + 7 * DAY + 3_600_000],
    ]);
  });

  it("no timeline: frozen at a moment, or running at a rate", () => {
    const frozen = definitionOf(new Scene().addBody(earth).setTimeline({ none: true, at: T0 + 3 * DAY }));
    expect(frozen.clock.startUtcMs).toBe(T0 + 3 * DAY);
    expect(frozen.clock.playing).toBe(false);
    const running = definitionOf(new Scene().addBody(earth).setTime(T0).setTimeline({ none: true, rate: 3_600 }));
    expect(running.clock.startUtcMs).toBe(T0);
    expect(running.clock.rate).toBe(3_600);
  });

  it("display switches called twice lay the later call over the earlier, switch by switch", () => {
    const scene = new Scene()
      .addBody(earth)
      .addBody(moon, { orbit: true })
      .setTime(T0)
      .setSwitches({ orbitLines: { place: "top-bar" }, labels: { place: "panel", on: false } })
      .setSwitches({ milkyWay: { place: "developer", on: false }, labels: { place: "top-bar" } });
    expect(definitionOf(scene).displaySwitches).toEqual({
      orbitLines: { place: "top-bar" },
      labels: { place: "top-bar" },
      milkyWay: { place: "developer", on: false },
    });
  });

  it("views carry the objects, events and panels they name with the always-shown first body, and a camera rule that defaults to stay", () => {
    const scene = new Scene()
      .addBody(earth)
      .addBody(moon)
      .setTime(T0)
      .addTrajectory({ id: "a", samples: line(5) })
      .addTrajectory({ id: "b", samples: line(5, 2) })
      .addEvents([{ id: "ea", label: "EA", time: T0 + DAY }])
      .addStoryPanels([panel("pa", { time: new Date(T0 + DAY).toISOString() })])
      .setViews(
        [
          { id: "va", label: "A", objects: ["a"], events: ["ea"], panels: ["pa"], camera: { follow: "a" } },
          { id: "vb", label: "B", objects: ["b", "moon"], camera: { focus: "b" } },
          { id: "vs", label: "Start", camera: "start" },
          { id: "vn", label: "Default" },
        ],
        { place: "panel", start: "vb" },
      );
    const views = definitionOf(scene).views!;
    expect(views.start).toBe("vb");
    expect(views.place).toBe("panel");
    const byId = Object.fromEntries(views.views.map((view) => [view.id, view]));
    expect([...byId.va!.objects].sort()).toEqual(["a", "earth"]);
    expect([...byId.va!.events]).toEqual(["ea"]);
    expect([...byId.va!.panels]).toEqual(["pa"]);
    expect([...byId.vb!.objects].sort()).toEqual(["b", "earth", "moon"]);
    expect(byId.va!.camera.rule).toBe("start");
    expect(byId.vs!.camera.rule).toBe("start");
    expect(byId.vn!.camera.rule).toBe("stay");
  });

  it("scales: readable offered alone leaves one choice; true scale chosen after readable is the opening one", () => {
    const alone = new Scene().addBody(earth).addBody(moon).setTime(T0).setScale(readableScale, { only: true });
    expect(definitionOf(alone).scaleChoices).toEqual(["readable-scale"]);
    const switched = new Scene().addBody(earth).addBody(moon).setScale(readableScale).setScale(trueScale).setTime(T0);
    expect(definitionOf(switched).scaleChoices![0]).toBe("true-scale");
  });

  it("a Sun scene that enlarges a body opens on the solar-system scale", () => {
    const scene = new Scene()
      .addBody(sun)
      .addBody(earth, { enlarge: 60, orbit: true })
      .addBody(mars, { orbit: true })
      .setTime(T0)
      .setScale(solarSystemScale);
    const definition = definitionOf(scene);
    expect(definition.scaleChoices![0]).toBe("solar-system");
    expect(ids(scene)).toEqual(["sun", "earth", "mars"]);
  });

  it("groups: each is its own object with its rocks and a centre when named", () => {
    const scene = new Scene()
      .addBody(sun)
      .addBody(earth)
      .setTime(T0 + 5 * DAY)
      .addActivity(burst())
      .addGroup({ id: "ring", plane: "EQJ", orbits: rocks(4), readouts: [{ kind: "rate" }] })
      .addGroup({ id: "belt", plane: "ecliptic-j2000", orbits: rocks(2), center: "earth" });
    const definition = definitionOf(scene);
    expect((definition.groups ?? []).map((layer) => layer.object.id)).toEqual(["ring", "belt"]);
    const layers = definition.groups ?? [];
    expect(layers.map((layer) => layer.group.count)).toEqual([4, 2]);
    expect(layers[1]!.group.center).toBe("earth");
  });

  it("a camera follow with a declared reach carries the reach, and no reach is carried otherwise", () => {
    const scene = new Scene()
      .addBody(sun)
      .addBody(earth)
      .setTime(T0)
      .addTrajectory({
        id: "far",
        center: "sun",
        samples: [0, 100, 200].map((i) => ({ time: T0 + i * DAY, positionKm: [i * 5e9, 0, 0] })),
        lineFixedTo: "sun",
      });
    scene.camera.follow("far", { distance: 90 }).setReach(5_000);
    expect(definitionOf(scene).camera?.maxFocusDistance).toBe(5_000);
    const none = new Scene().addBody(earth).setTime(T0);
    expect(definitionOf(none).camera?.maxFocusDistance).toBeUndefined();
  });

  it("a Jupiter-moon scene names the data package it still needs, and none once it is given", () => {
    const scene = new Scene()
      .addBody(jupiter)
      .addBody("io")
      .setTime(Date.UTC(2016, 5, 1));
    expect(missingDataOf(scene, []).length).toBeGreaterThan(0);
    expect(
      missingDataOf(scene, [{ name: "astraeus-data-jupiter", provides: ["io", "europa", "ganymede", "callisto"] }]),
    ).toEqual([]);
  });
});
