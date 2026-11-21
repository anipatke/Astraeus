import { describe, expect, it } from "vitest";
import { eqjToRenderQuaternion, eqjToRenderVector } from "../src/app/renderCoordinates";

describe("frame tags", () => {
  it("refuse a drawing-space value where an EQJ value is expected", () => {
    const noRun = (): void => {
      const v = [1, 2, 3] as const;
      const q = [0, 0, 0, 1] as const;
      // @ts-expect-error converting twice: a render vector is not an EQJ vector
      eqjToRenderVector(eqjToRenderVector(v));
      // @ts-expect-error converting a render quaternion twice
      eqjToRenderQuaternion(eqjToRenderQuaternion(q));
    };
    expect(typeof noRun).toBe("function");
  });

  it("still converts to [x, z, -y] and [x, z, -y, w] at run time", () => {
    expect(Array.from(eqjToRenderVector([1, 2, 3]))).toEqual([1, 3, -2]);
    expect(Array.from(eqjToRenderQuaternion([1, 2, 3, 4]))).toEqual([1, 3, -2, 4]);
  });
});
