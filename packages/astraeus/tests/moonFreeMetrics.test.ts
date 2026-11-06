// A scene without the Moon never asks the viewer's resolver about the Moon (moved here from the site's experiences test, O-059 T-272; I-144), on a made-up Moon-free scene (ARCH-03).
import { describe, expect, it } from "vitest";
import { Scene, earth, sun, type ElementsBodyRecord } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { createSceneResolver } from "../src/app/sceneLayout";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import type { StateResolver } from "../src/core/stateResolver";
import { definitionOf } from "../src/api/definitionOf";

const T = Date.UTC(2026, 7, 12);
const rock: ElementsBodyRecord = {
  id: "rock", label: "Rock",
  elements: { semiMajorAxisAu: 2.5, eccentricity: 0.3, inclinationDeg: 10, ascendingNodeDeg: 40, argumentOfPerihelionDeg: 70, meanAnomalyDeg: 20 },
  epoch: { jd: 2461000.5, timeScale: "TDB", ttMinusUtcSeconds: 69.184 },
  plane: "ecliptic-j2000",
  source: { name: "Made up", url: "https://example.org/rock", solution: "S1", accessed: "2026-10-28" },
  accuracy: { classification: "indicative", statement: "Made up.", valid: { start: "2020-01-01T00:00:00Z", end: "2030-01-01T00:00:00Z" }, limitations: [] },
  marker: { color: "#aabbcc", sizePx: 6 },
};

describe("a Moon-free scene never reads the Moon", () => {
  it("answers every metric without asking the resolver about the Moon", () => {
    const definition = definitionOf(new Scene().addBody(sun).addBody(earth, { orbit: true }).addBodyFromElements(rock).setTime(T));
    const resolver = createSceneResolver(createOrbAstronomyAdapter(), definition.catalogue);
    const asked: string[] = [];
    const spy: StateResolver = {
      stateOf: (body, t, centre) => { asked.push(body, centre); return resolver.stateOf(body, t, centre); },
      offsetKm: (from, centre, t) => { asked.push(from, centre); return resolver.offsetKm(from, centre, t); },
      sunFrom: (centre, t) => { asked.push(centre); return resolver.sunFrom(centre, t); },
    };
    const metrics = definition.createMetrics({ clock: undefined as never, resolver: spy, catalogue: definition.catalogue ?? catalogue });
    for (const id of ["sun", "earth", "rock", "moon", "nothing"]) metrics(id, T);
    expect(asked.length).toBeGreaterThan(0);
    expect(asked).not.toContain("moon");
  });
});
