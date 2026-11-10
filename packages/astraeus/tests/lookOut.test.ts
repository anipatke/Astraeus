import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { readableScale } from "../src/core/scalePolicy";
import { createOrbitCameraState, poseCamera, resolveCamera, type CameraRequest } from "../src/app/CameraController";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { clampFov, LOOK_OUT_FOV_RANGE_DEG, LOOK_OUT_NEAR, panLookOut, zoomLookOut } from "../src/app/lookOut";
import { eqjToRenderVector, type RenderVector } from "../src/app/renderCoordinates";
import { stepCameraTarget, type CameraStepInput } from "../src/app/sceneCamera";
import type { SceneTargets } from "../src/app/sceneTargets";
import { EQUATORIAL_UP, viewUpVector } from "../src/app/viewUp";
import { hiddenWithLookOut } from "../src/app/viewHiding";

const positions = new Map<string, RenderVector>([["earth", [0, 0, 0]], ["moon", [60, 0, 0]], ["mars", [1000, 200, -3000]], ["sun", [0, 0, 20000]]]);
const targets: SceneTargets = {
  bodyIdFor: (id) => (catalogue.has(id) ? id : null),
  placed: positions as SceneTargets["placed"],
  absoluteOf: (id) => positions.get(id) ?? [0, 0, 0],
  groupViews: [], sunCentredViews: [], trackedViews: [], bodySetViews: [],
  timeUtcMs: 0, policy: readableScale, placement: {} as SceneTargets["placement"],
};
const frame = { centre: "earth", span: 60, bodies: catalogue } as const;
const EQJ_X: [number, number, number] = [1, 0, 0];

function run(request: CameraRequest, over: Partial<CameraStepInput> = {}) {
  const step: CameraStepInput = { camState: createOrbitCameraState(16, "earth"), controls: { cameraRequest: request }, targets, frame, catalogue, reach: {}, fovDeg: 45, viewUp: EQUATORIAL_UP, firstFrame: false, previousUp: null, ...over };
  const origin = new FloatingOrigin();
  stepCameraTarget(step);
  resolveCamera(step.camState, step.camState.fixedPoint ?? (positions.get(step.camState.focus) as RenderVector), origin, 0.016, 1, step.viewUp);
  const camera = new PerspectiveCamera(45, 1, 0.05, 1000);
  poseCamera(camera, step.camState, 1, origin, 5000, step.viewUp);
  camera.updateMatrixWorld();
  return { step, camera, origin };
}

/** Where a render-frame direction lands on screen, in NDC (0, 0 is the centre). */
function ndcOf(camera: PerspectiveCamera, direction: RenderVector): Vector3 {
  const at = new Vector3(...direction).multiplyScalar(10).add(camera.position);
  return at.project(camera);
}

describe("look out from a body", () => {
  it.each([["earth"], ["mars"]])("puts the camera at the centre of %s with the requested direction on screen centre", (body) => {
    const direction: [number, number, number] = [0.3, -0.5, 0.2];
    const { step, camera, origin } = run({ kind: "lookOut", body, direction });
    expect(step.camState.lookOut?.fovDeg).toBe(60);
    expect(step.camState.cameraAbsolute).toEqual(positions.get(body));
    expect(origin.toLocal(step.camState.cameraAbsolute)).toEqual([camera.position.x, camera.position.y, camera.position.z]);
    const ndc = ndcOf(camera, eqjToRenderVector(direction));
    expect(ndc.x).toBeCloseTo(0, 6);
    expect(ndc.y).toBeCloseTo(0, 6);
    expect(camera.fov).toBe(60);
  });

  it("looks in the ecliptic up too, and turns toward an object id", () => {
    const up = viewUpVector("ecliptic");
    const turned = run({ kind: "lookOut", body: "earth", direction: "moon" }, { viewUp: up });
    const ndc = ndcOf(turned.camera, [1, 0, 0]);
    expect(Math.abs(ndc.x) + Math.abs(ndc.y)).toBeLessThan(1e-6);
    expect(turned.camera.up.toArray()).toEqual(up);
  });

  it("applies the requested field of view within the range, and keeps the current one when none is given", () => {
    const wide = run({ kind: "lookOut", body: "earth", direction: EQJ_X, fovDeg: 500 });
    expect(wide.step.camState.lookOut?.fovDeg).toBe(LOOK_OUT_FOV_RANGE_DEG.max);
    const again = run({ kind: "lookOut", body: "earth", direction: EQJ_X }, { camState: wide.step.camState });
    expect(again.step.camState.lookOut?.fovDeg).toBe(LOOK_OUT_FOV_RANGE_DEG.max);
  });

  it("ignores a request that names no body or no direction", () => {
    for (const request of [
      { kind: "lookOut", body: "nowhere", direction: EQJ_X },
      { kind: "lookOut", body: "earth", direction: [0, 0, 0] },
      { kind: "lookOut", body: "earth", direction: "nowhere" },
      { kind: "lookOut", body: "earth", direction: "earth" },
    ] as CameraRequest[]) expect(run(request).step.camState.lookOut).toBeNull();
  });

  it("keeps the near plane positive and keeps the camera on a moving body across a rebase", () => {
    const { step, camera, origin } = run({ kind: "lookOut", body: "mars", direction: EQJ_X });
    expect(camera.near).toBe(LOOK_OUT_NEAR);
    expect(camera.near).toBeGreaterThan(0);
    positions.set("mars", [5000, 0, 0]);
    resolveCamera(step.camState, positions.get("mars") as RenderVector, origin, 0.016, 1, EQUATORIAL_UP);
    const after = new PerspectiveCamera(45, 1, 0.05, 1000);
    poseCamera(after, step.camState, 1, origin, 5000, EQUATORIAL_UP);
    expect(step.camState.cameraAbsolute).toEqual([5000, 0, 0]);
    expect(origin.toLocal(step.camState.cameraAbsolute)).toEqual([after.position.x, after.position.y, after.position.z]);
    positions.set("mars", [1000, 200, -3000]);
  });

  it("keeps the look direction when the up direction changes", () => {
    const first = run({ kind: "lookOut", body: "earth", direction: [0.3, -0.5, 0.2] });
    const up = viewUpVector("ecliptic");
    const second = run({ kind: "lookOut", body: "earth", direction: [0.3, -0.5, 0.2] }, { camState: first.step.camState, viewUp: up, previousUp: EQUATORIAL_UP, controls: { cameraRequest: null } });
    const ndc = ndcOf(second.camera, eqjToRenderVector([0.3, -0.5, 0.2]));
    expect(ndc.x).toBeCloseTo(0, 6);
    expect(ndc.y).toBeCloseTo(0, 6);
  });

  it.each<[string, CameraRequest]>([
    ["focus", { kind: "focus", target: "moon" }],
    ["follow", { kind: "follow", target: "moon" }],
    ["overview", { kind: "overview" }],
    ["pose", { kind: "pose", view: { focus: "moon", azimuthDeg: 10, elevationDeg: 20, distance: 5 } }],
  ])("a %s request returns to the orbit camera at the orbit field of view", (_name, request) => {
    const standing = run({ kind: "lookOut", body: "earth", direction: EQJ_X, fovDeg: 20 });
    const back = run(request, { camState: standing.step.camState });
    expect(back.step.camState.lookOut).toBeNull();
    expect(back.camera.fov).toBe(45);
    expect(back.camera.near).toBeGreaterThan(LOOK_OUT_NEAR);
    expect(back.camera.position.distanceTo(new Vector3(...back.origin.toLocal(back.step.camState.targetAbsolute)))).toBeGreaterThan(0);
  });

  it("a hold is ignored while looking out", () => {
    const standing = run({ kind: "lookOut", body: "earth", direction: EQJ_X });
    const held = run({ kind: "hold" }, { camState: standing.step.camState });
    expect(held.step.camState.lookOut).not.toBeNull();
    expect(held.step.camState.fixedPoint).toBeNull();
  });
});

describe("look-out gestures", () => {
  it("pans with the sky: a drag right turns the view left, a drag down looks up, slower at a narrow field of view", () => {
    const wide = { azimuth: 0, elevation: 0 };
    panLookOut(wide, 60, 100, 50, 600);
    expect(wide.azimuth).toBeGreaterThan(0);
    expect(wide.elevation).toBeGreaterThan(0);
    const narrow = { azimuth: 0, elevation: 0 };
    panLookOut(narrow, 10, 100, 50, 600);
    expect(narrow.azimuth).toBeCloseTo(wide.azimuth / 6, 9);
  });

  it("keeps the elevation within 89 degrees and pans no faster than the floor near the pole", () => {
    const angles = { azimuth: 0, elevation: 0 };
    panLookOut(angles, 100, 0, 100000, 600);
    expect(angles.elevation).toBeCloseTo((89 * Math.PI) / 180, 9);
    panLookOut(angles, 100, 0, -1000000, 600);
    expect(angles.elevation).toBeCloseTo((-89 * Math.PI) / 180, 9);
    const pole = { azimuth: 0, elevation: (89 * Math.PI) / 180 };
    panLookOut(pole, 60, 1, 0, 600);
    expect(pole.azimuth).toBeLessThan(((60 * Math.PI) / 180 / 600) * 10 + 1e-9);
  });

  it("zooms by field of view inside the range", () => {
    const look = { fovDeg: 60 };
    zoomLookOut(look, 0.001);
    expect(look.fovDeg).toBe(5);
    zoomLookOut(look, 1000);
    expect(look.fovDeg).toBe(100);
    expect(clampFov(42)).toBe(42);
  });
});

describe("hiddenWithLookOut", () => {
  it("adds the stood-in body to the view's hidden objects, and is the same object when not looking out", () => {
    const hidden = { objects: new Set(["moon"]), panels: new Set(["p"]) };
    expect(hiddenWithLookOut(hidden, null)).toBe(hidden);
    expect(hiddenWithLookOut(undefined, null)).toBeUndefined();
    const merged = hiddenWithLookOut(hidden, "earth");
    expect([...merged!.objects].sort()).toEqual(["earth", "moon"]);
    expect(merged!.panels).toBe(hidden.panels);
    expect(hiddenWithLookOut(undefined, "earth")!.objects.has("earth")).toBe(true);
  });
});
