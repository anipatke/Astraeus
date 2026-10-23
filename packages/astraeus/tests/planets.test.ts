import { describe, expect, it } from "vitest";
import { drawnRadii } from "../src/app/bodyDraw";
import { catalogue } from "../src/assets/catalogue";
import { JUPITER_VISUAL } from "../src/assets/bodies/jupiter";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { BUILT_IN_BODIES, JUPITER, MARS, MERCURY, VENUS } from "../src/core/bodies";
import { createStateResolver } from "../src/core/stateResolver";
import { trueScale } from "../src/core/scalePolicy";
import { PLANETS, positionFixture } from "./planetFixtures";

const textureFiles = Object.keys(import.meta.glob("../src/assets/textures/*.jpg", { query: "?url" }));
const adapter = createOrbAstronomyAdapter();
const resolver = createStateResolver(catalogue.definitions(), catalogue.sources(), adapter);
const AU_KM = 149_597_870.7;

/** Largest sampled difference from Horizons: separation in arcseconds, range difference in km, vector distance in km. */
function residuals(planet: (typeof PLANETS)[number]): { arcsec: number; rangeKm: number; distanceKm: number } {
  let arcsec = 0, rangeKm = 0, distanceKm = 0;
  for (const sample of positionFixture.bodies[planet].samples) {
    const p = adapter.planetPositionFromSunKm(planet, sample.utcMs);
    const h = sample.positionKm;
    const mp = Math.hypot(p[0], p[1], p[2]), mh = Math.hypot(h[0], h[1], h[2]);
    const cosine = (p[0] * h[0] + p[1] * h[1] + p[2] * h[2]) / (mp * mh);
    arcsec = Math.max(arcsec, Math.acos(Math.min(1, cosine)) * (180 / Math.PI) * 3600);
    rangeKm = Math.max(rangeKm, Math.abs(mp - mh));
    distanceKm = Math.max(distanceKm, Math.hypot(p[0] - h[0], p[1] - h[1], p[2] - h[2]));
  }
  return { arcsec, rangeKm, distanceKm };
}

describe("planet positions against JPL Horizons (DE441, six dates 1969 to 2030)", () => {
  const targets = { mercury: 40, venus: 70, mars: 120, jupiter: 1500 } as const;
  for (const planet of PLANETS) {
    it(`${planet} stays within ${targets[planet]} km and 0.5 arcsec of the archived vectors`, () => {
      const worst = residuals(planet);
      expect(positionFixture.bodies[planet].samples).toHaveLength(6);
      expect(worst.distanceKm).toBeLessThan(targets[planet]);
      expect(worst.arcsec).toBeLessThan(0.5);
    });
  }

  it("spans 1969 to 2030 and was fetched from the Horizons targets 199, 299, 499 and 599 about the Sun", () => {
    const years = positionFixture.bodies.mars.samples.map((s) => new Date(s.utcMs).getUTCFullYear());
    expect(Math.min(...years)).toBe(1969);
    expect(Math.max(...years)).toBe(2030);
    expect(PLANETS.map((planet) => positionFixture.bodies[planet].command)).toEqual(["199", "299", "499", "599"]);
    expect(positionFixture.center).toMatch(/500@10/);
  });

  it("returns EQJ kilometres about the Sun at plausible distances and refuses a planet it has no model for", () => {
    const t = Date.UTC(2026, 3, 1);
    const ranges = PLANETS.map((planet) => Math.hypot(...adapter.planetPositionFromSunKm(planet, t)) / AU_KM);
    expect(ranges[0]).toBeGreaterThan(0.3); expect(ranges[0]).toBeLessThan(0.48);
    expect(ranges[1]).toBeGreaterThan(0.71); expect(ranges[1]).toBeLessThan(0.73);
    expect(ranges[2]).toBeGreaterThan(1.38); expect(ranges[2]).toBeLessThan(1.67);
    expect(ranges[3]).toBeGreaterThan(4.9); expect(ranges[3]).toBeLessThan(5.5);
    expect(() => adapter.planetPositionFromSunKm("earth" as never, t)).toThrow(/no model/);
    expect(() => adapter.planetPositionFromSunKm("toString" as never, t)).toThrow(/no model/);
    expect(() => adapter.planetPositionFromSunKm("mars", 1.5)).toThrow(/integer/);
  });
});

describe("planets in the catalogue", () => {
  it("are catalogued once with a Sun parent, an IAU-rotation orientation and a state source", () => {
    for (const definition of [MERCURY, VENUS, MARS, JUPITER]) {
      expect(catalogue.get(definition.id).definition).toBe(definition);
      expect(definition.parentId).toBe("sun");
      expect(definition.orientation).toBe("iau-rotation");
      expect(definition.gmKm3S2).toBeGreaterThan(0);
      expect(catalogue.get(definition.id).source?.body).toBe(definition.id);
      expect(definition.accuracy.orientationLimitations.join(" ")).toMatch(/nutation and libration terms are left out/);
      expect(definition.accuracy.position.accuracy).toMatch(/Horizons/);
      expect(definition.accuracy.validUtc.startUtcMs).toBe(Date.UTC(1969, 6, 21));
      expect(definition.accuracy.validUtc.endUtcMs).toBe(Date.UTC(2030, 5, 1));
    }
    expect(BUILT_IN_BODIES.map((definition) => definition.id)).toEqual(["sun", "earth", "moon", "mercury", "venus", "mars", "jupiter", "io", "europa", "ganymede", "callisto", "saturn", "uranus", "neptune", "pluto", "phobos", "deimos", "mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus", "triton", "charon", "swift-tuttle"]);
  });

  it("carry the NASA fact-sheet dimensions, with both radii where flattening is visible", () => {
    expect(MERCURY.radiusKm).toBe(2439.7);
    expect(MERCURY.equatorialRadiusKm).toBeUndefined();
    expect([VENUS.radiusKm, VENUS.equatorialRadiusKm, VENUS.polarRadiusKm]).toEqual([6051.8, 6051.8, 6051.8]);
    expect([MARS.radiusKm, MARS.equatorialRadiusKm, MARS.polarRadiusKm]).toEqual([3389.5, 3396.2, 3376.2]);
    expect([JUPITER.radiusKm, JUPITER.equatorialRadiusKm, JUPITER.polarRadiusKm]).toEqual([69911, 71492, 66854]);
  });

  it("resolve to the adapter's position and an orientation, from the Sun and from Earth", () => {
    const t = Date.UTC(2026, 3, 1, 12);
    const fromSun = resolver.stateOf("mars", t, "sun");
    expect(Array.from(fromSun.positionKm)).toEqual(Array.from(adapter.planetPositionFromSunKm("mars", t)));
    expect(fromSun.orientation).not.toBeNull();
    const fromEarth = resolver.stateOf("jupiter", t, "earth");
    const jupiter = adapter.planetPositionFromSunKm("jupiter", t);
    const earth = adapter.earthPositionFromSunKm(t);
    expect(fromEarth.positionKm[0]).toBeCloseTo(jupiter[0] - earth[0], 3);
    expect(fromEarth.positionKm[2]).toBeCloseTo(jupiter[2] - earth[2], 3);
    expect(() => resolver.stateOf("venus", t, "venus")).not.toThrow();
  });
});

describe("planet visuals", () => {
  it("give Mercury and Mars a CC BY 4.0 texture with attribution, and no local-only declaration", () => {
    for (const id of ["mercury", "mars"]) {
      const texture = catalogue.get(id).visual.texture!;
      expect(texture.localOnly).toBeUndefined();
      expect(texture.licence).toMatchObject({ licence: "CC BY 4.0", url: "https://www.solarsystemscope.com/textures/" });
      expect(texture.licence?.attribution).toMatch(/Solar System Scope/);
      expect([texture.widthPx, texture.heightPx]).toEqual([2048, 1024]);
      expect(textureFiles).toContain(`../src/assets/textures/${id}-2k.jpg`);
    }
  });

  it("draw Jupiter as a spheroid with a CC BY 4.0 texture over its material colour, with independently mapped radii with independently mapped radii", () => {
    const texture = JUPITER_VISUAL.texture!;
    expect(texture.localOnly).toBeUndefined();
    expect(texture.licence).toMatchObject({ licence: "CC BY 4.0", url: "https://www.solarsystemscope.com/textures/" });
    expect(textureFiles).toContain("../src/assets/textures/jupiter-2k.jpg");
    expect(JUPITER.accuracy.orientationLimitations.join(" ")).toMatch(/bands rotate at different rates/);
    expect(catalogue.get("jupiter").visual.material.color).toBe("#d4a97a");
    const radii = drawnRadii(JUPITER, trueScale);
    expect(radii.equatorial).toBeCloseTo(71492 / 6371, 9);
    expect(radii.polar).toBeCloseTo(66854 / 6371, 9);
    expect(radii.polar / radii.equatorial).toBeCloseTo(66854 / 71492, 9);
    const sphere = drawnRadii(MERCURY, trueScale);
    expect(sphere.polar).toBe(sphere.equatorial);
  });
});
