import { gzipSize, readBytes, readJson } from "../../astraeus/tools/import/test-io.mjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parsePlanetSettings } from "../src/experiences/planets/planetSettings";
import { buildPlanetDefinition, type PlanetSystem } from "../src/experiences/planets/planetDefinition";
import { PLANET_SWITCH_KEEPS, choosePlanet } from "../src/experiences/planets/planetChoice";
import { switchAddress } from "../../astraeus/src/shell/SwitchControl";
import { SATURN_MOON_SYSTEM, URANUS_MOON_SYSTEM, NEPTUNE_MOON_SYSTEM, PLUTO_MOON_SYSTEM } from "../../astraeus/src/core/bodies/planetMoons";
import { parseRingSystem } from "../../astraeus/src/assets/rings";
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

// Engine data (bodies, moons, rings, fits) lives in the astraeus package; REPO is the repository root, where a build-time asset address (/packages/...) is rooted.
const ENGINE = new URL("../../astraeus/", import.meta.url).pathname;
const REPO = new URL("../../../", import.meta.url).pathname;

/** The stated load limit of each outer planet's view: one source, shared with tools/validate/load-budget.mjs (see the note in the file). */
const LIMITS = viewLimits as unknown as Record<string, { chunkBytes: number; indexGzipBytes: number; indexRawBytes: number }>;

const VIEWS = [
  { name: "saturn", file: saturnFile, system: saturnSystem, urls: SATURN_CHUNK_URLS, moonSystem: SATURN_MOON_SYSTEM },
  { name: "uranus", file: uranusFile, system: uranusSystem, urls: URANUS_CHUNK_URLS, moonSystem: URANUS_MOON_SYSTEM },
  { name: "neptune", file: neptuneFile, system: neptuneSystem, urls: NEPTUNE_CHUNK_URLS, moonSystem: NEPTUNE_MOON_SYSTEM },
  { name: "pluto", file: plutoFile, system: plutoSystem, urls: PLUTO_CHUNK_URLS, moonSystem: PLUTO_MOON_SYSTEM },
] as const;

/** Surface places each planet shows of its own package (the planet places rule; Saturn 3 of 20, Uranus 9 of 19, Neptune 9 of 19, Pluto 12 of 16). */
const OWN_PLACES: Record<string, number> = { saturn: 3, uranus: 9, neptune: 9, pluto: 12 };

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

      it("shows its own surface places by the planet places rule (centre listed, no ring or moon entry)", () => {
        const sets = buildPlanetDefinition(settings, view.system as PlanetSystem, noPanels).experience.bodyFeatures!;
        expect(settings.bodyFeatures).toContain(settings.centre.id);
        const own = sets.find((set) => set.bodyId === settings.centre.id)!;
        const source = (readJson(`${ENGINE}data/bodies/${settings.centre.id}/features.json`) as { features: { id: string; ringRadius?: number; moonRadius?: number; latitude?: number }[] }).features;
        expect(own.features.map((feature) => feature.id)).toEqual(source.filter((f) => f.latitude !== undefined && f.ringRadius === undefined && f.moonRadius === undefined).map((f) => f.id));
        expect(own.features).toHaveLength(OWN_PLACES[view.name]!);
      });

      it("loads exactly the chunks it ships, within its stated limit", async () => {
        const fetched: string[] = [];
        let bytes = 0;
        vi.stubGlobal("fetch", async (url: string) => {
          fetched.push(url);
          const data = readBytes(`${REPO}${url.slice(1)}`);
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
        const raw = readBytes(`${ENGINE}data/ephemerides/${view.name}-moons/index.json`);
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
      expect(parseRingSystem(readJson(`${ENGINE}data/rings/${name}.json`)).bands).toEqual(rings.bands);
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

  it("the switch carries the clock's time now, not the time the address was opened with (I-051)", () => {
    const opened = "http://x/app.html?experience=planets&planet=jupiter&t=2016-11-10T12:00:00Z";
    const later = Date.UTC(2016, 10, 12, 3, 4, 5, 600);
    expect(new URL(switchAddress(opened, "planet", "saturn", PLANET_SWITCH_KEEPS, later)).searchParams.get("t")).toBe("2016-11-12T03:04:06.000Z");
    expect(new URL(switchAddress("http://x/app.html?experience=planets&planet=jupiter", "planet", "saturn", PLANET_SWITCH_KEEPS, later)).searchParams.get("t")).toBe("2016-11-12T03:04:06.000Z");
    // A switch that does not keep the time (the showers') drops it whatever the clock says.
    expect(new URL(switchAddress(opened, "shower", "b", [], later)).searchParams.has("t")).toBe(false);
  });

  it("states each dot moon's own measured error, never less than the fit index's worst figure (I-050)", () => {
    for (const view of VIEWS) {
      const index = readJson(`${ENGINE}data/ephemerides/${view.name}-moons/index.json`) as { bodies: { id: string; accuracy?: Record<string, { worstM?: number }> }[] };
      const definition = buildPlanetDefinition(parsePlanetSettings(view.file), view.system as PlanetSystem, noPanels);
      const stated = new Map(definition.experience.objects.map((object) => [object.id, object.provenance?.accuracy ?? ""]));
      let checked = 0;
      for (const body of index.bodies) {
        const worst = Math.max(0, ...Object.values(body.accuracy ?? {}).map((entry) => entry.worstM ?? 0));
        const text = stated.get(body.id);
        if (text === undefined || !text.startsWith("Positions reproduce Horizons to within ")) continue;
        checked += 1;
        expect(Number(/within ([\d.]+) m/.exec(text)![1]), `${view.name}/${body.id}`).toBeGreaterThanOrEqual(worst);
      }
      expect(checked, view.name).toBeGreaterThan(0);
    }
  });

  it("a planet with no mapped moon (Uranus) builds with only the planet's presets", () => {
    const definition = buildPlanetDefinition(parsePlanetSettings(uranusFile), uranusSystem, noPanels);
    expect(definition.experience.cameraPresets.map((preset) => preset.id)).toEqual(["overview", "focus-uranus"]);
  });
});
