// O-088 T-406: which build fault wins. Every bad build a host can make, as one table of the stage that throws (the call, `check`, or `load`) and the error's code (API-05: the
// code, never the message). Rows that fix the order of a build's checks ("two faults") assert the code of the fault that wins. The rows whose outcome can depend on the planet series
// run in both orders: the series loaded (the normal test graph), and a fresh module graph where they are not. Made-up scenes only (ARCH-03).
import { describe, expect, it, vi } from "vitest";
import { createState } from "../src/core/state";
import type { DataSource, Scene } from "astraeus";

type Api = typeof import("astraeus");
const T0 = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;
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

type Build = (a: Api) => Scene;
interface Bad {
  readonly build: Build;
  readonly data?: DataSource[];
}
function badBuilds(): Record<string, Bad> {
  const earthMoon = (a: Api) => new a.Scene().addBody(a.earth).addBody(a.moon).setTime(T0);
  const sunScene = (a: Api) => new a.Scene().addBody(a.sun).addBody(a.earth).setTime(T0);
  const withPath = (a: Api, extra: object) =>
    earthMoon(a).addTrajectory({ id: "p", samples: line(5), ...extra } as never);
  const b = (build: Build, data?: DataSource[]): Bad => ({ build, ...(data === undefined ? {} : { data }) });
  const tl = (a: Api, timeline: unknown) => earthMoon(a).setTimeline(timeline as never);
  const view = (a: Api, views: unknown, options: unknown = { place: "panel" }) =>
    earthMoon(a).setViews(views as never, options as never);
  const bodyOpt = (a: Api, options: object) => new a.Scene().addBody(a.earth, options as never);
  const grp = (a: Api, extra: object) =>
    earthMoon(a).addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(2), ...extra } as never);
  const act = (a: Api, extra: object) => earthMoon(a).addActivity(burst(extra) as never);
  const ev = (a: Api, events: unknown, options?: unknown) => earthMoon(a).addEvents(events as never, options as never);
  const panels = (a: Api, ...list: object[]) => earthMoon(a).addStoryPanels(list as never);
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
    "addBody: Sun orbit line id taken by a path (path added second)": b((a) =>
      sunScene(a)
        .addBody(a.venus, { orbit: true })
        .addTrajectory({ id: "venus-orbit", samples: line(4), center: "sun" }),
    ),
    "addBody: Sun orbit line id taken (path added first)": b((a) =>
      new a.Scene()
        .addBody(a.sun)
        .addTrajectory({ id: "venus-orbit", samples: line(4), center: "sun" })
        .addBody(a.venus, { orbit: true })
        .setTime(T0),
    ),
    "addBodyFromElements: reserved id auto": b((a) => sunScene(a).addBodyFromElements({ ...COMET, id: "auto" })),
    "addBodyFromElements: bad record": b((a) =>
      sunScene(a).addBodyFromElements({ ...COMET, elements: { ...COMET.elements, eccentricity: 3 } }),
    ),
    "addBodyFromElements: record not an object": b((a) => sunScene(a).addBodyFromElements(undefined as never)),
    "addBodyFromElements: id already in the catalogue": b((a) =>
      sunScene(a).addBodyFromElements({ ...COMET, id: "mars" }),
    ),
    "addBodyFromElements: id already in the scene": b((a) =>
      sunScene(a).addBodyFromElements(COMET).addBodyFromElements(COMET),
    ),
    "addBodyFromElements: a bad option": b((a) => sunScene(a).addBodyFromElements(COMET, { enlarge: 0 })),
    "addBodyFromElements: orbit asked, then the Sun is absent": b((a) =>
      new a.Scene().addBody(a.earth).addBodyFromElements(COMET, { orbit: true }).setTime(T0),
    ),
    // addTrajectory
    "addTrajectory: empty id": b((a) => earthMoon(a).addTrajectory({ id: "", samples: line(3) })),
    "addTrajectory: id of a body": b((a) => earthMoon(a).addTrajectory({ id: "moon", samples: line(3) })),
    "addTrajectory: id of a group": b((a) =>
      earthMoon(a)
        .addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1) })
        .addTrajectory({ id: "g", samples: line(3) }),
    ),
    "addTrajectory: repeated id": b((a) => withPath(a, {}).addTrajectory({ id: "p", samples: line(3) })),
    "addTrajectory: centre not catalogued": b((a) => withPath(a, { center: "nowhere" })),
    "addTrajectory: first body not built-in (centre falls back to earth)": b((a) =>
      new a.Scene()
        .addBodyFromElements(COMET)
        .addTrajectory({ id: "p", samples: line(3), readouts: [{ kind: "range", marker: "earth" }] })
        .addBody(a.earth),
    ),
    "addTrajectory: labelReach not positive": b((a) => withPath(a, { labelReachEarthRadii: -1 })),
    "addTrajectory: plane not known": b((a) => withPath(a, { plane: "galactic" })),
    "addTrajectory: sample time not a moment": b((a) =>
      withPath(a, {
        samples: [
          { time: "soon", positionKm: [1, 2, 3] },
          { time: T0, positionKm: [1, 2, 3] },
        ],
      }),
    ),
    "addTrajectory: samples too few": b((a) => withPath(a, { samples: line(1) })),
    "addTrajectory: samples out of order": b((a) => withPath(a, { samples: [...line(3)].reverse() })),
    "addTrajectory: sample position not three numbers": b((a) =>
      withPath(a, {
        samples: [
          { time: T0, positionKm: [1, 2] },
          { time: T0 + DAY, positionKm: [1, 2, 3] },
        ],
      }),
    ),
    "addTrajectory: samples not a list": b((a) => withPath(a, { samples: 5 })),
    "addTrajectory: provider without stateAt": b((a) =>
      earthMoon(a).addTrajectory({ id: "p", provider: {} as never, bounds: { start: T0, end: T0 + DAY } }),
    ),
    "addTrajectory: provider bounds not moments": b((a) =>
      earthMoon(a).addTrajectory({ id: "p", provider: provider("p", "earth"), bounds: { start: "x", end: T0 } }),
    ),
    "addTrajectory: provider bounds missing": b((a) =>
      earthMoon(a).addTrajectory({ id: "p", provider: provider("p", "earth") } as never),
    ),
    "addTrajectory: provider bounds end before start": b((a) =>
      earthMoon(a).addTrajectory({ id: "p", provider: provider("p", "earth"), bounds: { start: T0 + DAY, end: T0 } }),
    ),
    "addTrajectory: provenanceSpans not a list": b((a) => withPath(a, { provenanceSpans: "x" })),
    "addTrajectory: provenanceSpans bad time": b((a) =>
      withPath(a, { provenanceSpans: [{ start: "x", end: T0, provenance: prov }] }),
    ),
    "addTrajectory: provenanceSpans bad provenance": b((a) =>
      withPath(a, { provenanceSpans: [{ start: T0, end: T0 + DAY, provenance: { sourceType: "nope" } }] }),
    ),
    "addTrajectory: provenanceSpans end before start": b((a) =>
      withPath(a, { provenanceSpans: [{ start: T0 + DAY, end: T0, provenance: prov }] }),
    ),
    "addTrajectory: provenanceSpans outside the path": b((a) =>
      withPath(a, { provenanceSpans: [{ start: T0 - DAY, end: T0 + DAY, provenance: prov }] }),
    ),
    "addTrajectory: provenanceSpans overlapping": b((a) =>
      withPath(a, {
        provenanceSpans: [
          { start: T0, end: T0 + 2 * DAY, provenance: prov },
          { start: T0 + DAY, end: T0 + 3 * DAY, provenance: prov },
        ],
      }),
    ),
    "addTrajectory: lineFixedTo a number": b((a) => withPath(a, { lineFixedTo: 5 })),
    "addTrajectory: lineFixedTo a stretch without a body": b((a) =>
      withPath(a, { lineFixedTo: [{ start: T0, end: T0 + DAY, body: "" }] }),
    ),
    "addTrajectory: lineFixedTo stretches overlapping": b((a) =>
      withPath(a, {
        lineFixedTo: [
          { start: T0, end: T0 + 2 * DAY, body: "moon" },
          { start: T0 + DAY, end: T0 + 3 * DAY, body: "moon" },
        ],
      }),
    ),
    "addTrajectory: lineFixedTo a body the scene lacks (at toDefinition)": b((a) =>
      withPath(a, { lineFixedTo: "mars" }),
    ),
    "addTrajectory: lineFixedTo a stretch body the scene lacks": b((a) =>
      withPath(a, { lineFixedTo: [{ start: T0, end: T0 + DAY, body: "mars" }] }),
    ),
    "addTrajectory: readouts not a list": b((a) => withPath(a, { readouts: "x" })),
    "addTrajectory: readout of an unknown kind": b((a) => withPath(a, { readouts: [{ kind: "colour" }] })),
    "addTrajectory: readout distance without a body": b((a) => withPath(a, { readouts: [{ kind: "distance" }] })),
    "addTrajectory: readout altitude without a body": b((a) => withPath(a, { readouts: [{ kind: "altitude" }] })),
    "addTrajectory: readout names an uncatalogued body": b((a) =>
      withPath(a, { readouts: [{ kind: "range", marker: "nope" }] }),
    ),
    "addTrajectory: readout names a body the scene lacks": b((a) =>
      withPath(a, { readouts: [{ kind: "distance", to: "mars" }] }),
    ),
    "addTrajectory: anchors not a list": b((a) => withPath(a, { anchors: "x" })),
    "addTrajectory: anchor without an id": b((a) => withPath(a, { anchors: [{ time: T0 }] })),
    "addTrajectory: anchor twice": b((a) =>
      withPath(a, {
        anchors: [
          { id: "a", time: T0 },
          { id: "a", time: T0 + DAY },
        ],
      }),
    ),
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
    "addGroup: clump near an uncatalogued body": b((a) =>
      grp(a, { clump: { near: "nope", fraction: 0.5, widthDeg: 10 } }),
    ),
    "addGroup: clump fraction above 1": b((a) => grp(a, { clump: { near: "moon", fraction: 2, widthDeg: 10 } })),
    "addGroup: clump width above 180": b((a) => grp(a, { clump: { near: "moon", fraction: 0.5, widthDeg: 200 } })),
    "addGroup: readouts not a list": b((a) => grp(a, { readouts: "x" })),
    "addGroup: readout of an unknown kind": b((a) => grp(a, { readouts: [{ kind: "speed" }] })),
    "addGroup: readout activity not a text": b((a) => grp(a, { readouts: [{ kind: "rate", activity: 5 }] })),
    "addGroup: centre not catalogued": b((a) => grp(a, { center: "nowhere" })),
    "addGroup: id of a body": b((a) => grp(a, { id: "moon" })),
    "addGroup: id of a path": b((a) =>
      withPath(a, {}).addGroup({ plane: "ecliptic-j2000", id: "p", orbits: rocks(1) }),
    ),
    "addGroup: centre the scene lacks (at toDefinition)": b((a) => grp(a, { center: "mars" })),
    "addGroup: clump body the scene lacks": b((a) => grp(a, { clump: { near: "mars", fraction: 0.5, widthDeg: 10 } })),
    "addGroup: clump near its own centre": b((a) => grp(a, { clump: { near: "earth", fraction: 0.5, widthDeg: 10 } })),
    "addGroup: rate readout with no activity": b((a) => grp(a, { readouts: [{ kind: "rate" }] })),
    "addGroup: rate readout naming a missing activity": b((a) =>
      grp(a, { readouts: [{ kind: "rate", activity: "ghost" }] }).addActivity(burst()),
    ),
    "addGroup: an orbit the engine refuses": b((a) => grp(a, { orbits: [{ ...orbit(0), eccentricity: 1.5 }] })),
    "addGroup: reference time not a moment": b((a) => grp(a, { referenceTime: "x" })),
    "addGroup: an orbit time not a moment": b((a) => grp(a, { orbits: [{ ...orbit(0), time: "x" }] })),
    "addGroup: reads the planet series but the window is outside them": b((a) =>
      new a.Scene()
        .addBody(a.earth)
        .addBody(a.mars)
        .setTimeline({ start: "1500-01-01", end: "1500-02-01" })
        .addGroup({
          plane: "ecliptic-j2000",
          id: "g",
          orbits: rocks(2),
          clump: { near: "mars", fraction: 0.5, widthDeg: 10 },
          center: "earth",
        }),
    ),
    "addActivity: no id": b((a) => act(a, { id: "" })),
    "addActivity: no label": b((a) => act(a, { label: "" })),
    "addActivity: no unit": b((a) => act(a, { unit: "" })),
    "addActivity: one sample": b((a) => act(a, { samples: [{ time: T0, value: 1 }] })),
    "addActivity: empty peakLabel": b((a) => act(a, { peakLabel: "" })),
    "addActivity: repeated id": b((a) => earthMoon(a).addActivity(burst()).addActivity(burst())),
    "addActivity: sample time not a moment": b((a) =>
      act(a, {
        samples: [
          { time: "x", value: 1 },
          { time: T0, value: 1 },
        ],
      }),
    ),
    "addActivity: negative rate": b((a) =>
      act(a, {
        samples: [
          { time: T0, value: -1 },
          { time: T0 + DAY, value: 1 },
        ],
      }),
    ),
    "addActivity: peak outside": b((a) => act(a, { peak: T0 + 100 * DAY })),
    "addActivity: start not a moment": b((a) => act(a, { start: "x" })),
    "addActivity: provenance span not a moment": b((a) =>
      act(a, { provenance: [{ start: "x", end: T0, provenance: prov }] }),
    ),
    "addActivity: provenance malformed": b((a) =>
      act(a, { provenance: [{ start: T0, end: T0 + DAY, provenance: { sourceType: "nope" } }] }),
    ),
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
    "addEvents: repeated id": b((a) =>
      ev(a, [
        { id: "a", label: "A", time: T0 },
        { id: "a", label: "B", time: T0 },
      ]),
    ),
    "addEvents: repeated across calls": b((a) =>
      ev(a, [{ id: "a", label: "A", time: T0 }]).addEvents([{ id: "a", label: "B", time: T0 }]),
    ),
    "addEvents: time not a moment": b((a) => ev(a, [{ id: "a", label: "A", time: "x" }])),
    "addEvents: object not a text": b((a) => ev(a, [{ id: "a", label: "A", time: T0, object: 5 }])),
    "addEvents: own provenance malformed": b((a) =>
      ev(a, [{ id: "a", label: "A", time: T0, provenance: { sourceType: "nope" } }]),
    ),
    "addEvents: batch provenance malformed": b((a) =>
      ev(a, [{ id: "a", label: "A", time: T0 }], { provenance: { sourceType: "nope" } }),
    ),
    "addEvents: object not in the scene (at toDefinition)": b((a) =>
      ev(a, [{ id: "a", label: "A", time: T0, object: "ghost" }]),
    ),
    "addStoryPanels: event not there": b((a) => panels(a, panel("p1", { event: "ghost" }))),
    "addStoryPanels: anchor not there": b((a) => panels(a, panel("p2", { anchor: "ghost" }))),
    "addStoryPanels: object not in the scene": b((a) =>
      panels(a, panel("p3", { time: T0 + 3_600_000 }, { object: "ghost" })),
    ),
    "addStoryPanels: time outside the timeline": b((a) => panels(a, panel("p4", { time: T0 + 400 * DAY }))),
    "addStoryPanels: source type not one": b((a) =>
      panels(a, panel("p5", { time: T0 + 3_600_000 }, { provenance: { ...prov, sourceType: "guess" } })),
    ),
    "addStoryPanels: no sources": b((a) =>
      panels(a, panel("p6", { time: T0 + 3_600_000 }, { provenance: { ...prov, sources: [] } })),
    ),
    "addStoryPanels: repeated id": b((a) =>
      panels(a, panel("p7", { time: T0 + 3_600_000 }), panel("p7", { time: T0 + 7_200_000 })),
    ),
    "addStoryPanels: panels not a list": b((a) => earthMoon(a).addStoryPanels(5 as never)),
    "setStoryPanelPlayback: pauseSeconds out of range": b((a) =>
      earthMoon(a).setStoryPanelPlayback({ pauseSeconds: 99 }),
    ),
    "addStoryPanels: no body": b((a) => earthMoon(a).addStoryPanels([panel("p", { time: T0 }, { body: [] })])),
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
    "setTimeline: pacing rate not positive": b((a) =>
      tl(a, { start: T0, end: T0 + DAY, pacing: [{ start: T0, end: T0 + 100, rate: 0 }] }),
    ),
    "setTimeline: pacing ramp negative": b((a) =>
      tl(a, { start: T0, end: T0 + DAY, pacing: [{ start: T0, end: T0 + 100, rate: 1, rampSeconds: -1 }] }),
    ),
    "setTimeline: pacing near without a type": b((a) =>
      tl(a, { start: T0, end: T0 + DAY, pacing: [{ near: { withinSeconds: 5 }, rate: 1 }] }),
    ),
    "setTimeline: pacing near within not positive": b((a) =>
      tl(a, { start: T0, end: T0 + DAY, pacing: [{ near: { type: "x", withinSeconds: 0 }, rate: 1 }] }),
    ),
    "setTimeline: pacing piece without from and to": b((a) =>
      tl(a, { start: T0, end: T0 + DAY, pacing: [{ rate: 1 }] }),
    ),
    "setTimeline: pacing to before from": b((a) =>
      tl(a, { start: T0, end: T0 + DAY, pacing: [{ start: T0 + 100, end: T0, rate: 1 }] }),
    ),
    "setTimeline: pacing spans overlapping": b((a) =>
      tl(a, {
        start: T0,
        end: T0 + DAY,
        pacing: [
          { start: T0, end: T0 + 100, rate: 1 },
          { start: T0 + 50, end: T0 + 200, rate: 1 },
        ],
      }),
    ),
    "setTimeline: pacing rule matching no event (at toDefinition)": b((a) =>
      tl(a, { start: T0, end: T0 + DAY, pacing: [{ near: { type: "ghost", withinSeconds: 5 }, rate: 1 }] }),
    ),
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
    "setViews: repeated id": b((a) =>
      view(a, [
        { id: "a", label: "A" },
        { id: "a", label: "B" },
      ]),
    ),
    "setViews: ids not a list": b((a) => view(a, [{ id: "a", label: "A", objects: "x" }])),
    "setViews: camera malformed": b((a) => view(a, [{ id: "a", label: "A", camera: { follow: "x", focus: "y" } }])),
    "setViews: camera a string that is not a rule": b((a) => view(a, [{ id: "a", label: "A", camera: "orbit" }])),
    "setViews: start not a view": b((a) => view(a, [{ id: "a", label: "A" }], { place: "panel", start: "z" })),
    "setViews: id the scene lacks (at toDefinition)": b((a) => view(a, [{ id: "a", label: "A", objects: ["ghost"] }])),
    "setViews: body the scene lacks": b((a) => view(a, [{ id: "a", label: "A", objects: ["ghost"] }])),
    "setViews: event the scene lacks": b((a) => view(a, [{ id: "a", label: "A", events: ["ghost"] }])),
    "setViews: panel the scene lacks": b((a) => view(a, [{ id: "a", label: "A", panels: ["ghost"] }])),
    "setViews: camera target the view does not show": b((a) =>
      earthMoon(a)
        .addTrajectory({ id: "x", samples: line(3) })
        .setViews(
          [
            { id: "a", label: "A", objects: ["x"] },
            { id: "b", label: "B", objects: ["moon"], camera: { follow: "x" } },
          ],
          { place: "panel" },
        ),
    ),
    // camera
    "camera.follow: unknown id": b((a) => {
      const s = earthMoon(a);
      s.camera.follow("ghost");
      return s;
    }),
    "camera.focus: unknown id": b((a) => {
      const s = earthMoon(a);
      s.camera.focus("ghost");
      return s;
    }),
    "camera.follow: up not known": b((a) => {
      const s = earthMoon(a);
      s.camera.follow("moon", { up: "north" as never });
      return s;
    }),
    "camera.setReach: zero": b((a) => {
      const s = earthMoon(a);
      s.camera.setReach(0);
      return s;
    }),
    "camera.setReach: not a number": b((a) => {
      const s = earthMoon(a);
      s.camera.setReach("far" as never);
      return s;
    }),
    "camera.setReach: infinite": b((a) => {
      const s = earthMoon(a);
      s.camera.setReach(Infinity);
      return s;
    }),
    "camera.fitOrbit: unknown id": b((a) => {
      const s = earthMoon(a);
      s.camera.fitOrbit("ghost");
      return s;
    }),
    "camera.fitOrbit: a body that does not circle the Sun": b((a) => {
      const s = earthMoon(a);
      s.camera.fitOrbit(a.moon);
      return s;
    }),
    "camera.fitOrbit: the Sun itself": b((a) => {
      const s = sunScene(a);
      s.camera.fitOrbit(a.sun);
      return s;
    }),
    // scene-level
    "toDefinition: empty scene": b((a) => new a.Scene()),
    "toDefinition: a data package not passed": b((a) => new a.Scene().addBody(a.jupiter).addBody(a.io).setTime(T0)),
    "toDefinition: a listed moon's data package not passed": b((a) =>
      new a.Scene().addBody(a.uranus).addBody("miranda").setTime(T0),
    ),
    "stateOf: unknown id": b((a) => {
      earthMoon(a).stateOf("ghost", T0);
      return earthMoon(a);
    }),
    "stateOf: time not a moment": b((a) => {
      earthMoon(a).stateOf("moon", "x");
      return earthMoon(a);
    }),
    "stateOf: outside a path": b((a) => {
      withPath(a, {}).stateOf("p", T0 + 100 * DAY);
      return earthMoon(a);
    }),
    "provenanceOf: unknown id": b((a) => {
      earthMoon(a).provenanceOf("ghost");
      return earthMoon(a);
    }),
    "planet series: stateOf a planet before they are loaded": b((a) => {
      new a.Scene().addBody(a.sun).addBody(a.mars).stateOf("mars", T0);
      return sunScene(a);
    }),
    "out-of-span: planets and a window outside the planet series (prepare rejects)": b((a) =>
      new a.Scene()
        .addBody(a.sun)
        .addBody(a.earth)
        .addBody(a.mars)
        .setTimeline({ start: "1500-01-01", end: "1500-02-01" }),
    ),
    "out-of-span: orbit lines and a window outside the series": b((a) =>
      new a.Scene()
        .addBody(a.sun)
        .addBody(a.mars, { orbit: true })
        .setTimeline({ start: "1500-01-01", end: "1500-02-01" }),
    ),
    "out-of-span: a fit and a window outside the series": b((a) => {
      const s = new a.Scene().addBody(a.sun).addBody(a.mars).setTimeline({ start: "1500-01-01", end: "1500-02-01" });
      s.camera.fitOrbit("mars");
      return s;
    }),
    // which error wins when a scene has two faults, in the order toDefinition checks
    "two faults: empty scene and a bad group readout": b((a) => new a.Scene().addActivity(burst())),
    "two faults: missing data package and a bad group readout": b(
      (a) =>
        new a.Scene()
          .addBody(a.jupiter)
          .addBody(a.io)
          .setTime(T0)
          .addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1), readouts: [{ kind: "rate" }] }),
      DATA.slice(1),
    ),
    "two faults: bad group readout and a moon orbit with no planet": b((a) =>
      new a.Scene()
        .addBody(a.moon, { orbit: true })
        .setTime(T0)
        .addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1), readouts: [{ kind: "rate" }] }),
    ),
    "two faults: moon orbit with no planet and a bad scale": b((a) =>
      new a.Scene().addBody(a.moon, { orbit: true }).setTime(T0).setScale(a.solarSystemScale),
    ),
    "two faults: bad scale and a path line fixed to a missing body": b((a) =>
      withPath(a, { lineFixedTo: "mars" }).setScale(a.solarSystemScale),
    ),
    "two faults: path line fixed to a missing body and a readout naming a missing body": b((a) =>
      withPath(a, { lineFixedTo: "mars", readouts: [{ kind: "distance", to: "venus" }] }),
    ),
    "two faults: readout naming a missing body and setTime outside the timeline": b((a) =>
      withPath(a, { readouts: [{ kind: "distance", to: "venus" }] })
        .setTimeline({ start: T0 + 100 * DAY, end: T0 + 200 * DAY })
        .setTime(T0),
    ),
    "two faults: setTime outside the timeline and a Sun orbit with no Sun": b((a) =>
      new a.Scene()
        .addBody(a.earth, { orbit: true })
        .setTimeline({ start: T0 + DAY, end: T0 + 2 * DAY })
        .setTime(T0),
    ),
    "two faults: Sun orbit with no Sun and a bad story panel": b((a) =>
      new a.Scene()
        .addBody(a.earth, { orbit: true })
        .setTime(T0)
        .addStoryPanels([panel("p", { event: "ghost" })]),
    ),
    "two faults: bad story panel and a group centre the scene lacks": b((a) =>
      earthMoon(a)
        .addStoryPanels([panel("p", { event: "ghost" })])
        .addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1), center: "mars" }),
    ),
    "two faults: group centre the scene lacks and an event object the scene lacks": b((a) =>
      earthMoon(a)
        .addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1), center: "mars" })
        .addEvents([{ id: "e", label: "E", time: T0, object: "ghost" }]),
    ),
    "two faults: event object the scene lacks and a view id the scene lacks": b((a) =>
      earthMoon(a)
        .addEvents([{ id: "e", label: "E", time: T0, object: "ghost" }])
        .setViews([{ id: "a", label: "A", objects: ["ghost"] }], { place: "panel" }),
    ),
    "two faults: view id the scene lacks and a pacing rule matching no event": b((a) =>
      earthMoon(a)
        .setViews([{ id: "a", label: "A", objects: ["ghost"] }], { place: "panel" })
        .setTimeline({ start: T0, end: T0 + DAY, pacing: [{ near: { type: "ghost", withinSeconds: 5 }, rate: 1 }] }),
    ),
    "two faults: out-of-span and a group centre the scene lacks": b((a) =>
      new a.Scene()
        .addBody(a.sun)
        .addBody(a.mars)
        .setTimeline({ start: "1500-01-01", end: "1500-02-01" })
        .addGroup({ plane: "ecliptic-j2000", id: "g", orbits: rocks(1), center: "venus" }),
    ),
    "two faults: out-of-span and an event object the scene lacks": b((a) =>
      new a.Scene()
        .addBody(a.sun)
        .addBody(a.mars)
        .setTimeline({ start: "1500-01-01", end: "1500-02-01" })
        .addEvents([{ id: "e", label: "E", time: "1500-01-15", object: "ghost" }]),
    ),
    "two faults at the call: the first throws": b((a) => new a.Scene().addBody("nope").addBody("nada")),
  };
}

type Stage = "call" | "check" | "load" | "none";
interface Fault {
  readonly stage: Stage;
  readonly code?: string;
}
interface Row {
  readonly loaded: Fault;
  /** Outcome on a fresh module graph, for the rows that can depend on the planet series: "same" when it equals `loaded`. */
  readonly fresh?: Fault | "same";
}

/** What a build does through the public API: the stage that threw (the call, `check` or `load`) and the error's code, or that nothing threw. */
async function outcome(build: () => Scene, data: DataSource[] = []): Promise<Fault> {
  let stage: Stage = "call";
  try {
    const scene = build();
    stage = "check";
    scene.check({ data });
    stage = "load";
    await scene.load({ data });
    return { stage: "none" };
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    return { stage, ...(typeof code === "string" ? { code } : {}) };
  }
}

const FAULTS: Record<string, Row> = {
  "addBody: orbit on a body with no orbit": { loaded: { stage: "call", code: "no-orbit" } },
  "addBody: unknown id": { loaded: { stage: "call", code: "unknown-body" } },
  "addBody: repeated id": { loaded: { stage: "call", code: "duplicate-id" } },
  "addBody: labelReach not positive": { loaded: { stage: "call", code: "bad-body" } },
  "addBody: enlarge below 1": { loaded: { stage: "call", code: "bad-body" } },
  "addBody: showLabel not a boolean": { loaded: { stage: "call", code: "bad-body" } },
  "addBody: colour not hex": { loaded: { stage: "call", code: "bad-body" } },
  "addBody: knownLimitations with an empty text": { loaded: { stage: "call", code: "bad-body" } },
  "addBody: moon orbit with its planet absent": { loaded: { stage: "check", code: "no-orbit" } },
  "addBody: Sun orbit with the Sun absent": { loaded: { stage: "check", code: "no-orbit" }, fresh: "same" },
  "addBody: Sun orbit line id taken by a path (path added second)": {
    loaded: { stage: "check", code: "duplicate-id" },
    fresh: "same",
  },
  "addBody: Sun orbit line id taken (path added first)": {
    loaded: { stage: "check", code: "duplicate-id" },
    fresh: "same",
  },
  "addBodyFromElements: reserved id auto": { loaded: { stage: "call", code: "bad-element" } },
  "addBodyFromElements: bad record": { loaded: { stage: "call", code: "bad-element" } },
  "addBodyFromElements: record not an object": { loaded: { stage: "call", code: "bad-element" } },
  "addBodyFromElements: id already in the catalogue": { loaded: { stage: "call", code: "duplicate-id" } },
  "addBodyFromElements: id already in the scene": { loaded: { stage: "call", code: "duplicate-id" } },
  "addBodyFromElements: a bad option": { loaded: { stage: "call", code: "bad-body" } },
  "addBodyFromElements: orbit asked, then the Sun is absent": { loaded: { stage: "check", code: "no-orbit" } },
  "addTrajectory: empty id": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: id of a body": { loaded: { stage: "call", code: "duplicate-id" } },
  "addTrajectory: id of a group": { loaded: { stage: "call", code: "duplicate-id" } },
  "addTrajectory: repeated id": { loaded: { stage: "call", code: "duplicate-id" } },
  "addTrajectory: centre not catalogued": { loaded: { stage: "call", code: "unknown-body" } },
  "addTrajectory: first body not built-in (centre falls back to earth)": { loaded: { stage: "none" } },
  "addTrajectory: labelReach not positive": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: plane not known": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: sample time not a moment": { loaded: { stage: "call", code: "bad-time" } },
  "addTrajectory: samples too few": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: samples out of order": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: sample position not three numbers": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: provider without stateAt": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: provider bounds not moments": { loaded: { stage: "call", code: "bad-time" } },
  "addTrajectory: provider bounds missing": { loaded: { stage: "call", code: "bad-time" } },
  "addTrajectory: provider bounds end before start": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: provenanceSpans not a list": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: provenanceSpans bad time": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: provenanceSpans bad provenance": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: provenanceSpans end before start": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: provenanceSpans outside the path": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: provenanceSpans overlapping": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: lineFixedTo a number": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: lineFixedTo a stretch without a body": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: lineFixedTo stretches overlapping": { loaded: { stage: "call", code: "bad-trajectory" } },
  "addTrajectory: lineFixedTo a body the scene lacks (at toDefinition)": {
    loaded: { stage: "check", code: "bad-trajectory" },
  },
  "addTrajectory: lineFixedTo a stretch body the scene lacks": { loaded: { stage: "check", code: "bad-trajectory" } },
  "addTrajectory: readouts not a list": { loaded: { stage: "call", code: "bad-readout" } },
  "addTrajectory: readout of an unknown kind": { loaded: { stage: "call", code: "bad-readout" } },
  "addTrajectory: readout distance without a body": { loaded: { stage: "call", code: "bad-readout" } },
  "addTrajectory: readout altitude without a body": { loaded: { stage: "call", code: "bad-readout" } },
  "addTrajectory: readout names an uncatalogued body": { loaded: { stage: "call", code: "bad-readout" } },
  "addTrajectory: readout names a body the scene lacks": { loaded: { stage: "check", code: "bad-readout" } },
  "addTrajectory: anchors not a list": { loaded: { stage: "call", code: "bad-anchor" } },
  "addTrajectory: anchor without an id": { loaded: { stage: "call", code: "bad-anchor" } },
  "addTrajectory: anchor twice": { loaded: { stage: "call", code: "bad-anchor" } },
  "addTrajectory: anchor time not a moment": { loaded: { stage: "call", code: "bad-anchor" } },
  "addTrajectory: anchor outside the path": { loaded: { stage: "call", code: "bad-anchor" } },
  "addGroup: no id": { loaded: { stage: "call", code: "bad-group" } },
  "addGroup: no orbits": { loaded: { stage: "call", code: "bad-group" } },
  "addGroup: an orbit without an id": { loaded: { stage: "call", code: "bad-group" } },
  "addGroup: an orbit twice": { loaded: { stage: "call", code: "bad-group" } },
  "addGroup: colour not hex": { loaded: { stage: "call", code: "bad-group" } },
  "addGroup: dot size not positive": { loaded: { stage: "call", code: "bad-group" } },
  "addGroup: refillAfterMs not positive": { loaded: { stage: "call", code: "bad-group" } },
  "addGroup: refillSliceMs negative": { loaded: { stage: "call", code: "bad-group" } },
  "addGroup: knownLimitations with an empty text": { loaded: { stage: "call", code: "bad-group" } },
  "addGroup: clump near an uncatalogued body": { loaded: { stage: "call", code: "bad-group" }, fresh: "same" },
  "addGroup: clump fraction above 1": { loaded: { stage: "call", code: "bad-group" }, fresh: "same" },
  "addGroup: clump width above 180": { loaded: { stage: "call", code: "bad-group" }, fresh: "same" },
  "addGroup: readouts not a list": { loaded: { stage: "call", code: "bad-readout" } },
  "addGroup: readout of an unknown kind": { loaded: { stage: "call", code: "bad-readout" } },
  "addGroup: readout activity not a text": { loaded: { stage: "call", code: "bad-readout" } },
  "addGroup: centre not catalogued": { loaded: { stage: "call", code: "unknown-body" } },
  "addGroup: id of a body": { loaded: { stage: "call", code: "duplicate-id" } },
  "addGroup: id of a path": { loaded: { stage: "call", code: "duplicate-id" } },
  "addGroup: centre the scene lacks (at toDefinition)": { loaded: { stage: "check", code: "bad-group" } },
  "addGroup: clump body the scene lacks": { loaded: { stage: "check", code: "bad-group" }, fresh: "same" },
  "addGroup: clump near its own centre": { loaded: { stage: "check", code: "bad-group" }, fresh: "same" },
  "addGroup: rate readout with no activity": { loaded: { stage: "check", code: "bad-readout" } },
  "addGroup: rate readout naming a missing activity": { loaded: { stage: "check", code: "bad-readout" } },
  "addGroup: an orbit the engine refuses": { loaded: { stage: "check", code: "bad-group" } },
  "addGroup: reference time not a moment": { loaded: { stage: "check", code: "bad-time" } },
  "addGroup: an orbit time not a moment": { loaded: { stage: "check", code: "bad-time" } },
  "addGroup: reads the planet series but the window is outside them": {
    loaded: { stage: "load", code: "out-of-span" },
    fresh: "same",
  },
  "addActivity: no id": { loaded: { stage: "call", code: "bad-activity" } },
  "addActivity: no label": { loaded: { stage: "call", code: "bad-activity" } },
  "addActivity: no unit": { loaded: { stage: "call", code: "bad-activity" } },
  "addActivity: one sample": { loaded: { stage: "call", code: "bad-activity" } },
  "addActivity: empty peakLabel": { loaded: { stage: "call", code: "bad-activity" } },
  "addActivity: repeated id": { loaded: { stage: "call", code: "duplicate-id" } },
  "addActivity: sample time not a moment": { loaded: { stage: "call", code: "bad-time" } },
  "addActivity: negative rate": { loaded: { stage: "call", code: "bad-activity" } },
  "addActivity: peak outside": { loaded: { stage: "call", code: "bad-activity" } },
  "addActivity: start not a moment": { loaded: { stage: "call", code: "bad-time" } },
  "addActivity: provenance span not a moment": { loaded: { stage: "call", code: "bad-time" } },
  "addActivity: provenance malformed": { loaded: { stage: "call", code: "bad-activity" } },
  "addActivity: samples not a list": { loaded: { stage: "call", code: "bad-activity" } },
  "setTime: not a moment": { loaded: { stage: "call", code: "bad-time" } },
  "setTime: invalid Date": { loaded: { stage: "call", code: "bad-time" } },
  "setScale: not a scale": { loaded: { stage: "call", code: "bad-scale" } },
  "setScale: nothing": { loaded: { stage: "call", code: "bad-scale" } },
  "setScale: solar-system without a Sun-centred scene": { loaded: { stage: "check", code: "bad-scale" } },
  "setScale: solar-system without an enlarged body": { loaded: { stage: "check", code: "bad-scale" } },
  "addEvents: not a list": { loaded: { stage: "call", code: "bad-event" } },
  "addEvents: no id": { loaded: { stage: "call", code: "bad-event" } },
  "addEvents: no label": { loaded: { stage: "call", code: "bad-event" } },
  "addEvents: repeated id": { loaded: { stage: "call", code: "duplicate-id" } },
  "addEvents: repeated across calls": { loaded: { stage: "call", code: "duplicate-id" } },
  "addEvents: time not a moment": { loaded: { stage: "call", code: "bad-time" } },
  "addEvents: object not a text": { loaded: { stage: "call", code: "bad-event" } },
  "addEvents: own provenance malformed": { loaded: { stage: "call", code: "bad-event" } },
  "addEvents: batch provenance malformed": { loaded: { stage: "call", code: "bad-event" } },
  "addEvents: object not in the scene (at toDefinition)": { loaded: { stage: "check", code: "bad-event" } },
  "addStoryPanels: event not there": { loaded: { stage: "check", code: "bad-panels" } },
  "addStoryPanels: anchor not there": { loaded: { stage: "check", code: "bad-panels" } },
  "addStoryPanels: object not in the scene": { loaded: { stage: "check", code: "bad-panels" } },
  "addStoryPanels: time outside the timeline": { loaded: { stage: "check", code: "bad-panels" } },
  "addStoryPanels: source type not one": { loaded: { stage: "call", code: "bad-panels" } },
  "addStoryPanels: no sources": { loaded: { stage: "call", code: "bad-panels" } },
  "addStoryPanels: repeated id": { loaded: { stage: "call", code: "duplicate-id" } },
  "addStoryPanels: panels not a list": { loaded: { stage: "call", code: "bad-panels" } },
  "setStoryPanelPlayback: pauseSeconds out of range": { loaded: { stage: "call", code: "bad-panels" } },
  "addStoryPanels: no body": { loaded: { stage: "call", code: "bad-panels" } },
  "addStoryPanels: undefined": { loaded: { stage: "call", code: "bad-panels" } },
  "setTimeline: not an object": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: rate zero": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: loop not a boolean": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: none with a bad moment": { loaded: { stage: "call", code: "bad-time" } },
  "setTimeline: start not a moment": { loaded: { stage: "call", code: "bad-time" } },
  "setTimeline: end before start": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: rates empty": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: a rate not positive": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: pacing not a list": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: pacing piece not an object": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: pacing rate not positive": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: pacing ramp negative": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: pacing near without a type": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: pacing near within not positive": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: pacing piece without from and to": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: pacing to before from": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: pacing spans overlapping": { loaded: { stage: "call", code: "bad-timeline" } },
  "setTimeline: pacing rule matching no event (at toDefinition)": { loaded: { stage: "check", code: "bad-timeline" } },
  "setTime outside the timeline (at toDefinition)": { loaded: { stage: "check", code: "bad-timeline" } },
  "setTime outside a frozen-at timeline": { loaded: { stage: "none" } },
  "setSwitches: not an object": { loaded: { stage: "call", code: "bad-switch" } },
  "setSwitches: unknown switch": { loaded: { stage: "call", code: "bad-switch" } },
  "setSwitches: bad place": { loaded: { stage: "call", code: "bad-switch" } },
  "setSwitches: on not a boolean": { loaded: { stage: "call", code: "bad-switch" } },
  "setViews: not a list": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: empty": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: bad place": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: options missing": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: view not an object": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: no id": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: no label": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: repeated id": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: ids not a list": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: camera malformed": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: camera a string that is not a rule": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: start not a view": { loaded: { stage: "call", code: "bad-view" } },
  "setViews: id the scene lacks (at toDefinition)": { loaded: { stage: "check", code: "bad-view" } },
  "setViews: body the scene lacks": { loaded: { stage: "check", code: "bad-view" } },
  "setViews: event the scene lacks": { loaded: { stage: "check", code: "bad-view" } },
  "setViews: panel the scene lacks": { loaded: { stage: "check", code: "bad-view" } },
  "setViews: camera target the view does not show": { loaded: { stage: "check", code: "bad-view" } },
  "camera.follow: unknown id": { loaded: { stage: "call", code: "unknown-body" } },
  "camera.focus: unknown id": { loaded: { stage: "call", code: "unknown-body" } },
  "camera.follow: up not known": { loaded: { stage: "call", code: "bad-camera" } },
  "camera.setReach: zero": { loaded: { stage: "call", code: "bad-camera" } },
  "camera.setReach: not a number": { loaded: { stage: "call", code: "bad-camera" } },
  "camera.setReach: infinite": { loaded: { stage: "call", code: "bad-camera" } },
  "camera.fitOrbit: unknown id": { loaded: { stage: "call", code: "unknown-body" }, fresh: "same" },
  "camera.fitOrbit: a body that does not circle the Sun": {
    loaded: { stage: "call", code: "bad-camera" },
    fresh: "same",
  },
  "camera.fitOrbit: the Sun itself": { loaded: { stage: "call", code: "bad-camera" }, fresh: "same" },
  "toDefinition: empty scene": { loaded: { stage: "check", code: "empty-scene" } },
  "toDefinition: a data package not passed": { loaded: { stage: "check", code: "missing-data" } },
  "toDefinition: a listed moon's data package not passed": { loaded: { stage: "check", code: "missing-data" } },
  "stateOf: unknown id": { loaded: { stage: "call", code: "unknown-body" } },
  "stateOf: time not a moment": { loaded: { stage: "call", code: "bad-time" } },
  "stateOf: outside a path": { loaded: { stage: "call", code: "bad-time" } },
  "provenanceOf: unknown id": { loaded: { stage: "call", code: "unknown-body" } },
  "planet series: stateOf a planet before they are loaded": {
    loaded: { stage: "none" },
    fresh: { stage: "call", code: "missing-data" },
  },
  "out-of-span: planets and a window outside the planet series (prepare rejects)": {
    loaded: { stage: "load", code: "out-of-span" },
    fresh: "same",
  },
  "out-of-span: orbit lines and a window outside the series": {
    loaded: { stage: "load", code: "out-of-span" },
    fresh: "same",
  },
  "out-of-span: a fit and a window outside the series": {
    loaded: { stage: "load", code: "out-of-span" },
    fresh: "same",
  },
  "two faults: empty scene and a bad group readout": { loaded: { stage: "check", code: "empty-scene" } },
  "two faults: missing data package and a bad group readout": { loaded: { stage: "check", code: "missing-data" } },
  "two faults: bad group readout and a moon orbit with no planet": { loaded: { stage: "check", code: "bad-readout" } },
  "two faults: moon orbit with no planet and a bad scale": { loaded: { stage: "check", code: "no-orbit" } },
  "two faults: bad scale and a path line fixed to a missing body": { loaded: { stage: "check", code: "bad-scale" } },
  "two faults: path line fixed to a missing body and a readout naming a missing body": {
    loaded: { stage: "check", code: "bad-trajectory" },
  },
  "two faults: readout naming a missing body and setTime outside the timeline": {
    loaded: { stage: "check", code: "bad-readout" },
  },
  "two faults: setTime outside the timeline and a Sun orbit with no Sun": {
    loaded: { stage: "check", code: "bad-timeline" },
    fresh: "same",
  },
  "two faults: Sun orbit with no Sun and a bad story panel": {
    loaded: { stage: "check", code: "no-orbit" },
    fresh: "same",
  },
  "two faults: bad story panel and a group centre the scene lacks": { loaded: { stage: "check", code: "bad-panels" } },
  "two faults: group centre the scene lacks and an event object the scene lacks": {
    loaded: { stage: "check", code: "bad-group" },
  },
  "two faults: event object the scene lacks and a view id the scene lacks": {
    loaded: { stage: "check", code: "bad-event" },
  },
  "two faults: view id the scene lacks and a pacing rule matching no event": {
    loaded: { stage: "check", code: "bad-timeline" },
  },
  "two faults: out-of-span and a group centre the scene lacks": {
    loaded: { stage: "check", code: "bad-group" },
    fresh: "same",
  },
  "two faults: out-of-span and an event object the scene lacks": {
    loaded: { stage: "check", code: "bad-event" },
    fresh: "same",
  },
  "two faults at the call: the first throws": { loaded: { stage: "call", code: "unknown-body" } },
};

/** Covered where they are, not here (TEST-03): addTrajectory: samples not a list. */
const COVERED_ELSEWHERE = ["addTrajectory: samples not a list"];

describe("which build fault wins (O-088 T-406)", () => {
  const bad = badBuilds();
  it("every bad build has a row, and every row a build", () => {
    expect(
      Object.keys(bad)
        .filter((name) => !COVERED_ELSEWHERE.includes(name))
        .sort(),
    ).toEqual(Object.keys(FAULTS).sort());
  });

  describe("planet series loaded", () => {
    it.each(Object.entries(FAULTS))("%s", async (name, row) => {
      const api = await import("astraeus");
      const one = bad[name]!;
      expect(await outcome(() => one.build(api), one.data)).toEqual(row.loaded);
    });
  });

  describe("fresh module graph (planet series not loaded)", () => {
    it.each(Object.entries(FAULTS).filter(([, row]) => row.fresh !== undefined))("%s", async (name, row) => {
      vi.resetModules();
      const api = await import("astraeus");
      const { planetSeriesLoaded } = await import("../src/core/planetSeries");
      expect(planetSeriesLoaded()).toBe(false);
      const one = bad[name]!;
      expect(await outcome(() => one.build(api), one.data)).toEqual(row.fresh === "same" ? row.loaded : row.fresh);
    });
  });
});
