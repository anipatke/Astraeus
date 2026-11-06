// The Jupiter and planet views' own rules, on the built scenes (O-038 T-146, O-059 T-270): the parts of browser-jupiter-io.mjs, browser-jupiter-tap.mjs, browser-outer-planets.mjs and browser-planet-switch.mjs
// that are about what the settings, the data and the builder make, read through the public `Scene` reads. The moon panel's model is in the engine's tests/moonPanelModel.test.ts and its screen in
// tests/domMoonPanel.test.ts; the moon facts in tests/moonList.test.ts; the switch's clock and views in tests/planetSystems.test.ts, tests/planetSwitchInner.test.ts and the site's tests/planetChoice.test.ts;
// Io's place and lighting in the engine's tests/jupiterIo.test.ts; the rings in its tests/jupiterMoonsWindow.test.ts and tests/outerPlanetRings.test.ts. What is drawn, the dots' taps and the camera are the smoke check.
import { describe, expect, it } from "vitest";
import { Scene } from "astraeus";
import { buildPlanetScene, placesOf, type MapCoordinates, type PackageFeature, type PlanetSystem } from "../src/experiences/planets/planetScene";
import { parsePlanetSettings } from "../src/experiences/planets/planetSettings";
import { jupiterIoScene } from "../src/experiences/jupiter-io/jupiterIo";
import { marsSystem } from "../src/experiences/planets/systems/mars";
import { plutoSystem } from "../src/experiences/planets/systems/pluto";
import { saturnSystem } from "../src/experiences/planets/systems/saturn";
import { uranusSystem } from "../src/experiences/planets/systems/uranus";
import { readJson } from "./helpers/testIo.mjs";
import marsFile from "../data/planets/mars.json";
import plutoFile from "../data/planets/pluto.json";
import saturnFile from "../data/planets/saturn.json";
import uranusFile from "../data/planets/uranus.json";
import noPanels from "../data/stories/no-panels/panels.json";

const DATA = new URL("../../", import.meta.url).pathname;
const DATA_PKG = `${DATA}astraeus-data/`;
const build = (file: unknown, system: PlanetSystem): Scene => buildPlanetScene(parsePlanetSettings(file), system, noPanels);
const MAPPED = ["io", "europa", "ganymede", "callisto"];
const jupiterList = readJson(`${DATA}astraeus-data-jupiter/data/jupiter-moons/list.json`) as { asOf: string; moons: { id: string; bodyPackage: string | null }[]; families: { id: string }[] };

describe("the Jupiter view (browser-jupiter-io)", () => {
  const scene = jupiterIoScene;

  it("holds Jupiter and its four mapped moons about Jupiter, in True scale only, with Io's loop the one drawn orbit", () => {
    expect(scene.bodies.map((body) => body.id)).toEqual(["jupiter", ...MAPPED]);
    expect(scene.bodies.filter((body) => body.orbit).map((body) => body.id)).toEqual(["io"]);
    expect(scene.bodies.slice(1).every((body) => body.parent === "jupiter")).toBe(true);
    expect(scene.scales).toEqual(["true-scale"]);
    expect(scene.bodies.map((body) => `${body.id} ${body.label}`).join(" ")).not.toMatch(/apollo|columbia|eagle|perseid/i);
  });

  it("draws every other catalogued moon as one batch of dots, with one orbit colour for each family", () => {
    const [set] = scene.bodySets;
    expect(jupiterList.moons.length).toBe(115);
    expect(set!.count + MAPPED.length).toBe(jupiterList.moons.length);
    expect(set!.center).toBe("jupiter");
    expect(set!.families).toEqual(jupiterList.families.map((family) => family.id));
    expect(scene.moonPanel!.count).toBe(115);
    // The mapped moons are the ones with body packages.
    expect(jupiterList.moons.filter((moon) => moon.bodyPackage !== null).map((moon) => moon.id).sort()).toEqual([...MAPPED].sort());
  });

  it("states Jupiter's missing texture and Io's source and the fits' figure", () => {
    const text = (id: string) => { const p = scene.provenanceOf(id); return [p.accuracy, p.notes, ...p.sources].join(" "); };
    expect(scene.bodies[0]!.knownLimitations.join(" ")).toMatch(/flat in one colour/i);
    expect(text("io")).toMatch(/Horizons/i);
    expect(text("io")).toMatch(/0\.1924 m/);
    expect(text("himalia")).toMatch(/JPL Horizons/);
    expect(scene.provenanceOf("himalia").sources.join(" ")).toContain(String(jupiterList.moons.length));
  });

  it("states the total and the Horizons list date in Jupiter's information and a small moon's sources (I-045)", () => {
    const fact = scene.bodies[0]!.facts!.find((entry) => entry.label === "Known moons")!;
    expect(fact.value).toBe(scene.moonPanel!.summary);
    expect(fact.value).toContain("115 moons");
    const sources = scene.provenanceOf("himalia").sources.join(" ");
    expect(sources).toContain(String(jupiterList.moons.length));
    expect(sources).toContain(jupiterList.asOf);
  });

  it("carries the tagged places of the four mapped moons only", () => {
    expect(scene.places.map((set) => set.body).sort()).toEqual([...MAPPED].sort());
    for (const set of scene.places) expect(set.count).toBeGreaterThan(0);
  });
});

describe("the planet views (browser-outer-planets, browser-planet-switch)", () => {
  it("Saturn lists its moon families in the data's order", () => {
    const saturn = build(saturnFile, saturnSystem);
    const moons = readJson(`${DATA}astraeus-data-saturn/data/saturn-moons/list.json`) as { families: { id: string }[] };
    expect(saturn.bodySets[0]!.families).toEqual(moons.families.map((family) => family.id));
    expect(saturn.moonPanel!.count).toBe((readJson(`${DATA}astraeus-data-saturn/data/saturn-moons/list.json`) as { moons: unknown[] }).moons.length);
  });

  it("puts a tagged place on Titan and on Charon, with the name and description the information shows", () => {
    const places = [[build(saturnFile, saturnSystem), "titan", "kraken-mare"], [build(plutoFile, plutoSystem), "charon", "mordor-macula"], [build(plutoFile, plutoSystem), "pluto", "sputnik-planitia"]] as const;
    for (const [scene, body, id] of places) {
      expect(scene.places.map((set) => set.body)).toContain(body);
      const stored = (readJson(`${DATA_PKG}data/bodies/${body}/features.json`) as { features: { id: string; name: string; description: string }[] }).features.find((feature) => feature.id === id)!;
      expect(stored.name).not.toBe("");
      const file = readJson(`${DATA_PKG}data/bodies/${body}/features.json`) as { features: PackageFeature[] };
      const map = body === "titan" || body === "charon" || body === "pluto" ? (readJson(`${DATA_PKG}data/bodies/${body}/map.json`) as { coordinates: MapCoordinates }).coordinates : undefined;
      const shown = placesOf(file.features, map).find((feature) => feature.id === id)!;
      expect(shown.name).toBe(stored.name);
      expect(shown.description).toBe(stored.description);
    }
  });

  it("Pluto's view holds Pluto and Charon, and Uranus holds every moon as a dot with no mapped moon", () => {
    const pluto = build(plutoFile, plutoSystem);
    expect(pluto.bodies.map((body) => body.id)).toEqual(["pluto", "charon"]);
    const uranus = build(uranusFile, uranusSystem);
    expect(uranus.bodySets[0]!.count).toBe((readJson(`${DATA}astraeus-data-uranus/data/uranus-moons/list.json`) as { moons: unknown[] }).moons.length);
    expect(uranus.bodies.map((body) => body.id)).toEqual(["uranus"]);
  });

  it("Mars's view lists Mars, Phobos and Deimos and shows only Mars's own places", () => {
    const mars = build(marsFile, marsSystem);
    expect(mars.bodies.map((body) => body.id)).toEqual(["mars", "phobos", "deimos"]);
    expect(mars.bodySets).toEqual([]);
    expect(mars.places).toEqual([{ body: "mars", count: 30 }]);
  });
});
