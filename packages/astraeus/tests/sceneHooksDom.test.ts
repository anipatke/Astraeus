// @vitest-environment happy-dom
// The scene's React hooks (sceneHooks.ts, sceneContentsHooks.ts) run inside a small host component on the pretend page. The react-three-fiber
// frame hooks are replaced by recorders (there is no GPU here), so the tests read what each hook hands the scene, mounts on the page or calls.
import { createElement, act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Group, PerspectiveCamera } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const frame = vi.hoisted(() => ({ callbacks: [] as ((state: unknown, delta: number) => void)[], three: {} as Record<string, unknown> }));
vi.mock("@react-three/fiber", () => ({
  useFrame: (callback: (state: unknown, delta: number) => void) => { frame.callbacks.push(callback); },
  useThree: () => frame.three,
}));
const sky = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: sky.load }));
const runFrameSpy = vi.hoisted(() => vi.fn());
vi.mock("../src/app/sceneFrame", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/app/sceneFrame")>()), runFrame: runFrameSpy }));

import { catalogue } from "../src/assets/catalogue";
import type { SceneControls, SceneRuntime } from "../src/app/AstraeusScene";
import { createOrbitCameraState } from "../src/app/CameraController";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { createSceneResolver } from "../src/app/sceneLayout";
import { createFrameState } from "../src/app/sceneFrame";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { SimulationClock } from "../src/core/clock";
import { createSolarSystemScale } from "../src/core/scalePolicy";
import { bodyIdOf, refFor, useBodyRefs, useOverlayLayers, useSceneDerived, useSceneFrame, useScenePointer } from "../src/app/sceneContentsHooks";
import { useSceneViews, useSkyStars } from "../src/app/sceneHooks";
import { SkyView } from "../src/app/SkyView";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement;
let canvas: HTMLCanvasElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  canvas = document.createElement("canvas");
  host.appendChild(canvas);
  document.body.appendChild(host);
  root = createRoot(document.createElement("div"));
  frame.callbacks.length = 0;
  runFrameSpy.mockReset();
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); });

/** Runs `use` as a component's body on every render and hands back its latest result. */
function renderHook<T>(use: () => T): { readonly current: () => T; readonly rerender: () => void } {
  let result!: T;
  const Probe = () => { result = use(); return null; };
  const draw = () => act(() => root.render(createElement(Probe) as ReactElement));
  draw();
  return { current: () => result, rerender: draw };
}

const resolver = createSceneResolver(createOrbAstronomyAdapter(), catalogue);
const baseRuntime = (extra: Partial<SceneRuntime> = {}): SceneRuntime => ({
  clock: new SimulationClock(Date.UTC(2030, 0, 1)),
  resolver, bodies: ["earth", "moon"], sceneCenter: "earth", trackedBodies: [], groups: [], ...extra,
} as SceneRuntime);
const policy = createSolarSystemScale({ exaggeration: {}, defaultExaggeration: 1 });

describe("bodyIdOf and refFor", () => {
  it("names the Sun body for the Sun's shell item, passes catalogued ids and answers null for anything else", () => {
    const runtime = { sun: { object: { id: "sun-item" } } };
    expect(bodyIdOf(runtime, catalogue, "sun-item")).toBe(catalogue.get("sun").definition.id);
    expect(bodyIdOf(runtime, catalogue, "moon")).toBe("moon");
    expect(bodyIdOf({}, catalogue, "sun-item")).toBeNull();
  });
  it("keeps the map pointing at the mounted node and forgets it on unmount", () => {
    const map = new Map<string, Group>();
    const node = new Group();
    refFor(map, "earth")(node);
    expect(map.get("earth")).toBe(node);
    refFor(map, "earth")(null);
    expect(map.has("earth")).toBe(false);
  });
});

describe("useBodyRefs", () => {
  it("gives one stable parts callback per body that records the parts in the shared map, and the same maps on every render", () => {
    const runtime = baseRuntime();
    const hook = renderHook(() => useBodyRefs(runtime));
    const first = hook.current();
    expect([...first.partsFor.keys()]).toEqual(["earth", "moon"]);
    const parts = { sphere: new Group(), marker: new Group() };
    first.partsFor.get("moon")!(parts);
    expect(first.bodyRefs.parts.get("moon")).toBe(parts);
    hook.rerender();
    expect(hook.current().partsFor.get("moon")).toBe(first.partsFor.get("moon"));
    expect(hook.current().bodyRefs.parts).toBe(first.bodyRefs.parts);
    first.partsFor.get("moon")!(null);
    expect(first.bodyRefs.parts.has("moon")).toBe(false);
  });
});

describe("useSceneDerived", () => {
  it("works out the readout pair with its labels, one asset per body with the overrides applied, and the body-set families", () => {
    const overrides = new Map([["moon", { material: { color: "#123456" } }]]);
    const layer = { id: "set", bodyFamilies: { io: "gal" } };
    const runtime = baseRuntime({ overrides, bodySets: [layer] } as unknown as Partial<SceneRuntime>);
    const { placement, readoutPair, pairLabels, assets, bodyFamilies } = renderHook(() => useSceneDerived(runtime, catalogue)).current();
    expect(placement).toEqual({ resolver, center: "earth" });
    expect(readoutPair).toEqual({ parent: "earth", child: "moon" });
    expect(pairLabels).toEqual({ parent: catalogue.get("earth").definition.label, child: catalogue.get("moon").definition.label });
    expect(assets.map((a) => a.definition.id)).toEqual(["earth", "moon"]);
    expect(assets[1]!.visual.material.color).toBe("#123456");
    expect(assets[0]).toBe(catalogue.get("earth"));
    expect(bodyFamilies).toEqual([{ layer, body: "io", family: "gal" }]);
  });
  it("has no pair labels when the scene mounts no satellite with its planet", () => {
    const derived = renderHook(() => useSceneDerived(baseRuntime({ bodies: ["earth"] }), catalogue)).current();
    expect(derived.readoutPair).toBeNull();
    expect(derived.pairLabels).toBeUndefined();
    expect(derived.bodyFamilies).toEqual([]);
  });
});

describe("useSceneViews and useSkyStars", () => {
  const gl = { getPixelRatio: () => 2, capabilities: { getMaxAnisotropy: () => 8 } } as never;
  const skyRuntime = (visible: boolean) => baseRuntime({ sky: { visible, starBrightness: 1.2, milkyWayBrightness: 0.7, milkyWay: false } } as unknown as Partial<SceneRuntime>);

  it("builds a view per declared thing once and keeps them across renders, with no sky view for a hidden sky", () => {
    const runtime = skyRuntime(false);
    const hook = renderHook(() => useSceneViews(runtime, gl));
    const views = hook.current();
    expect(views.skyView).toBeNull();
    expect(views.trackedViews).toEqual([]);
    expect(views.bodySetViews).toEqual([]);
    hook.rerender();
    expect(hook.current().trackedViews).toBe(views.trackedViews);
  });

  it("builds the sky from the runtime's settings, then loads the stars into it, marks the canvas and clears everything on unmount", async () => {
    sky.load.mockResolvedValue({ stars: [[10, 20, 3, 0.5], [30, -40, 5, null]] });
    const runtime = skyRuntime(true);
    const hook = renderHook(() => { const views = useSceneViews(runtime, gl); useSkyStars(canvas, views.skyView); return views; });
    const skyView = hook.current().skyView!;
    expect(skyView).toBeInstanceOf(SkyView);
    expect(canvas.dataset.skyStars).toBe("0");
    await act(async () => { await Promise.resolve(); });
    expect(skyView.starCount).toBe(2);
    expect(canvas.dataset.skyStars).toBe("2");
    canvas.dataset.skyPicture = "x";
    act(() => root.render(null));
    expect(canvas.dataset.skyStars).toBeUndefined();
    expect(canvas.dataset.skyPicture).toBeUndefined();
    expect(skyView.starCount).toBe(0); // disposed
  });

  it("draws the Milky Way alone when the star file is missing, and ignores stars that arrive after unmount", async () => {
    sky.load.mockResolvedValueOnce(null);
    const missing = renderHook(() => { const views = useSceneViews(skyRuntime(true), gl); useSkyStars(canvas, views.skyView); return views; });
    await act(async () => { await Promise.resolve(); });
    expect(missing.current().skyView!.starCount).toBe(0);
    expect(canvas.dataset.skyStars).toBe("0");
    act(() => root.unmount());
    root = createRoot(document.createElement("div"));

    let release!: (value: unknown) => void;
    sky.load.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const late = new SkyView({ starBrightness: 1, milkyWayBrightness: 1, pixelRatio: 1, picture: null });
    renderHook(() => { useSkyStars(canvas, late); return null; });
    act(() => root.render(null));
    await act(async () => { release({ stars: [[1, 2, 3, 0]] }); await Promise.resolve(); });
    expect(late.starCount).toBe(0);
    expect(canvas.dataset.skyStars).toBeUndefined();
  });

  it("does nothing for the stars without a sky view", () => {
    sky.load.mockClear();
    renderHook(() => { useSkyStars(canvas, null); return null; });
    expect(sky.load).not.toHaveBeenCalled();
    expect(canvas.dataset.skyStars).toBeUndefined();
  });
});

describe("useOverlayLayers", () => {
  const controls = (extra: Partial<SceneControls> = {}) => ({ labelObjects: [{ id: "earth", label: "Earth" }], ...extra }) as unknown as SceneControls;

  it("mounts the name layer next to the canvas, adds story and feature markers only when there are some, and removes them all on unmount", () => {
    const only = renderHook(() => useOverlayLayers(canvas, controls(), [], []));
    expect(host.querySelector(".scene-labels")).not.toBeNull();
    expect(host.querySelector(".story-markers")).toBeNull();
    expect(host.querySelector(".feature-markers")).toBeNull();
    expect(only.current().storyMarkers.current).toBeNull();
    act(() => root.render(null));
    expect(host.children).toHaveLength(1); // only the canvas is left
    root = createRoot(document.createElement("div"));

    const onStory = vi.fn();
    const onFeature = vi.fn();
    const full = controls({
      storyMarkers: [{ panelId: "p1", objectId: "earth", title: "Panel one", timeUtcMs: 0 }],
      featureMarkers: [{ key: "io:a", bodyId: "io", name: "A", color: "#fff", latitude: 0, longitude: 0 }],
      onStoryMarker: onStory, onFeatureMarker: onFeature,
    });
    const layers = renderHook(() => useOverlayLayers(canvas, full, [], [])).current();
    expect(layers.storyMarkers.current).not.toBeNull();
    expect(layers.featureMarkers.current).not.toBeNull();
    host.querySelector<HTMLButtonElement>('[data-feature-key="io:a"]')!.click();
    expect(onFeature).toHaveBeenCalledExactlyOnceWith("io:a");
    host.querySelector<HTMLButtonElement>(".story-marker")!.click();
    expect(onStory).toHaveBeenCalledExactlyOnceWith("p1");
    act(() => root.render(null));
    expect(host.querySelector(".feature-markers")).toBeNull();
    expect(layers.featureMarkers.current).toBeNull();
    expect(layers.storyMarkers.current).toBeNull();
  });
});

describe("useScenePointer", () => {
  function pointerEvent(type: string, x: number, y: number): void {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, { clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", button: 0, buttons: 0 });
    canvas.dispatchEvent(event);
  }
  beforeEach(() => {
    Object.assign(canvas, { setPointerCapture: vi.fn() });
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
  });

  it("reports the body under a tap to the scene's pick handler, and stops listening on unmount", () => {
    const onPickObject = vi.fn();
    const state = { current: { ...createFrameState("solar-system"), pickables: [{ id: "moon", x: 100, y: 100, radiusPx: 10 }] } };
    const orbit = { current: createOrbitCameraState(16, "earth") };
    renderHook(() => useScenePointer(canvas, baseRuntime({ cameraReach: {} } as Partial<SceneRuntime>), { policy, onPickObject } as unknown as SceneControls, catalogue, orbit, state));
    pointerEvent("pointerdown", 100, 100);
    pointerEvent("pointerup", 100, 100);
    expect(onPickObject).toHaveBeenCalledExactlyOnceWith("moon");
    pointerEvent("pointermove", 20, 30);
    expect(state.current.hoverPoint).toEqual({ x: 20, y: 30 });
    act(() => root.render(null));
    pointerEvent("pointerdown", 100, 100);
    pointerEvent("pointerup", 100, 100);
    expect(onPickObject).toHaveBeenCalledTimes(1);
  });

  it("limits a wheel zoom to the focused body's range read from the live frame state", () => {
    const orbit = { current: createOrbitCameraState(16, "earth") };
    const state = { current: createFrameState("solar-system") };
    renderHook(() => useScenePointer(canvas, baseRuntime({ cameraReach: { maxFocusDistance: 20 } } as Partial<SceneRuntime>), { policy } as unknown as SceneControls, catalogue, orbit, state));
    const wheel = new Event("wheel", { cancelable: true });
    Object.assign(wheel, { deltaY: 1e6 });
    canvas.dispatchEvent(wheel);
    expect(orbit.current.distance).toBe(20);
  });
});

describe("useSceneFrame", () => {
  const makeInputs = (runtime: SceneRuntime, mounted: boolean) => {
    const groups = new Map(mounted ? runtime.bodies.map((id) => [id, new Group()] as const) : []);
    return {
      runtime, controls: {} as SceneControls, readout: { current: null }, catalogue, origin: new FloatingOrigin(),
      orbit: { current: createOrbitCameraState(16, "earth") }, state: { current: createFrameState("solar-system") }, assets: [],
      bodyRefs: { groups, orients: new Map(groups), parts: new Map() }, lightRefs: { current: new Map() }, placement: { resolver, center: "earth" },
      views: {} as never, layers: {} as never, bodyFamilies: [], readoutPair: null, pairLabels: undefined,
    };
  };
  const setThree = () => { frame.three = { gl: { domElement: canvas }, camera: new PerspectiveCamera(), size: { width: 800, height: 600 } }; };

  it("asks for a draw every frame but runs the scene only once its root and every body are mounted", () => {
    setThree();
    const runtime = baseRuntime();
    const unmounted = makeInputs(runtime, false);
    unmounted.state.current.drawThisFrame = false;
    renderHook(() => { useSceneFrame({ current: new Group() }, unmounted); return null; });
    frame.callbacks.at(-1)!({}, 0.016);
    expect(unmounted.state.current.drawThisFrame).toBe(true);
    expect(runFrameSpy).not.toHaveBeenCalled();
    const noRoot = makeInputs(runtime, true);
    renderHook(() => { useSceneFrame({ current: null }, noRoot); return null; });
    frame.callbacks.at(-1)!({}, 0.016);
    expect(runFrameSpy).not.toHaveBeenCalled();
  });

  it("hands a mounted scene's frame the renderer handles, the delta and a resolver from a scene id to its body", () => {
    setThree();
    const inputs = makeInputs(baseRuntime(), true);
    renderHook(() => { useSceneFrame({ current: new Group() }, inputs); return null; });
    frame.callbacks.at(-1)!({}, 0.5);
    expect(runFrameSpy).toHaveBeenCalledTimes(1);
    const ctx = runFrameSpy.mock.calls[0]![0];
    expect(ctx).toMatchObject({ delta: 0.5, canvas, size: { width: 800, height: 600 }, orbit: inputs.orbit.current, state: inputs.state.current, lightRefs: inputs.lightRefs.current });
    expect(ctx.camera).toBe(frame.three.camera);
    expect(ctx.bodyIdFor("moon")).toBe("moon");
    expect(ctx.bodyIdFor("not-a-body")).toBeNull();
  });
});
