import { describe, expect, it } from "vitest";
import { dataSource as pictureData } from "astraeus-data";
import { buildPlanetScene, type PlanetSystem } from "../src/experiences/planets/planetScene";
import { parsePlanetSettings } from "../src/experiences/planets/planetSettings";
import jupiterPanels from "../data/stories/jupiter-io/panels.json";
import noPanels from "../data/stories/no-panels/panels.json";

// O-057 T-274 (owner, 2026-11-07: "Retire it, keep public parts"): each of the nine planets is built as its settings and system files say, read only through the scene's public reads and
// `scene.camera` getters. The whole-definition compare with the old builder's recorded output is retired: the rest of it (info card rows, camera presets, label ranking...) has no public read.
const FILES = import.meta.glob("../data/planets/*.json", { eager: true, import: "default" }) as Record<string, unknown>;
const SYSTEMS = import.meta.glob("../src/experiences/planets/systems/*.ts", { eager: true }) as Record<string, Record<string, PlanetSystem>>;

const views = Object.values(FILES).map((file) => {
  const settings = parsePlanetSettings(file);
  const system = SYSTEMS[`../src/experiences/planets/systems/${settings.system}.ts`]![`${settings.system}System`]!;
  const scene = buildPlanetScene(settings, system, settings.id === "jupiter" ? jupiterPanels : noPanels);
  return { settings, system, scene };
});
type View = (typeof views)[number];

describe("the nine planets are built as their settings say (public reads only)", () => {
  it("covers all nine planets", () => {
    expect(views.map((view) => view.settings.id).sort()).toEqual(["earth", "jupiter", "mars", "mercury", "neptune", "pluto", "saturn", "uranus", "venus"]);
  });

  describe.each(views)("$settings.id", (view: View) => {
    const { settings, system, scene } = view;
    const mapped = settings.moons?.mapped ?? [];

    it("builds without a viewer, given the planet's data", () => {
      expect(() => scene.check({ data: [pictureData, ...system.data] })).not.toThrow();
    });

    it("lists the planet first (the scene's centre), then its mapped moons, in draw order, all listed", () => {
      const full = system.bodies.map((body) => body.id);
      expect(full).toEqual([settings.centre.id, ...mapped.map((moon) => moon.id)]);
      expect(scene.bodies.map((body) => body.id).slice(0, full.length)).toEqual(full);
      expect(scene.bodies.slice(0, full.length).every((body) => body.listed)).toBe(true);
    });

    it("draws an orbit line for exactly the bodies the system says have one", () => {
      expect(scene.bodies.slice(0, system.bodies.length).map((body) => [body.id, body.orbit])).toEqual(system.bodies.map((body) => [body.id, body.orbit !== undefined && body.orbit !== false]));
    });

    it("keeps the centre's and every mapped moon's words and known limits as the settings give them", () => {
      const centre = scene.bodies[0]!;
      expect([centre.description, centre.knownLimitations]).toEqual([settings.centre.description, settings.centre.knownLimitations]);
      for (const moon of mapped) {
        const read = scene.bodies.find((body) => body.id === moon.id)!;
        expect(read.description, moon.id).toBe(moon.description);
        if (moon.knownLimitations !== undefined) expect(read.knownLimitations, moon.id).toEqual(moon.knownLimitations);
        else expect(read.knownLimitations.length, moon.id).toBeGreaterThan(0);
      }
    });

    it("shows the moon panel and small-moon sets exactly when the system has a moon list", () => {
      const list = system.moonList;
      expect(scene.moonPanel === undefined).toBe(list === undefined);
      expect(scene.bodySets.length > 0).toBe(list !== undefined && list.moons.some((moon) => !mapped.some((one) => one.id === moon.id)));
      if (scene.moonPanel !== undefined) {
        expect(scene.moonPanel.count).toBe(list!.moons.length);
        const [year, month, day] = list!.asOf.split("-").map(Number);
        const date = `${day} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month! - 1]} ${year}`;
        expect(scene.moonPanel.summary).toBe(`${list!.moons.length} moons in the ${settings.moons!.listSource} list of ${date}`);
        expect(scene.bodies[0]!.facts).toEqual([{ label: "Known moons", value: scene.moonPanel.summary }]);
      } else expect(scene.bodies[0]!.facts).toBeUndefined();
      for (const set of scene.bodySets) {
        expect(set.center, set.id).toBe(settings.centre.id);
        expect(set.count, set.id).toBeGreaterThan(0);
        expect(set.families.length, set.id).toBeGreaterThan(0);
      }
    });

    it("states provenance for every body the scene holds and every small moon, in the engine's words and the list's", () => {
      const list = system.moonList;
      const dotIds = (list?.moons ?? []).filter((moon) => !mapped.some((one) => one.id === moon.id) && moon.id !== settings.centre.id).map((moon) => moon.id);
      for (const id of [...scene.bodies.map((body) => body.id), ...dotIds]) {
        const provenance = scene.provenanceOf(id);
        expect(provenance.sources.length, id).toBeGreaterThan(0);
        expect(provenance.accuracy.length, id).toBeGreaterThan(0);
        expect(provenance.notes.length, id).toBeGreaterThan(0);
        expect(provenance.sourceType, id).toBe("ephemeris");
      }
      for (const moon of list?.moons ?? []) {
        if (moon.id === settings.centre.id) continue;
        const listed = [...scene.bodies.map((body) => body.id), ...dotIds].includes(moon.id);
        if (!listed) continue;
        // a moon taken from the list cites the list's own source for its family, size and discovery
        expect(scene.provenanceOf(moon.id).sources, moon.id).toEqual(expect.arrayContaining(moon.sourceIds.map((sourceId) => list!.sources[sourceId]!.title)));
      }
      for (const id of dotIds) expect(scene.provenanceOf(id).sources, id).toContain(settings.moons!.fitSource);
    });

    it("tags places on the bodies the settings name, each with at least one place", () => {
      expect(scene.places.map((places) => places.body).sort()).toEqual([...settings.bodyFeatures].sort());
      expect(scene.places.every((places) => places.count > 0)).toBe(true);
    });

    it("opens on the settings' window, speeds and the true scale alone", () => {
      expect(scene.timeline).toMatchObject({ windowStartUtcMs: settings.window.startUtcMs, windowEndUtcMs: settings.window.endUtcMs, openUtcMs: settings.window.startUtcMs, rates: settings.rates, rate: settings.clockRate });
      expect(scene.scales).toEqual(["true-scale"]);
    });

    it("keeps the camera: opening pose, no pressed camera button, Follow only for the followed moon, reach and far plane", () => {
      expect(scene.camera.pose).toEqual(settings.startView);
      expect(scene.camera.target).toBeUndefined();
      expect(scene.camera.followChoices).toEqual(settings.moons?.follow === undefined ? [] : [settings.moons.follow]);
      expect(scene.camera.reachEarthRadii).toBe(settings.camera.maxFocusDistance);
      expect(scene.camera.farEarthRadii).toBe(settings.camera.far);
    });

    it("carries the story panels: Jupiter's three, none elsewhere", () => {
      expect(scene.panels.map((panel) => panel.id).sort()).toEqual(settings.id === "jupiter" ? (jupiterPanels as { panels: { id: string }[] }).panels.map((panel) => panel.id).sort() : []);
    });
  });
});
