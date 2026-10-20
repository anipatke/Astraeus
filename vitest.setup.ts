import { loadPlanetSeries } from "./src/core/planetSeries";
import { loadJupiterMoons } from "./src/core/bodies/jupiterMoons";
import { MARS_MOON_SYSTEM, NEPTUNE_MOON_SYSTEM, PLANET_MOON_DEFINITIONS, PLUTO_MOON_SYSTEM, SATURN_MOON_SYSTEM } from "./src/core/bodies/planetMoons";
import { readBytes } from "./tools/import/test-io.mjs";

// The browser entry loads the planet series on demand; tests that read planet positions load them once up front.
await loadPlanetSeries();

// Likewise Jupiter's moon fits (core data, T-096): the 2016 chunk of every moon (the slowest moons' 2016 chunks start on 9 February), read from disk, so any test can resolve Io, Europa, Ganymede,
// Callisto or a small moon in 2016 (the Jupiter scene's window year).
const FITS = new URL("./data/ephemerides/jupiter-moons/", import.meta.url).pathname;
await loadJupiterMoons({
  window: { startUtcMs: Date.UTC(2016, 1, 10), endUtcMs: Date.UTC(2016, 11, 30) },
  bodies: ["io", "europa", "ganymede", "callisto", ...(await import("./data/moons/jupiter.json")).default.moons.map((moon: { id: string }) => moon.id)].filter((id, index, all) => all.indexOf(id) === index),
  chunkUrls: new Proxy({}, { get: (_target, path: string) => (path.endsWith("/2016.bin") ? `${FITS}${path}` : undefined) }) as Record<string, string>,
  fetchBytes: async (path) => readBytes(path),
});

// And the mapped moons of the other planets (O-033 T-116): their 2016 chunks and the centre series, from disk, so any test can resolve them in 2016.
for (const [system, folder] of [[MARS_MOON_SYSTEM, "mars-moons"], [SATURN_MOON_SYSTEM, "saturn-moons"], [NEPTUNE_MOON_SYSTEM, "neptune-moons"], [PLUTO_MOON_SYSTEM, "pluto-moons"]] as const) {
  const root = new URL(`./data/ephemerides/${folder}/`, import.meta.url).pathname;
  await system.load({
    window: { startUtcMs: Date.UTC(2016, 1, 10), endUtcMs: Date.UTC(2016, 11, 30) },
    bodies: PLANET_MOON_DEFINITIONS.filter((moon) => moon.parentId === system.config.centre).map((moon) => moon.id),
    chunkUrls: new Proxy({}, { get: (_target, path: string) => (path.endsWith("/2016.bin") ? `${root}${path}` : undefined) }) as Record<string, string>,
    fetchBytes: async (path) => readBytes(path),
  });
}
