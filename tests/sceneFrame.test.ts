import { afterEach, describe, expect, it, vi } from "vitest";
import { Group, PerspectiveCamera } from "three";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { SimulationClock } from "../src/core/clock";
import { readableScale, trueScale } from "../src/core/scalePolicy";
import type { BodyId } from "../src/core/body";
import { catalogue } from "../src/assets/catalogue";
import { createOrbitCameraState } from "../src/app/CameraController";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import type { SceneControls, SceneRuntime } from "../src/app/AstraeusScene";
import { bodiesMounted, createFrameState, frameTime, placeLightsAndReadout, placeScene, stepAndPoseCamera, updateOverlays, viewUpOf, type FrameContext, type FrameLayers } from "../src/app/sceneFrame";
import { createSceneResolver } from "../src/app/sceneLayout";
import { DEFAULT_BODY_MARKER } from "../src/app/bodyDraw";
import { EQUATORIAL_UP } from "../src/app/viewUp";

const T0 = Date.UTC(2026, 0, 1);
const BODIES: BodyId[] = ["earth", "moon"];
const resolver = createSceneResolver(createOrbAstronomyAdapter());

function fakeCanvas(): HTMLCanvasElement {
  return { dataset: {}, style: { cursor: "" }, getBoundingClientRect: () => ({ left: 0, top: 0 }) } as unknown as HTMLCanvasElement;
}

function makeContext(over: { controls?: Partial<SceneControls>; runtime?: Partial<SceneRuntime>; clock?: SimulationClock } = {}) {
  const clock = over.clock ?? new SimulationClock(T0);
  const runtime = { clock, resolver, bodies: BODIES, sceneCenter: "earth", trackedBodies: [], groups: [], cameraReach: {}, ...over.runtime } as SceneRuntime;
  const controls = { policy: readableScale, cameraRequest: null, showAnchorLabels: false, showMilkyWay: false, bodyMarker: DEFAULT_BODY_MARKER, starBrightness: 1, milkyWayBrightness: 1, labelObjects: [{ id: "earth", label: "Earth" }], selectedObjectId: "earth", frameStats: null, groupFills: [], ...over.controls } as SceneControls;
  const groups = new Map<BodyId, Group>(BODIES.map((id) => [id, new Group()]));
  const orients = new Map<BodyId, Group>(BODIES.map((id) => [id, new Group()]));
  const layers: FrameLayers = { bodySetLabels: { current: [] }, anchorLabels: { current: null }, sceneLabels: { current: null }, storyMarkers: { current: null }, featureMarkers: { current: null } };
  const camera = new PerspectiveCamera(45, 1, 0.05, 1000);
  const ctx: FrameContext = {
    runtime, controls, readout: { current: null }, catalogue, camera, canvas: fakeCanvas(), size: { width: 800, height: 600 }, origin: new FloatingOrigin(),
    orbit: createOrbitCameraState(16, "earth"), state: createFrameState(controls.policy.id), delta: 0.016, assets: BODIES.map((id) => catalogue.get(id)),
    bodyRefs: { groups, orients, parts: new Map() }, lightRefs: new Map(), placement: { resolver, center: "earth" },
    views: { trackedViews: [], groupViews: [], sunCentredViews: [], compositionPaths: [], skyView: null, bodySetViews: [], orbitSetViews: [] },
    layers, bodyFamilies: [], bodyIdFor: (id) => (catalogue.has(id) ? id : null), readoutPair: { parent: "earth", child: "moon" }, pairLabels: undefined,
  };
  return { ctx, clock, groups };
}

afterEach(() => vi.unstubAllGlobals());

describe("frame prerequisites and time", () => {
  it("draws a frame only once every body's nodes are mounted", () => {
    const { ctx } = makeContext();
    expect(bodiesMounted(ctx.runtime, ctx.bodyRefs)).toBe(true);
    (ctx.bodyRefs.orients as Map<BodyId, Group>).delete("moon");
    expect(bodiesMounted(ctx.runtime, ctx.bodyRefs)).toBe(false);
  });

  it("wraps the clock only when looping is on and the runtime has a loop window", () => {
    let monotonic = 0;
    const clock = new SimulationClock(T0, () => monotonic);
    clock.play();
    monotonic = 10_000;
    const window = { startUtcMs: T0, endUtcMs: T0 + 1000 };
    const spy = vi.spyOn(clock, "wrapWithin");
    frameTime({ clock } as SceneRuntime, { loop: true });
    frameTime({ clock, loopWindow: window } as SceneRuntime, {});
    expect(spy).not.toHaveBeenCalled();
    const t = frameTime({ clock, loopWindow: window } as SceneRuntime, { loop: true });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(t).toBeGreaterThanOrEqual(window.startUtcMs);
    expect(t).toBeLessThanOrEqual(window.endUtcMs + 20_000);
  });

  it("takes the up vector from the controls, then the runtime, then the equatorial default", () => {
    const own: [number, number, number] = [0, 0, 1];
    expect(viewUpOf({ controls: { up: own } as SceneControls, runtime: {} as SceneRuntime })).toBe(own);
    expect(viewUpOf({ controls: {} as SceneControls, runtime: { up: own } as SceneRuntime })).toBe(own);
    expect(viewUpOf({ controls: {} as SceneControls, runtime: {} as SceneRuntime })).toBe(EQUATORIAL_UP);
  });
});

describe("placeScene", () => {
  it("rescales the camera once per policy change and records the span", () => {
    const { ctx } = makeContext();
    const first = placeScene(ctx, T0);
    expect(ctx.state.spanScaled).toBe(first.span);
    expect(ctx.state.lastPolicyId).toBe(readableScale.id);
    ctx.orbit.distance = 10;
    const switched = { ...ctx, controls: { ...ctx.controls, policy: trueScale } };
    const before = ctx.state.spanScaled;
    const placed = placeScene(switched, T0);
    expect(ctx.state.lastPolicyId).toBe(trueScale.id);
    expect(ctx.orbit.distance).toBeCloseTo(10 * (placed.span / before), 6);
    const settled = ctx.orbit.distance;
    placeScene(switched, T0);
    expect(ctx.orbit.distance).toBe(settled);
  });

  it("answers absoluteOf for a placed body and for the centre", () => {
    const { ctx } = makeContext();
    const placed = placeScene(ctx, T0);
    expect(placed.absoluteOf("moon")).toEqual(placed.composed.absolutes.get("moon"));
    expect(placed.absoluteOf("earth").map((v) => v + 0)).toEqual([0, 0, 0]);
  });
});

describe("stepAndPoseCamera", () => {
  it("hides the boot loader and uses the start view on the first frame only", () => {
    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    const startView = { focus: "moon", azimuthDeg: 30, elevationDeg: 10, distance: 5 };
    const { ctx } = makeContext({ controls: { startView } });
    const placed = placeScene(ctx, T0);
    stepAndPoseCamera(ctx, T0, placed);
    expect(raf).toHaveBeenCalledTimes(1);
    expect(ctx.orbit.focus).toBe("moon");
    expect(ctx.state.started).toBe(true);
    expect(ctx.controls.viewReadout?.focus).toBe("moon");
    ctx.orbit.focus = "earth";
    stepAndPoseCamera(ctx, T0, placed);
    expect(raf).toHaveBeenCalledTimes(1);
    expect(ctx.orbit.focus).toBe("earth");
    expect(ctx.state.lastUp).toBe(EQUATORIAL_UP);
  });

  it("places the bodies about the origin and poses the camera", () => {
    vi.stubGlobal("requestAnimationFrame", vi.fn());
    const { ctx, groups } = makeContext();
    const placed = placeScene(ctx, T0);
    stepAndPoseCamera(ctx, T0, placed);
    const moon = placed.absoluteOf("moon");
    const local = ctx.origin.toLocal(moon);
    expect(groups.get("moon")!.position.x).toBeCloseTo(local[0], 4);
    expect(ctx.camera.position.length()).toBeGreaterThan(0);
  });
});

describe("updateOverlays", () => {
  it("carries the hover and pick targets into the canvas readouts", () => {
    vi.stubGlobal("requestAnimationFrame", vi.fn());
    const { ctx } = makeContext();
    const placed = placeScene(ctx, T0);
    const step = stepAndPoseCamera(ctx, T0, placed);
    ctx.camera.updateMatrixWorld();
    updateOverlays(ctx, T0, step, 1);
    expect(ctx.canvas.dataset.pickHover).toBe("");
    expect(ctx.canvas.style.cursor).toBe("");
    const candidate = ctx.state.pickables.find((pick) => pick.id === "earth");
    expect(candidate).toBeDefined();
    ctx.state.hoverPoint = { x: candidate!.x, y: candidate!.y };
    updateOverlays(ctx, T0, step, 1);
    expect(ctx.canvas.dataset.pickHover).toBe("earth");
    expect(ctx.canvas.style.cursor).toBe("pointer");
  });
});

describe("placeLightsAndReadout", () => {
  it("builds the frame readout for the body pair and clears it without one", () => {
    const { ctx } = makeContext();
    const placed = placeScene(ctx, T0);
    placeLightsAndReadout(ctx, T0, placed);
    expect(ctx.readout.current).not.toBeNull();
    placeLightsAndReadout({ ...ctx, readoutPair: null }, T0, placed);
    expect(ctx.readout.current).toBeNull();
  });
});
