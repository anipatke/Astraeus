import { afterEach, describe, expect, it } from "vitest";
import { MOON_SYSTEMS } from "../src/core/bodies/listedMoonBodies";
import { readBytes, readJson } from "../tools/import/test-io.mjs";
import { moonDataFolder } from "./moonData";

// Moved from the planets demo (O-059 T-270; first O-033 T-118): the chunks a planet's window loads, with the orbit lines' history, from the real data packages. The demo ships a
// chunk list per planet from its own globs and states the same counts (tests/planetSystems.test.ts there), so the list it ships is the list a window loads (Jupiter's ships a few more
// for the slow moons; it was never held to the loaded list).
const WINDOW = { startUtcMs: Date.parse("2016-11-04T00:00:00Z"), endUtcMs: Date.parse("2016-11-18T00:00:00Z") };
const THREE_YEARS_MS = 3 * 365.25 * 86_400_000;
/** What the demo gives each planet's orbit lines: how far they reach back (Mars: three days; Pluto: not at all, its moons orbit in under 40 days). */
const HISTORY_MS: Record<string, number> = { jupiter: THREE_YEARS_MS, saturn: THREE_YEARS_MS, uranus: THREE_YEARS_MS, neptune: THREE_YEARS_MS, mars: 3 * 86_400_000, pluto: 0 };
/** The chunks each planet's window loads: [2016 chunks, 2015 chunks, 2014 chunks]. */
const CHUNKS_LOADED: Record<string, readonly [number, number, number]> = { jupiter: [116, 96, 76], saturn: [293, 269, 237], uranus: [29, 10, 9], neptune: [17, 9, 8], mars: [3, 0, 0], pluto: [6, 0, 0] };

afterEach(() => { for (const planet of Object.keys(HISTORY_MS)) MOON_SYSTEMS[planet]?.install(null); });

describe.each(Object.keys(HISTORY_MS))("%s", (planet) => {
  it("loads the chunks the window and its orbit lines need, all of them files of its data package", async () => {
    const system = MOON_SYSTEMS[planet]!;
    const list = readJson(`${moonDataFolder(planet)}list.json`) as { moons: { id: string }[] };
    const ids = list.moons.map((moon) => moon.id);
    const folder = moonDataFolder(planet);
    const chunkUrls = new Proxy({}, { get: (_target, path: string) => (/\/\d{4}\.bin$/.test(path) ? `${folder}${path}` : undefined) }) as Record<string, string>;
    const fetched: string[] = [];
    system.provideIndex(async () => readJson(`${folder}index.json`));
    system.install(null);
    await system.load({ window: WINDOW, bodies: ids, chunkUrls, ...(HISTORY_MS[planet] === 0 ? {} : { history: { bodies: ids, maxMs: HISTORY_MS[planet]! } }), fetchBytes: async (url) => { fetched.push(url); return readBytes(url); } });
    const byYear = (year: number) => new Set(fetched.filter((url) => url.endsWith(`/${year}.bin`))).size;
    expect([byYear(2016), byYear(2015), byYear(2014)]).toEqual(CHUNKS_LOADED[planet]);
    expect(fetched.every((url) => url.startsWith(folder))).toBe(true);
  });
});
