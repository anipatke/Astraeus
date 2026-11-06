import { describe, expect, it } from "vitest";
import { dataSource as pictureData } from "astraeus-data";
import { buildPlanetScene, type PlanetSystem } from "../src/experiences/planets/planetScene";
import { parsePlanetSettings, type PlanetSettings } from "../src/experiences/planets/planetSettings";
import jupiterPanels from "../data/stories/jupiter-io/panels.json";
import noPanels from "../data/stories/no-panels/panels.json";
import before from "./fixtures/planet-views-before.json";
import { planetViewSnapshot } from "./helpers/planetViewSnapshot";

// O-059 T-270: the planets were built by `buildPlanetDefinition`, which went when `buildPlanetScene` replaced it. `fixtures/planet-views-before.json` is what the old builder
// gave for all nine planets (its definition, the small-moon sets summarised, and every listed object's info card rows at the opening time). The scenes must give the same.
// Each way the output differs is named below, with why it is not a change to what the visitor sees; anything else fails.
const FILES = import.meta.glob("../data/planets/*.json", { eager: true, import: "default" }) as Record<string, unknown>;
const SYSTEMS = import.meta.glob("../src/experiences/planets/systems/*.ts", { eager: true }) as Record<string, Record<string, PlanetSystem>>;

interface Snapshot {
  label?: string;
  desktopTextures?: boolean;
  look?: { desktopPictures?: boolean };
  sceneLayers?: string[];
  composition: { id: string; bodies: string[]; defaultCenter: string; paths?: { body: string; spanMs: number; look?: unknown }[] };
  camera: { maxFocusDistance: number; far: number };
  startView: unknown;
  experience: {
    objects: { id: string; label: string; listed?: boolean; knownLimitations?: string[]; provenance?: { sources: string[]; accuracy: string; notes: string }; labelPriority?: number; labelMaxDistance?: number }[];
    cameraPresets: { id: string; label: string; request: { kind: string; target?: string } }[];
    startCameraPresetId?: string;
    bodyFeatures?: { bodyId: string; features: { tags?: string[]; latitude: number; longitude: number; description: string }[] }[];
    moonFamilies?: { planetLabel: string; listSource: string; listDate: string; featuredFamilyId: string };
  };
  bodySets: { id: string; members: { id: string }[]; extra?: { group: { id: string } } }[];
  metricRows: Record<string, { kind: string; id: string }[]>;
}

const views = Object.values(FILES).map((file) => {
  const settings = parsePlanetSettings(file);
  const system = SYSTEMS[`../src/experiences/planets/systems/${settings.system}.ts`]![`${settings.system}System`]!;
  const scene = buildPlanetScene(settings, system, settings.id === "jupiter" ? jupiterPanels : noPanels);
  return { settings, system, scene, now: planetViewSnapshot(scene.toDefinition([pictureData, ...system.data]), scene) as Snapshot, old: (before as unknown as Record<string, Snapshot>)[settings.id]! };
});
type View = (typeof views)[number];

/** Deep equality in which numbers agree to a part in a billion (the rows are worked out from the scene's own states here, by a different route than the old resolver's). */
function expectClose(got: unknown, wanted: unknown, path = "metricRows"): void {
  if (typeof wanted === "number") {
    expect(typeof got, path).toBe("number");
    expect(Math.abs((got as number) - wanted), path).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(wanted)));
  } else if (Array.isArray(wanted)) {
    expect(Array.isArray(got) && got.length, path).toBe(wanted.length);
    wanted.forEach((item, index) => expectClose((got as unknown[])[index], item, `${path}[${index}]`));
  } else if (wanted !== null && typeof wanted === "object") {
    expect(Object.keys(got as object).sort(), path).toEqual(Object.keys(wanted).sort());
    for (const [key, item] of Object.entries(wanted)) expectClose((got as Record<string, unknown>)[key], item, `${path}.${key}`);
  } else expect(got, path).toEqual(wanted);
}

/** The old output, with the differences that are not a change to what the visitor sees taken out of both sides. */
function normalised(snapshot: Snapshot, settings: PlanetSettings): unknown {
  const copy = JSON.parse(JSON.stringify(snapshot)) as Snapshot;
  delete (copy as { needsPlanetSeries?: boolean }).needsPlanetSeries; // the engine decides this itself when the scene loads (the planet series), no longer the site
  copy.label = settings.experienceLabel; // the site writes the page heading (it was the old definition's label)
  delete copy.desktopTextures; // now the public look `desktopPictures`
  delete copy.look;
  delete copy.sceneLayers; // the old definition said none; the default adds the tracked-bodies layer, which draws nothing with no tracked body
  copy.composition.id = "scene"; // an internal name
  for (const set of copy.bodySets) if (set.extra !== undefined) set.extra.group.id = `${set.id}-orbits`; // an internal name
  for (const set of copy.experience.bodyFeatures ?? []) for (const feature of set.features) delete feature.tags; // a field of the package no panel or marker reads
  return copy;
}

describe("the nine planets are built as they were (the old builder's output, recorded)", () => {
  it("covers all nine planets", () => {
    expect(views.map((view) => view.settings.id).sort()).toEqual(["earth", "jupiter", "mars", "mercury", "neptune", "pluto", "saturn", "uranus", "venus"]);
    expect(Object.keys(before).sort()).toEqual(views.map((view) => view.settings.id).sort());
  });

  describe.each(views)("$settings.id", (view: View) => {
    const { settings, now, old } = view;
    const wanted = normalised(old, settings) as Snapshot;
    // What the scene adds on top of the old presets: a Focus button for each other body, the same id, label and request as the one the viewer makes anyway for every listed object without a preset (`focusPresetFor`).
    const synthesised = (): Snapshot["experience"]["cameraPresets"] => now.experience.cameraPresets.filter((preset) => !old.experience.cameraPresets.some((was) => was.id === preset.id));

    it("gives the same definition but for the named differences", () => {
      const got = JSON.parse(JSON.stringify({ ...now, label: settings.experienceLabel })) as Snapshot;
      expect(got.look).toEqual({ desktopPictures: true });
      expect(got.sceneLayers).toEqual(["tracked-bodies"]);
      expect(got.composition.id).toBe("scene");
      const extra = new Set(synthesised().map((preset) => preset.id));
      got.experience.cameraPresets = got.experience.cameraPresets.filter((preset) => !extra.has(preset.id));
      delete got.look;
      delete got.sceneLayers;
      // The card rows are held to a part in a billion by trap 3 below.
      const { metricRows: _got, ...gotRest } = got;
      const { metricRows: _wanted, ...wantedRest } = wanted;
      expect(gotRest).toEqual(wantedRest);
    });

    it("carries the extra Focus presets only as plain Focus buttons for other bodies (the camera menu the viewer makes anyway)", () => {
      const labels = new Map(now.experience.objects.map((object) => [object.id, object.label]));
      for (const preset of synthesised()) {
        expect(preset.request, preset.id).toEqual({ kind: "focus", target: preset.id.replace(/^focus-/, "") });
        expect(preset.label, preset.id).toBe(`Focus ${labels.get(preset.request.target!)}`);
        expect(old.experience.objects.some((object) => object.id === preset.request.target), preset.id).toBe(true);
      }
    });

    // The traps found while comparing (docs/architecture/o059-public-forms.md, section 8): each is asserted on its own so a regression names it.
    it("trap 1: opens at the planet's start pose with no camera button pressed", () => {
      expect(now.startView).toEqual(settings.startView);
      expect(now.experience.startCameraPresetId).toBeUndefined();
    });

    it("trap 2: offers Follow only for the moon the settings follow (none when they name none)", () => {
      const follows = now.experience.cameraPresets.filter((preset) => preset.request.kind === "follow").map((preset) => preset.request.target);
      expect(follows).toEqual(settings.moons?.follow === undefined ? [] : [settings.moons.follow]);
    });

    it("trap 3: shows the distance, phase and coordinates rows on a body's card, as before", () => {
      expectClose(now.metricRows, old.metricRows);
      const kinds = (snapshot: Snapshot) => [...new Set(Object.values(snapshot.metricRows).flat().map((row) => row.kind))].sort();
      expect(kinds(now)).toEqual(kinds(old));
      if (settings.id === "jupiter") expect(kinds(now)).toEqual(["coordinates", "distance", "phase"]);
    });

    it("trap 4: keeps the camera's reach and far plane from the settings file", () => {
      expect(now.camera).toEqual({ maxFocusDistance: settings.camera.maxFocusDistance, far: settings.camera.far });
      expect(now.camera).toEqual(old.camera);
    });

    it("trap 5: draws each moon's orbit loop as it was (Mars's Phobos and Deimos on their stated laps, fading at the old end)", () => {
      expect(now.composition.paths).toEqual(old.composition.paths);
      if (settings.id === "mars") expect(now.composition.paths!.map((path) => [path.body, path.spanMs, path.look])).toEqual([["phobos", 0.3189 * 86_400_000, undefined], ["deimos", 1.2624 * 86_400_000, undefined]]);
      if (settings.id === "jupiter") expect(now.composition.paths!.map((path) => [path.body, path.look])).toEqual([["io", { endFadeOn: false }]]);
    });

    it("trap 6: keeps each body's label priority and reach", () => {
      expect(now.experience.objects.map((object) => [object.id, object.labelPriority, object.labelMaxDistance])).toEqual(old.experience.objects.map((object) => [object.id, object.labelPriority, object.labelMaxDistance]));
    });

    it("trap 7: lists the planet, its mapped moons, then the dots", () => {
      const ids = now.experience.objects.map((object) => object.id);
      const dots = now.bodySets.flatMap((set) => set.members.map((member) => member.id));
      expect(ids.slice(0, ids.length - dots.length)).toEqual(view.system.bodies.map((body) => body.id));
      expect(ids.slice(ids.length - dots.length)).toEqual(dots);
      expect(ids).toEqual(old.experience.objects.map((object) => object.id));
    });

    it("keeps every moon's known limits, the tidal-lock note included, word for word", () => {
      expect(now.experience.objects.map((object) => [object.id, object.knownLimitations])).toEqual(old.experience.objects.map((object) => [object.id, object.knownLimitations]));
    });

    it("keeps every position record's provenance and accuracy words, the dots' own measured figures included", () => {
      const words = (snapshot: Snapshot) => snapshot.experience.objects.map((object) => [object.id, object.provenance?.sources, object.provenance?.accuracy, object.provenance?.notes]);
      expect(words(now)).toEqual(words(old));
      expect(now.bodySets.map((set) => set.id)).toEqual(old.bodySets.map((set) => set.id));
    });

    it("keeps the places exactly as stored, the west longitudes converted", () => {
      const places = (snapshot: Snapshot) => (snapshot.experience.bodyFeatures ?? []).map((set) => [set.bodyId, set.features.map((feature) => [feature.latitude, feature.longitude, feature.description])]);
      expect(places(now)).toEqual(places(old));
    });

    it("keeps the moon panel's heading, source and date", () => {
      const panel = (snapshot: Snapshot) => snapshot.experience.moonFamilies === undefined ? undefined : [snapshot.experience.moonFamilies.planetLabel, snapshot.experience.moonFamilies.listSource, snapshot.experience.moonFamilies.listDate, snapshot.experience.moonFamilies.featuredFamilyId];
      expect(panel(now)).toEqual(panel(old));
    });
  });
});
