import { afterEach, describe, expect, it, vi } from "vitest";
import { PICTURES } from "astraeus-data";
import { JUPITER_CHUNK_URLS, JUPITER_MOON_IDS, JUPITER_WINDOW, jupiterIoData, jupiterIoScene } from "../src/experiences/jupiter-io/jupiterIo";
import { readBytes } from "./helpers/testIo.mjs";

// O-025 T-098: the Jupiter scene draws every catalogued moon, ships and fetches only its window's fit chunks. Read through the public `Scene` reads (O-059 T-270);
// what Jupiter's fits make of the window is the engine's tests/jupiterMoonsWindow.test.ts, and the rings are its tests too.
const FOLDER = new URL("../../astraeus-data-jupiter/data/jupiter-moons/", import.meta.url).pathname;
const REPO = new URL("../../../../", `file://${FOLDER}`).pathname;
const MAPPED = ["io", "europa", "ganymede", "callisto"];

describe("Jupiter's moons in the Jupiter scene", () => {
  it("draws all 115 catalogued moons: the four mapped ones as bodies, the other 111 as one body set", () => {
    const [set] = jupiterIoScene.bodySets;
    expect(jupiterIoScene.bodies.map((body) => body.id)).toEqual(["jupiter", ...MAPPED]);
    expect(set!.count).toBe(111);
    expect(JUPITER_MOON_IDS.length).toBe(115);
    expect(new Set([...MAPPED, ...JUPITER_MOON_IDS.filter((id) => !MAPPED.includes(id))]).size).toBe(115);
    for (const id of MAPPED) expect(PICTURES[id]?.licence?.licence, id).toBe("public domain");
  });

  it("keeps its window inside the fits and ships its year's chunks, and the two years before for the slow moons' orbit lines", () => {
    expect(JUPITER_WINDOW.startUtcMs).toBeGreaterThanOrEqual(Date.UTC(2010, 0, 1));
    expect(JUPITER_WINDOW.endUtcMs).toBeLessThanOrEqual(Date.UTC(2030, 0, 1));
    const shipped = Object.keys(JUPITER_CHUNK_URLS);
    const fast = ["metis", "adrastea", "amalthea", "thebe", "io", "europa", "ganymede", "callisto"];
    // One chunk per moon plus Jupiter's own series, all from 2016 (the engine's tests/jupiterMoonsWindow.test.ts: that is what the window needs).
    expect(shipped.filter((path) => path.endsWith("/2016.bin")).length).toBe(116);
    // 2014 and 2015 for every moon but the eight whose periods are days, and for Jupiter (the centre).
    for (const year of [2014, 2015]) expect(shipped.filter((path) => path.endsWith(`/${year}.bin`)).length).toBe(116 - fast.length);
    expect(shipped.every((path) => /\/(2014|2015|2016)\.bin$/.test(path))).toBe(true);
    expect(shipped.some((path) => fast.some((id) => path.startsWith(`${id}/201`) && !path.endsWith("2016.bin")))).toBe(false);
    // Every chunk it ships is a file of the data package, and the slow moon S/2021 J 7's earlier years are among them.
    for (const path of shipped) expect(readBytes(`${FOLDER}${path}`).byteLength, path).toBeGreaterThan(0);
    expect(shipped).toEqual(expect.arrayContaining(["s2021-j7/2016.bin", "s2021-j7/2015.bin"]));
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it("places every small moon from the fits inside the window", async () => {
    // The scene reads only its own moon data, so it loads the package's chunks first (the file behind each chunk address stands in for the network).
    vi.stubGlobal("fetch", async (url: string) => {
      const bytes = readBytes(`${REPO}${url.split("?")[0]!.replace(/^\//, "")}`);
      return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
    });
    await jupiterIoScene.load({ data: jupiterIoData });
    const distances = JUPITER_MOON_IDS.filter((id) => !MAPPED.includes(id)).map((id) => Math.hypot(...jupiterIoScene.stateOf(id, JUPITER_WINDOW.startUtcMs).positionKm));
    expect(distances).toHaveLength(111);
    // Metis about 128,000 km from Jupiter; the farthest irregular moons beyond 25 million km.
    expect(Math.min(...distances)).toBeGreaterThan(120_000);
    expect(Math.max(...distances)).toBeGreaterThan(25_000_000);
  });
});
