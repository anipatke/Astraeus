import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { JUPITER_ROTATION, MARS_ROTATION, MERCURY_ROTATION, VENUS_ROTATION } from "../src/core/bodies";
import { iauAnglesAt, iauBodyToEqjMatrix, iauOrientation, type IauRotationElements } from "../src/core/iauRotation";
import { rotateVectorByQuaternion } from "../src/core/bodyOrientation";
import { createPlanetSunTrajectory } from "../src/core/bodies/planetTrajectory";
import { elementsFromKernel, pckLines, rotationFixture } from "./planetFixtures";

const LIGHT_KM_S = 299_792.458;
const adapter = createOrbAstronomyAdapter();

/**
 * Planetographic (west-positive) longitude and planetocentric latitude of the Earth as seen from a planet, the way Horizons'
 * ObsSub columns are made: the planet is taken where it was one light time ago and the Earth where it is now.
 */
function subEarth(planet: "mars" | "jupiter", elements: IauRotationElements, utcMs: number): { westLonDeg: number; latDeg: number } {
  const earth = adapter.earthPositionFromSunKm(utcMs);
  let position = adapter.planetPositionFromSunKm(planet, utcMs);
  let lightMs = 0;
  for (let pass = 0; pass < 4; pass += 1) {
    position = adapter.planetPositionFromSunKm(planet, utcMs - lightMs);
    lightMs = Math.round((Math.hypot(position[0] - earth[0], position[1] - earth[1], position[2] - earth[2]) / LIGHT_KM_S) * 1000);
  }
  const m = iauBodyToEqjMatrix(elements, adapter.daysSinceJ2000Tt(utcMs - lightMs));
  const toEarth = [earth[0] - position[0], earth[1] - position[1], earth[2] - position[2]];
  const range = Math.hypot(toEarth[0], toEarth[1], toEarth[2]);
  // Transpose of the body-to-EQJ matrix takes the EQJ direction into body axes.
  const body = [0, 1, 2].map((axis) => (m[axis] * toEarth[0] + m[3 + axis] * toEarth[1] + m[6 + axis] * toEarth[2]) / range);
  const eastDeg = (Math.atan2(body[1], body[0]) * 180) / Math.PI;
  return { westLonDeg: (((-eastDeg % 360) + 360) % 360), latDeg: (Math.asin(body[2]) * 180) / Math.PI };
}

function longitudeErrorDeg(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

function maxLongitudeError(planet: "mars" | "jupiter", elements: IauRotationElements): number {
  const samples = rotationFixture.bodies[planet].samples;
  return Math.max(...samples.map((s) => longitudeErrorDeg(subEarth(planet, elements, s.utcMs).westLonDeg, s.subObserverWestLonDeg)));
}

describe("IAU rotation model", () => {
  const elements: IauRotationElements = { poleRaDeg: [40, 0], poleDecDeg: [60, 0], primeMeridianDeg: [10, 360], citation: "made up" };

  it("builds a right-handed body-to-EQJ basis whose +Z is the pole and whose +X turns with W", () => {
    const m = iauBodyToEqjMatrix(elements, 0);
    const ra = (40 * Math.PI) / 180, dec = (60 * Math.PI) / 180;
    expect([m[2], m[5], m[8]]).toEqual([expect.closeTo(Math.cos(dec) * Math.cos(ra), 12), expect.closeTo(Math.cos(dec) * Math.sin(ra), 12), expect.closeTo(Math.sin(dec), 12)]);
    const column = (c: number) => [m[c], m[3 + c], m[6 + c]];
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const [x, y, z] = [column(0), column(1), column(2)];
    expect(dot(x, x)).toBeCloseTo(1, 12);
    expect(dot(x, y)).toBeCloseTo(0, 12);
    expect(dot(x, z)).toBeCloseTo(0, 12);
    expect(dot([x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]], z)).toBeCloseTo(1, 12);
    // W = 10 degrees at day 0; a quarter day later (rate 360 degrees per day) it has turned a quarter more, and a whole day returns it.
    const quarter = iauBodyToEqjMatrix(elements, 0.25);
    expect(dot(column(0), [quarter[0], quarter[3], quarter[6]])).toBeCloseTo(Math.cos(Math.PI / 2), 12);
    const day = iauBodyToEqjMatrix(elements, 1);
    for (let k = 0; k < 9; k += 1) expect(day[k]).toBeCloseTo(m[k], 9);
  });

  it("applies the pole rates per Julian century and the prime-meridian rate per day", () => {
    const moving: IauRotationElements = { poleRaDeg: [10, 2], poleDecDeg: [50, -1], primeMeridianDeg: [5, 3], citation: "made up" };
    const angles = iauAnglesAt(moving, 36_525);
    expect(angles.raRad).toBeCloseTo((12 * Math.PI) / 180, 12);
    expect(angles.decRad).toBeCloseTo((49 * Math.PI) / 180, 12);
    expect(angles.wRad).toBeCloseTo(((5 + 3 * 36_525) * Math.PI) / 180, 9);
  });

  it("rejects elements without finite numbers or a citation, and a non-finite time", () => {
    expect(() => iauBodyToEqjMatrix({ ...elements, citation: " " }, 0)).toThrow(/citation/);
    expect(() => iauBodyToEqjMatrix({ ...elements, poleRaDeg: [Number.NaN, 0] }, 0)).toThrow(/finite/);
    expect(() => iauBodyToEqjMatrix(elements, Number.NaN)).toThrow(/finite/);
  });

  it("turns a made-up planet through the same state-source path as the real ones", () => {
    const fakeAdapter = { ...adapter, planetPositionFromSunKm: () => Float64Array.of(1e8, 2e8, 3e7), daysSinceJ2000Tt: (t: number) => t / 86_400_000 };
    const trajectory = createPlanetSunTrajectory("mars", elements, fakeAdapter);
    const state = trajectory.stateAt(43_200_000);
    expect(Array.from(state.positionKm)).toEqual([1e8, 2e8, 3e7]);
    expect(state.center).toBe("sun");
    const pole = rotateVectorByQuaternion(state.orientation!, [0, 0, 1]);
    const m = iauBodyToEqjMatrix(elements, 0.5);
    expect(pole[0]).toBeCloseTo(m[2], 12);
    expect(pole[2]).toBeCloseTo(m[8], 12);
    expect(() => trajectory.stateAt(0, "earth")).toThrow(/Sun-centred/);
    expect(iauOrientation(elements, 0.5)).toEqual(state.orientation);
  });
});

describe("shipped rotation constants", () => {
  it("equal the NAIF pck00011 lines of the IAU 2015 report archived in the repository", () => {
    for (const [body, shipped] of [[199, MERCURY_ROTATION], [299, VENUS_ROTATION], [499, MARS_ROTATION], [599, JUPITER_ROTATION]] as const) {
      const archived = elementsFromKernel("pck00011", body);
      expect(shipped.poleRaDeg).toEqual(archived.poleRaDeg);
      expect(shipped.poleDecDeg).toEqual(archived.poleDecDeg);
      expect(shipped.primeMeridianDeg).toEqual(archived.primeMeridianDeg);
      expect(shipped.citation).toMatch(/Archinal.*2015.*130.*pck00011/);
    }
    expect(pckLines().length).toBeGreaterThanOrEqual(18);
  });
});

describe("sub-Earth longitude against JPL Horizons (six dates, 1969 to 2030)", () => {
  it("Jupiter (System III, the same constants in both IAU reports) agrees within 0.02 degrees", () => {
    const worst = maxLongitudeError("jupiter", JUPITER_ROTATION);
    expect(worst).toBeLessThan(0.02);
  });

  it("Mars agrees within 0.02 degrees when given the IAU 2009 constants Horizons uses for it", () => {
    const worst = maxLongitudeError("mars", elementsFromKernel("pck00010", 499));
    expect(worst).toBeLessThan(0.02);
  });

  it("Mars with the shipped IAU 2015 constants differs from Horizons by under 1.2 degrees, the size of the change between the reports", () => {
    const worst = maxLongitudeError("mars", MARS_ROTATION);
    expect(worst).toBeGreaterThan(0.3);
    expect(worst).toBeLessThan(1.2);
  });

  it("the sub-Earth latitude follows the pole: Jupiter within 0.7 degrees of Horizons' planetographic latitude", () => {
    // Horizons' latitude is planetographic and the model's planetocentric; they differ by the flattening, at most ~0.45 degrees here.
    for (const s of rotationFixture.bodies.jupiter.samples) {
      expect(Math.abs(subEarth("jupiter", JUPITER_ROTATION, s.utcMs).latDeg - s.subObserverLatDeg)).toBeLessThan(0.7);
    }
  });
});
