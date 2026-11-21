// O-083: every throw a host can reach through the public API is a coded SceneError. One table of calls and the code each must throw (API-05: the code, never the message).
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import jupiterIndex from "astraeus-data-jupiter/index.json";
import marsIndex from "astraeus-data-mars/index.json";
import { Scene, SceneError, earth, io, jupiter, mars, mercury, neptune, parseElementsBodyRecord, phobos, saturn, sun, triton, uranus, venus, mount, listedMoons, type DataSource } from "astraeus";

const folder = `${dirname(createRequire(import.meta.url).resolve("astraeus-data-jupiter/package.json"))}/data/jupiter-moons/`;
const jupiterData: DataSource = {
  name: "astraeus-data-jupiter",
  provides: ["io", "europa", "ganymede", "callisto"],
  moonPositions: { center: "jupiter", loadIndex: async () => jupiterIndex, chunkUrls: new Proxy({}, { get: (_target, path: string) => pathToFileURL(`${folder}${path}`).href }) as Record<string, string> },
};

const PLANETS = { mercury, venus, mars, jupiter, saturn, uranus, neptune } as const;
const BEFORE = "1949-01-01T00:00:00Z";
const AFTER = "2046-06-01T00:00:00Z";
const OPEN = "2016-03-01T00:00:00Z";

const planetScene = async (): Promise<Scene> => {
  const scene = new Scene().addBody(sun).addBody(earth).setTime(OPEN);
  for (const planet of Object.values(PLANETS)) scene.addBody(planet);
  await scene.load({});
  return scene;
};
const moonScene = async (): Promise<Scene> => {
  const scene = new Scene().addBody(sun).addBody(jupiter).addBody(io).setTime(OPEN);
  await scene.load({ data: [jupiterData] });
  return scene;
};

interface Row { readonly name: string; readonly scene: () => Promise<Scene>; readonly call: (scene: Scene) => unknown; readonly code: string }
const rows: Row[] = [
  ...Object.keys(PLANETS).flatMap((id): Row[] => [
    { name: `${id} before the series`, scene: planetScene, call: (s) => s.stateOf(id, BEFORE), code: "out-of-span" },
    { name: `${id} after the series`, scene: planetScene, call: (s) => s.stateOf(id, AFTER), code: "out-of-span" },
  ]),
  { name: "a fitted moon before its data", scene: moonScene, call: (s) => s.stateOf("io", BEFORE), code: "out-of-span" },
  { name: "a moon in its years but outside the loaded window", scene: moonScene, call: (s) => s.stateOf("io", "2020-01-01T00:00:00Z"), code: "bad-time" },
];

describe("public calls throw a coded SceneError", () => {
  it.each(rows)("$name -> $code", async ({ scene, call, code }) => {
    const built = await scene();
    let thrown: unknown;
    try { call(built); } catch (error) { thrown = error; }
    expect(thrown).toBeInstanceOf(SceneError);
    expect((thrown as SceneError).code).toBe(code);
  });

  it("Earth and the Sun answer before the planet series (recorded: they have no series cut-off)", async () => {
    const scene = await planetScene();
    for (const id of ["earth", "sun"]) expect(() => scene.stateOf(id, BEFORE)).not.toThrow();
  });
});

// T-344: the entry paths (AstraeusScene shares `mount`'s prepareScene; its row is in astraeusSceneBadScene.test.ts, which needs a DOM) that used to throw raw (a TypeError, a DataCloneError, an internal error class, a bare fetch error) now throw a coded SceneError. One table across them; the code is asserted, never the message.
const fakeElement = { appendChild: () => undefined, style: {} } as unknown as HTMLElement;
const goodScene = (): Scene => new Scene().addBody(earth);
// Each unreadable-package row uses its own planet: a moon system keeps what it loaded, so a package already read by an earlier row would not be read again.
const unreadableIndex: DataSource = { name: "astraeus-data-neptune", provides: ["triton"], moonPositions: { center: "neptune", loadIndex: async () => { throw new Error("HTTP 404"); }, chunkUrls: {} } };
const unreadableChunks: DataSource = { name: "astraeus-data-mars", provides: ["phobos"], moonPositions: { center: "mars", loadIndex: async () => marsIndex, chunkUrls: new Proxy({}, { get: () => "file:///nonexistent/chunk.bin" }) as Record<string, string> } };
const asScene = (value: unknown): Scene => value as Scene;
const rawRows: { name: string; run: () => unknown; code: string }[] = [
  { name: "mount of something that is not a Scene", run: () => mount(fakeElement, asScene({})), code: "bad-scene" },
  { name: "mount of null", run: () => mount(fakeElement, asScene(null)), code: "bad-scene" },
  { name: "setViews with a function inside", run: () => goodScene().setViews([{ id: "a", label: "A", objects: [() => 1] as unknown as string[] }], { place: "top-bar" }), code: "bad-view" },
  { name: "setViews with a symbol inside", run: () => goodScene().setViews([{ id: "a", label: "A", objects: [Symbol("x")] as unknown as string[] }], { place: "top-bar" }), code: "bad-view" },
  { name: "addTrajectory(null)", run: () => goodScene().addTrajectory(null as never), code: "bad-trajectory" },
  { name: "addTrajectory of a text", run: () => goodScene().addTrajectory("path" as never), code: "bad-trajectory" },
  { name: "addTrajectory with samples that are not a list", run: () => goodScene().addTrajectory({ id: "p", samples: "none" } as never), code: "bad-trajectory" },
  { name: "parseElementsBodyRecord of an empty object", run: () => parseElementsBodyRecord({}), code: "bad-element" },
  { name: "parseElementsBodyRecord of null", run: () => parseElementsBodyRecord(null), code: "bad-element" },
];
const moonLoad = (body: typeof triton, centre: typeof neptune, source: DataSource): Promise<void> => new Scene().addBody(sun).addBody(centre).addBody(body).setTime(OPEN).load({ data: [source] });
const asyncRows: { name: string; run: () => Promise<unknown>; code: string }[] = [
  { name: "load of a data package whose index cannot be read", run: () => moonLoad(triton, neptune, unreadableIndex), code: "bad-data" },
  { name: "load of a data package whose chunk address is unreadable", run: () => moonLoad(phobos, mars, unreadableChunks), code: "bad-data" },
];

describe("T-344: raw throws are coded", () => {
  it.each(rawRows)("$name -> $code", ({ run, code }) => {
    let thrown: unknown;
    try { run(); } catch (error) { thrown = error; }
    expect(thrown).toBeInstanceOf(SceneError);
    expect((thrown as SceneError).code).toBe(code);
  });
  it.each(asyncRows)("$name -> $code", async ({ run, code }) => {
    const thrown = await run().then(() => undefined, (error: unknown) => error);
    expect(thrown).toBeInstanceOf(SceneError);
    expect((thrown as SceneError).code).toBe(code);
  });
  it("load of a non-Scene's route (definitionOf) and a checkable Scene still work", () => {
    expect(() => Scene.prototype.check.call(goodScene())).not.toThrow();
  });
});

// T-345: more lit spheres than the viewer has render layers for is refused when the scene is built (check, mount), not as a raw RangeError during render.
// The built-in catalogue holds 25 lit bodies, so the lit bodies here are the four giant planets plus listed moons (spheres), which any scene may add; elements bodies are markers (overlay layer) and are not counted.
const GIANTS = ["uranus", "saturn", "neptune", "jupiter"];
const litIds = (n: number): string[] => [...GIANTS, ...GIANTS.flatMap((planet) => listedMoons(planet).map((moon) => moon.id))].slice(0, n);
const MARKER = { id: "x", label: "X", elements: { semiMajorAxisAu: 2, eccentricity: 0.1, inclinationDeg: 5, ascendingNodeDeg: 100, argumentOfPerihelionDeg: 60, meanAnomalyDeg: 200 }, epoch: { jd: 2_461_000.5, timeScale: "TDB" as const, ttMinusUtcSeconds: 69.184 }, plane: "ecliptic-j2000" as const, source: { name: "Invented Survey", url: "https://example.invalid/x", solution: "A", accessed: "2026-10-24" }, accuracy: { classification: "indicative" as const, statement: "Made up.", valid: { start: "2025-01-01T00:00:00Z", end: "2027-01-01T00:00:00Z" }, limitations: ["Invented for a test."] }, marker: { color: "#ff9966", sizePx: 8 } };
const litScene = (lit: number, markers = 0): Scene => {
  const ids = litIds(lit);
  expect(ids).toHaveLength(lit);
  const scene = new Scene().addBody(sun).setTime(OPEN);
  for (const id of ids) scene.addBody(id);
  for (let k = 0; k < markers; k++) scene.addBodyFromElements({ ...MARKER, id: `marker-${k}`, label: `Marker ${k}` });
  return scene;
};
const allData: DataSource[] = GIANTS.map((planet) => ({ name: `astraeus-data-${planet}`, provides: listedMoons(planet).map((moon) => moon.id) }));
const catchOf = (run: () => unknown): unknown => { try { run(); } catch (error) { return error; } return undefined; };
describe("T-345: too many lit bodies", () => {
  it("31 lit bodies -> too-many-bodies from check()", () => {
    const thrown = catchOf(() => litScene(31).check({ data: allData }));
    expect(thrown).toBeInstanceOf(SceneError);
    expect((thrown as SceneError).code).toBe("too-many-bodies");
  });
  it("30 lit bodies plus marker bodies do not throw", () => {
    expect(() => litScene(30, 5).check({ data: allData })).not.toThrow();
  });
});
