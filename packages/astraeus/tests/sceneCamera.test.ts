import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { readableScale } from "../src/core/scalePolicy";
import { createOrbitCameraState, resolveCamera } from "../src/app/CameraController";
import { cameraTargetAbsolute, rescaleCameraForPolicy, stepCameraTarget, type CameraStepInput } from "../src/app/sceneCamera";
import type { SceneTargets } from "../src/app/sceneTargets";
import type { RenderVector } from "../src/app/renderCoordinates";
import { focusLimits } from "../src/app/sceneFraming";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { EQUATORIAL_UP } from "../src/app/viewUp";
import { viewFromAngles, type StartView } from "../src/app/viewLink";

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

  it("keeps the camera's focus and pose when a view switch asks for nothing (rule stay): no request, no jump to the overview", () => {
    const step = input();
    step.camState.focus = "moon";
    step.camState.distance = step.camState.targetDistance = 5;
    step.camState.targetAzimuth = step.camState.azimuth = 1;
    stepCameraTarget(step);
    expect(step.camState.focus).toBe("moon");
    expect(step.camState.targetAzimuth).toBe(1);
    expect(step.camState.distance).toBe(5);
  });

  it("moves to the request a view's rule makes (a follow keeps the distance, a focus frames it)", () => {
    const followed = input({}, { cameraRequest: { kind: "follow", target: "moon" } });
    stepCameraTarget(followed);
    expect(followed.camState.focus).toBe("moon");
    expect(followed.camState.targetDistance).toBe(16);
    const focused = input({}, { cameraRequest: { kind: "focus", target: "moon" } });
    stepCameraTarget(focused);
    expect(focused.camState.focus).toBe("moon");
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

  it("an opening look-out toward an object runs the same step as a setCamera look-out toward it (I-169), and a host request still wins", () => {
    const toward = { kind: "lookOut", body: "earth", direction: "moon", fovDeg: 40 } as const;
    const opened = input({ firstFrame: true }, { cameraRequest: { kind: "overview" }, startView: toward });
    const asked = input({ firstFrame: false }, { cameraRequest: toward });
    stepCameraTarget(opened);
    stepCameraTarget(asked);
    expect(opened.camState.lookOut).toEqual({ fovDeg: 40 });
    expect([opened.camState.focus, opened.camState.azimuth, opened.camState.elevation]).toEqual([asked.camState.focus, asked.camState.azimuth, asked.camState.elevation]);
    expect(opened.controls.cameraRequest).toBeNull();
    const host = { kind: "focus", target: "moon" } as const;
    const overruled = input({ firstFrame: true }, { cameraRequest: host, hostCameraRequest: host, startView: toward });
    expect(stepCameraTarget(overruled)).toBe("moon");
    expect(overruled.camState.lookOut).toBeNull();
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

describe("a held camera (a view's stay rule)", () => {
  /** One frame as the scene does it: the request step, then the camera resolved against the target it names. */
  const frameOf = (step: CameraStepInput, origin: FloatingOrigin) => {
    stepCameraTarget(step);
    resolveCamera(step.camState, cameraTargetAbsolute(step.camState, step.targets), origin, 0.5, 1e12, EQUATORIAL_UP);
    return { target: [...step.camState.targetAbsolute], camera: [...step.camState.cameraAbsolute], distance: step.camState.distance, azimuth: step.camState.azimuth, elevation: step.camState.elevation };
  };

  it("keeps the target and camera still while the object it was on moves on, and keeps the distance and angles", () => {
    const moving = new Map(positions);
    const step = input({ targets: { ...targets, placed: moving as SceneTargets["placed"], absoluteOf: (id) => moving.get(id) ?? [0, 0, 0] } });
    const origin = new FloatingOrigin();
    step.camState.focus = "moon";
    step.camState.distance = step.camState.targetDistance = 5;
    const before = frameOf(step, origin);
    expect(before.target).toEqual([60, 0, 0]);
    step.controls.cameraRequest = { kind: "hold" };
    const held = frameOf(step, origin);
    expect(held).toEqual(before);
    for (const x of [90, 400, 5000]) {
      moving.set("moon", [x, 0, 0]); // the clock runs: the object moves
      expect(frameOf(step, origin)).toEqual(before);
    }
  });

  it("is replaced by the next focus: picking a new object focuses it normally and the target follows it again", () => {
    const moving = new Map(positions);
    const step = input({ targets: { ...targets, placed: moving as SceneTargets["placed"], absoluteOf: (id) => moving.get(id) ?? [0, 0, 0] } });
    const origin = new FloatingOrigin();
    step.camState.focus = "moon";
    step.controls.cameraRequest = { kind: "hold" };
    frameOf(step, origin);
    moving.set("moon", [500, 0, 0]);
    step.controls.cameraRequest = { kind: "focus", target: "sun" };
    stepCameraTarget(step);
    expect(step.camState.focus).toBe("sun");
    expect(step.camState.fixedPoint).toBeNull();
    for (let i = 0; i < 40; i += 1) frameOf(step, origin);
    expect(step.camState.targetAbsolute).toEqual([0, 0, 20000]);
    moving.set("sun", [0, 0, 30000]);
    for (let i = 0; i < 5; i += 1) frameOf(step, origin);
    expect(step.camState.targetAbsolute).toEqual([0, 0, 30000]);
  });

  it("is released by a focus on the very object it was held on", () => {
    const step = input();
    step.camState.focus = "moon";
    step.controls.cameraRequest = { kind: "hold" };
    stepCameraTarget(step);
    expect(step.camState.fixedPoint).toEqual([60, 0, 0]);
    step.controls.cameraRequest = { kind: "follow", target: "moon" };
    stepCameraTarget(step);
    expect(step.camState.fixedPoint).toBeNull();
  });

  it("rescales its point with the visual scale, like the transition", () => {
    const camState = createOrbitCameraState(10, "earth");
    camState.fixedPoint = [1, 2, 3];
    rescaleCameraForPolicy(camState, "earth", 2);
    expect(camState.fixedPoint).toEqual([2, 4, 6]);
  });
});

describe("a pose read and restored (the host camera, T-225)", () => {
  /** Runs frames until the eased camera has settled, then reads the pose as the scene does every frame. */
  const settle = (step: CameraStepInput): StartView => {
    const origin = new FloatingOrigin();
    for (let i = 0; i < 80; i += 1) {
      stepCameraTarget(step);
      resolveCamera(step.camState, cameraTargetAbsolute(step.camState, step.targets), origin, 0.5, 1e12, EQUATORIAL_UP);
    }
    const { camState } = step;
    return viewFromAngles(camState.focus, camState.azimuth, camState.elevation, camState.distance);
  };
  const standing = (focus: string, azimuth: number, elevation: number, distance: number): CameraStepInput => {
    const step = input();
    Object.assign(step.camState, { focus, azimuth, targetAzimuth: azimuth, elevation, targetElevation: elevation, distance, targetDistance: distance });
    return step;
  };
  const near = (a: StartView, b: StartView) => {
    expect(a.focus).toBe(b.focus);
    expect(a.azimuthDeg).toBeCloseTo(b.azimuthDeg, 1);
    expect(a.elevationDeg).toBeCloseTo(b.elevationDeg, 1);
    expect(a.distance / b.distance).toBeCloseTo(1, 4);
  };

  it("puts the camera back where it was read after the visitor moved it", () => {
    const step = standing("moon", 2, 0.3, 9);
    const read = settle(step);
    Object.assign(step.camState, { focus: "earth", azimuth: 4, targetAzimuth: 4, elevation: -0.2, targetElevation: -0.2, distance: 14, targetDistance: 14 });
    step.controls.cameraRequest = { kind: "pose", view: read };
    near(settle(step), read);
    expect(step.controls.cameraRequest).toBeNull();
  });

  it("each input alone: only the focus, only the azimuth, only the elevation or only the distance differs", () => {
    const base = { azimuth: 2, elevation: 0.3, distance: 9 };
    const changes: Array<Partial<typeof base> & { focus?: string }> = [{ focus: "earth" }, { azimuth: 5 }, { elevation: -0.4 }, { distance: 30 }];
    for (const change of changes) {
      const step = standing("moon", base.azimuth, base.elevation, base.distance);
      const read = settle(step);
      const moved = { focus: "moon", ...base, ...change };
      Object.assign(step.camState, { focus: moved.focus, azimuth: moved.azimuth, targetAzimuth: moved.azimuth, elevation: moved.elevation, targetElevation: moved.elevation, distance: moved.distance, targetDistance: moved.distance });
      step.controls.cameraRequest = { kind: "pose", view: read };
      near(settle(step), read);
    }
  });

  it("the followed object moves between read and restore: the camera restores the same offset from where the object is now", () => {
    const step = standing("moon", 2, 0.3, 9);
    const read = settle(step);
    const offsetBefore = step.camState.cameraAbsolute.map((v, k) => v - step.camState.targetAbsolute[k]);
    positions.set("moon", [400, 55, -30]);
    try {
      Object.assign(step.camState, { focus: "earth", azimuth: 4, targetAzimuth: 4, distance: 14, targetDistance: 14 });
      step.controls.cameraRequest = { kind: "pose", view: read };
      near(settle(step), read);
      expect(step.camState.targetAbsolute).toEqual([400, 55, -30]);
      const offsetAfter = step.camState.cameraAbsolute.map((v, k) => v - step.camState.targetAbsolute[k]);
      offsetAfter.forEach((v, k) => expect(v / Math.hypot(...offsetBefore)).toBeCloseTo(offsetBefore[k] / Math.hypot(...offsetBefore), 4));
    } finally {
      positions.set("moon", [60, 0, 0]);
    }
  });

  it("restores after the camera was following a moving object (it keeps up, then returns to the read pose)", () => {
    const step = standing("moon", 2, 0.3, 9);
    step.controls.cameraRequest = { kind: "follow", target: "moon" };
    const read = settle(step);
    positions.set("moon", [-90, 20, 10]);
    try {
      settle(step); // the camera has followed the Moon to its new place
      expect(step.camState.targetAbsolute).toEqual([-90, 20, 10]);
      positions.set("moon", [10, 5, 5]);
      step.controls.cameraRequest = { kind: "pose", view: read };
      near(settle(step), read);
      expect(step.camState.targetAbsolute).toEqual([10, 5, 5]);
    } finally {
      positions.set("moon", [60, 0, 0]);
    }
  });

  it("also takes the camera out of a hold (the stay rule)", () => {
    const step = standing("moon", 2, 0.3, 9);
    const read = settle(step);
    step.controls.cameraRequest = { kind: "hold" };
    settle(step);
    expect(step.camState.fixedPoint).not.toBeNull();
    step.controls.cameraRequest = { kind: "pose", view: read };
    near(settle(step), read);
    expect(step.camState.fixedPoint).toBeNull();
  });
});
