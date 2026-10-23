import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { readableScale } from "../src/core/scalePolicy";
import { createOrbitCameraState } from "../src/app/CameraController";
import { rescaleCameraForPolicy, stepCameraTarget, type CameraStepInput } from "../src/app/sceneCamera";
import type { SceneTargets } from "../src/app/sceneTargets";
import type { RenderVector } from "../src/app/renderCoordinates";
import { focusLimits } from "../src/app/sceneFraming";
import { EQUATORIAL_UP } from "../src/app/viewUp";

const positions = new Map<string, RenderVector>([["earth", [0, 0, 0]], ["moon", [60, 0, 0]], ["sun", [0, 0, 20000]]]);
const targets: SceneTargets = {
  bodyIdFor: (id) => (catalogue.has(id) ? id : null),
  placed: positions as SceneTargets["placed"],
  absoluteOf: (id) => positions.get(id) ?? [0, 0, 0],
  groupViews: [], sunCentredViews: [], trackedViews: [], bodySetViews: [],
  timeUtcMs: 0, policy: readableScale, placement: {} as SceneTargets["placement"],
};
const frame = { centre: "earth", span: 60, bodies: catalogue } as const;

function input(over: Partial<CameraStepInput> = {}, controls: CameraStepInput["controls"] = { cameraRequest: null }): CameraStepInput {
  return { camState: createOrbitCameraState(16, "earth"), controls, targets, frame, catalogue, reach: {}, fovDeg: 45, viewUp: EQUATORIAL_UP, firstFrame: false, previousUp: null, ...over };
}

describe("rescaleCameraForPolicy", () => {
  it("scales the distance only while the centre is focused, and always scales the transition", () => {
    const centred = createOrbitCameraState(10, "earth");
    centred.transition = [1, 2, 3];
    rescaleCameraForPolicy(centred, "earth", 2);
    expect(centred.distance).toBe(20);
    expect(centred.transition).toEqual([2, 4, 6]);
    const away = createOrbitCameraState(10, "moon");
    rescaleCameraForPolicy(away, "earth", 2);
    expect(away.distance).toBe(10);
  });
});

describe("stepCameraTarget", () => {
  it("returns the focused body and leaves a within-limits distance alone", () => {
    const step = input();
    expect(stepCameraTarget(step)).toBe("earth");
    expect(step.camState.distance).toBe(16);
  });

  it("clamps distance and target distance to the focus limits", () => {
    const step = input();
    const limits = focusLimits("earth", frame, readableScale, {});
    step.camState.distance = step.camState.targetDistance = 1e6;
    stepCameraTarget(step);
    expect(step.camState.distance).toBe(limits.max);
    expect(step.camState.targetDistance).toBe(limits.max);
    step.camState.distance = step.camState.targetDistance = 0;
    stepCameraTarget(step);
    expect(step.camState.distance).toBe(limits.min);
  });

  it("opens exactly on an explicit start view on the first frame and consumes any request", () => {
    const controls = { cameraRequest: { kind: "overview" } as const, startView: { focus: "moon", azimuthDeg: 90, elevationDeg: 30, distance: 8 } };
    const step = input({ firstFrame: true }, controls);
    expect(stepCameraTarget(step)).toBe("moon");
    expect(step.camState.azimuth).toBeCloseTo(Math.PI / 2, 6);
    expect(step.camState.elevation).toBeCloseTo(Math.PI / 6, 6);
    expect(step.camState.distance).toBe(8);
    expect(controls.cameraRequest).toBeNull();
  });

  it("ignores the start view after the first frame and when it names something unknown", () => {
    const later = input({ firstFrame: false }, { cameraRequest: null, startView: { focus: "moon", azimuthDeg: 0, elevationDeg: 0, distance: 8 } });
    expect(stepCameraTarget(later)).toBe("earth");
    const unknown = input({ firstFrame: true }, { cameraRequest: null, startView: { focus: "nowhere", azimuthDeg: 0, elevationDeg: 0, distance: 8 } });
    expect(stepCameraTarget(unknown)).toBe("earth");
  });

  it("opens at the overview when the start distance is inside the focus's closest approach", () => {
    const step = input({ firstFrame: true });
    step.camState.distance = step.camState.targetDistance = 0.0001;
    stepCameraTarget(step);
    expect(step.camState.distance).toBeGreaterThan(0.0001);
    expect(step.controls.cameraRequest).toBeNull();
  });

  it("handles a focus request: switches focus, frames the body and faces its parent", () => {
    const controls = { cameraRequest: { kind: "focus", target: "moon" } as const };
    const step = input({}, controls);
    stepCameraTarget(step);
    expect(step.camState.focus).toBe("moon");
    expect(step.camState.targetDistance).toBeGreaterThan(0);
    expect(controls.cameraRequest).toBeNull();
    expect(Number.isFinite(step.camState.targetAzimuth)).toBe(true);
  });

  it("a follow request keeps the framing distance", () => {
    const step = input({}, { cameraRequest: { kind: "follow", target: "moon" } });
    step.camState.targetDistance = 12;
    stepCameraTarget(step);
    expect(step.camState.focus).toBe("moon");
    expect(step.camState.targetDistance).toBe(12);
  });

  it("re-expresses the camera in a new up direction without moving it", () => {
    const step = input({ previousUp: EQUATORIAL_UP, viewUp: [1, 0, 0] });
    step.camState.cameraAbsolute = [0, 5, 5];
    step.camState.targetAbsolute = [0, 0, 0];
    const before = step.camState.azimuth;
    stepCameraTarget(step);
    expect(step.camState.azimuth).not.toBe(before);
    const same = input({ previousUp: EQUATORIAL_UP });
    const untouched = same.camState.azimuth;
    stepCameraTarget(same);
    expect(same.camState.azimuth).toBe(untouched);
  });
});
