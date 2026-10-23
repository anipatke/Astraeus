import { moonDataFolder } from "./moonData";
import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { catalogue } from "../src/assets/catalogue";
import { chunksNeeded, createMoonSystem, MOON_FIT_SPAN, moonFitSource } from "../src/core/bodies/moonSystem";
import { MARS_MOON_SYSTEM, PHOBOS, PLANET_MOON_DEFINITIONS, PLUTO_MOON_SYSTEM, SATURN_MOON_SYSTEM } from "../src/core/bodies/planetMoons";
import { PLUTO } from "../src/core/bodies/outerPlanets";
import { MARS } from "../src/core/bodies/mars";
import outerFixture from "./fixtures/outer-planets-horizons.json";
import marsIndex from "astraeus-data-mars/index.json";
import saturnIndex from "astraeus-data-saturn/index.json";
import neptuneIndex from "astraeus-data-neptune/index.json";
import plutoIndex from "astraeus-data-pluto/index.json";
import { readBytes } from "../tools/import/test-io.mjs";

// The generic moon-system loader and the mapped moons of Mars, Saturn, Neptune and Pluto (O-033 T-116). The facing tolerances are the largest
// angles measured below (IAU linear prime meridian against the fitted direction to the planet), rounded up; the report's periodic libration terms
// are left out of the orientation (ROTATION_LIMITATION), so they are the size of those terms.
const adapter = createOrbAstronomyAdapter();
const angleDeg = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (Math.hypot(a[0], a[1], a[2]) * Math.hypot(b[0], b[1], b[2]))))) * 180 / Math.PI;

/** The angle between the body's prime-meridian axis (body +X) and the direction to its planet, over the window the setup loaded (2016-02-10 to 2016-12-30). */
function facingAngles(id: string): number[] {
  const trajectory = catalogue.get(id).source!.create(adapter);
  const angles: number[] = [];
  for (let day = 0; day < 300; day += 1.37) {
    const state = trajectory.stateAt(Date.UTC(2016, 1, 10) + day * 86_400_000);
    const [x, y, z, w] = state.orientation!;
    const axis = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w)];
    angles.push(angleDeg(axis, state.positionKm.map((c) => -c)));
  }
  return angles;
}

describe("the sub-planet point of a synchronous moon sits at its record's prime meridian (one moon per system)", () => {
  // Measured worst (this test logs them): Io 0.8, Titan 5.4, Triton 2.8, Charon 1.5 degrees. Titan's includes its optical libration (about 2e radians, 3.3 degrees); the rest is
  // the IAU model's own distance from the actual instant. Io is the Jupiter system's moon, now on the same wrapper.
  const tolerance: Record<string, number> = { io: 1, titan: 6, triton: 3, charon: 2 };
  for (const [id, limit] of Object.entries(tolerance)) {
    it(`${id} keeps its prime meridian within ${limit} degrees of the direction to its planet`, () => {
      const worst = Math.max(...facingAngles(id));
      expect(worst).toBeLessThan(limit);
    });
  }

  it("holds the near side of Phobos (no IAU record in data/orbits) to the fitted direction, to numerical precision", () => {
    expect(Math.max(...facingAngles("phobos"))).toBeLessThan(1e-4);
  });
});

describe("the mapped moons of the other planets", () => {
  const indexes = { mars: marsIndex, saturn: saturnIndex, neptune: neptuneIndex, pluto: plutoIndex } as const;
  it("are defined once with their planet as parent, tidal lock, and the fit span as validity (2010-2030)", () => {
    expect(PLANET_MOON_DEFINITIONS.map((moon) => moon.id)).toEqual(["phobos", "deimos", "mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus", "triton", "charon"]);
    for (const moon of PLANET_MOON_DEFINITIONS) {
      expect(moon.orientation, moon.id).toBe("tidal-lock");
      expect(moon.accuracy.validUtc, moon.id).toBe(MOON_FIT_SPAN);
      expect(catalogue.get(moon.id).source?.body, moon.id).toBe(moon.id);
      expect(moon.accuracy.position.sources[0], moon.id).toBe(moonFitSource(moon.parentId![0].toUpperCase() + moon.parentId!.slice(1)));
    }
    for (const index of Object.values(indexes)) expect([index.span.fromUtc, index.span.toUtc]).toEqual(["2010-01-01", "2030-01-01"]);
  });

  it("carry the worst figure and the radius and GM their own index recorded (no number typed that the data does not hold)", () => {
    for (const moon of PLANET_MOON_DEFINITIONS) {
      const index = indexes[moon.parentId as keyof typeof indexes];
      const entry = index.bodies.find((body) => body.id === moon.id)! as unknown as { accuracy: Record<string, { worstM: number }>; horizons?: { headerNotes: string[] } };
      const centred = Object.entries(entry.accuracy).find(([key]) => key.endsWith("CentredUtc"))![1].worstM;
      expect(moon.accuracy.position.accuracy, moon.id).toContain(`within ${centred} m`);
      if (entry.horizons !== undefined && moon.parentId !== "mars") {
        const header = entry.horizons.headerNotes.join(" ");
        const printed = (value: number) => header.replace(/\s+/g, " ").includes(String(value));
        expect(printed(moon.radiusKm), `${moon.id} radius ${moon.radiusKm}`).toBe(true);
        expect(printed(moon.gmKm3S2!), `${moon.id} GM ${moon.gmKm3S2}`).toBe(true);
      }
    }
  });

  it("draw Phobos and Deimos as grey spheres with no map, and every other mapped moon with a licensed map", () => {
    for (const moon of PLANET_MOON_DEFINITIONS) {
      const texture = catalogue.get(moon.id).visual.texture;
      if (moon.parentId === "mars") {
        expect(texture, moon.id).toBeUndefined();
        expect(catalogue.get(moon.id).visual.kind).toBe("sphere");
      } else {
        expect(texture?.licence?.licence.length, moon.id).toBeGreaterThan(5);
        expect(texture?.licence?.attribution, moon.id).toBeTruthy();
        expect(Math.max(texture!.widthPx, texture!.heightPx), moon.id).toBeLessThanOrEqual(5760);
      }
    }
    expect(PHOBOS.radiusKm).toBe(11.08);
  });
});

describe("the generic loader", () => {
  it("fetches only the chunks a window needs for one system, and refuses a window whose chunks the build does not ship", async () => {
    const fresh = createMoonSystem({ ...MARS_MOON_SYSTEM.config, loadIndex: async () => marsIndex });
    const requested: string[] = [];
    const root = moonDataFolder("mars");
    const chunkUrls = new Proxy({}, { get: (_target, path: string) => (path.endsWith("/2018.bin") ? `${root}${path}` : undefined) }) as Record<string, string>;
    const window = { startUtcMs: Date.UTC(2018, 2, 1), endUtcMs: Date.UTC(2018, 2, 8) };
    const set = await fresh.load({ window, bodies: ["phobos"], chunkUrls, fetchBytes: async (url) => { requested.push(url); return readBytes(url); } });
    expect(requested.sort()).toEqual(["mars/2018.bin", "phobos/2018.bin"].map((path) => `${root}${path}`).sort());
    expect(fresh.ephemeris()).toBe(set);
    expect(Math.hypot(...set.stateOf("phobos", Date.UTC(2018, 2, 4)).positionKm)).toBeGreaterThan(9000);
    expect(() => chunksNeeded(set, { window: { startUtcMs: Date.UTC(2019, 0, 2), endUtcMs: Date.UTC(2019, 0, 3) }, bodies: ["deimos"], chunkUrls })).toThrow(/does not ship/);
    expect(() => createMoonSystem(MARS_MOON_SYSTEM.config).ephemeris()).toThrow(/not loaded/);
  });

  it("serves Saturn's mapped moons about Saturn from the committed fits", () => {
    const state = catalogue.get("titan").source!.create(adapter).stateAt(Date.UTC(2016, 5, 1));
    expect(state.center).toBe("saturn");
    expect(Math.hypot(...state.positionKm)).toBeGreaterThan(1.1e6);
    expect(Math.hypot(...state.positionKm)).toBeLessThan(1.3e6);
    expect(() => catalogue.get("titan").source!.create(adapter).stateAt(Date.UTC(2016, 5, 1), "sun")).toThrow(/Saturn-centred/);
    expect(SATURN_MOON_SYSTEM.config.centreGmKm3S2).toBe(37_931_206.234);
  });
});

describe("Pluto: the system barycentre from the planet fits plus its own offset from its system's fits", () => {
  const samples = outerFixture.bodies.pluto.samples;
  const trajectory = catalogue.get("pluto").source!.create(adapter);

  it("is within a kilometre of Horizons' Pluto where its system's chunks are loaded", async () => {
    const root = moonDataFolder("pluto");
    const ephemeris = PLUTO_MOON_SYSTEM.ephemeris();
    for (const year of [2010, 2023, 2024]) ephemeris.addChunk("pluto", `pluto/${year}.bin`, readBytes(`${root}pluto/${year}.bin`));
    const checked: number[] = [];
    for (const sample of samples) {
      if (sample.utcMs < MOON_FIT_SPAN.startUtcMs || sample.utcMs > MOON_FIT_SPAN.endUtcMs) continue;
      const p = trajectory.stateAt(sample.utcMs).positionKm;
      const h = sample.positionKm;
      checked.push(Math.hypot(p[0] - h[0], p[1] - h[1], p[2] - h[2]));
    }
    expect(checked.length).toBeGreaterThanOrEqual(2);
    for (const value of checked) expect(value).toBeLessThan(1.5);
  });

  it("stays within the offset's size (2,200 km) of Horizons' Pluto at the barycentre, where the system is not loaded", () => {
    for (const sample of samples) {
      if (sample.utcMs >= MOON_FIT_SPAN.startUtcMs && sample.utcMs <= MOON_FIT_SPAN.endUtcMs) continue;
      const p = trajectory.stateAt(sample.utcMs).positionKm;
      const h = sample.positionKm;
      expect(Math.hypot(p[0] - h[0], p[1] - h[1], p[2] - h[2])).toBeLessThan(2200);
    }
    expect(PLUTO.accuracy.position.accuracy).toMatch(/barycentre/);
  });

  it("makes Mars's definition the centre of its own system", () => {
    expect(MARS_MOON_SYSTEM.config.centreGmKm3S2).toBe(MARS.gmKm3S2);
  });
});
