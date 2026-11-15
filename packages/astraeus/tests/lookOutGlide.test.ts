// @vitest-environment happy-dom
// T-313 (O-073): a look-out turn made while already looking out glides, and a tap in a look-out camera keeps the sky.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { readableScale } from "../src/core/scalePolicy";
import { createOrbitCameraState, resolveCamera } from "../src/app/CameraController";
import { cameraTargetAbsolute, stepCameraTarget, type CameraStepInput } from "../src/app/sceneCamera";
import type { SceneTargets } from "../src/app/sceneTargets";
import type { RenderVector } from "../src/app/renderCoordinates";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { EQUATORIAL_UP } from "../src/app/viewUp";
import { attachScenePointer, type PointerState } from "../src/app/scenePointer";

const positions = new Map<string, RenderVector>([["earth", [0, 0, 0]], ["moon", [60, 0, 0]]]);
const targets: SceneTargets = {
  bodyIdFor: (id) => (catalogue.has(id) ? id : null),
  placed: positions as SceneTargets["placed"],
  absoluteOf: (id) => positions.get(id) ?? [0, 0, 0],
  groupViews: [], sunCentredViews: [], trackedViews: [], bodySetViews: [],
  timeUtcMs: 0, policy: readableScale, placement: {} as SceneTargets["placement"],
};
const frame = { centre: "earth", span: 60, bodies: catalogue } as const;
const step = (camState: CameraStepInput["camState"], cameraRequest: CameraStepInput["controls"]["cameraRequest"]): CameraStepInput =>
  ({ camState, controls: { cameraRequest }, targets, frame, catalogue, reach: {}, fovDeg: 45, viewUp: EQUATORIAL_UP, firstFrame: false, previousUp: null });
const tick = (camState: CameraStepInput["camState"], reduced: boolean) =>
  resolveCamera(camState, cameraTargetAbsolute(camState, targets), new FloatingOrigin(), 0.016, 1e12, EQUATORIAL_UP, reduced);

/** The ways a host or panel asks for a look-out turn: a direction as RA/Dec vector, toward an object, and a zoom alone. */
const turns = [
  ["an EQJ direction", { kind: "lookOut", body: "earth", direction: [0, 1, 0], fovDeg: 20 }],
  ["toward an object", { kind: "lookOut", body: "earth", direction: "moon", fovDeg: 20 }],
  ["a zoom only", { kind: "lookOut", body: "earth", fovDeg: 20 }],
] as const;

describe("look-out turns while already looking out", () => {
  it.each(turns)("%s glides over several frames, and arrives next frame under reduced motion", (_name, request) => {
    for (const reduced of [false, true]) {
      const camState = createOrbitCameraState(16, "earth");
      stepCameraTarget(step(camState, { kind: "lookOut", body: "earth", direction: [1, 0, 0], fovDeg: 60 }));
      tick(camState, true);
      const [azimuth, elevation] = [camState.azimuth, camState.elevation];
      stepCameraTarget(step(camState, request));
      tick(camState, reduced);
      const moved = camState.azimuth !== azimuth || camState.elevation !== elevation;
      if (reduced) {
        expect(camState.lookOut?.fovDeg).toBe(20);
        expect(camState.azimuth).toBeCloseTo(camState.targetAzimuth, 9);
        expect(camState.elevation).toBeCloseTo(camState.targetElevation, 9);
        continue;
      }
      // Not a jump: one frame leaves the field of view and the direction short of their targets.
      expect(camState.lookOut?.fovDeg).toBeGreaterThan(20);
      expect(camState.lookOut?.fovDeg).toBeLessThan(60);
      if (moved) expect(Math.abs(camState.azimuth - camState.targetAzimuth) + Math.abs(camState.elevation - camState.targetElevation)).toBeGreaterThan(1e-4);
      for (let i = 0; i < 600; i += 1) tick(camState, false);
      expect(camState.lookOut?.fovDeg).toBe(20);
      expect(camState.targetFovDeg).toBeNull();
    }
  });

  it("still cuts when entering look-out from the orbit camera", () => {
    const camState = createOrbitCameraState(16, "earth");
    stepCameraTarget(step(camState, { kind: "lookOut", body: "earth", direction: [0, 1, 0], fovDeg: 30 }));
    expect(camState.lookOut).toEqual({ fovDeg: 30 });
    expect(camState.azimuth).toBe(camState.targetAzimuth);
    expect(camState.elevation).toBe(camState.targetElevation);
  });
});

describe("a tap in a look-out camera", () => {
  let canvas: HTMLCanvasElement;
  beforeEach(() => {
    canvas = document.createElement("canvas");
    Object.assign(canvas, { setPointerCapture: vi.fn() });
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
    document.body.appendChild(canvas);
  });
  afterEach(() => { canvas.remove(); vi.restoreAllMocks(); });
  const tap = (x: number, y: number): void => {
    for (const type of ["pointerdown", "pointerup"]) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.assign(event, { clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", button: 0, buttons: 0 });
      canvas.dispatchEvent(event);
    }
  };
  const state = (): PointerState => ({ pickables: [{ id: "sun", x: 200, y: 150, radiusPx: 12 }], hoverPoint: null, skyFigures: () => [{ id: "leo", lines: [[150, 150, 400, 150]], label: { left: 190, right: 260, top: 140, bottom: 160 } }] });

  it.each([
    ["figure over body", 200, 150, "leo", true],
  ])("%s: looking out the figure wins and the pick says keep the sky", (_name, x, y, id, keepSky) => {
    const picked = vi.fn();
    const orbit = createOrbitCameraState(16, "earth");
    orbit.lookOut = { fovDeg: 60 };
    attachScenePointer(canvas, orbit, state(), () => ({ min: 1, max: 100 }), picked);
    tap(x, y);
    expect(picked).toHaveBeenCalledExactlyOnceWith(id, keepSky ? { keepSky: true } : undefined);
  });

  it("looking out, a body outside any figure is picked with keepSky; orbiting, the body wins and the call is unchanged", () => {
    const bodyOnly: PointerState = { pickables: [{ id: "sun", x: 200, y: 400, radiusPx: 12 }], hoverPoint: null, skyFigures: () => [] };
    const pickedOut = vi.fn();
    const looking = createOrbitCameraState(16, "earth");
    looking.lookOut = { fovDeg: 60 };
    const detach = attachScenePointer(canvas, looking, bodyOnly, () => ({ min: 1, max: 100 }), pickedOut);
    tap(200, 400);
    expect(pickedOut).toHaveBeenCalledExactlyOnceWith("sun", { keepSky: true });
    detach();
    const pickedOrbit = vi.fn();
    attachScenePointer(canvas, createOrbitCameraState(16, "earth"), state(), () => ({ min: 1, max: 100 }), pickedOrbit);
    tap(200, 150);
    expect(pickedOrbit).toHaveBeenCalledExactlyOnceWith("sun");
  });
});
