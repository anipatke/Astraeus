import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { createOrbitCameraState, poseCamera, resolveCamera } from "../src/app/CameraController";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { eqjToRenderVector, type RenderVector } from "../src/app/renderCoordinates";
import { EQUATORIAL_UP, orbitAnglesFor, orbitBasis, viewUpFromSearch, viewUpVector } from "../src/app/viewUp";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";

const matrix = createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix();
const sinE = -matrix[5];
const cosE = matrix[8];
const dot = (a: ArrayLike<number>, b: ArrayLike<number>): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function pose(up: RenderVector, elevation: number, azimuth = 0.7): { camera: PerspectiveCamera; state: ReturnType<typeof createOrbitCameraState> } {
  const state = createOrbitCameraState(10, "sun");
  state.distance = state.targetDistance = 10;
  state.azimuth = state.targetAzimuth = azimuth;
  state.elevation = state.targetElevation = elevation;
  const origin = new FloatingOrigin();
  resolveCamera(state, [0, 0, 0], origin, 0, 1e9, up);
  const camera = new PerspectiveCamera(45, 1.6, 0.1, 1000);
  poseCamera(camera, state, 0, origin, 1000, up);
  camera.updateMatrixWorld(true);
  return { camera, state };
}

describe("ecliptic-up view", () => {
  it("is ecliptic north from the engine's own matrix: (0, cos e, sin e) in render axes, to 1e-9", () => {
    const up = viewUpVector("ecliptic");
    expect(up[0]).toBeCloseTo(0, 9);
    expect(up[1]).toBeCloseTo(cosE, 9);
    expect(up[2]).toBeCloseTo(sinE, 9);
    expect(Math.hypot(...up)).toBeCloseTo(1, 12);
    expect(Math.abs(Math.asin(sinE) * 180 / Math.PI - 23.439)).toBeLessThan(0.01);
    expect(viewUpVector("equatorial")).toEqual([0, 1, 0]);
    expect(viewUpVector(undefined)).toEqual(EQUATORIAL_UP);
  });

  it("reads ?up= over the experience's own setting", () => {
    expect(viewUpFromSearch("?up=ecliptic", "equatorial")).toBe("ecliptic");
    expect(viewUpFromSearch("?up=equatorial", "ecliptic")).toBe("equatorial");
    expect(viewUpFromSearch("?up=sideways", "ecliptic")).toBe("ecliptic");
    expect(viewUpFromSearch("", "equatorial")).toBe("equatorial");
  });

  it("leaves the default camera exactly as before", () => {
    const { camera, state } = pose(EQUATORIAL_UP, 0.25);
    const d = 10;
    const expected = [d * Math.cos(0.25) * Math.sin(0.7), d * Math.sin(0.25), d * Math.cos(0.25) * Math.cos(0.7)];
    for (let k = 0; k < 3; k += 1) expect(state.cameraAbsolute[k]).toBeCloseTo(expected[k], 12);
    expect(camera.up.toArray()).toEqual([0, 1, 0]);
  });

  it("sets camera.up to ecliptic north and orbits about it: the offset is perpendicular to it at elevation 0 and along it at the pole, to 1e-9", () => {
    const up = viewUpVector("ecliptic");
    const side = pose(up, 0);
    expect(side.camera.up.distanceTo(new Vector3(...up))).toBeLessThan(1e-9);
    expect(dot(side.state.cameraAbsolute, up)).toBeCloseTo(0, 9);
    const top = pose(up, Math.PI / 2);
    for (let k = 0; k < 3; k += 1) expect(top.state.cameraAbsolute[k]).toBeCloseTo(10 * up[k], 9);
    const { east, south } = orbitBasis(up);
    expect(dot(east, up)).toBeCloseTo(0, 12);
    expect(dot(south, up)).toBeCloseTo(0, 12);
    expect(dot(east, south)).toBeCloseTo(0, 12);
  });

  it("puts Earth's orbit normal parallel to screen-up in a side view", () => {
    const adapter = createOrbAstronomyAdapter();
    const t = Date.UTC(2027, 7, 13);
    const [p0, p1] = [t, t + 6 * 3_600_000].map((time) => eqjToRenderVector(adapter.earthPositionFromSunKm(time)));
    const normal = new Vector3(...p0).cross(new Vector3(...p1)).normalize();
    for (const azimuth of [0.7, 2.1]) {
      const { camera } = pose(viewUpVector("ecliptic"), 0, azimuth);
      const screenUp = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      expect(Math.abs(screenUp.dot(normal))).toBeGreaterThan(1 - 1e-3);
    }
    // Under the default (celestial north) view the same normal is tilted by the obliquity from screen-up.
    const { camera } = pose(EQUATORIAL_UP, 0);
    const screenUp = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    expect(Math.acos(Math.abs(screenUp.dot(normal))) * 180 / Math.PI).toBeGreaterThan(23);
  });

  it("re-poses in place: the angles for the same offset under the other up direction rebuild exactly that offset", () => {
    const first = pose(EQUATORIAL_UP, 0.4, 1.9);
    const offset = [0, 1, 2].map((k) => first.state.cameraAbsolute[k]) as RenderVector;
    for (const target of [viewUpVector("ecliptic"), EQUATORIAL_UP]) {
      const angles = orbitAnglesFor(offset, target)!;
      const again = pose(target, angles.elevation, angles.azimuth);
      for (let k = 0; k < 3; k += 1) expect(again.state.cameraAbsolute[k]).toBeCloseTo(offset[k], 9);
    }
    expect(orbitAnglesFor([0, 0, 0], EQUATORIAL_UP)).toBeNull();
  });
});
