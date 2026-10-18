import { describe, expect, it } from "vitest";
import { bodySetsOf, mountedBodiesOf, visualOverridesOf } from "../src/app/experienceDefinition";
import { JUPITER_MOON_CATALOGUE } from "../src/assets/bodies/jupiterMoonCatalogue";
import { JUPITER_RINGS } from "../src/assets/bodies/jupiterRings";
import { catalogue } from "../src/assets/catalogue";
import { parseRingSystem, ringBandsWithLook } from "../src/assets/rings";
import { ringExtentKm } from "../src/app/RingView";
import { chunksNeeded, jupiterMoonEphemeris, JUPITER_MOON_FIT_SPAN, osculatingPeriodMs } from "../src/core/bodies/jupiterMoons";
import { JUPITER_CHUNK_URLS, JUPITER_MOON_IDS, JUPITER_WINDOW, jupiterIoExplorer } from "../src/experiences/jupiter-io/jupiterIo";

// O-025 T-098: the Jupiter scene draws every catalogued moon, ships and fetches only its window's fit chunks, and draws the rings at the
// published radii in Planetary Explorer's look.
describe("Jupiter's moons in the Jupiter scene", () => {
  it("draws all 115 catalogued moons: the four mapped ones as bodies, the other 111 as one body set", () => {
    const mounted = mountedBodiesOf(jupiterIoExplorer);
    const [set] = bodySetsOf(jupiterIoExplorer);
    expect(mounted).toEqual(["jupiter", "io", "europa", "ganymede", "callisto"]);
    expect(set.members.length).toBe(111);
    expect(new Set([...mounted.slice(1), ...set.members.map((member) => member.id)])).toEqual(new Set(JUPITER_MOON_CATALOGUE.moons.map((moon) => moon.id)));
    expect(JUPITER_MOON_CATALOGUE.moons.length).toBe(115);
    // The mapped moons are the ones with body packages; the rest are grey dots with their family's orbit colour.
    expect(JUPITER_MOON_CATALOGUE.moons.filter((moon) => moon.bodyPackage !== undefined).map((moon) => moon.id).sort()).toEqual(["callisto", "europa", "ganymede", "io"]);
    expect(set.bodyFamilies).toEqual({ io: "galilean", europa: "galilean", ganymede: "galilean", callisto: "galilean" });
    // Europa's, Ganymede's and Callisto's orbit lines are in the batch (114 in all); Io keeps its own loop.
    expect(set.extraOrbits?.group.members).toEqual(["europa", "ganymede", "callisto"]);
    expect(set.extraOrbits?.families).toEqual(["galilean", "galilean", "galilean"]);
    expect(jupiterIoExplorer.composition?.paths?.map((path) => path.body)).toEqual(["io"]);
    expect(set.families.map((family) => family.id)).toEqual(JUPITER_MOON_CATALOGUE.families.map((family) => family.id));
    for (const id of ["io", "europa", "ganymede", "callisto"]) expect(catalogue.get(id).visual.texture?.licence?.licence, id).toBe("public domain");
  });

  it("keeps its window inside the fits, needs only its year's chunks, and ships the two years before for the slow moons' orbit lines", () => {
    expect(JUPITER_WINDOW.startUtcMs).toBeGreaterThanOrEqual(JUPITER_MOON_FIT_SPAN.startUtcMs);
    expect(JUPITER_WINDOW.endUtcMs).toBeLessThanOrEqual(JUPITER_MOON_FIT_SPAN.endUtcMs);
    const needed = chunksNeeded(jupiterMoonEphemeris(), { window: JUPITER_WINDOW, bodies: JUPITER_MOON_IDS, chunkUrls: JUPITER_CHUNK_URLS });
    // One chunk per moon plus Jupiter's own series, all from 2016.
    expect(needed.length).toBe(116);
    expect(needed.every(({ path }) => path.endsWith("/2016.bin"))).toBe(true);
    const shipped = Object.keys(JUPITER_CHUNK_URLS);
    const fast = ["metis", "adrastea", "amalthea", "thebe", "io", "europa", "ganymede", "callisto"];
    expect(shipped.filter((path) => path.endsWith("/2016.bin")).length).toBe(116);
    // 2014 and 2015 for every moon but the eight whose periods are days, and for Jupiter (the centre).
    for (const year of [2014, 2015]) expect(shipped.filter((path) => path.endsWith(`/${year}.bin`)).length).toBe(116 - fast.length);
    expect(shipped.every((path) => /\/(2014|2015|2016)\.bin$/.test(path))).toBe(true);
    expect(shipped.some((path) => fast.some((id) => path.startsWith(`${id}/201`) && !path.endsWith("2016.bin")))).toBe(false);
    // One period of S/2021 J 7's path before the window is covered by shipped chunks (the orbit line the owner checked).
    const period = osculatingPeriodMs(jupiterMoonEphemeris(), "s2021-j7", JUPITER_WINDOW.startUtcMs);
    expect(period).toBeGreaterThan(300 * 86_400_000);
    const history = jupiterMoonEphemeris().chunksFor(["s2021-j7"], Math.floor(JUPITER_WINDOW.startUtcMs - period), JUPITER_WINDOW.startUtcMs);
    expect(history.every(({ path }) => JUPITER_CHUNK_URLS[path] !== undefined)).toBe(true);
    expect(() => chunksNeeded(jupiterMoonEphemeris(), { window: { startUtcMs: Date.UTC(2018, 0, 1), endUtcMs: Date.UTC(2018, 0, 2) }, bodies: ["io"], chunkUrls: JUPITER_CHUNK_URLS })).toThrow(/does not ship/);
  });

  it("places every small moon from the fits inside the window", () => {
    const [set] = bodySetsOf(jupiterIoExplorer);
    const out = new Float64Array(3 * set.group.count);
    set.group.fillPositionsKm(JUPITER_WINDOW.startUtcMs, out);
    const distances = set.members.map((_, i) => Math.hypot(out[3 * i], out[3 * i + 1], out[3 * i + 2]));
    // Metis about 128,000 km from Jupiter; the farthest irregular moons beyond 25 million km.
    expect(Math.min(...distances)).toBeGreaterThan(120_000);
    expect(Math.max(...distances)).toBeGreaterThan(25_000_000);
  });
});

describe("Jupiter's rings", () => {
  it("are the four Planetary Explorer bands at the NSSDC radii, drawn through the experience's overrides", () => {
    expect(JUPITER_RINGS.bands.map((band) => [band.id, band.innerKm, band.outerKm, band.color, band.opacity])).toEqual([
      ["halo", 89_400, 123_000, "#a0b0d0", 0.105],
      ["main", 123_000, 128_940, "#d0a080", 0.28],
      ["amalthea-gossamer", 128_940, 181_350, "#b08060", 0.065],
      ["thebe-gossamer", 181_350, 221_900, "#a07050", 0.026],
    ]);
    expect(ringExtentKm(JUPITER_RINGS.bands)).toEqual({ innerKm: 89_400, outerKm: 221_900 });
    expect(JUPITER_RINGS.sources.join(" ")).toContain("nssdc.gsfc.nasa.gov/planetary/factsheet/jupringfact.html");
    expect(visualOverridesOf(jupiterIoExplorer).get("jupiter")?.rings).toBe(JUPITER_RINGS);
    // Rings are opt-in: the catalogue's Jupiter (used by the showers) has none.
    expect(catalogue.get("jupiter").visual.rings).toBeUndefined();
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
