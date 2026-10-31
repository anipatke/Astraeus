// A ringed planet carries its rings in its one catalogue definition (O-048 T-205, I-118), so a made-up scene that only adds the planet draws them (ARCH-03, ARCH-05).
import { describe, expect, it } from "vitest";
import { Scene, jupiter, mars, neptune, saturn, sun, uranus } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { visualOverridesOf } from "../src/app/experienceDefinition";

/** The rings the drawing code would use for a body in this scene: the experience's override first, else the catalogue's. */
const drawnRings = (scene: Scene, id: string) => (visualOverridesOf(scene.toDefinition()).get(id)?.rings ?? catalogue.get(id).visual.rings);

describe("rings come with the planet", () => {
  it.each([[jupiter, "jupiter"], [saturn, "saturn"], [uranus, "uranus"], [neptune, "neptune"]] as const)("addBody(%#) draws %s's rings with their recorded source", (ref, id) => {
    const rings = drawnRings(new Scene().addBody(sun).addBody(ref), id);
    expect(rings?.body).toBe(id);
    expect(rings!.bands.length).toBeGreaterThan(0);
    expect(rings!.sources.join(" ")).toContain("nssdc.gsfc.nasa.gov/planetary/factsheet/");
    for (const band of rings!.bands) expect(band.outerKm).toBeGreaterThan(band.innerKm);
  });

  it("a planet with no rings has none", () => {
    expect(drawnRings(new Scene().addBody(sun).addBody(mars), "mars")).toBeUndefined();
  });
});
