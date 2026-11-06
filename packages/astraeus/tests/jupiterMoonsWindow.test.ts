import { describe, expect, it } from "vitest";
import { ringExtentKm } from "../src/app/RingView";
import { JUPITER_RINGS } from "../src/assets/bodies/jupiterRings";
import { catalogue } from "../src/assets/catalogue";
import { parseRingSystem, ringBandsWithLook } from "../src/assets/rings";
import { chunksNeeded, jupiterMoonEphemeris, JUPITER_MOON_FIT_SPAN, osculatingPeriodMs } from "../src/core/bodies/jupiterMoons";
import { jupiterRawList } from "./helpers/jupiterMoonPanel";

// Moved from the planets demo (O-059 T-270; first O-025 T-098): what Jupiter's fits make of the planets demo's window, and Jupiter's rings. The demo keeps what it ships
// (tests/demoPlanets.test.ts there states the same counts for its shipped chunk list).
const WINDOW = { startUtcMs: Date.parse("2016-11-04T00:00:00Z"), endUtcMs: Date.parse("2016-11-18T00:00:00Z") };
const IDS = jupiterRawList().moons.map((moon) => moon.id);
const everyChunk = new Proxy({}, { get: () => "x" }) as Record<string, string>;

describe("Jupiter's fits for the planets demo's window", () => {
  it("keep the window inside the fits and need only its year's chunks, one per moon plus Jupiter's own series", () => {
    expect(WINDOW.startUtcMs).toBeGreaterThanOrEqual(JUPITER_MOON_FIT_SPAN.startUtcMs);
    expect(WINDOW.endUtcMs).toBeLessThanOrEqual(JUPITER_MOON_FIT_SPAN.endUtcMs);
    const needed = chunksNeeded(jupiterMoonEphemeris(), { window: WINDOW, bodies: IDS, chunkUrls: everyChunk });
    expect(needed.length).toBe(116);
    expect(needed.every(({ path }) => path.endsWith("/2016.bin"))).toBe(true);
  });

  it("need the two years before only for the moons whose orbit takes longer than the window's year has had", () => {
    const fast = ["metis", "adrastea", "amalthea", "thebe", "io", "europa", "ganymede", "callisto"];
    const historyYears = (id: string): string[] => {
      const period = osculatingPeriodMs(jupiterMoonEphemeris(), id, WINDOW.startUtcMs);
      const reach = Math.min(period * 1.05, 3 * 365.25 * 86_400_000);
      return [...new Set(jupiterMoonEphemeris().chunksFor([id], Math.floor(WINDOW.startUtcMs - reach), WINDOW.startUtcMs).map(({ path }) => /(\d{4})\.bin$/.exec(path)![1]!))];
    };
    for (const id of fast) expect(historyYears(id), id).toEqual(["2016"]);
    expect(IDS.filter((id) => !fast.includes(id) && historyYears(id).includes("2015")).length).toBeGreaterThan(0);
    // One period of S/2021 J 7's path before the window needs 2015 and 2014 chunks, which the data package holds.
    const period = osculatingPeriodMs(jupiterMoonEphemeris(), "s2021-j7", WINDOW.startUtcMs);
    expect(period).toBeGreaterThan(300 * 86_400_000);
    expect(historyYears("s2021-j7")).toEqual(expect.arrayContaining(["2015"]));
    expect(() => chunksNeeded(jupiterMoonEphemeris(), { window: { startUtcMs: Date.UTC(2018, 0, 1), endUtcMs: Date.UTC(2018, 0, 2) }, bodies: ["io"], chunkUrls: { "io/2016.bin": "x" } })).toThrow(/does not ship/);
  });
});

describe("Jupiter's rings", () => {
  it("are the four Planetary Explorer bands at the NSSDC radii, drawn from the catalogue's Jupiter", () => {
    expect(JUPITER_RINGS.bands.map((band) => [band.id, band.innerKm, band.outerKm, band.color, band.opacity])).toEqual([
      ["halo", 89_400, 123_000, "#a0b0d0", 0.105],
      ["main", 123_000, 128_940, "#d0a080", 0.28],
      ["amalthea-gossamer", 128_940, 181_350, "#b08060", 0.065],
      ["thebe-gossamer", 181_350, 221_900, "#a07050", 0.026],
    ]);
    expect(ringExtentKm(JUPITER_RINGS.bands)).toEqual({ innerKm: 89_400, outerKm: 221_900 });
    expect(JUPITER_RINGS.sources.join(" ")).toContain("nssdc.gsfc.nasa.gov/planetary/factsheet/jupringfact.html");
    // One source: the catalogue's Jupiter carries them and the experience attaches none of its own.
    expect(catalogue.get("jupiter").visual.rings).toBe(JUPITER_RINGS);
  });

  it("take live colour and opacity per band, and refuse bad data", () => {
    const bands = ringBandsWithLook(JUPITER_RINGS, { main: { opacity: 0.5, color: "#ffffff" } });
    expect(bands[1]).toMatchObject({ opacity: 0.5, color: "#ffffff", innerKm: 123_000 });
    expect(bands[0]).toEqual(JUPITER_RINGS.bands[0]);
    const good = { format: "astraeus.ring-system/1", body: "x", bands: [{ id: "a", label: "A", innerKm: 1, outerKm: 2, color: "#ffffff", opacity: 0.1 }] };
    expect(parseRingSystem(good).bands.length).toBe(1);
    expect(() => parseRingSystem({ ...good, bands: [{ ...good.bands[0], outerKm: 1 }] })).toThrow(/innerKm < outerKm/);
    expect(() => parseRingSystem({ ...good, bands: [{ ...good.bands[0], opacity: 2 }] })).toThrow(/opacity/);
    expect(() => parseRingSystem({ ...good, format: "other" })).toThrow(/format/);
  });
});
