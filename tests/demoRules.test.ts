// Rules that hold across the demos (O-038 T-146): the Sun label default, no stray Sun, and the marker rule on every demo's bodies (the per-demo parts of on-request/browser-sun.mjs and
// browser-marker-existing.mjs). The marker rule itself is pinned in tests/bodyMarkers.test.ts; the label settings in tests/showers.test.ts; each demo's own body list in its demo test.
import { describe, expect, it } from "vitest";
import { drawnRadii, drawsAsMarker, projectedRadiusPx } from "../src/app/bodyDraw";
import { mountedBodiesOf, type ExperienceDefinition } from "../src/app/experienceDefinition";
import { catalogue } from "../src/assets/catalogue";
import { trueScale } from "../src/core/scalePolicy";
import { apollo11Definition } from "../src/experiences/apollo11/apollo11Definition";
import { jupiterIoExplorer } from "../src/experiences/jupiter-io/jupiterIo";
import { buildPlanetDefinition, type PlanetSystem } from "../src/experiences/planets/planetDefinition";
import { parsePlanetSettings } from "../src/experiences/planets/planetSettings";
import { earthSystem } from "../src/experiences/planets/systems/earth";
import { marsSystem } from "../src/experiences/planets/systems/mars";
import { mercurySystem } from "../src/experiences/planets/systems/mercury";
import { venusSystem } from "../src/experiences/planets/systems/venus";
import { buildShowerDefinition, showerCatalogue } from "../src/experiences/showers/showerDefinition";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import earthFile from "../data/planets/earth.json";
import geminidsFile from "../data/showers/geminids.json";
import marsFile from "../data/planets/mars.json";
import mercuryFile from "../data/planets/mercury.json";
import perseidsFile from "../data/showers/perseids.json";
import venusFile from "../data/planets/venus.json";
import noPanels from "../data/stories/no-panels/panels.json";
import { madeUpOrbits } from "./helpers/measuredOrbits";

const planet = (file: unknown, system: unknown) => buildPlanetDefinition(parsePlanetSettings(file), system as PlanetSystem, noPanels);
const shower = (file: unknown) => { const settings = parseShowerSettings(file); return [buildShowerDefinition(settings, { kind: "loaded", orbits: madeUpOrbits(7, 20) }), showerCatalogue(settings)] as const; };
const [perseids, perseidsCatalogue] = shower(perseidsFile);
const [geminids, geminidsCatalogue] = shower(geminidsFile);
const SHOWERS: [string, ExperienceDefinition][] = [["Perseids", perseids], ["Geminids", geminids]];
/** A shower's parent may be defined in its own settings, so its bodies are read from the catalogue the shower builds. */
const catalogueOf = new Map<ExperienceDefinition, typeof catalogue>([[perseids, perseidsCatalogue], [geminids, geminidsCatalogue]]);
const OTHERS: [string, ExperienceDefinition][] = [
  ["Apollo 11", apollo11Definition],
  ["Jupiter", jupiterIoExplorer],
  ["Mercury", planet(mercuryFile, mercurySystem)],
  ["Venus", planet(venusFile, venusSystem)],
  ["Earth", planet(earthFile, earthSystem)],
  ["Mars", planet(marsFile, marsSystem)],
];
const FOV = 45;
const HEIGHT = 800;

describe("the Sun", () => {
  it.each(SHOWERS)("%s mounts the Sun, lists it and selects it, and starts with its name tag off", (_name, definition) => {
    expect(mountedBodiesOf(definition)).toContain("sun");
    const sun = definition.experience.objects.find((object) => object.id === "sun")!;
    expect(sun).toBeDefined();
    expect(sun.showLabel).toBe(false);
  });

  it.each(OTHERS)("%s mounts no Sun and lists none", (_name, definition) => {
    expect(mountedBodiesOf(definition)).not.toContain("sun");
    expect(definition.experience.objects.map((object) => object.id)).not.toContain("sun");
  });
});

describe("the marker rule on every demo's bodies (True scale)", () => {
  it.each([...SHOWERS, ...OTHERS])("%s: each mounted body has a drawn size, a marker far off and a sphere close up", (_name, definition) => {
    for (const id of mountedBodiesOf(definition)) {
      const body = (catalogueOf.get(definition) ?? catalogue).get(id).definition;
      const radius = drawnRadii(body, trueScale).equatorial;
      expect(radius, id).toBeGreaterThan(0);
      expect(Number.isFinite(radius), id).toBe(true);
      expect(drawsAsMarker(projectedRadiusPx(radius, radius * 1e9, FOV, HEIGHT)), `${id} far away`).toBe(true);
      expect(drawsAsMarker(projectedRadiusPx(radius, radius * 3, FOV, HEIGHT)), `${id} close up`).toBe(false);
    }
  });
});
