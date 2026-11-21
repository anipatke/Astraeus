// @vitest-environment happy-dom
// T-345: `mount` refuses more lit bodies than the viewer draws with the coded error (the DOM twin of the check() row in publicErrorContract.test.ts).
import { describe, expect, it } from "vitest";
import { Scene, SceneError, listedMoons, mount, sun } from "astraeus";

const PLANETS = ["uranus", "saturn", "neptune", "jupiter"];

describe("T-345: mount with too many lit bodies", () => {
  it("31 lit bodies -> too-many-bodies from mount", () => {
    const scene = new Scene().addBody(sun).setTime("2026-01-01T00:00:00Z");
    for (const planet of PLANETS) scene.addBody(planet);
    for (const moon of PLANETS.flatMap((planet) => listedMoons(planet)).slice(0, 27)) scene.addBody(moon.id);
    const data = PLANETS.map((planet) => ({
      name: `astraeus-data-${planet}`,
      provides: listedMoons(planet).map((moon) => moon.id),
    }));
    let thrown: unknown;
    try {
      mount(document.createElement("div"), scene, { data });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(SceneError);
    expect((thrown as SceneError).code).toBe("too-many-bodies");
  });
});
