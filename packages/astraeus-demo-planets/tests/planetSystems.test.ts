import { gzipSize, readBytes, readJson } from "./helpers/testIo.mjs";
import { describe, expect, it } from "vitest";
import { parsePlanetSettings } from "../src/experiences/planets/planetSettings";
import { buildPlanetScene, type PlanetSystem } from "../src/experiences/planets/planetScene";
import { saturnSystem, SATURN_CHUNK_URLS } from "../src/experiences/planets/systems/saturn";
import { uranusSystem, URANUS_CHUNK_URLS } from "../src/experiences/planets/systems/uranus";
import { neptuneSystem, NEPTUNE_CHUNK_URLS } from "../src/experiences/planets/systems/neptune";
import { plutoSystem, PLUTO_CHUNK_URLS } from "../src/experiences/planets/systems/pluto";
import saturnFile from "../data/planets/saturn.json";
import uranusFile from "../data/planets/uranus.json";
import neptuneFile from "../data/planets/neptune.json";
import plutoFile from "../data/planets/pluto.json";
import viewLimits from "../src/experiences/planets/viewLimits.json";
import noPanels from "../data/stories/no-panels/panels.json";

// Each planet's data is in its package: the places in astraeus-data, the moon lists and positions in astraeus-data-<planet>. The packages folder holds them all.
const DATA_PKG = new URL("../../astraeus-data/", import.meta.url).pathname;
const DATA = new URL("../../", import.meta.url).pathname;

/** The stated load limit of each outer planet's view: one source, shared with tools/validate/load-budget.mjs (see the note in the file). */
const LIMITS = viewLimits as unknown as Record<string, { chunkBytes: number; indexGzipBytes: number; indexRawBytes: number }>;

/** The chunks each outer planet's window loads, counted by year (the engine's tests/planetChunksWindow.test.ts loads them from the data packages and states the same counts). */
const LOADED: Record<string, readonly [number, number, number]> = { saturn: [293, 269, 237], uranus: [29, 10, 9], neptune: [17, 9, 8], pluto: [6, 0, 0] };

const VIEWS = [
  { name: "saturn", file: saturnFile, system: saturnSystem, urls: SATURN_CHUNK_URLS },
  { name: "uranus", file: uranusFile, system: uranusSystem, urls: URANUS_CHUNK_URLS },
  { name: "neptune", file: neptuneFile, system: neptuneSystem, urls: NEPTUNE_CHUNK_URLS },
  { name: "pluto", file: plutoFile, system: plutoSystem, urls: PLUTO_CHUNK_URLS },
] as const;

/** Surface places each planet shows of its own package (the planet places rule; Saturn 3 of 20, Uranus 9 of 19, Neptune 9 of 19, Pluto 12 of 16). */
const OWN_PLACES: Record<string, number> = { saturn: 3, uranus: 9, neptune: 9, pluto: 12 };

describe("the outer planets in the planet switch (T-118)", () => {
  for (const view of VIEWS) {
    describe(view.name, () => {
      const settings = parsePlanetSettings(view.file);

      it("builds its scene from its settings file and system alone", () => {
        const scene = buildPlanetScene(settings, view.system as PlanetSystem, noPanels);
        expect(scene.bodies[0]!.id).toBe(settings.centre.id);
        expect(scene.bodySets[0]!.count + scene.bodies.length - 1).toBe(view.system.moonList!.moons.length);
        expect(scene.places.map((set) => set.body)).toEqual(settings.bodyFeatures);
      });

      it("shows its own surface places by the planet places rule (centre listed, no ring or moon entry)", () => {
        const scene = buildPlanetScene(settings, view.system as PlanetSystem, noPanels);
        expect(settings.bodyFeatures).toContain(settings.centre.id);
        const source = (readJson(`${DATA_PKG}data/bodies/${settings.centre.id}/features.json`) as { features: { id: string; ringRadius?: number; moonRadius?: number; latitude?: number }[] }).features;
        expect(scene.places.find((set) => set.body === settings.centre.id)!.count).toBe(source.filter((f) => f.latitude !== undefined && f.ringRadius === undefined && f.moonRadius === undefined).length);
        expect(scene.places.find((set) => set.body === settings.centre.id)!.count).toBe(OWN_PLACES[view.name]);
      });

      it("ships the chunks its window loads, within its stated limit", () => {
        const shipped = Object.keys(view.urls);
        const byYear = (year: number) => shipped.filter((path) => path.endsWith(`/${year}.bin`)).length;
        expect([byYear(2016), byYear(2015), byYear(2014)], "the chunks a window loads are the chunks the build ships; adjust the system's history globs").toEqual(LOADED[view.name]);
        expect(shipped).toHaveLength(LOADED[view.name]!.reduce((total, count) => total + count, 0));
        const bytes = shipped.reduce((total, path) => total + readBytes(`${DATA}astraeus-data-${view.name}/data/${view.name}-moons/${path}`).byteLength, 0);
        expect(bytes).toBeLessThanOrEqual(LIMITS[view.name]!.chunkBytes);
        // eslint-disable-next-line no-console
        console.info(`${view.name}: ${shipped.length} chunks, ${bytes} bytes`);
      });

      it("keeps its moon index within its stated size", () => {
        const raw = readBytes(`${DATA}astraeus-data-${view.name}/data/${view.name}-moons/index.json`);
        const limit = LIMITS[view.name]!;
        expect(raw.byteLength).toBeLessThanOrEqual(limit.indexRawBytes);
        expect(gzipSize(raw)).toBeLessThanOrEqual(limit.indexGzipBytes);
      });
    });
  }

  it("states each dot moon's own measured error, never less than the fit index's worst figure (I-050)", () => {
    for (const view of VIEWS) {
      const index = readJson(`${DATA}astraeus-data-${view.name}/data/${view.name}-moons/index.json`) as { bodies: { id: string; accuracy?: Record<string, { worstM?: number }> }[] };
      const scene = buildPlanetScene(parsePlanetSettings(view.file), view.system as PlanetSystem, noPanels);
      const dots = new Set(view.system.moonList!.moons.filter((moon) => !view.system.bodies.some((body) => body.id === moon.id)).map((moon) => moon.id));
      let checked = 0;
      for (const body of index.bodies) {
        if (!dots.has(body.id)) continue;
        const worst = Math.max(0, ...Object.values(body.accuracy ?? {}).map((entry) => entry.worstM ?? 0));
        const text = scene.provenanceOf(body.id).accuracy;
        if (!text.startsWith("Positions reproduce Horizons to within ")) continue;
        checked += 1;
        expect(Number(/within ([\d.]+) m/.exec(text)![1]), `${view.name}/${body.id}`).toBeGreaterThanOrEqual(worst);
      }
      expect(checked, view.name).toBeGreaterThan(0);
    }
  });

  it("a planet with no mapped moon (Uranus) builds with only the planet's Focus and Follow offered for no moon", () => {
    const scene = buildPlanetScene(parsePlanetSettings(uranusFile), uranusSystem, noPanels);
    expect(scene.bodies.map((body) => body.id)).toEqual(["uranus"]);
    expect(scene.camera.followChoices).toEqual([]);
  });
});
