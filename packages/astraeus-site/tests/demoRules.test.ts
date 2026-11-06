// Rules that hold across the demos (O-038 T-146; O-059 T-272): the Sun is mounted and listed in the showers and in no other demo, read from each demo's scene the way a host reads it (`Scene.bodies`).
// The Sun's name tag default is held with the shower settings (the demo's tests/showers.test.ts), and the marker rule on every body the engine catalogues in the engine (tests/markerRuleEveryBody.test.ts).
import { describe, expect, it } from "vitest";
import type { Scene } from "astraeus";
import { buildApollo11Scene } from "astraeus-demo-apollo11/experiences/apollo11/apollo11Scene";
import { jupiterIoScene } from "astraeus-demo-planets/experiences/jupiter-io/jupiterIo";
import { buildPlanetScene, type PlanetSystem } from "astraeus-demo-planets/experiences/planets/planetScene";
import { parsePlanetSettings } from "astraeus-demo-planets/experiences/planets/planetSettings";
import { earthSystem } from "astraeus-demo-planets/experiences/planets/systems/earth";
import { marsSystem } from "astraeus-demo-planets/experiences/planets/systems/mars";
import { mercurySystem } from "astraeus-demo-planets/experiences/planets/systems/mercury";
import { venusSystem } from "astraeus-demo-planets/experiences/planets/systems/venus";
import { buildShowerScene } from "astraeus-demo-showers/experiences/showers/showerScene";
import { parseShowerSettings } from "astraeus-demo-showers/experiences/showers/showerSettings";
import earthFile from "astraeus-demo-planets/data/planets/earth.json";
import geminidsFile from "astraeus-demo-showers/data/showers/geminids.json";
import marsFile from "astraeus-demo-planets/data/planets/mars.json";
import mercuryFile from "astraeus-demo-planets/data/planets/mercury.json";
import perseidsFile from "astraeus-demo-showers/data/showers/perseids.json";
import venusFile from "astraeus-demo-planets/data/planets/venus.json";
import noPanels from "astraeus-demo-planets/data/stories/no-panels/panels.json";
import { madeUpOrbits } from "astraeus-demo-showers/tests/helpers/measuredOrbits";

const planet = (file: unknown, system: unknown): Scene => buildPlanetScene(parsePlanetSettings(file), system as PlanetSystem, noPanels);
const shower = (file: unknown): Scene => buildShowerScene(parseShowerSettings(file), { kind: "loaded", orbits: madeUpOrbits(7, 20) });
const SHOWERS: [string, Scene][] = [["Perseids", shower(perseidsFile)], ["Geminids", shower(geminidsFile)]];
const OTHERS: [string, Scene][] = [
  ["Apollo 11", buildApollo11Scene()],
  ["Jupiter", jupiterIoScene],
  ["Mercury", planet(mercuryFile, mercurySystem)],
  ["Venus", planet(venusFile, venusSystem)],
  ["Earth", planet(earthFile, earthSystem)],
  ["Mars", planet(marsFile, marsSystem)],
];

describe("the Sun", () => {
  it.each(SHOWERS)("%s mounts the Sun and lists it", (_name, scene) => {
    const sun = scene.bodies.find((body) => body.id === "sun");
    expect(sun).toBeDefined();
    expect(sun!.listed).toBe(true);
  });

  it.each(OTHERS)("%s mounts no Sun and lists none", (_name, scene) => {
    expect(scene.bodies.map((body) => body.id)).not.toContain("sun");
  });
});
