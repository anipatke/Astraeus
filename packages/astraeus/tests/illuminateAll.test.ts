import { describe, expect, it } from "vitest";
import { DEFAULT_ILLUMINATE_ALL, chooseLightDirection } from "../src/app/lighting";
import type { RenderVector } from "../src/app/renderCoordinates";

const toSun: RenderVector = [1, 0, 0];

describe("chooseLightDirection", () => {
  it("starts off, so the default is true sunlight", () => {
    expect(DEFAULT_ILLUMINATE_ALL).toBe(false);
    expect(chooseLightDirection(toSun, [0, 0, 0], [0, 5, 0], DEFAULT_ILLUMINATE_ALL)).toEqual(toSun);
  });

  it("keeps true sunlight when illuminate-all is off", () => {
    expect(chooseLightDirection(toSun, [0, 0, 0], [0, 5, 0], false)).toEqual(toSun);
  });

  it("lights from the camera's side, as a unit direction, when on", () => {
    const [x, y, z] = chooseLightDirection(toSun, [1, 1, 1], [1, 6, 1], true);
    expect([x, y, z]).toEqual([0, 1, 0]);
    const [a, b, c] = chooseLightDirection(toSun, [0, 0, 0], [3, 0, 4], true);
    expect(Math.hypot(a, b, c)).toBeCloseTo(1, 12);
    expect(a).toBeCloseTo(0.6, 12);
    expect(c).toBeCloseTo(0.8, 12);
  });

  it("falls back to sunlight when the camera sits on the body", () => {
    expect(chooseLightDirection(toSun, [2, 2, 2], [2, 2, 2], true)).toEqual(toSun);
  });
});
