import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { MOON, MOON_IAU_REPORT, MOON_ROTATION } from "../src/core/bodies/moon";
import { rotateVectorByQuaternion } from "../src/core/bodyOrientation";
import { iauAnglesAt, iauOrientation, type IauRotationElements } from "../src/core/iauRotation";
import { MoonTrajectory } from "../src/core/moonTrajectory";
import fixture from "./fixtures/moon-rotation-horizons.json";

const adapter = createOrbAstronomyAdapter();
const DEG = 180 / Math.PI;

/** Sub-Earth point (east longitude, latitude, degrees) from a body-to-EQJ quaternion and the Moon's geocentric position. */
function subEarth(orientation: readonly number[], moonFromEarthKm: ArrayLike<number>): { eastLonDeg: number; latDeg: number } {
  const conjugate = [-orientation[0], -orientation[1], -orientation[2], orientation[3]] as const;
  const toEarth = rotateVectorByQuaternion(conjugate, [-moonFromEarthKm[0], -moonFromEarthKm[1], -moonFromEarthKm[2]]);
  const range = Math.hypot(toEarth[0], toEarth[1], toEarth[2]);
  return { eastLonDeg: Math.atan2(toEarth[1], toEarth[0]) * DEG, latDeg: Math.asin(toEarth[2] / range) * DEG };
}

const wrap = (deg: number): number => ((deg + 540) % 360) - 180;

describe("Moon orientation: IAU rotation with libration", () => {
  const moon = new MoonTrajectory(adapter);

  it("is the IAU model, with its source recorded", () => {
    expect(MOON.orientation).toBe("iau-rotation");
    expect(MOON_ROTATION.citation).toBe(MOON_IAU_REPORT);
    expect(MOON_IAU_REPORT).toContain("pck00011");
    expect(MOON_ROTATION.periodic?.anglesDeg).toHaveLength(13);
  });

  it("evaluates the report's formulas at J2000 (hand-summed pole and prime meridian)", () => {
    const { raRad, decRad, wRad } = iauAnglesAt(MOON_ROTATION, 0);
    const sin = (deg: number) => Math.sin((deg * Math.PI) / 180);
    const cos = (deg: number) => Math.cos((deg * Math.PI) / 180);
    const ra = 269.9949 - 3.8787 * sin(125.045) - 0.1204 * sin(250.089) + 0.07 * sin(260.008) - 0.0172 * sin(176.625) + 0.0072 * sin(311.589) - 0.0052 * sin(15.134) + 0.0043 * sin(25.053);
    const dec = 66.5392 + 1.5419 * cos(125.045) + 0.0239 * cos(250.089) - 0.0278 * cos(260.008) + 0.0068 * cos(176.625) - 0.0029 * cos(311.589) + 0.0009 * cos(134.963) + 0.0008 * cos(15.134) - 0.0009 * cos(25.053);
    expect(raRad * DEG).toBeCloseTo(ra, 9);
    expect(decRad * DEG).toBeCloseTo(dec, 9);
    expect(wRad * DEG).toBeGreaterThan(38);
    expect(wRad * DEG).toBeLessThan(45);
  });

  it("matches Horizons' sub-Earth point (MOON_ME frame) at seven dates 1969-2050 within the recorded residual", () => {
    const residuals = fixture.samples.map((s) => {
      const state = moon.stateAt(s.utcMs);
      const mine = subEarth(state.orientation!, state.positionKm);
      return { lon: Math.abs(wrap(mine.eastLonDeg - s.eastLonDeg)), lat: Math.abs(mine.latDeg - s.latDeg) };
    });
    // Measured 2026-10-24: longitude at most 0.006 degrees, latitude at most 0.003 (Issue I-091 history); the bounds leave a little room.
    expect(Math.max(...residuals.map((r) => r.lon))).toBeLessThan(0.01);
    expect(Math.max(...residuals.map((r) => r.lat))).toBeLessThan(0.01);
  });

  it("puts the north pole where Horizons does (ICRF right ascension and declination) at the same dates", () => {
    const worst = fixture.samples.map((s) => {
      const { raRad, decRad } = iauAnglesAt(MOON_ROTATION, adapter.daysSinceJ2000Tt(s.utcMs));
      const dRa = wrap(raRad * DEG - s.poleRaDeg) * Math.cos(decRad);
      return Math.hypot(dRa, decRad * DEG - s.poleDecDeg);
    });
    // Measured 2026-10-24: see the Issue I-091 history (the IAU series and Horizons' mean-Earth pole differ by at most 0.0032 degrees here).
    expect(Math.max(...worst)).toBeLessThan(0.01);
  });

  it("shows libration: the sub-Earth point moves off the lock by degrees, in both longitude and latitude", () => {
    const points = fixture.samples.map((s) => subEarth(moon.stateAt(s.utcMs).orientation!, moon.stateAt(s.utcMs).positionKm));
    expect(Math.max(...points.map((p) => Math.abs(wrap(p.eastLonDeg))))).toBeGreaterThan(3);
    expect(Math.max(...points.map((p) => Math.abs(p.latDeg)))).toBeGreaterThan(4);
  });

  it("is generic (ARCH-03): a made-up body with libration terms follows the same formulas", () => {
    const made: IauRotationElements = {
      poleRaDeg: [10, 0], poleDecDeg: [50, 0], primeMeridianDeg: [0, 0],
      periodic: { anglesDeg: [[30, 0]], poleRaDeg: [2], poleDecDeg: [3], primeMeridianDeg: [4] },
      citation: "made up",
    };
    const { raRad, decRad, wRad } = iauAnglesAt(made, 123);
    expect(raRad * DEG).toBeCloseTo(10 + 2 * Math.sin(Math.PI / 6), 12);
    expect(decRad * DEG).toBeCloseTo(50 + 3 * Math.cos(Math.PI / 6), 12);
    expect(wRad * DEG).toBeCloseTo(4 * Math.sin(Math.PI / 6), 12);
    // Its body +Z axis is that pole.
    const z = rotateVectorByQuaternion(iauOrientation(made, 123), [0, 0, 1]);
    expect(Math.atan2(z[1], z[0]) * DEG).toBeCloseTo(10 + 2 * Math.sin(Math.PI / 6), 9);
    expect(Math.asin(z[2]) * DEG).toBeCloseTo(50 + 3 * Math.cos(Math.PI / 6), 9);
  });

  it("reports the limitations it keeps", () => {
    const text = MOON.accuracy.orientationLimitations.join(" ");
    expect(text).not.toContain("no libration, so");
    expect(text).toContain("libration");
  });
});
