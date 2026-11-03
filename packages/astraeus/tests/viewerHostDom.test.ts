// @vitest-environment happy-dom
// A host page reading and setting the viewer's one clock (O-047 T-197, I-099) and the speed menu showing exactly the speeds a scene gives (I-106).
// The 3D scene is replaced by a stub (no GPU here); the real viewer, its timeline and its clock run on a made-up definition.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
const prepared = vi.hoisted(() => ({ views: undefined as undefined | import("../src/app/views").ViewSettings, noTimeline: false, markerUntil: undefined as undefined | number }));
vi.mock("../src/api/prepared", async () => {
  const { syntheticDefinition } = await import("../src/synthetic/syntheticDefinition");
  return { prepareScene: () => {
    const base = prepared.noTimeline ? { ...syntheticDefinition, experience: { ...syntheticDefinition.experience, hideTimeline: true } } : syntheticDefinition;
    const withViews = prepared.views === undefined ? base : { ...base, views: prepared.views };
    // A path whose samples end before the timeline does: its marker is unavailable after `markerUntil`.
    const until = prepared.markerUntil;
    const definition = until === undefined ? withViews : { ...withViews, experience: { ...withViews.experience, objects: withViews.experience.objects.map((o) => o.id === "survey-marker" ? { ...o, availability: { startUtcMs: o.availability?.startUtcMs ?? 0, endUtcMs: until } } : o) } };
    return { definition, ready: Promise.resolve() }; } };
});

import { AstraeusScene } from "../src/api/AstraeusScene";
import { SceneError } from "../src/api/errors";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import type { ViewerHandle } from "../src/api/viewerHandle";
import type { ViewerChange } from "../src/api/viewerLink";
import type { SelectionChange } from "../src/api/viewerSelection";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { speedsOf } from "../src/shell/timelineModel";
import { $, byLabel, change, drawn, press } from "./domSetup";
import { FAKE_PRESENTATION, FAKE_PRESENTATION_CONTROL } from "./helpers/viewerPresentation";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { startUtcMs, endUtcMs } = syntheticDefinition.experience.window;
const MID = startUtcMs + Math.floor((endUtcMs - startUtcMs) / 2);
const RATES = syntheticDefinition.experience.rates;
let host: HTMLElement;
let root: Root | undefined;
beforeEach(() => {
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  // The clock reads performance.now and the viewer ticks on setInterval; both are driven by hand so times are exact.
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => { prepared.views = undefined; prepared.noTimeline = false; prepared.markerUntil = undefined; if (root) act(() => root!.unmount()); root = undefined; host.remove(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const codeOf = (run: () => void): string | undefined => { try { run(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return undefined; };

describe("presentation through the host (O-056 T-262)", () => {
  it("a visitor's scale choice is read back by handle.scale and heard once with cause visitor; the host's own is heard with cause host", async () => {
    const heard: Array<{ scale: string; cause: string }> = [];
    const handle = mount(host, new Scene(), { onChange: (c: ViewerChange) => heard.push({ scale: c.scale, cause: c.cause }) });
    await drawn(handle);
    const before = handle.scale;
    press($(host, ".scale-toggle"));
    expect(handle.scale).not.toBe(before);
    expect(heard.filter((c) => c.cause === "visitor").map((c) => c.scale)).toEqual([handle.scale]);
    act(() => handle.setScale(before!));
    expect(handle.scale).toBe(before);
    expect(heard.at(-1)).toEqual({ scale: before, cause: "host" });
    expect(heard.filter((c) => c.cause === "visitor")).toHaveLength(1);
    handle.unmount();
  });

  it("a live setLook replaces the whole look, and wins over the same look in the page address", async () => {
    window.history.replaceState(null, "", "/?stars=0.5");
    try {
      const handle = mount(host, new Scene(), { address: true });
      await drawn(handle);
      expect(handle.look?.starBrightness).toBe(0.5);
      act(() => handle.setLook({ markerSwapRadiusPx: 7 }));
      expect(handle.look).toMatchObject({ starBrightness: 1, markerSwapRadiusPx: 7 });
      handle.unmount();
    } finally {
      window.history.replaceState(null, "", "/");
    }
  });
});

describe("the mount handle", () => {
  it("reads nothing and refuses to set before the viewer is drawn", () => {
    const handle = mount(host, new Scene());
    expect(handle.time).toBeUndefined();
    expect(handle.rate).toBeUndefined();
    expect(codeOf(() => handle.setTime(MID))).toBe("not-mounted");
    handle.unmount();
  });

  it("reads the time and speed, and moves the viewer when set", async () => {
    const handle = mount(host, new Scene());
    await drawn(handle);
    expect(handle.rate).toBe(syntheticDefinition.clock.rate);
    act(() => handle.setTime(new Date(MID)));
    expect(handle.time).toBe(MID);
    act(() => handle.setRate(RATES[0]));
    expect(handle.rate).toBe(RATES[0]);
    handle.unmount();
    expect(handle.time).toBeUndefined();
  });

  it("refuses a time outside the timeline (bad-time) and a speed it does not offer (bad-timeline)", async () => {
    const handle = mount(host, new Scene());
    await drawn(handle);
    const before = handle.time;
    expect(codeOf(() => handle.setTime(endUtcMs + 1))).toBe("bad-time");
    expect(codeOf(() => handle.setTime(startUtcMs - 1))).toBe("bad-time");
    expect(codeOf(() => handle.setTime("not a date"))).toBe("bad-time");
    expect(codeOf(() => handle.setRate(7))).toBe("bad-timeline");
    expect(codeOf(() => handle.setRate("auto"))).toBe("bad-timeline"); // this scene has no pacing
    expect(handle.time).toBe(before);
    handle.unmount();
  });

  it("calls back on a host set, on a visitor's seek and speed change, and on playback; nothing after unmount", async () => {
    const seen: ViewerChange[] = [];
    const handle = mount(host, new Scene(), { onChange: (c) => seen.push(c) });
    const later: ViewerChange[] = [];
    handle.onChange((c) => later.push(c));
    await drawn(handle);

    act(() => handle.setTime(MID));
    expect(seen.at(-1)).toMatchObject({ time: MID, cause: "host" });

    const speed = byLabel(host, "Playback speed") as HTMLSelectElement;
    act(() => change(speed, String(RATES[2])));
    expect(seen.at(-1)).toMatchObject({ rate: RATES[2], cause: "visitor" });

    const before = seen.length;
    act(() => press($(host, ".timeline-play")));
    expect(seen.length).toBeGreaterThan(before);
    expect(seen.at(-1)).toMatchObject({ playing: true, cause: "visitor" });
    act(() => { vi.advanceTimersByTime(500); });
    expect(seen.at(-1)).toMatchObject({ cause: "playback" });
    expect(seen.at(-1)!.time).toBeGreaterThan(MID);

    const scrub = byLabel(host, "Seek timeline") as HTMLInputElement;
    act(() => change(scrub, scrub.max));
    expect(seen.at(-1)).toMatchObject({ cause: "visitor" });
    expect(seen.at(-1)!.time).toBeGreaterThan(MID);
    expect(handle.time).toBe(seen.at(-1)!.time);

    handle.unmount();
    const count = seen.length;
    vi.advanceTimersByTime(1000);
    expect(seen.length).toBe(count);
    expect(later.length).toBe(count);
  });

});

describe("AstraeusScene", () => {
  it("applies the time and rate props once drawn, reports changes, and sends a bad time to onError", async () => {
    const seen: ViewerChange[] = [];
    const errors: Error[] = [];
    const scene = new Scene();
    root = createRoot(host);
    const draw = (time: Date | number) => act(async () => { root!.render(createElement(AstraeusScene, { scene, time, rate: RATES[1], onChange: (c) => seen.push(c), onError: (e) => errors.push(e) })); });
    await draw(new Date(MID));
    await act(async () => { await Promise.resolve(); });
    expect(seen.some((c) => c.time === MID && c.rate === RATES[1])).toBe(true);
    const count = seen.length;
    await draw(new Date(MID)); // a fresh Date for the same moment does not seek again
    expect(seen.length).toBe(count);
    await draw(endUtcMs + 5);
    expect(errors.map((e) => (e as SceneError).code)).toEqual(["bad-time"]);
  });
});

describe("AstraeusScene hands React apps the handle (O-054 T-242)", () => {
  const render = (props: Record<string, unknown>) => act(async () => { root!.render(createElement(AstraeusScene, props as never)); });

  it("a React app reads camera and time, sets camera and time and listens through the ref after onReady", async () => {
    const ref: { current: ViewerHandle | null } = { current: null };
    const ready: ViewerHandle[] = [];
    root = createRoot(host);
    await render({ scene: new Scene(), ref, onReady: (h: ViewerHandle) => ready.push(h) });
    await act(async () => { await Promise.resolve(); });
    expect(ready).toHaveLength(1);
    expect(ready[0]).toBe(ref.current);
    const handle = ref.current!;
    expect(handle.time).toBeDefined();
    const seen: ViewerChange[] = [];
    const stop = handle.onChange((c) => seen.push(c));
    act(() => handle.setTime(MID));
    expect(handle.time).toBe(MID);
    expect(seen.at(-1)).toMatchObject({ time: MID, cause: "host" });
    expect(codeOf(() => handle.setCamera({ focus: "no-such-object" }))).toBe("bad-camera");
    expect(handle.camera === undefined || typeof handle.camera === "object").toBe(true);
    stop();
  });

  it("before it is drawn the handle reads undefined and throws not-mounted; after a rebuild the same handle works again and onReady fires again with it; after unmount it is gone", async () => {
    const ref: { current: ViewerHandle | null } = { current: null };
    const ready: ViewerHandle[] = [];
    root = createRoot(host);
    const onReady = (h: ViewerHandle) => ready.push(h);
    await render({ scene: new Scene(), ref, onReady });
    const handle = ref.current!;
    expect(handle).not.toBeNull();
    await act(async () => { await Promise.resolve(); });
    expect(ready).toEqual([handle]);
    expect(handle.time).toBeDefined();
    await render({ scene: new Scene(), ref, onReady }); // a rebuild
    await act(async () => { await Promise.resolve(); });
    expect(ready).toHaveLength(2);
    expect(ready[1]).toBe(handle);
    expect(ref.current).toBe(handle);
    act(() => handle.setTime(MID));
    expect(handle.time).toBe(MID);
    act(() => root!.unmount());
    root = undefined;
    expect(handle.time).toBeUndefined();
    expect(codeOf(() => handle.setTime(MID))).toBe("not-mounted");
  });

  it("is not-mounted before the first draw", () => {
    const ref: { current: ViewerHandle | null } = { current: null };
    root = createRoot(host);
    act(() => { root!.render(createElement(AstraeusScene, { scene: new Scene(), ref })); });
    expect(ref.current!.time).toBeUndefined();
    expect(codeOf(() => ref.current!.setTime(MID))).toBe("not-mounted");
  });

  it("the camera prop re-applies on a changed value but not when the same pose comes with its keys in another order", async () => {
    const errors: Error[] = [];
    const scene = new Scene();
    root = createRoot(host);
    const pose = { focus: "nope", azimuthDeg: 10, elevationDeg: 20, distance: 5 };
    const draw = (camera: unknown) => render({ scene, camera, onError: (e: Error) => errors.push(e) });
    await draw(pose);
    await act(async () => { await Promise.resolve(); });
    expect(errors).toHaveLength(1); // each application of a bad pose reports once
    await draw({ distance: 5, elevationDeg: 20, azimuthDeg: 10, focus: "nope" });
    expect(errors).toHaveLength(1);
    await draw({ ...pose, distance: 6 });
    expect(errors).toHaveLength(2);
  });
});

describe("the speed menu (I-106)", () => {
  it("offers exactly the speeds the scene gives, and no default is added", () => {
    expect(speedsOf([86_400, 604_800, 2_592_000, 86_400]).map((s) => s.rate)).toEqual([86_400, 604_800, 2_592_000]);
  });
  it("draws only those speeds in the menu", async () => {
    const handle = mount(host, new Scene());
    await drawn(handle);
    const options = [...(byLabel(host, "Playback speed") as HTMLSelectElement).options].map((o) => Number(o.value));
    expect(options).toEqual([...RATES].sort((a, b) => a - b));
    handle.unmount();
  });
});

describe("playing through the host (O-054 T-246)", () => {
  const playButton = () => $(host, ".timeline-play");
  it("setPlaying and the visitor's play button stay in step, and onChange names who did it", async () => {
    const seen: ViewerChange[] = [];
    const handle = mount(host, new Scene(), { onChange: (c) => seen.push(c) });
    await drawn(handle);
    expect(handle.playing).toBe(true); // the synthetic scene opens playing
    act(() => handle.setPlaying(false));
    expect(handle.playing).toBe(false);
    expect(seen.at(-1)).toMatchObject({ playing: false, cause: "host" });
    expect(playButton().getAttribute("aria-label")).toBe("Play playback");
    act(() => press(playButton()));
    expect(handle.playing).toBe(true);
    expect(seen.at(-1)).toMatchObject({ playing: true, cause: "visitor" });
    expect(playButton().getAttribute("aria-label")).toBe("Pause playback");
    act(() => handle.setPlaying(true));
    expect(handle.playing).toBe(true);
    act(() => handle.setPlaying(false));
    act(() => press(playButton()));
    expect(handle.playing).toBe(true);
    handle.unmount();
  });
  it("refuses a non-boolean, before ready and after unmount; leaves time and rate alone; remounting reads again", async () => {
    const handle = mount(host, new Scene());
    expect(handle.playing).toBeUndefined();
    expect(codeOf(() => handle.setPlaying(true))).toBe("not-mounted");
    await drawn(handle);
    const { time, rate } = handle;
    expect(codeOf(() => handle.setPlaying(1 as unknown as boolean))).toBe("bad-timeline");
    act(() => handle.setPlaying(false));
    expect([handle.time, handle.rate]).toEqual([time, rate]);
    handle.unmount();
    expect(handle.playing).toBeUndefined();
    expect(codeOf(() => handle.setPlaying(false))).toBe("not-mounted");
    const again = mount(host, new Scene());
    await drawn(again);
    expect(again.playing).toBe(true);
    again.unmount();
  });
  it("a scene without a timeline has no play control, so setPlaying throws bad-timeline", async () => {
    prepared.noTimeline = true;
    const handle = mount(host, new Scene());
    await drawn(handle);
    expect(host.querySelector(".timeline-play")).toBeNull(); // the timeline bar is not drawn
    expect(codeOf(() => handle.setPlaying(true))).toBe("bad-timeline");
    handle.unmount();
  });
});

describe("the rate source (ready for pacing)", () => {
  it("is the scene's until a visitor or the host chooses a speed, and the scene's again on a new attach", async () => {
    const { ViewerLink } = await import("../src/api/viewerLink");
    let state = { timeUtcMs: MID, rate: RATES[0], playing: false, ...FAKE_PRESENTATION };
    const control = { window: { startUtcMs, endUtcMs }, events: [], rates: RATES, paced: false, playable: true, setPlaying: () => undefined, read: () => state, seek: (t: number) => { state = { ...state, timeUtcMs: t }; }, setRate: (r: number) => { state = { ...state, rate: r }; }, views: [], setView: () => undefined, cameraTargets: () => [], readCamera: () => undefined, setCamera: () => undefined, ...FAKE_PRESENTATION_CONTROL };
    const link = new ViewerLink();
    link.attach(control);
    expect(link.rateSource).toBe("scene");
    link.publish({ ...state, timeUtcMs: MID + 1 }, "playback");
    expect(link.rateSource).toBe("scene");
    link.publish({ ...state, rate: RATES[1] }, "visitor");
    expect(link.rateSource).toBe("chosen");
    link.attach(control);
    expect(link.rateSource).toBe("scene");
    link.setRate(RATES[2]);
    expect(link.rateSource).toBe("chosen");
  });
});

describe("views through the host (O-051 T-220)", () => {
  const view = (id: string) => ({ id, label: id.toUpperCase(), camera: { rule: "stay" } as const, objects: new Set<string>(), events: new Set<string>(), panels: new Set<string>() });
  const withViews = () => { prepared.views = { place: "top-bar", start: "a", views: [view("a"), view("b")] }; };
  const viewButton = (id: string) => $(host, `[data-view-id="${id}"]`);

  it("a scene without views: view is undefined, setView throws bad-view, onChange payloads carry no view", async () => {
    const seen: ViewerChange[] = [];
    const handle = mount(host, new Scene(), { onChange: (c) => seen.push(c) });
    expect(handle.view).toBeUndefined();
    expect(codeOf(() => handle.setView("a"))).toBe("not-mounted"); // not drawn yet
    await drawn(handle);
    expect(handle.view).toBeUndefined();
    expect(codeOf(() => handle.setView("a"))).toBe("bad-view");
    act(() => handle.setTime(MID));
    expect("view" in seen.at(-1)!).toBe(false);
    handle.unmount();
  });

  it("reads the opening view, switches it, names an unknown id, and refuses before ready and after unmount", async () => {
    withViews();
    const handle = mount(host, new Scene());
    expect(handle.view).toBeUndefined();
    expect(codeOf(() => handle.setView("b"))).toBe("not-mounted");
    await drawn(handle);
    expect(handle.view).toBe("a");
    act(() => handle.setView("b"));
    expect(handle.view).toBe("b");
    expect(viewButton("b").getAttribute("aria-pressed")).toBe("true");
    expect(codeOf(() => handle.setView("zzz"))).toBe("bad-view");
    expect(handle.view).toBe("b");
    handle.unmount();
    expect(handle.view).toBeUndefined();
    expect(codeOf(() => handle.setView("a"))).toBe("not-mounted");
  });

  it("publishes the view: cause host for setView, visitor for the view choice, and the time and speed stay as they were", async () => {
    withViews();
    const seen: ViewerChange[] = [];
    const handle = mount(host, new Scene(), { onChange: (c) => seen.push(c) });
    await drawn(handle);
    const before = { time: handle.time, rate: handle.rate };
    act(() => handle.setView("b"));
    expect(seen.at(-1)).toMatchObject({ view: "b", cause: "host" });
    act(() => press(viewButton("a")));
    expect(seen.at(-1)).toMatchObject({ view: "a", cause: "visitor" });
    expect({ time: handle.time, rate: handle.rate }).toEqual(before);
    const count = seen.length;
    act(() => handle.setView("a")); // already showing: nothing to tell
    expect(seen.length).toBe(count);
    handle.unmount();
  });

  it("AstraeusScene applies the view prop once drawn and when it changes, and sends an unknown id to onError", async () => {
    withViews();
    const seen: ViewerChange[] = [];
    const errors: Error[] = [];
    const scene = new Scene();
    root = createRoot(host);
    const draw = (viewId: string) => act(async () => { root!.render(createElement(AstraeusScene, { scene, view: viewId, onChange: (c) => seen.push(c), onError: (e) => errors.push(e) })); });
    await draw("b");
    await act(async () => { await Promise.resolve(); });
    expect(seen.at(-1)).toMatchObject({ view: "b", cause: "host" });
    await draw("a");
    expect(seen.at(-1)).toMatchObject({ view: "a", cause: "host" });
    await draw("zzz");
    expect(errors.map((e) => (e as SceneError).code)).toEqual(["bad-view"]);
  });

  describe("AstraeusScene applies each prop only when that prop changes (I-129)", () => {
    const setup = async () => {
      withViews();
      const seen: ViewerChange[] = [];
      root = createRoot(host);
      const scene = new Scene();
      const props = { time: MID, rate: RATES[0], view: "a" } as { time: number; rate: number; view: string };
      const draw = (next: Partial<typeof props>) => act(async () => { Object.assign(props, next); root!.render(createElement(AstraeusScene, { scene, ...props, onChange: (c) => seen.push(c) })); });
      await draw({});
      await act(async () => { await Promise.resolve(); });
      return { seen, draw };
    };

    it("view only: a visitor's speed and the clock are left alone", async () => {
      const { seen, draw } = await setup();
      act(() => change(byLabel(host, "Playback speed") as HTMLSelectElement, String(RATES[2])));
      const before = seen.at(-1)!;
      expect(before).toMatchObject({ rate: RATES[2], cause: "visitor" });
      await draw({ view: "b" });
      expect(seen.at(-1)).toMatchObject({ view: "b", cause: "host", rate: RATES[2], time: before.time });
    });

    it("time only: a visitor's view is kept", async () => {
      const { seen, draw } = await setup();
      act(() => press(viewButton("b")));
      expect(seen.at(-1)).toMatchObject({ view: "b", cause: "visitor" });
      await draw({ time: MID + 1000 });
      expect(seen.at(-1)!.time).toBe(MID + 1000);
      expect(seen.at(-1)!.view).toBe("b");
      expect(viewButton("b").getAttribute("aria-pressed")).toBe("true");
    });

    it("rate only: the time and the view are left alone", async () => {
      const { seen, draw } = await setup();
      act(() => press(viewButton("b")));
      const before = seen.at(-1)!;
      await draw({ rate: RATES[1] });
      expect(seen.at(-1)).toMatchObject({ rate: RATES[1], view: "b", time: before.time });
      expect(viewButton("b").getAttribute("aria-pressed")).toBe("true");
    });
  });
});

describe("the selected object through the host (O-054 T-247)", () => {
  const view = (id: string, objects: string[]) => ({ id, label: id.toUpperCase(), camera: { rule: "stay" } as const, objects: new Set(objects), events: new Set<string>(), panels: new Set<string>() });
  const ALL = ["earth", "moon", "survey-marker"];
  const withViews = () => { prepared.views = { place: "top-bar", start: "a", views: [view("a", ALL), view("b", ["earth"])] }; };
  const pick = (id: string) => change(byLabel(host, "Select object") as HTMLSelectElement, id);

  it("reads the opening selection without reporting it, and reads undefined before ready and after unmount", async () => {
    const heard: SelectionChange[] = [];
    const handle = mount(host, new Scene());
    handle.onSelect((c) => heard.push(c));
    expect(handle.selected).toBeUndefined();
    await drawn(handle);
    expect(handle.selected).toBe("earth");
    act(() => { vi.advanceTimersByTime(500); });
    expect(heard).toEqual([]);
    handle.unmount();
    expect(handle.selected).toBeUndefined();
  });

  it("a visitor picks an object and the host hears it once, at once, with cause visitor", async () => {
    const heard: SelectionChange[] = [];
    const handle = mount(host, new Scene());
    handle.onSelect((c) => heard.push(c));
    await drawn(handle);
    pick("moon");
    expect(handle.selected).toBe("moon");
    expect(heard).toEqual([{ object: "moon", timeUtcMs: handle.time, cause: "visitor" }]);
    act(() => { vi.advanceTimersByTime(500); }); // the tick finds nothing new
    expect(heard.length).toBe(1);
    handle.unmount();
  });

  it("no report when nothing changed: the same object chosen again, and time passing", async () => {
    const heard: SelectionChange[] = [];
    const handle = mount(host, new Scene());
    handle.onSelect((c) => heard.push(c));
    await drawn(handle);
    pick("moon");
    pick("moon");
    act(() => handle.setTime(MID));
    act(() => { vi.advanceTimersByTime(500); });
    expect(heard.map((c) => c.object)).toEqual(["moon"]);
    handle.unmount();
  });

  it("a view switch that hides the selected object reports the drop (to the object that takes its place)", async () => {
    withViews();
    const heard: SelectionChange[] = [];
    const handle = mount(host, new Scene());
    handle.onSelect((c) => heard.push(c));
    await drawn(handle);
    pick("moon");
    act(() => handle.setView("b"));
    expect(handle.selected).toBe("earth");
    expect(heard.map((c) => c.object)).toEqual(["moon", "earth"]);
    expect(heard.map((c) => c.cause)).toEqual(["visitor", "host"]); // the host's own setView, not a visitor
    pick("moon");
    act(() => press($(host, '[data-view-id="a"]'))); // back to a view that shows it (no drop)
    pick("moon");
    act(() => press($(host, '[data-view-id="b"]'))); // a visitor's view choice drops it again
    expect(heard.at(-1)).toMatchObject({ object: "earth", cause: "visitor" });
    handle.unmount();
  });

  describe("a drop caused by time takes the cause of whatever moved the clock (I-137)", () => {
    const END = startUtcMs + 10 * 60_000;
    const setup = async () => {
      prepared.markerUntil = END;
      const heard: SelectionChange[] = [];
      const handle = mount(host, new Scene());
      handle.onSelect((c) => heard.push(c));
      await drawn(handle);
      act(() => { handle.setPlaying(false); handle.setTime(END - 60_000); });
      pick("survey-marker");
      return { heard, handle };
    };

    it("a host setTime past the path's end reports host", async () => {
      const { heard, handle } = await setup();
      act(() => handle.setTime(MID));
      expect(heard.map((c) => [c.object, c.cause])).toEqual([["survey-marker", "visitor"], ["earth", "host"]]);
      expect(heard.at(-1)?.timeUtcMs).toBe(MID);
      act(() => { vi.advanceTimersByTime(500); });
      expect(heard.length).toBe(2);
      handle.unmount();
    });

    it("the clock running past the path's end reports playback", async () => {
      const { heard, handle } = await setup();
      act(() => handle.setPlaying(true));
      expect(heard.length).toBe(1);
      for (let i = 0; i < 100 && heard.length < 2; i++) act(() => { vi.advanceTimersByTime(100); });
      expect(heard.map((c) => [c.object, c.cause])).toEqual([["survey-marker", "visitor"], ["earth", "playback"]]);
      handle.unmount();
    });

    it("a visitor's timeline seek past the path's end reports visitor, also after a host move", async () => {
      const { heard, handle } = await setup();
      act(() => handle.setTime(END - 30_000)); // a host move first: the selection survives it
      expect(heard.length).toBe(1);
      const scrub = byLabel(host, "Seek timeline") as HTMLInputElement;
      act(() => change(scrub, scrub.max));
      expect(heard.map((c) => [c.object, c.cause])).toEqual([["survey-marker", "visitor"], ["earth", "visitor"]]);
      handle.unmount();
    });
  });

  it("the stop function ends delivery, and nothing arrives after unmount", async () => {
    const heard: SelectionChange[] = [];
    const kept: SelectionChange[] = [];
    const handle = mount(host, new Scene());
    const stop = handle.onSelect((c) => heard.push(c));
    handle.onSelect((c) => kept.push(c));
    await drawn(handle);
    stop();
    pick("moon");
    expect(heard).toEqual([]);
    expect(kept.length).toBe(1);
    handle.unmount();
    expect(() => pick("earth")).toThrow(); // the viewer is gone: nothing to pick in
    expect(kept.length).toBe(1);
  });
});
