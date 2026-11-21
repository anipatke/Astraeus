import { describe, expect, it } from "vitest";
import { waitForSettledCamera } from "../tools/validate/driver.mjs";

// I-192: the viewer handle reports every frame, so a step-direction read waits for the pose to stop changing.
const fakePage = (poses: Array<Record<string, unknown>>) => {
  let i = 0;
  return {
    waitForFunction: async () => undefined,
    waitForTimeout: async () => undefined,
    evaluate: async () => poses[Math.min(i++, poses.length - 1)],
  };
};
const at = (raDeg: number) => ({ lookOut: "earth", raDeg, decDeg: -18, fovDeg: 40 });

describe("driver settled camera wait", () => {
  it("returns only after the pose has stopped changing", async () => {
    const page = fakePage([at(290), at(289), at(288.5), at(288.5), at(288.5)]);
    const reading = await waitForSettledCamera(page, (r: { sky: boolean }) => r.sky);
    expect(reading).toMatchObject({ raDeg: 288.5 });
  });
  it("times out naming what it waited for when the pose keeps moving", async () => {
    let ra = 300;
    const page = { ...fakePage([]), evaluate: async () => at((ra -= 1)) };
    await expect(waitForSettledCamera(page, () => true, { timeout: 30, what: "the camera to stop" })).rejects.toThrow(
      /the camera to stop never happened/,
    );
  });
});
