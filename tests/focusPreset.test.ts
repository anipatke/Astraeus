import { describe, expect, it } from "vitest";
import type { ExperienceConfig } from "../src/shell/experience";
import { focusPresetFor } from "../src/shell/objectModel";

// Owner, 2026-10-18: "there is no focus button" for Europa, Ganymede and Callisto, which have no hand-made focus preset.
const experience = {
  cameraPresets: [{ id: "focus-jupiter", label: "Focus Jupiter (own)", request: { kind: "focus", target: "jupiter" } }],
} as unknown as ExperienceConfig;

describe("focus button for any object", () => {
  it("uses the experience's own focus preset when there is one", () => {
    expect(focusPresetFor(experience, { id: "jupiter", label: "Jupiter" }).label).toBe("Focus Jupiter (own)");
  });
  it("makes a plain focus on the object when there is none", () => {
    expect(focusPresetFor(experience, { id: "europa", label: "Europa" })).toEqual({ id: "focus-europa", label: "Focus Europa", request: { kind: "focus", target: "europa" } });
  });
});
