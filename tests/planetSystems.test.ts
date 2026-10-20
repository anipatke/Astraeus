import { gzipSize, readBytes, readJson } from "../tools/import/test-io.mjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parsePlanetSettings } from "../src/experiences/planets/planetSettings";
import { buildPlanetDefinition, type PlanetSystem } from "../src/experiences/planets/planetDefinition";
import { PLANET_SWITCH_KEEPS, choosePlanet } from "../src/experiences/planets/planetChoice";
import { switchAddress } from "../src/shell/SwitchControl";
import { SATURN_MOON_SYSTEM, URANUS_MOON_SYSTEM, NEPTUNE_MOON_SYSTEM, PLUTO_MOON_SYSTEM } from "../src/core/bodies/planetMoons";
import { parseRingSystem } from "../src/assets/rings";
import { saturnSystem, SATURN_CHUNK_URLS } from "../src/experiences/planets/systems/saturn";
import { uranusSystem, URANUS_CHUNK_URLS } from "../src/experiences/planets/systems/uranus";
import { neptuneSystem, NEPTUNE_CHUNK_URLS } from "../src/experiences/planets/systems/neptune";
import { plutoSystem, PLUTO_CHUNK_URLS } from "../src/experiences/planets/systems/pluto";
import saturnFile from "../data/planets/saturn.json";
import uranusFile from "../data/planets/uranus.json";
import neptuneFile from "../data/planets/neptune.json";
import plutoFile from "../data/planets/pluto.json";
import noPanels from "../data/stories/no-panels/panels.json";

const ROOT = new URL("..", import.meta.url).pathname;
const KB = 1024;

/**
 * The stated load limit of each planet's view (T-118): the bytes its fit chunks add (the window's year plus the orbit-history years the load reaches
 * back into) and the moon index it fetches, as served (index gzipped). Jupiter's view, the reference, is about 3.3 MB of chunks and a 36 KB index.
 * Measured 2026-10-21: Saturn 2.96 MB (799 chunks) with a 962 KB index (71 KB gzipped: 292 moons at the same 3.4 KB each as Jupiter's 115, so it is
 * not trimmed), Uranus 1.69 MB, Neptune 0.94 MB, Pluto 87 KB; each limit is about 10% over its measured figure, Saturn's equal to Jupiter's.
 */
const LIMITS: Record<string, { chunkBytes: number; indexGzipBytes: number; indexRawBytes: number }> = {
  saturn: { chunkBytes: 3_300 * KB, indexGzipBytes: 80 * KB, indexRawBytes: 1_000 * KB },
  uranus: { chunkBytes: 1_850 * KB, indexGzipBytes: 16 * KB, indexRawBytes: 130 * KB },
  neptune: { chunkBytes: 1_030 * KB, indexGzipBytes: 12 * KB, indexRawBytes: 80 * KB },
  pluto: { chunkBytes: 100 * KB, indexGzipBytes: 6 * KB, indexRawBytes: 35 * KB },
};

const VIEWS = [
  { name: "saturn", file: saturnFile, system: saturnSystem, urls: SATURN_CHUNK_URLS, moonSystem: SATURN_MOON_SYSTEM },
  { name: "uranus", file: uranusFile, system: uranusSystem, urls: URANUS_CHUNK_URLS, moonSystem: URANUS_MOON_SYSTEM },
  { name: "neptune", file: neptuneFile, system: neptuneSystem, urls: NEPTUNE_CHUNK_URLS, moonSystem: NEPTUNE_MOON_SYSTEM },
  { name: "pluto", file: plutoFile, system: plutoSystem, urls: PLUTO_CHUNK_URLS, moonSystem: PLUTO_MOON_SYSTEM },
] as const;

afterEach(() => { vi.unstubAllGlobals(); for (const view of VIEWS) view.moonSystem.install(null); });

describe("the outer planets in the planet switch (T-118)", () => {
  for (const view of VIEWS) {
    describe(view.name, () => {
      const settings = parsePlanetSettings(view.file);

      it("builds its view from its settings file and system alone", () => {
        const definition = buildPlanetDefinition(settings, view.system as PlanetSystem, noPanels);
        expect(definition.composition!.defaultCenter).toBe(settings.centre.id);
        expect(definition.bodySets![0]!.members.length + definition.composition!.bodies.length - 1).toBe(view.system.catalogue!.moons.length);
        expect(definition.experience.bodyFeatures!.map((set) => set.bodyId)).toEqual(settings.bodyFeatures);
      });

      it("loads exactly the chunks it ships, within its stated limit", async () => {
        const fetched: string[] = [];
        let bytes = 0;
        vi.stubGlobal("fetch", async (url: string) => {
          fetched.push(url);
          const data = readBytes(`${ROOT}${url.slice(1)}`);
          bytes += data.byteLength;
          return { ok: true, arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) };
        });
        // The page awaits `prepare` before its first frame, so a view's own system (Pluto's, for Pluto itself to sit at its centre) is loaded by then.
        await buildPlanetDefinition(settings, view.system as PlanetSystem, noPanels).prepare!();
        expect(view.moonSystem.isLoaded()).toBe(true);
        const shipped = Object.values(view.urls).sort();
        expect([...new Set(fetched)].sort(), "the chunks a window loads are the chunks the build ships; adjust the system's history globs").toEqual(shipped);
        expect(bytes).toBeLessThanOrEqual(LIMITS[view.name]!.chunkBytes);
        // eslint-disable-next-line no-console
        console.info(`${view.name}: ${fetched.length} chunks, ${bytes} bytes`);
      });

      it("keeps its moon index within its stated size", () => {
        const raw = readBytes(`${ROOT}data/ephemerides/${view.name}-moons/index.json`);
        const limit = LIMITS[view.name]!;
        expect(raw.byteLength).toBeLessThanOrEqual(limit.indexRawBytes);
        expect(gzipSize(raw)).toBeLessThanOrEqual(limit.indexGzipBytes);
      });
    });
  }

  it("Saturn's, Uranus's and Neptune's rings come from the NSSDC fact sheets, with a look from the donor, and Pluto has none", () => {
    for (const [name, view] of [["saturn", saturnSystem], ["uranus", uranusSystem], ["neptune", neptuneSystem]] as const) {
      const rings = view.rings!;
      expect(rings.body).toBe(name);
      expect(rings.sources.join(" ")).toContain("nssdc.gsfc.nasa.gov/planetary/factsheet/");
      expect(rings.sources.join(" ")).toContain("Planetary Explorer");
      for (const band of rings.bands) expect(band.outerKm).toBeGreaterThan(band.innerKm);
      expect(parseRingSystem(readJson(`${ROOT}data/rings/${name}.json`)).bands).toEqual(rings.bands);
    }
    expect(plutoSystem.rings).toBeUndefined();
  });

  it("the switch keeps the clock time for planets, and the camera view is the new planet's own", () => {
    const from = "http://x/app.html?experience=planets&planet=jupiter&view=jupiter,1,2,3&t=2016-11-10T12:00:00Z";
    const next = new URL(switchAddress(from, "planet", "saturn", PLANET_SWITCH_KEEPS));
    expect(next.searchParams.get("planet")).toBe("saturn");
    expect(next.searchParams.get("t")).toBe("2016-11-10T12:00:00Z");
    expect(next.searchParams.has("view")).toBe(false);
    const chosen = choosePlanet([{ name: "jupiter", label: "Jupiter", order: 5, isDefault: true }, { name: "saturn", label: "Saturn", order: 6, isDefault: false }], "jupiter")!;
    expect(chosen.switcher.keep).toEqual(["t"]);
  });

  it("a planet with no mapped moon (Uranus) builds with only the planet's presets", () => {
    const definition = buildPlanetDefinition(parsePlanetSettings(uranusFile), uranusSystem, noPanels);
    expect(definition.experience.cameraPresets.map((preset) => preset.id)).toEqual(["overview", "focus-uranus"]);
  });
});
