// A group's `showLabel` (O-101 T-458), proved on made-up groups (ARCH-03): it starts the name hidden as a body's does, and the Labels switch and `?labels=` show it again.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type GroupInput } from "astraeus";
import { experienceWithGroups } from "../src/app/experienceDefinition";
import { hiddenLabelsFrom } from "../src/app/App";
import { labelsOn } from "../src/app/displaySwitches";
import { definitionOf } from "../src/api/definitionOf";

const orbit = (k: number) => ({
  id: `rock-${k}`,
  semiMajorAxisKm: 80_000 + 5_000 * k,
  eccentricity: 0.1,
  inclinationDeg: 5 + k,
  raanDeg: 40 + 3 * k,
  argumentOfPeriapsisDeg: 70 + k,
});
const ring = (extra: Record<string, unknown>): GroupInput =>
  ({ id: "ring", plane: "ecliptic-j2000", orbits: [0, 1, 2].map(orbit), ...extra }) as GroupInput;
const make = (extra: Record<string, unknown>) => new Scene().addBody(earth).addBody(moon).addGroup(ring(extra));

describe("addGroup showLabel", () => {
  it.each([
    ["absent", {}, undefined],
    ["true", { showLabel: true }, true],
    ["false", { showLabel: false }, false],
  ])("%s", (_name, extra, expected) => {
    const definition = definitionOf(make(extra));
    expect(definition.groups![0]!.object.showLabel).toBe(expected);
    const objects = experienceWithGroups(definition).objects;
    expect(objects.some((object) => object.id === "ring")).toBe(true);
    expect(definition.experience.cameraPresets.map((preset) => preset.id)).toContain("focus-ring");
    const hidden = hiddenLabelsFrom("", objects);
    expect(hidden.has("ring")).toBe(expected === false);
    if (expected === false) {
      expect(hiddenLabelsFrom("?labels=ring:on", objects).has("ring")).toBe(false);
      const ids = objects.map((object) => object.id);
      expect(labelsOn(["ring"], hidden, false)).toBe(false);
      expect(labelsOn(["ring"], new Set(), false)).toBe(true);
      expect(ids).toContain("ring");
    }
  });
  it("refuses a non-boolean showLabel with bad-group naming the field", () => {
    let error: unknown;
    try {
      make({ showLabel: "yes" });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(SceneError);
    expect((error as SceneError).code).toBe("bad-group");
    expect((error as SceneError).message).toBe('addGroup("ring"): showLabel must be true or false');
  });
});
