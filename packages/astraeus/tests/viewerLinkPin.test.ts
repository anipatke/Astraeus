// O-058 T-238: pins ViewerLink's every member against a fake control, so the split into clock, views, camera and zones is checked
// beyond the DOM tests: the NOT_OPEN guard, whenAttached, detach and close, the listener copying, and the publish order (change, then zones).
import { afterEach, describe, expect, it, vi } from "vitest";
import { SceneError } from "../src/api/errors";
import { ViewerLink, type EventZoneChange, type ViewerChange } from "../src/api/viewerLink";
import type { ViewerControl, ViewerState } from "../src/app/viewerPort";
import { FAKE_PRESENTATION, FAKE_PRESENTATION_CONTROL } from "./helpers/viewerPresentation";

const START = Date.UTC(2020, 0, 1);
const END = Date.UTC(2020, 0, 2);
const NOT_OPEN = "the viewer is not drawn yet (or is gone); wait for `ready` first";

function fake(opts: { paced?: boolean; views?: string[] } = {}) {
  const calls: string[] = [];
  let pose = { focus: "earth", azimuthDeg: 1, elevationDeg: 2, distance: 3 };
  let state: ViewerState = { timeUtcMs: START + 10, rate: 1, playing: false, ...FAKE_PRESENTATION, ...(opts.views?.length ? { view: opts.views[0] } : {}), ...(opts.paced ? { auto: true, zones: [] } : {}) };
  const control: ViewerControl = {
    window: { startUtcMs: START, endUtcMs: END },
    events: [{ id: "e1", type: "flyby", object: "moon", startUtcMs: START, endUtcMs: START + 5 } as never, { id: "e2" } as never],
    rates: [1, 60], paced: opts.paced ?? false,
    playable: true, setPlaying: (p) => { calls.push(`playing ${p}`); state = { ...state, playing: p }; },
    read: () => state,
    seek: (t) => { calls.push(`seek ${t}`); state = { ...state, timeUtcMs: t }; },
    setRate: (r) => { calls.push(`rate ${r}`); state = { ...state, rate: r === "auto" ? 1 : r, ...(opts.paced ? { auto: r === "auto" } : {}) }; },
    views: opts.views ?? [],
    setView: (id) => { calls.push(`view ${id}`); state = { ...state, view: id }; },
    cameraTargets: () => ["earth", "moon"],
    readCamera: () => pose,
    setCamera: (request) => { calls.push(`camera ${JSON.stringify(request)}`); },
    ...FAKE_PRESENTATION_CONTROL,
  };
  return { control, calls, move: (next: Partial<typeof pose>) => { pose = { ...pose, ...next }; }, set: (next: Partial<ViewerState>) => { state = { ...state, ...next }; return state; } };
}
const code = (run: () => void): string | undefined => { try { run(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return undefined; };

describe("ViewerLink before attach and after detach", () => {
  it("reads undefined and refuses every setter with not-mounted and the NOT_OPEN message", () => {
    const link = new ViewerLink();
    const reads = [link.timeUtcMs, link.rate, link.playing, link.eventZones, link.view, link.camera];
    expect(reads).toEqual([undefined, undefined, undefined, undefined, undefined, undefined]);
    expect(link.rateSource).toBe("scene");
    expect(code(() => link.setTime(START))).toBe(`not-mounted: setTime: ${NOT_OPEN}`);
    expect(code(() => link.setRate(1))).toBe(`not-mounted: setRate: ${NOT_OPEN}`);
    expect(code(() => link.setView("a"))).toBe(`not-mounted: setView: ${NOT_OPEN}`);
    expect(code(() => link.setCamera({ follow: "earth" }))).toBe(`not-mounted: setCamera: ${NOT_OPEN}`);
  });

  it("the look, scale and switch calls: not-mounted before attach, then checked (bad-look, bad-scale, bad-switch) before the control hears them", () => {
    const link = new ViewerLink();
    expect([link.look, link.scale, link.switches]).toEqual([undefined, undefined, undefined]);
    expect(code(() => link.setLook({}))).toBe(`not-mounted: setLook: ${NOT_OPEN}`);
    expect(code(() => link.setScale("true-scale"))).toBe(`not-mounted: setScale: ${NOT_OPEN}`);
    expect(code(() => link.setSwitch("labels", true))).toBe(`not-mounted: setSwitch: ${NOT_OPEN}`);
    const { control } = fake();
    const heard: string[] = [];
    link.attach({ ...control, setLook: (look) => heard.push(`look ${JSON.stringify(look)}`), setScale: (id) => heard.push(`scale ${id}`), setSwitch: (id, on) => heard.push(`switch ${id} ${on}`), read: () => ({ ...control.read(), switches: { labels: true } }) });
    expect(link.switches).toEqual({ labels: true });
    expect(code(() => link.setLook({ starBrightness: 3 }))).toMatch(/^bad-look: setLook: starBrightness/);
    expect(code(() => link.setScale("solar-system"))).toMatch(/^bad-scale: setScale: "solar-system".*true-scale, readable-scale/);
    expect(code(() => link.setSwitch("milkyWay", true))).toMatch(/^bad-switch: setSwitch: "milkyWay".*labels/);
    expect(code(() => link.setSwitch("labels", "yes" as never))).toMatch(/^bad-switch: .*true or false/);
    expect(heard).toEqual([]);
    link.setLook({ starBrightness: 1.5 });
    link.setScale("readable-scale");
    link.setSwitch("labels", false);
    expect(heard).toEqual(['look {"starBrightness":1.5}', "scale readable-scale", "switch labels false"]);
  });

  it("reads after attach and goes back to undefined after detach", () => {
    const link = new ViewerLink();
    const { control } = fake({ paced: true, views: ["a", "b"] });
    link.attach(control);
    expect([link.timeUtcMs, link.rate, link.playing, link.view]).toEqual([START + 10, 1, false, "a"]);
    expect(link.eventZones).toEqual([]);
    expect(link.camera).toEqual({ focus: "earth", azimuthDeg: 1, elevationDeg: 2, distance: 3 });
    link.detach();
    expect([link.timeUtcMs, link.rate, link.playing, link.view, link.eventZones, link.camera]).toEqual([undefined, undefined, undefined, undefined, undefined, undefined]);
    expect(code(() => link.setTime(START))).toBe(`not-mounted: setTime: ${NOT_OPEN}`);
  });

  it("eventZones is empty (not undefined) when attached to a control with no zones field", () => {
    const link = new ViewerLink();
    link.attach(fake().control);
    expect(link.eventZones).toEqual([]);
  });
});

describe("ViewerLink whenAttached, detach and close", () => {
  it("resolves on attach, at once when already attached, and arms a fresh wait after a detach", async () => {
    const link = new ViewerLink();
    let early = false;
    void link.whenAttached().then(() => { early = true; });
    await Promise.resolve();
    expect(early).toBe(false);
    link.attach(fake().control);
    await link.whenAttached();
    expect(early).toBe(true);
    link.detach();
    let again = false;
    void link.whenAttached().then(() => { again = true; });
    await Promise.resolve(); await Promise.resolve();
    expect(again).toBe(false);
    link.attach(fake().control);
    await link.whenAttached();
    expect(again).toBe(true);
  });

  it("after close: a wait armed before it rejects not-mounted, and all callbacks stop", async () => {
    const link = new ViewerLink();
    const f = fake({ paced: true });
    const changes: ViewerChange[] = [];
    const zones: EventZoneChange[] = [];
    link.onChange((c) => changes.push(c));
    link.onEventZone((z) => zones.push(z));
    let later = false;
    const outcome = link.whenAttached().then(() => { later = true; return "resolved"; }, (error: unknown) => (error instanceof SceneError ? error.code : String(error)));
    link.close();
    expect(await outcome).toBe("not-mounted");
    expect(later).toBe(false);
    link.attach(f.control);
    link.publish(f.set({ timeUtcMs: START + 99, zones: ["e1"] }), "playback");
    expect(changes).toEqual([]);
    expect(zones).toEqual([]);
  });

  it("close after an attach detaches (reads undefined) and a closed link does not re-arm the wait", async () => {
    const link = new ViewerLink();
    link.attach(fake().control);
    link.close();
    expect(link.timeUtcMs).toBeUndefined();
    await link.whenAttached(); // still the resolved wait: close never arms a new one
  });
});

describe("ViewerLink zone dispatch (C-139 O3)", () => {
  it("calls the listeners that were set when a report began: one removed or added by a listener mid-report changes the next report only", () => {
    const link = new ViewerLink();
    const f = fake({ paced: true });
    link.attach(f.control);
    const heard: string[] = [];
    let stopB = (): void => {};
    link.onEventZone(() => { heard.push("A"); stopB(); link.onEventZone(() => heard.push("C")); });
    stopB = link.onEventZone(() => heard.push("B"));
    link.publish(f.set({ zones: ["e1"] }), "playback");
    expect(heard).toEqual(["A", "B"]); // B still hears the report it was removed during; C, added during it, does not
    heard.length = 0;
    link.publish(f.set({ zones: [] }), "playback");
    expect(heard).toEqual(["A", "C"]);
  });
});

describe("ViewerLink setters", () => {
  it("setTime validates the window, seeks, then reports once with cause host", () => {
    const link = new ViewerLink();
    const f = fake();
    link.attach(f.control);
    const seen: ViewerChange[] = [];
    link.onChange((c) => seen.push(c));
    expect(code(() => link.setTime(START - 1))).toMatch(/^bad-time: setTime: .* is outside the timeline \(2020-01-01T00:00:00\.000Z to 2020-01-02T00:00:00\.000Z\)$/);
    expect(code(() => link.setTime(END + 1))).toMatch(/^bad-time: /);
    expect(f.calls).toEqual([]);
    link.setTime(new Date(START + 500));
    expect(f.calls).toEqual([`seek ${START + 500}`]);
    expect(seen).toMatchObject([{ timeUtcMs: START + 500, rate: 1, playing: false, cause: "host" }]);
    link.setTime(START + 500); // same reading: no second report
    expect(seen.length).toBe(1);
  });

  it("setRate takes only offered speeds and sets the source chosen; auto needs pacing and returns it to the scene", () => {
    const plain = new ViewerLink();
    const f = fake();
    plain.attach(f.control);
    expect(code(() => plain.setRate(7))).toBe("bad-timeline: setRate: 7 is not one of the offered speeds (1, 60); offer it with setTimeline({ rates })");
    expect(code(() => plain.setRate("auto"))).toBe('bad-timeline: setRate: "auto" needs a scene with pacing; give setTimeline({ pacing })');
    expect(f.calls).toEqual([]);
    const seen: ViewerChange[] = [];
    plain.onChange((c) => seen.push(c));
    plain.setRate(60);
    expect(plain.rateSource).toBe("chosen");
    expect(seen).toMatchObject([{ timeUtcMs: START + 10, rate: 60, playing: false, cause: "host" }]);

    const paced = new ViewerLink();
    const p = fake({ paced: true });
    paced.attach(p.control);
    paced.setRate(60);
    expect(paced.rateSource).toBe("chosen");
    paced.setRate("auto");
    expect(paced.rateSource).toBe("scene");
    expect(p.calls).toEqual(["rate 60", "rate auto"]);
  });

  it("setView names the views in its error and reports with cause host", () => {
    const none = new ViewerLink();
    none.attach(fake().control);
    expect(code(() => none.setView("a"))).toBe("bad-view: setView: the scene has no views; name them with setViews");
    const link = new ViewerLink();
    const f = fake({ views: ["a", "b"] });
    link.attach(f.control);
    expect(code(() => link.setView("z"))).toBe('bad-view: setView: "z" is not one of the scene\'s views (a, b)');
    const seen: ViewerChange[] = [];
    link.onChange((c) => seen.push(c));
    link.setView("b");
    expect(f.calls).toEqual(["view b"]);
    expect(seen).toMatchObject([{ timeUtcMs: START + 10, rate: 1, playing: false, view: "b", cause: "host" }]);
    expect(link.view).toBe("b");
  });

  it("setCamera builds follow, focus and pose requests and rejects unknown ids and malformed targets with bad-camera", () => {
    const link = new ViewerLink();
    const f = fake();
    link.attach(f.control);
    link.setCamera({ follow: "earth" });
    link.setCamera({ focus: "moon" });
    link.setCamera({ focus: "earth", azimuthDeg: 10, elevationDeg: 20, distance: 5 });
    expect(f.calls).toEqual([
      'camera {"kind":"follow","target":"earth"}',
      'camera {"kind":"focus","target":"moon"}',
      `camera ${JSON.stringify({ kind: "pose", view: { focus: "earth", azimuthDeg: 10, elevationDeg: 20, distance: 5 } })}`,
    ]);
    expect(code(() => link.setCamera({ follow: "mars" }))).toBe('bad-camera: setCamera: "mars" is not an object the showing view shows (earth, moon)');
    const tail = "; give { follow: id }, { focus: id } or a pose from camera";
    expect(code(() => link.setCamera(null as never))).toBe(`bad-camera: setCamera: null is not an object${tail}`);
    expect(code(() => link.setCamera([] as never))).toBe(`bad-camera: setCamera: ${String([])} is not an object${tail}`);
    expect(code(() => link.setCamera({ follow: "earth", focus: "moon" } as never))).toBe(`bad-camera: setCamera: the target must be exactly one of follow or focus, naming a non-empty id${tail}`);
    expect(code(() => link.setCamera({ follow: "" }))).toMatch(/^bad-camera: setCamera: the target must be exactly one/);
    expect(code(() => link.setCamera({ focus: "earth", azimuthDeg: "x" } as never))).toMatch(/^bad-camera: setCamera: .*; give \{ follow: id \}/);
    expect(f.calls.length).toBe(3);
  });
});

describe("ViewerLink publishing", () => {
  it("reports change before zones, with zone leaves before enters, event type and object, and via view or time", () => {
    const link = new ViewerLink();
    const f = fake({ paced: true, views: ["a", "b"] });
    const order: string[] = [];
    const zones: EventZoneChange[] = [];
    link.onChange((c) => order.push(`change ${c.cause}`));
    link.onEventZone((z) => { order.push(`zone ${z.event} ${z.entered}`); zones.push(z); });
    link.attach(f.control);
    link.publish(f.set({ timeUtcMs: START + 20, zones: ["e1"] }), "playback");
    link.publish(f.set({ timeUtcMs: START + 30, zones: ["e2"] }), "visitor");
    link.publish(f.set({ view: "b", zones: [] }), "visitor");
    expect(order).toEqual(["change playback", "zone e1 true", "change visitor", "zone e1 false", "zone e2 true", "change visitor", "zone e2 false"]);
    expect(zones[0]).toEqual({ event: "e1", type: "flyby", object: "moon", entered: true, timeUtcMs: START + 20, cause: "playback", via: "time" });
    expect(zones[2]).toEqual({ event: "e2", entered: true, timeUtcMs: START + 30, cause: "visitor", via: "time" });
    expect(zones[3]).toMatchObject({ event: "e2", entered: false, via: "view", cause: "visitor" });
  });

  it("a zone already active when the viewer attaches is reported on the first publish; a re-attach starts over", () => {
    const link = new ViewerLink();
    const f = fake({ paced: true });
    f.set({ zones: ["e1"] });
    const zones: EventZoneChange[] = [];
    link.onEventZone((z) => zones.push(z));
    link.attach(f.control);
    link.publish(f.control.read(), "playback");
    expect(zones.map((z) => [z.event, z.entered])).toEqual([["e1", true]]);
    link.publish(f.control.read(), "playback");
    expect(zones.length).toBe(1);
    link.attach(f.control);
    link.publish(f.control.read(), "playback");
    expect(zones.length).toBe(2);
  });

  it("rate source follows state.auto when given, else a visitor rate change; playback leaves it", () => {
    const link = new ViewerLink();
    const f = fake({ paced: true });
    link.attach(f.control);
    link.publish(f.set({ auto: false, rate: 60 }), "visitor");
    expect(link.rateSource).toBe("chosen");
    link.publish(f.set({ auto: true, rate: 1 }), "playback");
    expect(link.rateSource).toBe("scene");
    const plain = new ViewerLink();
    const g = fake();
    plain.attach(g.control);
    plain.publish(g.set({ rate: 60 }), "playback");
    expect(plain.rateSource).toBe("scene");
    plain.publish(g.set({ rate: 1 }), "visitor");
    expect(plain.rateSource).toBe("chosen");
  });

  it("copies the listener sets: one added or removed during a report does not change that report; unsubscribe works", () => {
    const link = new ViewerLink();
    const f = fake({ paced: true });
    link.attach(f.control);
    const log: string[] = [];
    let stopB: () => void = () => undefined;
    link.onChange(() => { log.push("a"); stopB(); link.onChange(() => log.push("late")); });
    stopB = link.onChange(() => log.push("b"));
    link.publish(f.set({ timeUtcMs: START + 1 }), "playback");
    expect(log).toEqual(["a", "b"]);
    log.length = 0;
    link.publish(f.set({ timeUtcMs: START + 2 }), "playback");
    expect(log).toEqual(["a", "late"]);
    const zlog: string[] = [];
    const stopZ = link.onEventZone(() => zlog.push("z"));
    link.publish(f.set({ zones: ["e1"] }), "playback");
    stopZ();
    link.publish(f.set({ zones: [] }), "playback");
    expect(zlog).toEqual(["z"]);
  });
});

describe("ViewerLink selection (O-054 T-247)", () => {
  it("reads the opening selection without reporting it, reports a change and a drop (no object) once each, and ignores a publish before attach and after detach", () => {
    const link = new ViewerLink();
    const heard: Array<{ object?: string; timeUtcMs: number; cause: string }> = [];
    link.onSelect((c) => heard.push(c));
    const { control, set } = fake();
    link.publish(set({ selected: "moon" }), "visitor");
    expect(heard).toEqual([]); // not attached yet
    link.attach(control);
    expect(link.selected).toBe("moon");
    link.publish(set({ selected: "moon" }), "playback");
    expect(heard).toEqual([]);
    link.publish(set({ selected: "earth" }), "visitor");
    link.publish(set({ selected: undefined }), "playback");
    link.publish(set({ selected: undefined }), "playback");
    expect(heard).toEqual([{ object: "earth", timeUtcMs: START + 10, cause: "visitor" }, { timeUtcMs: START + 10, cause: "playback" }]);
    expect(link.selected).toBeUndefined();
    link.detach();
    link.publish(set({ selected: "moon" }), "visitor");
    expect(heard.length).toBe(2);
    link.attach(control); // back again: the new opening selection is read, not reported
    expect(link.selected).toBe("moon");
    link.publish(set({ selected: "moon" }), "playback");
    expect(heard.length).toBe(2);
  });
});

describe("ViewerLink camera (O-054 T-248)", () => {
  afterEach(() => { vi.useRealTimers(); });
  const pub = (link: ViewerLink, set: (n: Partial<ViewerState>) => ViewerState) => link.publish(set({}), "playback");
  it("reads the opening pose without reporting it, reports each field changed alone once, and reports nothing for an unchanged pose", () => {
    vi.useFakeTimers({ toFake: ["performance"] });
    const link = new ViewerLink();
    const heard: unknown[] = [];
    link.onCameraChange((p) => heard.push(p));
    const { control, set, move } = fake();
    pub(link, set); // before attach
    link.attach(control);
    pub(link, set);
    expect(heard).toEqual([]);
    for (const [i, change] of ([{ focus: "moon" }, { azimuthDeg: 9 }, { elevationDeg: 8 }, { distance: 7 }] as const).entries()) {
      vi.advanceTimersByTime(100);
      move(change);
      pub(link, set);
      pub(link, set); // unchanged since the report
      expect(heard.length, JSON.stringify(change)).toBe(i + 1);
    }
    expect(heard[3]).toEqual({ focus: "moon", azimuthDeg: 9, elevationDeg: 8, distance: 7 });
  });
  it("an easing pose reports at most once per 100 ms tick and stops when it settles", () => {
    vi.useFakeTimers({ toFake: ["performance"] });
    const link = new ViewerLink();
    const heard: Array<{ azimuthDeg: number }> = [];
    link.onCameraChange((p) => heard.push(p));
    const { control, set, move } = fake();
    link.attach(control);
    for (let az = 10; az <= 15; az += 1) { move({ azimuthDeg: az }); pub(link, set); vi.advanceTimersByTime(20); } // six changes in 120 ms: two reports
    expect(heard.map((p) => p.azimuthDeg)).toEqual([10, 14]);
    for (let i = 0; i < 5; i += 1) { vi.advanceTimersByTime(100); pub(link, set); } // the next tick reports where it settled (15), then nothing
    expect(heard.map((p) => p.azimuthDeg)).toEqual([10, 14, 15]);
  });
  it("hears nothing after detach or close, a stopped listener is not called, and a throwing listener spares the others", () => {
    vi.useFakeTimers({ toFake: ["performance"] });
    vi.stubGlobal("reportError", vi.fn());
    const link = new ViewerLink();
    const heard: number[] = [];
    link.onCameraChange(() => { throw new Error("boom"); });
    link.onCameraChange((p) => heard.push(p.azimuthDeg));
    const stop = link.onCameraChange(() => heard.push(-1));
    const { control, set, move } = fake();
    link.attach(control);
    stop();
    vi.advanceTimersByTime(100); move({ azimuthDeg: 5 }); pub(link, set);
    expect(heard).toEqual([5]);
    link.detach(); vi.advanceTimersByTime(100); move({ azimuthDeg: 6 }); pub(link, set);
    expect(heard).toEqual([5]);
    link.attach(control); // the new opening pose is read, not reported
    vi.advanceTimersByTime(100); pub(link, set);
    expect(heard).toEqual([5]);
    link.close(); vi.advanceTimersByTime(100); move({ azimuthDeg: 7 }); pub(link, set);
    expect(heard).toEqual([5]);
    vi.unstubAllGlobals();
  });
});
