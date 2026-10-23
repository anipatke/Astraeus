import { describe, expect, it } from "vitest";
import { assertScaleInUse } from "../tools/validate/driver.mjs";

// I-036: a browser check that asks for a scale the experience does not offer fails loudly instead of silently rendering the default.
const fakePage = (options: string[] | null, current: string) => ({
  locator: () => ({
    count: async () => (options === null ? 0 : 1),
    getAttribute: async (name: string) => (name === "data-scale-options" ? options?.join(",") : current),
  }),
});

describe("driver scale guard", () => {
  it("passes when the scale is offered and in force", async () => {
    await expect(assertScaleInUse(fakePage(["true-scale", "readable-scale"], "readable-scale"), "readable-scale")).resolves.toBeUndefined();
  });
  it("fails for an id the experience does not offer (readable on a True-only experience, or the unknown id 'readable')", async () => {
    await expect(assertScaleInUse(fakePage(null, "true-scale"), "readable-scale")).rejects.toThrow(/does not offer/);
    await expect(assertScaleInUse(fakePage(["true-scale", "readable-scale"], "true-scale"), "readable")).rejects.toThrow(/does not offer/);
  });
  it("fails when the offered scale is not the one in force", async () => {
    await expect(assertScaleInUse(fakePage(["true-scale", "readable-scale"], "true-scale"), "readable-scale")).rejects.toThrow(/in force/);
  });
});
