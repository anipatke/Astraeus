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
import { bodiesMounted, cameraSettled, createFrameState, decideDraw, IDLE_GRACE_FRAMES, shouldDrawFrame, frameTime, placeLightsAndReadout, placeScene, placeViews, publishCanvasReadouts, stepAndPoseCamera, syncViews, updateOverlays, viewUpOf, type FrameContext, type FrameLayers } from "../src/app/sceneFrame";
import { createSceneResolver } from "../src/app/sceneLayout";
import { DEFAULT_BODY_SET_LOOK } from "../src/app/bodySet";
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

function fakePath(id: string, defaultLook: object | null = null) {
  return { id, defaultLook, setLook: vi.fn(), setColor: vi.fn(), sync: vi.fn(), place: vi.fn(), arcHeadAbsolute: () => null, screenReadout: () => ({ id, visible: true, vertices: 0, inView: 0, maxX: 0, minX: 0, maxY: 0, minY: 0, lineMinX: 1, lineMaxX: 0, lineMinY: 1, lineMaxY: 0, axisDeg: 0, aspect: 1, look: null }) };
}

describe("syncViews", () => {
  it("gives an owned orbit path its family colour and every path the live look, then syncs all views at the frame time", () => {
    const { ctx } = makeContext({ controls: { orbitLook: { lineWidth: 3 } as never, bodySetLook: { ...DEFAULT_BODY_SET_LOOK, highlightFamily: "moons", highlightColor: "#123456" } } });
    const owned = fakePath("moon-orbit", { lineWidth: 1 });
    const other = fakePath("earth-orbit");
    const group = { sync: vi.fn() };
    const views = { ...ctx.views, compositionPaths: [owned, other], groupViews: [group] } as unknown as FrameContext["views"];
    const look = syncViews({ ...ctx, views, bodyFamilies: [{ layer: {} as never, body: "moon", family: "moons" }] }, T0);
    expect(look.highlightColor).toBe("#123456");
    expect(owned.setColor).toHaveBeenCalledWith("#123456");
    expect(owned.setLook).toHaveBeenCalledWith({ lineWidth: 3 });
    expect(other.setColor).not.toHaveBeenCalled();
    expect(other.setLook).not.toHaveBeenCalled();
    expect(owned.sync).toHaveBeenCalledWith(T0, ctx.placement, ctx.controls.policy);
    expect(other.sync).toHaveBeenCalledTimes(1);
    expect(group.sync).toHaveBeenCalledWith(T0, ctx.placement, ctx.controls.policy);
  });

  it("falls back to the default body-set look when the controls carry none", () => {
    const { ctx } = makeContext();
    expect(syncViews(ctx, T0)).toBe(DEFAULT_BODY_SET_LOOK);
  });
});

describe("publishCanvasReadouts", () => {
  function fakeSky() {
    return { follow: vi.fn(), setPictureVisible: vi.fn(), requestPicture: vi.fn(), setStarBrightness: vi.fn(), setMilkyWayBrightness: vi.fn(), pictureVisible: false, probe: vi.fn(() => ({ ok: true })) };
  }

  it("updates the sky only when the scene has a sky view, and reads it back only in developer mode", () => {
    const { ctx } = makeContext();
    expect(() => publishCanvasReadouts(ctx)).not.toThrow();
    const sky = fakeSky();
    const withSky = { ...ctx, views: { ...ctx.views, skyView: sky } } as unknown as FrameContext;
    publishCanvasReadouts(withSky);
    expect(sky.follow).toHaveBeenCalledWith(ctx.camera);
    expect(sky.probe).not.toHaveBeenCalled();
    expect(ctx.canvas.dataset.skyProbe).toBeUndefined();
    const dev = { ...withSky, controls: { ...ctx.controls, frameStats: {} as never } } as FrameContext;
    publishCanvasReadouts(dev);
    expect(sky.probe).toHaveBeenCalledTimes(1);
    expect(ctx.canvas.dataset.skyProbe).toBe(JSON.stringify({ ok: true }));
  });

  it("reports the Milky Way picture and the live brightness settings on the canvas, the picture only when it is switched on (browser-sky.mjs)", () => {
    const { ctx } = makeContext({ controls: { showMilkyWay: false, starBrightness: 1.5, milkyWayBrightness: 0.5 } });
    const sky = fakeSky();
    const frame = (showMilkyWay: boolean) => ({ ...ctx, views: { ...ctx.views, skyView: sky }, controls: { ...ctx.controls, showMilkyWay } }) as unknown as FrameContext;
    publishCanvasReadouts(frame(false));
    expect(ctx.canvas.dataset).toMatchObject({ skyPicture: "off", skyStarBrightness: "1.5", skyMilkyWayBrightness: "0.5", skyPictureShown: "false" });
    expect(sky.requestPicture).not.toHaveBeenCalled();
    expect(sky.setStarBrightness).toHaveBeenCalledWith(1.5);
    sky.pictureVisible = true;
    publishCanvasReadouts(frame(true));
    expect(ctx.canvas.dataset).toMatchObject({ skyPicture: "on", skyPictureShown: "true" });
    expect(sky.requestPicture).toHaveBeenCalledTimes(1);
    const none = makeContext();
    publishCanvasReadouts(none.ctx);
    expect(none.ctx.canvas.dataset.skyPicture).toBeUndefined(); // ?sky=off: no sky view, no sky readouts
  });
});

describe("placeViews", () => {
  it("clamps the hover gain, passes it to the name layers and places the path views about the origin", () => {
    vi.stubGlobal("requestAnimationFrame", vi.fn());
    const label = { update: vi.fn() };
    const { ctx } = makeContext({ controls: { hoverBrightness: 99 } });
    const placedPath = fakePath("moon-orbit");
    const withViews = { ...ctx, views: { ...ctx.views, compositionPaths: [placedPath] }, layers: { ...ctx.layers, bodySetLabels: { current: [label] } } } as unknown as FrameContext;
    const placed = placeScene(withViews, T0);
    const gain = placeViews(withViews, T0, placed, DEFAULT_BODY_SET_LOOK);
    expect(gain).toBeLessThanOrEqual(3);
    expect(gain).toBeGreaterThan(1);
    expect(label.update).toHaveBeenCalledWith(DEFAULT_BODY_SET_LOOK, gain);
    expect(placedPath.place).toHaveBeenCalledWith(ctx.origin, { fovDeg: ctx.camera.fov, viewportHeightPx: 600 });
    const defaultGain = placeViews({ ...withViews, controls: { ...ctx.controls, hoverBrightness: undefined } }, T0, placed, DEFAULT_BODY_SET_LOOK);
    expect(defaultGain).toBeGreaterThanOrEqual(1);
  });
});

describe("draw this frame? (stage 8)", () => {
  const quiet = { clockPlaying: false, timeChanged: false, cameraMoving: false, inputChanged: false };

  it("draws when the clock plays, time jumps, the camera moves or an input changed", () => {
    expect(shouldDrawFrame({ ...quiet, quietFrames: 999, clockPlaying: true })).toBe(true);
    expect(shouldDrawFrame({ ...quiet, quietFrames: 999, timeChanged: true })).toBe(true);
    expect(shouldDrawFrame({ ...quiet, quietFrames: 999, cameraMoving: true })).toBe(true);
    expect(shouldDrawFrame({ ...quiet, quietFrames: 999, inputChanged: true })).toBe(true);
  });

  it("keeps drawing for the grace after the last change, then stops", () => {
    expect(shouldDrawFrame({ ...quiet, quietFrames: IDLE_GRACE_FRAMES - 1 })).toBe(true);
    expect(shouldDrawFrame({ ...quiet, quietFrames: IDLE_GRACE_FRAMES })).toBe(false);
  });

  it("knows when the camera's tweens have reached their targets", () => {
    const orbit = createOrbitCameraState(16, "earth");
    expect(cameraSettled(orbit)).toBe(true);
    orbit.targetDistance = 20;
    expect(cameraSettled(orbit)).toBe(false);
    orbit.targetDistance = orbit.distance;
    orbit.transition[1] = 0.5;
    expect(cameraSettled(orbit)).toBe(false);
    orbit.transition[1] = 0;
    orbit.targetAzimuth += 0.1;
    expect(cameraSettled(orbit)).toBe(false);
  });

  /** Frames of a paused, untouched scene until the draw rule stops. */
  function settle(ctx: FrameContext): number {
    let frames = 0;
    while (decideDraw(ctx, ctx.runtime.clock.now()) && frames < 500) frames += 1;
    return frames;
  }

  it("paused and idle: no draw once the first frames have settled", () => {
    const { ctx } = makeContext();
    const frames = settle(ctx);
    expect(frames).toBeGreaterThan(0);
    expect(frames).toBeLessThan(IDLE_GRACE_FRAMES + 5);
    for (let i = 0; i < 100; i += 1) expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(false);
  });

  it("a playing clock keeps drawing every frame", () => {
    let monotonic = 0;
    const clock = new SimulationClock(T0, () => monotonic);
    const { ctx } = makeContext({ clock });
    settle(ctx);
    clock.play();
    for (let i = 0; i < 100; i += 1) { monotonic += 16; expect(decideDraw(ctx, clock.now())).toBe(true); }
    clock.pause();
    expect(settle(ctx)).toBeGreaterThan(0);
  });

  it("a seek draws again", () => {
    const { ctx, clock } = makeContext();
    settle(ctx);
    clock.seek(T0 + 3_600_000);
    expect(decideDraw(ctx, clock.now())).toBe(true);
  });

  it("paused, camera still settling: draws until it arrives", () => {
    const { ctx } = makeContext();
    settle(ctx);
    ctx.orbit.targetDistance = 30;
    for (let i = 0; i < 10; i += 1) expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(true);
    ctx.orbit.distance = ctx.orbit.targetDistance;
    expect(settle(ctx)).toBeGreaterThanOrEqual(IDLE_GRACE_FRAMES - 1);
  });

  it("a moved camera pose draws; a sub-pixel nudge does not", () => {
    const { ctx } = makeContext();
    settle(ctx);
    ctx.camera.position.x += 1e-9;
    expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(false);
    ctx.camera.position.x += 0.5;
    expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(true);
    ctx.camera.fov = 60;
    settle(ctx);
    ctx.camera.fov = 61;
    expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(true);
  });

  it("a settings change, a resize, a wake or a new body mount draws", () => {
    const { ctx } = makeContext();
    settle(ctx);
    ctx.controls.policy = trueScale;
    expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(true);
    settle(ctx);
    ctx.controls.starBrightness = 1.5;
    expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(true);
    settle(ctx);
    (ctx as { size: { width: number; height: number } }).size = { width: 400, height: 300 };
    expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(true);
    settle(ctx);
    ctx.state.wakes += 1;
    expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(true);
    settle(ctx);
    (ctx.bodyRefs.parts as Map<BodyId, { sphere: Group; marker: Group }>).set("earth", { sphere: new Group(), marker: new Group() });
    expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(true);
  });

  it("sees a look edited in place, as the Developer panel does for the Sun's halo", () => {
    const glow = { sizePx: 40, brightness: 1, scale: 1 };
    const { ctx } = makeContext({ controls: { glowLook: glow } });
    settle(ctx);
    glow.sizePx = 80;
    expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(true);
    expect(settle(ctx)).toBeGreaterThan(0);
  });

  it("ignores the camera readout the scene rewrites every frame", () => {
    const { ctx } = makeContext();
    settle(ctx);
    ctx.controls.viewReadout = { focus: "earth", azimuthDeg: 1, elevationDeg: 2, distance: 3 };
    expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(false);
    ctx.controls.viewReadout = { focus: "earth", azimuthDeg: 1, elevationDeg: 2, distance: 3 };
    expect(decideDraw(ctx, ctx.runtime.clock.now())).toBe(false);
  });
});
