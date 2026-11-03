// @vitest-environment happy-dom
// The host hears when playback enters and leaves the pacing zone of an event the showing view has (O-052 T-226, G-015), on a made-up two-probe scene (ARCH-03).
// The 3D scene is a stand-in that exposes the controls the page hands it, so camera requests are read straight from them.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sceneProps = vi.hoisted(() => ({ latest: null as null | { controls: import("../src/app/AstraeusScene").SceneControls } }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => { sceneProps.latest = props; return createElement("div", { "data-testid": "scene" }); },
}));

import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { earth } from "../src/api/bodies";
import type { EventZoneChange } from "../src/api/viewerLink";
import { $, byLabel, change, drawn, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DAY = 86_400_000;
const T0 = Date.UTC(2030, 0, 1);
const at = (days: number) => new Date(T0 + days * DAY).toISOString();
const samples = (x: number) => [0, 1].map((i) => ({ time: T0 + i * 100 * DAY, positionKm: [x + i, 0, 0], velocityKmS: [1, 0, 0] }));
/** Probe A's flyby is on day 20 (view a), probe B's on day 50 (view b); each slows playback within a day. `start` is the day the timeline opens on. */
const makeScene = (start = 0, extra = false, within = 86_400, rate = 60) => new Scene().addBody(earth)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
  .addEvents([
    { id: "ea", label: "A flyby", time: at(20), type: "flyby", object: "pa" },
    { id: "eb", label: "B flyby", time: at(50), type: "flyby", object: "pb" },
    ...(extra ? [{ id: "ea2", label: "A second", time: at(20.5), type: "flyby", object: "pa" }] : []),
  ])
  .setViews([{ id: "a", label: "A", paths: ["pa"], events: ["ea", "ea2"].filter((id) => extra || id !== "ea2") }, { id: "b", label: "B", paths: ["pb"], events: ["eb"] }], { place: "top-bar" })
  .setTimeline({ start: at(start), end: at(100), rate: 86_400, rates: [60, 86_400], pacing: [{ near: { type: "flyby", within }, rate }] });
const plain = () => new Scene().addBody(earth).setTimeline({ start: at(0), end: at(100), rate: 86_400, rates: [60, 86_400] });

let host: HTMLElement;
let root: Root | undefined;
beforeEach(() => {
  pretendScreen({});
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => { if (root) act(() => root!.unmount()); root = undefined; host.remove(); sceneProps.latest = null; vi.unstubAllGlobals(); vi.useRealTimers(); });
const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const short = (c: EventZoneChange) => `${c.entered ? "enter" : "leave"} ${c.event} ${c.cause}`;
const vias = (seen: EventZoneChange[]) => seen.map((c) => c.via);
const listen = (handle: { onEventZone(l: (c: EventZoneChange) => void): () => void }) => { const seen: EventZoneChange[] = []; handle.onEventZone((c) => seen.push(c)); return seen; };

describe("event zones from playback", () => {
  it("reports enter then leave as the clock runs across a zone, with the event's type and object, and the time", async () => {
    const handle = mount(host, makeScene(19.9, false, 3_600, 3_600)); // a zone one hour either side of day 20, played at an hour a second
    await drawn(handle);
    const seen = listen(handle);
    expect(handle.eventZones).toEqual([]);
    for (let i = 0; i < 400 && seen.length < 2; i += 1) tick(100);
    expect(seen.map(short)).toEqual(["enter ea playback", "leave ea playback"]);
    expect(vias(seen)).toEqual(["time", "time"]);
    expect(seen[0]).toMatchObject({ type: "flyby", object: "pa", entered: true });
    expect(seen[0]!.time).toBeGreaterThanOrEqual(T0 + 20 * DAY - 3_600_000);
    expect(seen[0]!.time).toBeLessThanOrEqual(T0 + 20 * DAY + 3_600_000); // inside the zone
    expect(seen[1]!.time).toBeGreaterThan(T0 + 20 * DAY + 3_600_000);
    handle.unmount();
  });

  it("eventZones reads the active ids now, undefined before ready and after unmount, empty in a scene without pacing", async () => {
    const handle = mount(host, makeScene());
    expect(handle.eventZones).toBeUndefined();
    await drawn(handle);
    act(() => handle.setTime(T0 + 20 * DAY));
    expect(handle.eventZones).toEqual(["ea"]);
    handle.unmount();
    expect(handle.eventZones).toBeUndefined();
    const bare = mount(host, plain());
    await drawn(bare);
    expect(bare.eventZones).toEqual([]);
    bare.unmount();
  });
});

describe("event zones from a seek", () => {
  it("the host's setTime in and out reports with cause host", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    const seen = listen(handle);
    act(() => handle.setTime(T0 + 20 * DAY));
    act(() => handle.setTime(T0 + 30 * DAY));
    expect(seen.map(short)).toEqual(["enter ea host", "leave ea host"]);
    expect(vias(seen)).toEqual(["time", "time"]);
    handle.unmount();
  });

  it("a visitor's timeline seek in and out reports with cause visitor", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    const seen = listen(handle);
    const scrub = byLabel(host, "Seek timeline") as HTMLInputElement;
    act(() => change(scrub, String(T0 + 20 * DAY)));
    act(() => change(scrub, String(T0 + 30 * DAY)));
    expect(seen.map(short)).toEqual(["enter ea visitor", "leave ea visitor"]);
    expect(vias(seen)).toEqual(["time", "time"]);
    handle.unmount();
  });
});

describe("event zones from a view switch", () => {
  it("a switch that hides an active zone reports leave, one that shows it reports enter: host and visitor causes", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    act(() => handle.setTime(T0 + 20 * DAY));
    const seen = listen(handle);
    act(() => handle.setView("b")); // time is inside A's zone, which view b does not show
    act(() => handle.setView("a"));
    act(() => { (host.querySelector('[data-view-id="b"]') as HTMLElement).click(); });
    act(() => { (host.querySelector('[data-view-id="a"]') as HTMLElement).click(); });
    expect(seen.map(short)).toEqual(["leave ea host", "enter ea host", "leave ea visitor", "enter ea visitor"]);
    expect(vias(seen)).toEqual(["view", "view", "view", "view"]);
    expect($(host, '[data-view-id="a"]')).toBeTruthy();
    handle.unmount();
  });

  it("a zone of the other view is not reported when playback passes through it", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    act(() => handle.setView("b"));
    const seen = listen(handle);
    act(() => handle.setTime(T0 + 20 * DAY)); // inside A's zone, but B is showing
    expect(handle.eventZones).toEqual([]);
    expect(seen).toEqual([]);
    handle.unmount();
  });
});

describe("overlap, opening inside a zone, and after unmount", () => {
  it("overlapping zones report separately, each leaving on its own", async () => {
    const handle = mount(host, makeScene(0, true));
    await drawn(handle);
    const seen = listen(handle);
    act(() => handle.setTime(T0 + 20.25 * DAY)); // inside ea (day 20 ± 1) and ea2 (day 20.5 ± 1)
    expect(handle.eventZones).toEqual(["ea", "ea2"]);
    act(() => handle.setTime(T0 + 21.25 * DAY)); // past ea, still inside ea2
    expect(seen.map(short)).toEqual(["enter ea host", "enter ea2 host", "leave ea host"]);
    handle.unmount();
  });

  it("a zone already active when the viewer opens reports enter once, to a listener added right after ready", async () => {
    const handle = mount(host, makeScene(20));
    await drawn(handle);
    const seen = listen(handle);
    expect(handle.eventZones).toEqual(["ea"]);
    tick(100);
    tick(300);
    expect(seen.map(short)).toEqual(["enter ea playback"]);
    expect(vias(seen)).toEqual(["time"]); // opening inside a zone is time, not a view switch
    handle.unmount();
  });

  it("a scene without pacing reports nothing", async () => {
    const handle = mount(host, plain());
    await drawn(handle);
    const seen = listen(handle);
    act(() => handle.setTime(T0 + 20 * DAY));
    tick(500);
    expect(seen).toEqual([]);
    handle.unmount();
  });

  it("nothing arrives after unmount, and a stopped listener hears nothing more", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    const seen: EventZoneChange[] = [];
    const stop = handle.onEventZone((c) => seen.push(c));
    act(() => handle.setTime(T0 + 20 * DAY));
    expect(seen).toHaveLength(1);
    stop();
    act(() => handle.setTime(T0 + 30 * DAY));
    expect(seen).toHaveLength(1);
    const later = listen(handle);
    handle.unmount();
    tick(1000);
    expect(later).toEqual([]);
  });
});

describe("the React prop", () => {
  it("AstraeusScene onEventZone gets the same payload", async () => {
    const seen: EventZoneChange[] = [];
    const scene = makeScene();
    root = createRoot(host);
    const draw = (time: string) => act(async () => { root!.render(createElement(AstraeusScene, { scene, onEventZone: (c) => seen.push(c), time })); });
    await draw(at(20));
    await act(async () => { await Promise.resolve(); });
    await draw(at(30));
    expect(seen.map(short)).toEqual(["enter ea host", "leave ea host"]);
    expect(seen[0]).toMatchObject({ type: "flyby", object: "pa", time: T0 + 20 * DAY, via: "time" });
  });
});

describe("the README composition: the camera to the encounter and back", () => {
  it("on enter saves the camera and follows the object; on a time leave puts the saved pose back, through the camera request path", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    sceneProps.latest!.controls.viewReadout = { focus: "earth", azimuthDeg: 10, elevationDeg: 20, distance: 30 };
    let saved: typeof handle.camera;
    handle.onEventZone(({ entered, object, via }) => {
      if (entered) { saved = handle.camera; handle.setCamera({ follow: object! }); } else if (via === "time" && saved) handle.setCamera(saved);
      if (!entered) saved = undefined;
    });
    act(() => handle.setTime(T0 + 20 * DAY));
    expect(sceneProps.latest!.controls.cameraRequest).toEqual({ kind: "follow", target: "pa" });
    act(() => handle.setTime(T0 + 30 * DAY));
    expect(sceneProps.latest!.controls.cameraRequest).toMatchObject({ kind: "pose", view: { focus: "earth", azimuthDeg: 10, elevationDeg: 20, distance: 30 } });
    handle.unmount();
  });

  it("across a mid-zone view switch that hides the zone the composition neither throws nor asks for a restore", async () => {
    const handle = mount(host, makeScene());
    await drawn(handle);
    sceneProps.latest!.controls.viewReadout = { focus: "earth", azimuthDeg: 10, elevationDeg: 20, distance: 30 };
    let saved: typeof handle.camera | undefined;
    const errors: unknown[] = [];
    handle.onEventZone(({ entered, object, via }) => {
      try {
        if (entered) { saved = handle.camera; handle.setCamera({ follow: object! }); } else if (via === "time" && saved) handle.setCamera(saved);
        if (!entered) saved = undefined;
      } catch (error) { errors.push(error); }
    });
    act(() => handle.setTime(T0 + 20 * DAY));
    expect(sceneProps.latest!.controls.cameraRequest).toEqual({ kind: "follow", target: "pa" });
    act(() => handle.setView("b")); // hides probe A and its zone
    expect(errors).toEqual([]);
    expect(saved).toBeUndefined();
    expect(sceneProps.latest!.controls.cameraRequest).not.toMatchObject({ kind: "pose" }); // no restore request
    handle.unmount();
  });
});

// O-056 T-263 (G-016, owner D4): an event carries its own zone, with or without pacing.
const ZONES_DAY_20 = 86_400; // one day either side
const zoned = (events: readonly { id: string; day: number; within?: number; type?: string }[], opts: { views?: boolean; pacing?: readonly object[] } = {}) => {
  let scene = new Scene().addBody(earth)
    .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
    .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
    .addEvents(events.map((e) => ({ id: e.id, label: e.id, time: at(e.day), ...(e.type === undefined ? {} : { type: e.type }), ...(e.within === undefined ? {} : { withinSeconds: e.within }) })));
  if (opts.views) scene = scene.setViews([{ id: "a", label: "A", paths: ["pa"], events: ["za"] }, { id: "b", label: "B", paths: ["pb"], events: ["zb"] }], { place: "top-bar" });
  return scene.setTimeline({ start: at(0), end: at(100), rate: 86_400, rates: [60, 86_400], ...(opts.pacing === undefined ? {} : { pacing: opts.pacing as never }) });
};

describe("event zones from withinSeconds", () => {
  it.each([
    ["without pacing", undefined],
    ["alongside a pacing rule for another type", [{ near: { type: "other", within: 60 }, rate: 60 }]],
  ] as const)("reports enter and leave with via time, %s", async (_name, pacing) => {
    const events = [{ id: "za", day: 20, within: ZONES_DAY_20 }, { id: "oth", day: 80, type: "other" }];
    const handle = mount(host, zoned(events, { ...(pacing === undefined ? {} : { pacing }) }));
    await drawn(handle);
    const seen = listen(handle);
    act(() => handle.setTime(T0 + 19.5 * DAY));
    act(() => handle.setTime(T0 + 30 * DAY));
    expect(handle.eventZones).toEqual([]);
    expect(seen.map(short)).toEqual(["enter za host", "leave za host"]);
    expect(vias(seen)).toEqual(["time", "time"]);
    handle.unmount();
  });

  it("an event without withinSeconds and no rule has no zone", async () => {
    const handle = mount(host, zoned([{ id: "za", day: 20 }]));
    await drawn(handle);
    const seen = listen(handle);
    act(() => handle.setTime(T0 + 20 * DAY));
    expect([handle.eventZones, seen]).toEqual([[], []]);
    handle.unmount();
  });

  it("zones from both sources report together: an own zone and a rule zone", async () => {
    const events = [{ id: "za", day: 20, within: ZONES_DAY_20 }, { id: "zb", day: 20.5, type: "flyby" }];
    const handle = mount(host, zoned(events, { pacing: [{ near: { type: "flyby", within: 3_600 }, rate: 3_600 }] }));
    await drawn(handle);
    act(() => handle.setTime(T0 + 20.5 * DAY));
    expect([...handle.eventZones!].sort()).toEqual(["za", "zb"]); // zone order is not part of the contract
    act(() => handle.setTime(T0 + 20.3 * DAY)); // inside za's day, outside zb's hour
    expect(handle.eventZones).toEqual(["za"]);
    handle.unmount();
  });

  it("a pacing rule uses the event's own withinSeconds, its own within otherwise", async () => {
    const events = [{ id: "za", day: 20, within: ZONES_DAY_20, type: "flyby" }, { id: "zb", day: 50, type: "flyby" }];
    const handle = mount(host, zoned(events, { pacing: [{ near: { type: "flyby", within: 3_600 }, rate: 3_600 }] }));
    await drawn(handle);
    act(() => handle.setTime(T0 + 20.5 * DAY)); // 12 h from za: its own day, not the rule's hour
    expect(handle.eventZones).toEqual(["za"]);
    act(() => handle.setTime(T0 + 50.5 * DAY)); // 12 h from zb: the rule's hour does not reach
    expect(handle.eventZones).toEqual([]);
    handle.unmount();
  });

  it("a view that hides the event hides its zone", async () => {
    const handle = mount(host, zoned([{ id: "za", day: 20, within: ZONES_DAY_20 }, { id: "zb", day: 50, within: ZONES_DAY_20 }], { views: true }));
    await drawn(handle);
    act(() => handle.setTime(T0 + 50 * DAY)); // zb's zone, view a showing
    expect(handle.eventZones).toEqual([]);
    act(() => handle.setView("b"));
    expect(handle.eventZones).toEqual(["zb"]);
    handle.unmount();
  });

  it.each([[0], [-5], [Number.NaN], [Number.POSITIVE_INFINITY], ["60"]])("withinSeconds %s throws bad-event naming the event", (value) => {
    let error: unknown;
    try { new Scene().addEvents([{ id: "ev", label: "E", time: at(1), withinSeconds: value as never }]); } catch (caught) { error = caught; }
    expect(error).toMatchObject({ code: "bad-event" });
    expect((error as Error).message).toContain('"ev"');
  });

  it("scene.events reads withinSeconds back", () => {
    const scene = zoned([{ id: "za", day: 20, within: 90 }, { id: "zb", day: 21 }]);
    expect(scene.events.map((e) => e.withinSeconds)).toEqual([90, undefined]);
  });
});
