import { describe, expect, it } from "vitest";
import { assertSceneDrawn, assertStreamDrawn } from "../tools/validate/stream-check.mjs";

describe("the browser checks' meteor stream assertion (I-071)", () => {
  it("fails when a showers view has no stream dots in view, even though bodies and paths are drawn", () => {
    expect(() => assertStreamDrawn(0, "showers-perseids")).toThrow(/showers-perseids: the meteor stream is not drawn/);
    expect(() => assertStreamDrawn(Number.NaN, "showers")).toThrow(/not drawn/);
  });

  it("passes and returns the count when dots are in view", () => {
    expect(assertStreamDrawn(1200, "showers-perseids")).toBe(1200);
  });
});

describe("the browser checks' scene-drawn assertion (O-088 T-403, AH-33)", () => {
  it.each([
    ["all zero", { bodies: 0, dots: 0, paths: 0, stars: 0 }, false],
    ["stars only", { bodies: 0, dots: 0, paths: 0, stars: 5000 }, false],
    ["one body", { bodies: 1, dots: 0, paths: 0, stars: 0 }, true],
    ["one dot", { bodies: 0, dots: 1, paths: 0, stars: 0 }, true],
    ["one path", { bodies: 0, dots: 0, paths: 1, stars: 0 }, true],
  ])("%s", (_name, drawn, passes) => {
    if (passes) expect(assertSceneDrawn(drawn, "apollo11")).toBe(drawn);
    else
      expect(() => assertSceneDrawn(drawn, "apollo11")).toThrow(
        /apollo11: the scene shows no body, dot or path in view/,
      );
  });
});
