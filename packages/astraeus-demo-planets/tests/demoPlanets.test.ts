// The Jupiter and planet views' own rules, on the built definitions (O-038 T-146): the parts of browser-jupiter-io.mjs, browser-jupiter-tap.mjs, browser-outer-planets.mjs and browser-planet-switch.mjs
// that are about what the settings, the data and the builder make. The moon panel's model is in tests/moonFamilyPanel.test.ts and its screen in tests/domMoonPanel.test.ts; the switch's clock and views in
// tests/planetSystems.test.ts, tests/planetSwitchInner.test.ts and tests/planetChoice.test.ts; Io's place and lighting in tests/jupiterIo.test.ts. What is drawn, the dots' taps and the camera are the smoke check.
import { describe, expect, it } from "vitest";
import { mountedBodiesOf, sceneCenterOf, scaleChoiceIdsOf } from "astraeus/app/experienceDefinition";
import { buildPlanetDefinition, type PlanetSystem } from "../src/experiences/planets/planetDefinition";
import { parsePlanetSettings } from "../src/experiences/planets/planetSettings";
import { jupiterIoExplorer } from "../src/experiences/jupiter-io/jupiterIo";
import { marsSystem } from "../src/experiences/planets/systems/mars";
import { plutoSystem } from "../src/experiences/planets/systems/pluto";
import { saturnSystem } from "../src/experiences/planets/systems/saturn";
import { uranusSystem } from "../src/experiences/planets/systems/uranus";
import { JUPITER_MOON_CATALOGUE } from "astraeus/assets/bodies/jupiterMoonCatalogue";
import { infoView } from "astraeus/shell/infoModel";
import { readJson } from "astraeus/tools/import/test-io.mjs";
import marsFile from "../data/planets/mars.json";
import plutoFile from "../data/planets/pluto.json";
import saturnFile from "../data/planets/saturn.json";
import uranusFile from "../data/planets/uranus.json";
import noPanels from "../data/stories/no-panels/panels.json";

// Engine data (bodies, moons, rings, fits) lives in the astraeus package.
const ENGINE = new URL("../../astraeus/", import.meta.url).pathname;
const build = (file: unknown, system: unknown) => buildPlanetDefinition(parsePlanetSettings(file), system as PlanetSystem, noPanels);
const featuresOf = (definition: ReturnType<typeof build>, body: string) => definition.experience.bodyFeatures!.find((set) => set.bodyId === body)?.features ?? [];
const d = jupiterIoExplorer;
const e = d.experience;
const MAPPED = ["io", "europa", "ganymede", "callisto"];

describe("the Jupiter view (browser-jupiter-io)", () => {
  it("mounts Jupiter and its four mapped moons about Jupiter, in True scale only, with Io's loop the one drawn path", () => {
    expect(mountedBodiesOf(d)).toEqual(["jupiter", ...MAPPED]);
    expect(sceneCenterOf(d)).toBe("jupiter");
    expect(scaleChoiceIdsOf(d)).toEqual(["true-scale"]);
    expect(d.composition!.paths).toHaveLength(1);
    expect(e.objects.slice(0, 5).map((object) => object.id)).toEqual(["jupiter", ...MAPPED]);
    expect(e.objects.map((object) => `${object.id} ${object.label}`).join(" ")).not.toMatch(/apollo|columbia|eagle|perseid/i);
  });

  it("draws every other catalogued moon as one batch of dots, with one orbit colour for each family", () => {
    const set = d.bodySets![0];
    expect(set.members.length + MAPPED.length).toBe(JUPITER_MOON_CATALOGUE.moons.length);
    expect(new Set(set.members.map((member) => member.id)).size).toBe(set.members.length);
    expect(e.moonFamilies!.families.map((family) => family.id)).toEqual(JUPITER_MOON_CATALOGUE.families.map((family) => family.id));
    expect(e.objects.filter((object) => !["jupiter", ...MAPPED].includes(object.id)).length).toBeGreaterThan(0);
  });

  it("states Jupiter's missing texture and Io's source and the fits' figure", () => {
    const text = (id: string) => { const p = infoView(e, { kind: "object", id })!.provenance!; return [p.accuracy, p.notes, ...p.sources, ...(p.knownLimitations ?? [])].join(" "); };
    expect(text("jupiter")).toMatch(/flat in one colour/i);
    expect(text("io")).toMatch(/Horizons/i);
    expect(text("io")).toMatch(/0\.0994 m/);
  });

  it("carries the tagged places of the four mapped moons only, each with its name, description and details, shown as Reconstructed", () => {
    expect(e.bodyFeatures!.map((set) => set.bodyId).sort()).toEqual([...MAPPED].sort());
    for (const set of e.bodyFeatures!) {
      expect(set.features.length).toBeGreaterThan(0);
      expect(new Set(set.features.map((feature) => feature.id)).size).toBe(set.features.length);
      for (const feature of set.features) {
        expect(feature.name).not.toBe("");
        expect(feature.description.length).toBeGreaterThan(40);
        expect(Array.isArray(feature.details)).toBe(true);
      }
    }
  });
});

describe("the planet views (browser-outer-planets, browser-planet-switch)", () => {
  it("Saturn draws its ring bands at the fact sheet's radii and lists its moon families in the data's order", () => {
    const saturn = build(saturnFile, saturnSystem);
    const rings = saturn.visualOverrides!.saturn!.rings!;
    const source = readJson(`${ENGINE}data/rings/saturn.json`) as { bands: { id: string; innerKm: number; outerKm: number }[] };
    expect(rings.bands.map((band) => band.id)).toEqual(source.bands.map((band) => band.id));
    for (const band of rings.bands) expect([band.innerKm, band.outerKm]).toEqual([source.bands.find((entry) => entry.id === band.id)!.innerKm, source.bands.find((entry) => entry.id === band.id)!.outerKm]);
    const moons = readJson(`${ENGINE}data/moons/saturn.json`) as { families: { id: string }[] };
    expect(saturn.experience.moonFamilies!.families.map((family) => family.id)).toEqual(moons.families.map((family) => family.id));
  });

  it("puts a tagged place on Titan and on Charon, with the name and description the information shows", () => {
    const places = [[build(saturnFile, saturnSystem), "titan", "kraken-mare"], [build(plutoFile, plutoSystem), "charon", "mordor-macula"], [build(plutoFile, plutoSystem), "pluto", "sputnik-planitia"]] as const;
    for (const [definition, body, id] of places) {
      const stored = (readJson(`${ENGINE}data/bodies/${body}/features.json`) as { features: { id: string; name: string; description: string }[] }).features.find((feature) => feature.id === id)!;
      const shown = featuresOf(definition, body).find((feature) => feature.id === id)!;
      expect(shown.name).toBe(stored.name);
      expect(shown.description).toBe(stored.description);
    }
  });

  it("Pluto's view mounts Pluto and Charon, and Uranus draws its ring bands and every moon as a dot with no mapped moon", () => {
    const pluto = build(plutoFile, plutoSystem);
    expect(mountedBodiesOf(pluto)).toEqual(expect.arrayContaining(["pluto", "charon"]));
    const uranus = build(uranusFile, uranusSystem);
    const bands = (readJson(`${ENGINE}data/rings/uranus.json`) as { bands: unknown[] }).bands.length;
    expect(uranus.visualOverrides!.uranus!.rings!.bands).toHaveLength(bands);
    expect(uranus.bodySets![0].members).toHaveLength((readJson(`${ENGINE}data/moons/uranus.json`) as { moons: unknown[] }).moons.length);
    expect(mountedBodiesOf(uranus)).toEqual(["uranus"]);
  });

  it("Mars's view lists Mars, Phobos and Deimos and shows only Mars's own places, each of them Reconstructed with its name", () => {
    const mars = build(marsFile, marsSystem);
    expect(mars.experience.objects.map((object) => object.id)).toEqual(["mars", "phobos", "deimos"]);
    expect(mars.experience.bodyFeatures!.map((set) => set.bodyId)).toEqual(["mars"]);
    expect(featuresOf(mars, "mars").every((feature) => feature.name !== "")).toBe(true);
  });
});
