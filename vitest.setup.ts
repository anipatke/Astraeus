import { loadPlanetSeries } from "./src/core/planetSeries";
import { loadJupiterMoons } from "./src/core/bodies/jupiterMoons";
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
