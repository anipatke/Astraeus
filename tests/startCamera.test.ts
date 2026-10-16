import { describe, expect, it } from "vitest";
import { START_CAMERA_DISTANCE, startsInsideFocus } from "../src/app/sceneFraming";
import { trueScale } from "../src/core/scalePolicy";

describe("the start camera (I-028)", () => {
  it("opens at the overview when the centre body is so large that the start distance would be clamped inside it", () => {
    // A Sun-centred scene: the closest approach is 1.15 Sun radii, about 125 Earth radii, far beyond the start distance.
    expect(startsInsideFocus(START_CAMERA_DISTANCE, "sun", { centre: "sun", span: 24_000 }, trueScale, {})).toBe(true);
  });

  it("keeps the start distance for Earth- and Jupiter-centred scenes", () => {
    expect(startsInsideFocus(START_CAMERA_DISTANCE, "earth", { centre: "earth", span: 60 }, trueScale, {})).toBe(false);
    expect(startsInsideFocus(START_CAMERA_DISTANCE, "jupiter", { centre: "jupiter", span: 70 }, trueScale, {})).toBe(false);
  });

  it("keeps it for a centre that is only a point", () => {
    expect(startsInsideFocus(START_CAMERA_DISTANCE, "apollo-point", { centre: "earth", span: 60 }, trueScale, {})).toBe(false);
  });
});
