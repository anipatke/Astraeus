// O-047 T-196: every planet's orbit line and fitOrbit by one rule chosen by source coverage, never by name (ARCH-03, TEST-01, TEST-03).
import { describe, expect, it } from "vitest";
import { Scene, sun } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { sunCentredOf, cameraReachOf } from "../src/app/experienceDefinition";
import { sunOrbitLayer } from "../src/api/sunOrbit";

const AU_KM = 149_597_870.7;
const YEAR_MS = 365.25 * 86_400_000;
const adapter = createOrbAstronomyAdapter();
const sceneAt = (body: string, iso: string) => {
  const scene = new Scene().addBody(sun).addBody(body, { orbit: true }).setTime(Date.parse(iso));
  scene.camera.fitOrbit(body);
  return scene;
};
const PLANETS: Readonly<Record<string, { a: number; e: number }>> = { saturn: { a: 9.537, e: 0.0541 }, uranus: { a: 19.19, e: 0.0472 }, neptune: { a: 30.07, e: 0.0086 } };

describe("orbit line and fitOrbit for the outer planets", () => {
  for (const [id, { a, e }] of Object.entries(PLANETS)) {
    for (const iso of ["1980-01-01T00:00:00Z", "2030-01-01T00:00:00Z"]) {
      it(`${id} opened ${iso.slice(0, 4)}: draws one turn and fits the view to about a(1+e)`, () => {
        const scene = sceneAt(id, iso);
        const definition = scene.toDefinition();
        const [path] = sunCentredOf(definition).paths;
        expect(path!.object.id).toBe(`${id}-orbit`);
        const span = path!.span as { startUtcMs: number; endUtcMs: number };
        expect(Math.abs((span.endUtcMs - span.startUtcMs) / YEAR_MS / Math.sqrt(a ** 3) - 1)).toBeLessThan(0.02);
        const farthest = cameraReachOf(definition).fitOrbit!.farthestKm();
        expect(Math.abs(farthest / (a * (1 + e) * AU_KM) - 1)).toBeLessThan(0.03);
      });
    }
  }

  it("Neptune's osculating line stays near the series positions for the years the series covers", () => {
    const start = Date.parse("1990-01-01T00:00:00Z");
    const layer = sunOrbitLayer(catalogue, "neptune", start, "")!;
    expect(layer.object.knownLimitations![0]).toMatch(/osculating/);
    for (const year of [1960, 1990, 2020, 2040]) {
      const t = Date.UTC(year, 0, 1);
      const drawn = layer.source.stateAt(t, "sun").positionKm;
      const real = adapter.planetPositionFromSunKm("neptune", t);
      expect(Math.hypot(drawn[0]! - real[0]!, drawn[1]! - real[1]!, drawn[2]! - real[2]!) / Math.hypot(real[0]!, real[1]!, real[2]!)).toBeLessThan(0.1);
    }
  });

  it("a planet whose source covers its turn keeps the full-turn wording (Mars, Saturn from 1980)", () => {
    for (const id of ["mars", "saturn"]) expect(sunOrbitLayer(catalogue, id, Date.parse("1980-01-01T00:00:00Z"), "")!.object.knownLimitations![0]).toMatch(/samples joined|full turn/);
  });

  it("the farthest distance is worked out once in setup, so a bad framing never repeats per frame", () => {
    const scene = sceneAt("neptune", "2030-01-01T00:00:00Z");
    const read = cameraReachOf(scene.toDefinition()).fitOrbit!.farthestKm;
    expect(read()).toBe(read());
  });
});
