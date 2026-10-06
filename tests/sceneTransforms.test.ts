import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Quaternion as ThreeQuaternion, Vector3 } from "three";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { EARTH, MOON } from "../src/core/body";
import { rotateVectorByQuaternion } from "../src/core/bodyOrientation";
import { directionFromCenterToSun, directionToSun, lunarIlluminatedFraction } from "../src/core/illumination";
import { MoonTrajectory } from "../src/core/moonTrajectory";
import { earthStateAt, sunPositionFromEarthAt } from "../src/core/referenceCenters";
import { readableScale, trueScale, type ScalePolicy } from "../src/core/scalePolicy";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import {
  DEFAULT_PATH_SAMPLES,
  mapOrbitPath,
  pathNeedsRefresh,
  sampleOrbitPath,
  SIDEREAL_MONTH_MS,
} from "../src/app/orbitPath";
import { eqjToRenderQuaternion, eqjToRenderVector } from "../src/app/renderCoordinates";
import { createSceneHierarchy, placeBodies } from "../src/app/sceneLayout";

const adapter = createOrbAstronomyAdapter();
const trajectory = new MoonTrajectory(adapter);
const T = Date.UTC(2026, 3, 1, 12, 0, 0);
const policies: ScalePolicy[] = [readableScale, trueScale];

function worldDirection(object: import("three").Object3D, local: [number, number, number]): Vector3 {
  object.updateWorldMatrix(true, false);
  return new Vector3(...local).transformDirection(object.matrixWorld);
}

function angleDeg(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return (Math.acos(Math.max(-1, Math.min(1, dot / (Math.hypot(a[0], a[1], a[2]) * Math.hypot(b[0], b[1], b[2]))))) * 180) / Math.PI;
}

describe("fixed render-axis conversion", () => {
  it("preserves handedness and rotates vectors and quaternions consistently", () => {
    const [x, y, z] = [eqjToRenderVector([1, 0, 0]), eqjToRenderVector([0, 1, 0]), eqjToRenderVector([0, 0, 1])];
    new Vector3(...x).cross(new Vector3(...y)).toArray().forEach((v, i) => expect(v).toBeCloseTo(z[i], 12));
    const q = earthStateAt(adapter, T).orientation!;
    const vector = [0.3, -0.5, 0.8];
    const eqjRotated = rotateVectorByQuaternion(q, vector);
    const renderRotated = new Vector3(...eqjToRenderVector(vector)).applyQuaternion(new ThreeQuaternion(...eqjToRenderQuaternion(q)));
    const expected = eqjToRenderVector(eqjRotated);
    renderRotated.toArray().forEach((value, i) => expect(value).toBeCloseTo(expected[i], 12));
  });
});

describe("Three.js hierarchy independence", () => {
  it.each(policies)("keeps scientific state and relative geometry after rotating camera and Earth mesh (%o)", (policy) => {
    const h = createSceneHierarchy();
    const origin = new FloatingOrigin();
    const earth = earthStateAt(adapter, T);
    const moon = trajectory.stateAt(T, "earth");
    const before = { position: Array.from(moon.positionKm), orientation: [...moon.orientation!], earthQ: [...earth.orientation!], time: moon.timeUtcMs };

    placeBodies(h, earth, moon, policy, origin);
    expect(h.moonGroup.parent).toBe(h.root);
    expect(h.earthGroup.parent).toBe(h.root);
    h.root.updateMatrixWorld(true);
    const moonWorld = h.moonGroup.getWorldPosition(new Vector3());
    const separation = moonWorld.distanceTo(h.earthGroup.getWorldPosition(new Vector3()));

    const camera = new PerspectiveCamera(45, 1.5, 0.1, 5000);
    camera.position.set(3, 2, 8);
    camera.lookAt(0, 0, 0);
    camera.position.set(-9, 4, 1);
    camera.lookAt(moonWorld);
    h.earthMesh.rotateY(1.7);
    h.earthMesh.rotateX(0.4);
    h.root.updateMatrixWorld(true);

    expect(h.moonGroup.getWorldPosition(new Vector3()).toArray()).toEqual(moonWorld.toArray());
    expect(h.moonGroup.getWorldPosition(new Vector3()).distanceTo(h.earthGroup.getWorldPosition(new Vector3()))).toBe(separation);
    expect(Array.from(moon.positionKm)).toEqual(before.position);
    expect([...moon.orientation!]).toEqual(before.orientation);
    expect([...earth.orientation!]).toEqual(before.earthQ);
    expect(moon.timeUtcMs).toBe(before.time);
  });

  it("draws both policies from the same state with the physical radius ratio and distance ratio", () => {
    const earth = earthStateAt(adapter, T);
    const moon = trajectory.stateAt(T, "earth");
    const distances = policies.map((policy) => {
      const h = createSceneHierarchy();
      placeBodies(h, earth, moon, policy, new FloatingOrigin());
      h.root.updateMatrixWorld(true);
      expect(policy.mapRadius(MOON.radiusKm) / policy.mapRadius(EARTH.radiusKm)).toBeCloseTo(MOON.radiusKm / EARTH.radiusKm, 12);
      return { d: h.moonGroup.position.length(), dir: h.moonGroup.position.clone().normalize() };
    });
    expect(distances[1].d / distances[0].d).toBeCloseTo(10, 5);
    expect(distances[0].dir.distanceTo(distances[1].dir)).toBeLessThan(1e-6);
    expect(distances[1].d * EARTH.radiusKm).toBeCloseTo(Math.hypot(...moon.positionKm), 2);
  });
});

describe("scientific orientation conversion and texture axes", () => {
  it("maps body-fixed pole to mesh +Y and longitude 0 to mesh +X in the rendered world", () => {
    const h = createSceneHierarchy();
    const earth = earthStateAt(adapter, T);
    placeBodies(h, earth, trajectory.stateAt(T, "earth"), readableScale, new FloatingOrigin());
    const pole = worldDirection(h.earthMesh, [0, 1, 0]);
    const lon0 = worldDirection(h.earthMesh, [1, 0, 0]);
    const east = worldDirection(h.earthMesh, [0, 0, -1]);
    const q = earth.orientation!;
    eqjToRenderVector(rotateVectorByQuaternion(q, [0, 0, 1])).forEach((v, i) => expect(pole.getComponent(i)).toBeCloseTo(v, 12));
    eqjToRenderVector(rotateVectorByQuaternion(q, [1, 0, 0])).forEach((v, i) => expect(lon0.getComponent(i)).toBeCloseTo(v, 12));
    eqjToRenderVector(rotateVectorByQuaternion(q, [0, 1, 0])).forEach((v, i) => expect(east.getComponent(i)).toBeCloseTo(v, 12));
  });

  it("keeps the Moon's near-side axis toward Earth across dates", () => {
    for (const date of [Date.UTC(2020, 0, 5), Date.UTC(2023, 6, 20), T, Date.UTC(2026, 3, 17, 11, 52), Date.UTC(2031, 10, 2)]) {
      const h = createSceneHierarchy();
      const moon = trajectory.stateAt(date, "earth");
      placeBodies(h, earthStateAt(adapter, date), moon, trueScale, new FloatingOrigin());
      h.root.updateMatrixWorld(true);
      const nearSide = worldDirection(h.moonMesh, [1, 0, 0]);
      const towardEarth = h.earthGroup.getWorldPosition(new Vector3()).sub(h.moonGroup.getWorldPosition(new Vector3()));
      expect(angleDeg(nearSide.toArray(), towardEarth.toArray())).toBeLessThan(0.01);
    }
  });
});

describe("floating origin", () => {
  const AU_SCALED = 1.495978707e8 / EARTH.radiusKm;

  function project(camera: PerspectiveCamera, point: number[]): Vector3 {
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    return new Vector3(...point).project(camera);
  }

  it.each([0, AU_SCALED])("keeps distances and projections invariant under origin changes (common offset %f)", (offset) => {
    for (const policy of policies) {
      const moon = trajectory.stateAt(T, "earth");
      const earthKm = [offset * EARTH.radiusKm * 1.0, 0, 0];
      const abs = (km: number[]) => eqjToRenderVector(policy.mapPosition(km));
      const earthAbs = abs(earthKm);
      const moonAbs = abs([earthKm[0] + moon.positionKm[0], moon.positionKm[1], moon.positionKm[2]]);
      const cameraAbs = [moonAbs[0] + 0.6, moonAbs[1] + 0.3, moonAbs[2] + 0.5];
      const results = [earthAbs, moonAbs, cameraAbs].map(() => [] as number[][]);
      const ndc: Vector3[] = [];
      const separations: number[] = [];
      for (const originAbs of [moonAbs, earthAbs, [earthAbs[0] + 5, earthAbs[1] - 3, earthAbs[2] + 1]]) {
        const origin = new FloatingOrigin();
        origin.set(originAbs);
        const [e, m, c] = [earthAbs, moonAbs, cameraAbs].map((p, i) => { const l = origin.toLocal(p); results[i].push(l); return new Vector3(...l); });
        separations.push(e.distanceTo(m));
        const camera = new PerspectiveCamera(45, 1.5, 0.01, 5000);
        camera.position.copy(c);
        camera.lookAt(m);
        ndc.push(project(camera, [m.x + 0.2727, m.y, m.z]));
      }
      separations.forEach((s) => expect(s / separations[0]).toBeCloseTo(1, 6));
      ndc.forEach((p) => {
        expect(p.x).toBeCloseTo(ndc[0].x, 4);
        expect(p.y).toBeCloseTo(ndc[0].y, 4);
      });
    }
  });

  it("subtracts in Float64: close Moon focus is exact near one AU where naive Float32 is not", () => {
    const origin = new FloatingOrigin();
    const moonAbs = [AU_SCALED + 60.3, 0.123456789, -0.987654321];
    origin.set(moonAbs);
    const local = origin.toLocal([moonAbs[0] + 0.1234567, moonAbs[1], moonAbs[2]]);
    expect(Math.fround(local[0])).toBeCloseTo(0.1234567, 6);
    expect(Math.abs(Math.fround(moonAbs[0] + 0.1234567) - Math.fround(moonAbs[0]) - 0.1234567)).toBeGreaterThan(1e-4);
  });

  it("rebases only past the threshold", () => {
    const origin = new FloatingOrigin();
    expect(origin.rebaseIfFar([0.5, 0, 0], 1)).toBe(false);
    expect(origin.rebaseIfFar([3, 0, 0], 1)).toBe(true);
    expect(Array.from(origin.scaledCameraOrigin)).toEqual([3, 0, 0]);
  });
});

describe("sampled orbit path", () => {
  it("derives from the same trajectory, is open, includes the selected timestamp and maps through the policy", () => {
    const samples = sampleOrbitPath(trajectory, T);
    const n = samples.timesUtcMs.length;
    expect(n).toBe(DEFAULT_PATH_SAMPLES);
    expect(samples.timesUtcMs[(n - 1) / 2]).toBe(T);
    expect(Math.abs(samples.timesUtcMs[n - 1] - samples.timesUtcMs[0] - SIDEREAL_MONTH_MS)).toBeLessThan(2);
    const first = samples.positionsKm.slice(0, 3);
    const last = samples.positionsKm.slice((n - 1) * 3);
    expect(Math.hypot(last[0] - first[0], last[1] - first[1], last[2] - first[2])).toBeGreaterThan(1_000); // not a closed ring
    for (const index of [0, 37, (n - 1) / 2, n - 1]) {
      const exact = trajectory.stateAt(samples.timesUtcMs[index], "earth").positionKm;
      expect(Array.from(samples.positionsKm.subarray(index * 3, index * 3 + 3))).toEqual(Array.from(exact));
    }
    for (const policy of policies) {
      const mapped = mapOrbitPath(samples, policy);
      const centre = (n - 1) / 2;
      expect(Array.from(mapped.subarray(centre * 3, centre * 3 + 3))).toEqual(Array.from(policy.mapPosition(trajectory.stateAt(T, "earth").positionKm)));
    }
    expect(Math.hypot(...Array.from(mapOrbitPath(samples, trueScale).subarray(0, 3))) /
      Math.hypot(...Array.from(mapOrbitPath(samples, readableScale).subarray(0, 3)))).toBeCloseTo(10, 6);
  });

  it("refreshes on seek, drift and respects the playback cadence", () => {
    const samples = sampleOrbitPath(trajectory, T);
    expect(pathNeedsRefresh(null, T, 0, 0)).toBe(true);
    expect(pathNeedsRefresh(samples, T + 60_000, 1_000, 0)).toBe(false);
    expect(pathNeedsRefresh(samples, T + 2 * 3_600_000, 1_000, 0)).toBe(true);
    expect(pathNeedsRefresh(samples, T + 2 * 3_600_000, 1_100, 1_000)).toBe(false);
    expect(pathNeedsRefresh(samples, T + 20 * 86_400_000, 1_100, 1_000)).toBe(true);
  });
});

describe("physical Sun illumination", () => {
  it("converts Earth and Moon Sun directions without readable compression", () => {
    const sun = sunPositionFromEarthAt(adapter, T);
    const moon = trajectory.stateAt(T, "earth");
    const earthDir = directionFromCenterToSun(sun);
    const moonDir = directionToSun(moon, sun);
    expect(eqjToRenderVector(earthDir)).toEqual([earthDir[0], earthDir[2], -earthDir[1]]);
    expect(angleDeg(earthDir, moonDir)).toBeLessThan(0.3);
    expect(angleDeg(earthDir, moonDir)).toBeGreaterThan(0.005); // Moon-vs-Earth parallax is real but tiny
  });

  it("puts the subsolar point where an independent NOAA-style formula does", () => {
    // Independent low-precision solar position (Meeus/NOAA), 2026-04-01 12:00 UTC.
    const d = (T - Date.UTC(2000, 0, 1, 12)) / 86_400_000;
    const rad = Math.PI / 180;
    const L = (280.46 + 0.9856474 * d) % 360;
    const g = ((357.528 + 0.9856003 * d) % 360) * rad;
    const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
    const eps = (23.439 - 0.0000004 * d) * rad;
    const decl = Math.asin(Math.sin(eps) * Math.sin(lambda)) / rad;
    const ra = (Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / rad + 360) % 360;
    const gmst = (280.46061837 + 360.98564736629 * d) % 360;
    const expectedLon = ((ra - gmst + 540) % 360) - 180;

    const earth = earthStateAt(adapter, T);
    const sun = directionFromCenterToSun(sunPositionFromEarthAt(adapter, T));
    const q = earth.orientation!;
    const inverse: [number, number, number, number] = [-q[0], -q[1], -q[2], q[3]];
    const body = rotateVectorByQuaternion(inverse, sun);
    const lon = Math.atan2(body[1], body[0]) / rad;
    const lat = Math.asin(body[2]) / rad;
    expect(Math.abs(lat - decl)).toBeLessThan(0.2);
    expect(Math.abs(lon - expectedLon)).toBeLessThan(0.5);
  });

  // USNO Astronomical Applications moon-phase API, retrieved 2026-10-06 (aa.usno.navy.mil/api/moon/phases/year?year=2026).
  it.each([
    ["new", Date.UTC(2026, 3, 17, 11, 52), 0],
    ["first quarter", Date.UTC(2026, 3, 24, 2, 32), 0.5],
    ["full", Date.UTC(2026, 3, 2, 2, 12), 1],
    ["last quarter", Date.UTC(2026, 3, 10, 4, 51), 0.5],
  ])("lunar illuminated fraction at USNO %s Moon", (_name, time, fraction) => {
    const moon = trajectory.stateAt(time, "earth");
    const sun = sunPositionFromEarthAt(adapter, time);
    expect(Math.abs(lunarIlluminatedFraction(moon, sun) - fraction)).toBeLessThan(0.03);
  });
});
