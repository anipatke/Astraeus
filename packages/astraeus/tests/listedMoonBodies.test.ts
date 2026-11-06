import { describe, expect, it } from "vitest";
import { Scene, SceneError, listedMoons as listed, type DataSource } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { installData } from "../src/api/data";
import { listedMoon, listedMoons } from "../src/core/bodies/listedMoons";
import { MOON_SYSTEMS } from "../src/core/bodies/listedMoonBodies";
import { ChebyshevEphemeris, parseEphemerisIndex } from "../src/core/chebyshevEphemeris";
import { HISTORICAL_MOON_FIT_SPAN, MOON_FIT_SPAN } from "../src/core/bodies/moonSystem";
import { moonDataFolder } from "./moonData";
import { readBytes, readJson } from "../tools/import/test-io.mjs";
import uranusIndex from "astraeus-data-uranus/index.json";
import { definitionOf } from "../src/api/definitionOf";

// O-049 T-211: addBody takes any listed moon by one rule; detailed definitions win; an unused moon costs nothing. Made-up Sun-first scenes, no browser.
const DAY_MS = 86_400_000;
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const uranusData: DataSource = { name: "astraeus-data-uranus", provides: [] };
const scene = (...ids: string[]) => ids.reduce((s, id) => s.addBody(id), new Scene());

describe("addBody takes any listed moon", () => {
  it("builds Miranda in a Sun-first scene with Uranus and its data package, and one lap of its period for { orbit: true }", () => {
    const definition = definitionOf(new Scene().addBody("sun").addBody("uranus").addBody("miranda", { orbit: true }), [uranusData]);
    expect(definition.experience.objects.map((o) => o.id)).toEqual(["sun", "uranus", "miranda"]);
    const path = definition.composition!.paths!.find((p) => p.body === "miranda")!;
    expect(path.spanMs / DAY_MS).toBeCloseTo(listedMoon("miranda")!.orbitPeriodDays!, 6);
    const asset = definition.catalogue!.get("miranda");
    expect(asset.definition).toMatchObject({ label: "Miranda", parentId: "uranus", radiusKm: listedMoon("miranda")!.meanRadiusKm, orientation: "tidal-lock" });
    expect(asset.visual).toMatchObject({ kind: "sphere" });
    expect(asset.visual.texture).toBeUndefined();
    expect(asset.definition.accuracy.validUtc).toEqual(HISTORICAL_MOON_FIT_SPAN);
  });

  it("refuses without its data package, as an unlisted moon of any planet does", () => {
    expect(codeOf(() => definitionOf(scene("sun", "uranus", "miranda"), []))).toMatch(/^missing-data: miranda needs the astraeus-data-uranus package/);
    expect(codeOf(() => definitionOf(scene("sun", "saturn", "pan"), []))).toMatch(/^missing-data: pan needs the astraeus-data-saturn package/);
  });

  it("refuses a window outside the years the package covers, as out-of-span", async () => {
    const source = { name: "astraeus-data-uranus", provides: [], moonPositions: { centre: "uranus", loadIndex: async () => uranusIndex, chunkUrls: {} } };
    MOON_SYSTEMS.uranus!.install(null);
    const window = { startUtcMs: Date.UTC(2040, 0, 1), endUtcMs: Date.UTC(2041, 0, 1) };
    const built = new Scene().addBody("sun").addBody("uranus").addBody("miranda");
    const error = await installData([source], ["sun", "uranus", "miranda"], window, definitionOf(built, [uranusData]).catalogue).catch((caught: unknown) => caught);
    expect((error as SceneError).code).toBe("out-of-span");
    MOON_SYSTEMS.uranus!.install(null);
  });

  it("refuses { orbit: true } for a moon with no period, and for one whose planet is not in the scene", () => {
    const noPeriod = listedMoons().find((moon) => moon.orbitPeriodDays === null);
    if (noPeriod !== undefined) expect(codeOf(() => scene(noPeriod.parent).addBody(noPeriod.id, { orbit: true }))).toMatch(/^no-orbit/);
    expect(codeOf(() => definitionOf(new Scene().addBody("miranda", { orbit: true }), [uranusData]))).toMatch(/^no-orbit: .*about uranus/);
  });

  it("keeps the detailed definitions: Io, Titan, Triton, Charon and Phobos are the built-in ones", () => {
    for (const id of ["io", "europa", "ganymede", "callisto", "phobos", "deimos", "mimas", "titan", "iapetus", "triton", "charon"]) {
      const s = scene(id === "phobos" || id === "deimos" ? "mars" : "sun").addBody(id);
      const definition = definitionOf(s, [{ name: "all", provides: [id] }]);
      expect(definition.catalogue === undefined || definition.catalogue.get(id).definition === catalogue.get(id).definition, id).toBe(true);
    }
    expect(codeOf(() => new Scene().addBody("phobos", { orbit: true }).addBody("mars"))).toMatch(/^no-orbit/);
  });

  it("an unused moon costs nothing: the built-in catalogue holds none of the others, and a scene without one does not carry a catalogue", () => {
    expect(catalogue.has("miranda")).toBe(false);
    expect(definitionOf(new Scene().addBody("sun").addBody("uranus")).catalogue).toBeUndefined();
    scene("sun", "uranus", "miranda");
    expect(catalogue.has("miranda")).toBe(false);
  });

  it("builds every listed moon by the one rule (no moon is named in it), with its planet's data package", () => {
    for (const moon of listedMoons()) {
      expect(moon.fitBody, moon.id).toBe(moon.id);
      const built = new Scene().addBody(moon.parent).addBody(moon.id);
      const definition = definitionOf(built, [{ name: moon.dataPackage, provides: [] }]);
      const asset = (definition.catalogue ?? catalogue).get(moon.id);
      expect(asset.definition.parentId, moon.id).toBe(moon.parent);
      expect(asset.source, moon.id).toBeDefined();
      if (moon.orbitPeriodDays !== null && !catalogue.has(moon.id)) expect(asset.definition.orbitPeriodDays, moon.id).toBeDefined();
    }
  });

  it("places Miranda about Uranus from the committed fits during the Voyager 2 flyby (1986)", () => {
    const index = parseEphemerisIndex(readJson(`${moonDataFolder("uranus")}index.json`));
    const set = new ChebyshevEphemeris(index);
    for (const body of ["uranus", "miranda"]) set.addChunk(body, `${body}/1986.bin`, readBytes(`${moonDataFolder("uranus")}${body}/1986.bin`));
    MOON_SYSTEMS.uranus!.install(set);
    const s = new Scene().addBody("sun").addBody("uranus").addBody("miranda");
    const state = s.stateOf("miranda", "1986-01-24T17:00:00Z");
    expect(Math.hypot(...state.positionKm)).toBeGreaterThan(1.2e5);
    expect(Math.hypot(...state.positionKm)).toBeLessThan(1.4e5);
    expect(s.provenanceOf("miranda").sourceType).toBe("ephemeris");
    MOON_SYSTEMS.uranus!.install(null);
  });
});

describe("the listings and the unknown-body message", () => {
  it("lists every listed moon with its data package, and a planet's own", () => {
    expect(listed()).toHaveLength(458);
    expect(listed("uranus").map((m) => m.id)).toEqual(expect.arrayContaining(["miranda", "ariel", "umbriel", "titania", "oberon"]));
    expect(listed("uranus").every((m) => m.requires === "astraeus-data-uranus")).toBe(true);
    expect(listed("mars").map((m) => m.id)).toEqual(["phobos", "deimos"]);
  });

  it("stays short with hundreds of moons: the built-in ids and how to list moons, not every moon", () => {
    const message = codeOf(() => new Scene().addBody("not-a-body"));
    expect(message).toMatch(/^unknown-body: .*known: sun, earth, moon/);
    expect(message).toMatch(/listedMoons\(planet\)/);
    expect(message.length).toBeLessThan(600);
  });

  it("the early flag marks the moons whose fits start in 1950, from the shipped indexes", () => {
    expect(listedMoon("miranda")!.early).toBe(true);
    expect(listedMoon("caliban")!.early).toBe(false);
    expect(MOON_FIT_SPAN.startUtcMs).toBeGreaterThan(HISTORICAL_MOON_FIT_SPAN.startUtcMs);
  });
});
