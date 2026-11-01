// @vitest-environment happy-dom
// A host page reading and setting the viewer's one clock (O-047 T-197, I-099) and the speed menu showing exactly the speeds a scene gives (I-106).
// The 3D scene is replaced by a stub (no GPU here); the real viewer, its timeline and its clock run on a made-up definition.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
const prepared = vi.hoisted(() => ({ views: undefined as undefined | import("../src/app/views").ViewSettings }));
vi.mock("../src/api/prepared", async () => {
  const { syntheticDefinition } = await import("../src/synthetic/syntheticDefinition");
  return { prepareScene: () => ({ definition: prepared.views === undefined ? syntheticDefinition : { ...syntheticDefinition, views: prepared.views }, ready: Promise.resolve() }) };
});

import { AstraeusScene } from "../src/api/AstraeusScene";
import { SceneError } from "../src/api/errors";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import type { ViewerHandle } from "../src/api/viewerHandle";
import type { ViewerChange } from "../src/api/viewerLink";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { speedsOf } from "../src/shell/timelineModel";
import { $, byLabel, change, drawn, press } from "./domSetup";

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
afterEach(() => { prepared.views = undefined; if (root) act(() => root!.unmount()); root = undefined; host.remove(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const codeOf = (run: () => void): string | undefined => { try { run(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return undefined; };

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

describe("the rate source (ready for pacing)", () => {
  it("is the scene's until a visitor or the host chooses a speed, and the scene's again on a new attach", async () => {
    const { ViewerLink } = await import("../src/api/viewerLink");
    let state = { timeUtcMs: MID, rate: RATES[0], playing: false };
    const control = { window: { startUtcMs, endUtcMs }, events: [], rates: RATES, paced: false, read: () => state, seek: (t: number) => { state = { ...state, timeUtcMs: t }; }, setRate: (r: number) => { state = { ...state, rate: r }; }, views: [], setView: () => undefined, cameraTargets: () => [], readCamera: () => undefined, setCamera: () => undefined };
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
