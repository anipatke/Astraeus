// I-050: each moon's worst measured error against Horizons, from its fit index, as a small file the planets view imports (the index itself is too big to ship up front).
// `node tools/import/moon-fit-errors.mjs` rewrites data/moons/fit-errors/<planet>.json; tests/planetFitErrors.test.ts fails when a file differs from the indexes.
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
export const FIT_ERROR_PLANETS = ["mars", "saturn", "uranus", "neptune", "pluto"];

/** The largest worst-case figure (m) the index records for a moon: over the fitted span, the demo window and the planet-centred check. */
export function worstFigures(index) {
  const out = {};
  for (const body of index.bodies) {
    const figures = Object.values(body.accuracy ?? {}).flatMap((entry) => (entry !== null && typeof entry === "object" && typeof entry.worstM === "number" ? [entry.worstM] : []));
    if (figures.length > 0) out[body.id] = Math.max(...figures);
  }
  return out;
}

export function fitErrorsOf(planet) {
  return worstFigures(JSON.parse(readFileSync(new URL(`data/ephemerides/${planet}-moons/index.json`, root), "utf8")));
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  for (const planet of FIT_ERROR_PLANETS) writeFileSync(new URL(`data/moons/fit-errors/${planet}.json`, root), JSON.stringify(fitErrorsOf(planet)) + "\n");
}
