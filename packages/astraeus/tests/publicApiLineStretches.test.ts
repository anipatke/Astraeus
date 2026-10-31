// O-050 T-213: one path whose line is drawn against a different body in each stretch (a flyby). Made-up configurations only (ARCH-03).
import { describe, expect, it } from "vitest";
import { Frustum, Matrix4, PerspectiveCamera, Vector3 } from "three";
import { Scene, SceneError, earth, mars, moon, sun } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createStateResolver } from "../src/core/stateResolver";
import { trueScale } from "../src/core/scalePolicy";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { TrackedBodyView } from "../src/app/TrackedBodyView";
import { trackedBodiesOf } from "../src/app/experienceDefinition";
import { bodyAbsolute } from "../src/app/sceneLayout";
import { placementAbout } from "./scenePlacement";
import { createOrbitCameraState, poseCamera, resolveCamera } from "../src/app/CameraController";
import { stepCameraTarget } from "../src/app/sceneCamera";
import { canFocus, focusAbsoluteOf, labelPositionOf, type SceneTargets } from "../src/app/sceneTargets";
import { EQUATORIAL_UP } from "../src/app/viewUp";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const DAY = 86_400_000;
const resolver = () => createStateResolver(catalogue.definitions(), catalogue.sources(), createOrbAstronomyAdapter());
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const at = (day: number) => new Date(T0 + day * DAY).toISOString();

/** A made-up straight cruise about the Sun, 11 samples 20 days apart. */
const cruise = () => Array.from({ length: 11 }, (_, i) => ({ time: T0 + i * 20 * DAY, positionKm: [1.2e8 + i * 1e6, 2e7 * i, 5e6] }));
const flyby = [{ start: at(0), end: at(60), body: "sun" }, { start: at(60), end: at(140), body: "mars" }, { start: at(140), end: at(200), body: "sun" }];
const solar = (lineFixedTo: unknown) => new Scene().addBody(sun).addBody(earth, { enlarge: 50 }).addBody(mars, { enlarge: 50 }).setTime(T0).addTrajectory({ id: "probe", center: "sun", samples: cruise(), lineFixedTo: lineFixedTo as never });

const vertices = (view: TrackedBodyView, centre: "sun" | "earth", timeUtcMs: number): number[][] => {
  view.update(timeUtcMs, trueScale, new FloatingOrigin(), new PerspectiveCamera(), placementAbout(centre));
  const read = (index: number) => Array.from((view.group.children[index] as any).geometry.getAttribute("position").array as Float32Array);
  const travelled = read(0);
  return Array.from({ length: travelled.length / 3 }, (_, i) => travelled.slice(i * 3, i * 3 + 3));
};
const near = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!) / Math.hypot(...b);

describe("lineFixedTo as a list of stretches", () => {
  it("builds one path, one menu entry that is available across the whole span", () => {
    const definition = solar(flyby).toDefinition();
    const entries = definition.experience.objects.filter((o) => o.id === "probe");
    expect(entries).toHaveLength(1);
    expect(entries[0]!.availability).toEqual({ startUtcMs: T0, endUtcMs: T0 + 200 * DAY });
    expect(trackedBodiesOf(definition)).toHaveLength(1);
  });

  it("names the index of each fault", () => {
    const code = (list: unknown) => codeOf(() => solar(list).toDefinition());
    expect(code([{ start: at(0), end: at(60), body: "jupiter" }])).toMatch(/^bad-trajectory: addTrajectory\("probe"\): lineFixedTo\[0\] names "jupiter"/);
    expect(code([flyby[0], { start: at(50), end: at(100), body: "mars" }])).toMatch(/lineFixedTo\[1\] overlaps or is out of order/);
    expect(code([{ start: at(0), end: at(300), body: "sun" }])).toMatch(/lineFixedTo\[0\] lies outside the path/);
    expect(code([{ start: at(10), end: at(10), body: "sun" }])).toMatch(/lineFixedTo\[0\] must end after it starts/);
    expect(code([flyby[0], { start: "not a time", end: at(100), body: "mars" }])).toMatch(/lineFixedTo\[1\]/);
    expect(code([{ start: at(0), end: at(10), body: 4 }])).toMatch(/lineFixedTo\[0\] body must be a body id/);
    expect(code({})).toMatch(/lineFixedTo must be a list/);
  });

  it("draws each stretch against its own body: the boundary vertex is placed from Mars at its own time, carried to Mars at the clock time", () => {
    const view = new TrackedBodyView(trackedBodiesOf(solar(flyby).toDefinition())[0]!);
    const clock = T0 + 200 * DAY;
    const drawn = vertices(view, "sun", clock);
    const r = resolver();
    const sample = (i: number) => cruise()[i]!.positionKm;
    const against = (i: number, body: string | null) => {
      const t = T0 + i * 20 * DAY;
      if (body === null) return sample(i);
      const then = r.stateOf(body, t, "sun").positionKm;
      const now = r.stateOf(body, clock, "sun").positionKm;
      return sample(i).map((v, k) => v - then[k]! + now[k]!);
    };
    // sample 3 (day 60) opens the Mars stretch; sample 2 closes the Sun one; sample 7 (day 140) opens the last Sun stretch
    expect(near(drawn[3]!, [...bodyAbsolute(against(3, "mars"), trueScale)])).toBeLessThan(1e-6);
    expect(near(drawn[2]!, [...bodyAbsolute(against(2, null), trueScale)])).toBeLessThan(1e-6);
    expect(near(drawn[7]!, [...bodyAbsolute(against(7, null), trueScale)])).toBeLessThan(1e-6);
    // the Mars-fixed stretch moves with the clock, the Sun-fixed ones do not
    const earlier = vertices(view, "sun", T0 + 150 * DAY);
    expect(earlier[2]).toEqual(drawn[2]);
    expect(near(earlier[3]!, drawn[3]!)).toBeGreaterThan(1e-4);
  });

  it("a plain body id is the one-stretch case", () => {
    const whole = vertices(new TrackedBodyView(trackedBodiesOf(solar("sun").toDefinition())[0]!), "sun", T0 + 200 * DAY);
    const list = vertices(new TrackedBodyView(trackedBodiesOf(solar([{ start: at(0), end: at(200), body: "sun" }]).toDefinition())[0]!), "sun", T0 + 200 * DAY);
    expect(list).toEqual(whole);
  });

  it("draws a Moon-orbit stretch against the Moon in an Earth-centred scene", () => {
    const samples = Array.from({ length: 5 }, (_, i) => ({ time: T0 + i * DAY, positionKm: [30_000 + i * 2_000, 10_000, 0] }));
    const scene = new Scene().addBody(earth).addBody(moon).setTime(T0).addTrajectory({ id: "probe", center: "earth", samples, lineFixedTo: [{ start: at(1), end: at(3), body: "moon" }] });
    const view = new TrackedBodyView(trackedBodiesOf(scene.toDefinition())[0]!);
    const clock = T0 + 4 * DAY;
    const drawn = vertices(view, "earth", clock);
    const r = resolver();
    const moonAt = (t: number) => r.stateOf("moon", t, "earth").positionKm;
    const expected = samples[1]!.positionKm.map((v, k) => v - moonAt(T0 + DAY)[k]! + moonAt(clock)[k]!);
    expect(near(drawn[1]!, [...bodyAbsolute(expected, trueScale)])).toBeLessThan(1e-6);
    expect(near(drawn[0]!, [...bodyAbsolute(samples[0]!.positionKm, trueScale)])).toBeLessThan(1e-6);
  });

  it("keeps the marker where the state puts it across both boundaries", () => {
    const view = new TrackedBodyView(trackedBodiesOf(solar(flyby).toDefinition())[0]!);
    const marker = (t: number) => { view.update(t, trueScale, new FloatingOrigin(), new PerspectiveCamera(), placementAbout("sun")); return (view.group.children[3] as any).position.clone(); };
    for (const day of [60, 140]) {
      const [before, after] = [marker(T0 + day * DAY - 1000), marker(T0 + day * DAY + 1000)];
      expect(before.distanceTo(after)).toBeLessThan(1);
      expect(view.group.children[3]!.visible).toBe(true);
    }
  });

  it("camera follow keeps the followed target at the marker, in view and available at, just before and just after each boundary", () => {
    const definition = solar(flyby).toDefinition();
    const view = new TrackedBodyView(trackedBodiesOf(definition)[0]!);
    const placement = placementAbout("sun");
    const policy = trueScale;
    const origin = new FloatingOrigin();
    const camera = new PerspectiveCamera(45, 1.6, 0.001, 1e9);
    const camState = createOrbitCameraState(20, "probe");
    const controls = { cameraRequest: { kind: "follow", target: "probe" } as const } as { cameraRequest: any };
    const frame = { centre: "sun", span: 1000, bodies: catalogue } as never;
    const targetsAt = (timeUtcMs: number): SceneTargets => ({ bodyIdFor: (id) => (catalogue.has(id) ? id : null), placed: new Map() as never, absoluteOf: () => [0, 0, 0], groupViews: [], sunCentredViews: [], trackedViews: [view], bodySetViews: [], timeUtcMs, policy, placement });
    const times = [60, 140].flatMap((day) => [-1, 0, 1].map((hours) => T0 + day * DAY + hours * 3_600_000));
    for (const timeUtcMs of times) {
      const targets = targetsAt(timeUtcMs);
      expect(() => focusAbsoluteOf(targets, "probe")).not.toThrow();
      expect(canFocus(targets, "probe")).toBe(true);
      expect(labelPositionOf(targets, "probe")).not.toBeNull();
      expect(definition.experience.objects.find((o) => o.id === "probe")!.availability!.startUtcMs).toBeLessThanOrEqual(timeUtcMs);
      stepCameraTarget({ camState, controls, targets, frame, catalogue, reach: {}, fovDeg: 45, viewUp: EQUATORIAL_UP, firstFrame: false, previousUp: null });
      expect(camState.focus).toBe("probe");
      const absolute = view.absolute(timeUtcMs, policy, placement);
      resolveCamera(camState, absolute, origin, 1, 1e12, EQUATORIAL_UP);
      poseCamera(camera, camState, 0, origin, 1e9, EQUATORIAL_UP);
      view.update(timeUtcMs, policy, origin, camera, placement);
      const marker = (view.group.children[3] as any);
      expect(marker.visible).toBe(true);
      // the camera's look-at target is the marker, and the marker is inside the view
      const target = new Vector3(...origin.toLocal(camState.targetAbsolute));
      expect(target.distanceTo(marker.position)).toBeLessThan(1e-6 * Math.max(1, camState.distance));
      camera.updateMatrixWorld();
      const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      expect(frustum.containsPoint(marker.position)).toBe(true);
    }
  });
});
