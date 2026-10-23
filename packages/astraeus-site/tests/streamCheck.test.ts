import { describe, expect, it } from "vitest";
import { assertStreamDrawn } from "../tools/validate/stream-check.mjs";

describe("the browser checks' meteor stream assertion (I-071)", () => {
  it("fails when a showers view has no stream dots in view, even though bodies and paths are drawn", () => {
    expect(() => assertStreamDrawn(0, "showers-perseids")).toThrow(/showers-perseids: the meteor stream is not drawn/);
    expect(() => assertStreamDrawn(Number.NaN, "showers")).toThrow(/not drawn/);
  });

  it("passes and returns the count when dots are in view", () => {
    expect(assertStreamDrawn(1200, "showers-perseids")).toBe(1200);
  });
});
