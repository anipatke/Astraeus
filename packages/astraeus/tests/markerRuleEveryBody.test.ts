// The marker rule on every body the engine catalogues (True scale), moved from the site's demo rules (O-038 T-146, O-059 T-272): each has a drawn size, a marker far off and a sphere close up.
// The rule itself is pinned in tests/bodyMarkers.test.ts; which bodies each demo mounts is read from the demo's scene in the demo's own tests.
import { describe, expect, it } from "vitest";
import { Scene, sun, type ElementsBodyRecord } from "astraeus";
import { mountedBodiesOf } from "../src/app/experienceDefinition";
import { drawnRadii, drawsAsMarker, projectedRadiusPx } from "../src/app/bodyDraw";
import { catalogue } from "../src/assets/catalogue";
import { trueScale } from "../src/core/scalePolicy";
import { definitionOf } from "../src/api/definitionOf";

const FOV = 45;
const HEIGHT = 800;

describe("the marker rule on every catalogued body (True scale)", () => {
  it.each(catalogue.ids().map((id) => [id] as const))("%s: it has a drawn size, a marker far off and a sphere close up", (id) => {
    const radius = drawnRadii(catalogue.get(id).definition, trueScale).equatorial;
    expect(radius, id).toBeGreaterThan(0);
    expect(Number.isFinite(radius), id).toBe(true);
    expect(drawsAsMarker(projectedRadiusPx(radius, radius * 1e9, FOV, HEIGHT)), `${id} far away`).toBe(true);
    expect(drawsAsMarker(projectedRadiusPx(radius, radius * 3, FOV, HEIGHT)), `${id} close up`).toBe(false);
  });
});

/** A made-up body on two-body motion about the Sun, with a radius or without one (ARCH-03: a body a scene defines for itself, as a shower defines its parent comet). */
const madeUp = (id: string, radiusKm?: number): ElementsBodyRecord => ({
  id, label: id,
  elements: { semiMajorAxisAu: 2.5, eccentricity: 0.3, inclinationDeg: 10, ascendingNodeDeg: 40, argumentOfPerihelionDeg: 70, meanAnomalyDeg: 20 },
  epoch: { jd: 2461000.5, timeScale: "TDB", ttMinusUtcSeconds: 69.184 },
  plane: "ecliptic-j2000",
  source: { name: "Made up", url: "https://example.org/rock", solution: "S1", accessed: "2026-10-28" },
  accuracy: { classification: "indicative", statement: "Made up.", valid: { start: "2020-01-01T00:00:00Z", end: "2030-01-01T00:00:00Z" }, limitations: [] },
  marker: { color: "#aabbcc", sizePx: 6 },
  ...(radiusKm === undefined ? {} : { radius: { km: radiusKm, source: "Made up" } }),
});

describe("the marker rule on bodies a scene defines for itself (True scale)", () => {
  const definition = definitionOf(new Scene().addBody(sun).addBodyFromElements(madeUp("rock-sized", 3)).addBodyFromElements(madeUp("rock-bare")));
  const own = mountedBodiesOf(definition).filter((id) => id.startsWith("rock-"));

  it("finds the scene's own bodies in its catalogue", () => {
    expect(own).toEqual(["rock-sized", "rock-bare"]);
    expect(definition.catalogue).toBeDefined();
  });

  it.each(["rock-sized", "rock-bare"])("%s: it has a drawn size, a marker far off and a sphere close up", (id) => {
    const radius = drawnRadii(definition.catalogue!.get(id).definition, trueScale).equatorial;
    expect(radius, id).toBeGreaterThan(0);
    expect(Number.isFinite(radius), id).toBe(true);
    expect(drawsAsMarker(projectedRadiusPx(radius, radius * 1e9, FOV, HEIGHT)), `${id} far away`).toBe(true);
    expect(drawsAsMarker(projectedRadiusPx(radius, radius * 3, FOV, HEIGHT)), `${id} close up`).toBe(false);
  });
});
