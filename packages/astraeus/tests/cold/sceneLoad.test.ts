// O-056 T-259: numbers without a viewer. Runs in the "cold" Vitest project (no vitest.setup.ts preload), so the planet series and the moon fits are loaded only by what the test does,
// as in a Node consumer. Public entry points only: `astraeus` and a data package's `dataSource`. Each case takes a fresh module graph, so none sees another's loads.
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jupiterIndex from "astraeus-data-jupiter/index.json";

type Api = typeof import("astraeus");
type DataSource = import("astraeus").DataSource;
interface Data { readonly dataSource: DataSource }

const WHEN = "2016-03-01T00:00:00Z";

// The package's own `dataSource` needs its built chunk list (`src/chunks.js`, written at build time), which a source checkout lacks, so the same source is assembled here from the package's
// shipped index and chunk files (what `dataSource` holds); the packed package's own `dataSource` is exercised by `npm run check:node-consumer`.
const folder = `${dirname(createRequire(import.meta.url).resolve("astraeus-data-jupiter/package.json"))}/data/jupiter-moons/`;
const dataSource: DataSource = {
  name: "astraeus-data-jupiter",
  provides: ["io", "europa", "ganymede", "callisto"],
  moonPositions: { centre: "jupiter", loadIndex: async () => jupiterIndex, chunkUrls: new Proxy({}, { get: (_target, path: string) => pathToFileURL(`${folder}${path}`).href }) as Record<string, string> },
};

async function fresh(): Promise<{ api: Api; data: Data }> {
  vi.resetModules();
  return { api: await import("astraeus"), data: { dataSource } };
}
const jupiterScene = (api: Api) => new api.Scene().addBody(api.sun).addBody(api.jupiter).addBody(api.io).setTime(WHEN);
/** What a call throws (or "no error"), as `code: message`, so two entry paths compare equal on both. */
const thrown = (call: () => unknown): string => {
  try { call(); } catch (error) { return `${(error as { code?: string }).code}: ${(error as Error).message}`; }
  return "no error";
};

beforeEach(() => { vi.resetModules(); });

describe("stateOf before load", () => {
  const rows = [["a planet", "jupiter"], ["a fitted moon", "io"]] as const;
  it.each(rows)("%s throws missing-data that names scene.load and no internal", async (_name, id) => {
    const { api } = await fresh();
    const failure = thrown(() => jupiterScene(api).stateOf(id, WHEN));
    expect(failure).toMatch(/^missing-data: /);
    expect(failure).toContain("scene.load");
    expect(failure).not.toMatch(/loadPlanetSeries|moon fits are not loaded|planet series are not loaded/);
  });
});

describe("Scene.load", () => {
  it("makes stateOf and provenanceOf work for a planet and a fitted moon, in plain Node", async () => {
    const { api, data } = await fresh();
    const scene = jupiterScene(api);
    await scene.load({ data: [data.dataSource] });
    const jupiterKm = Math.hypot(...scene.stateOf("jupiter", WHEN).positionKm);
    expect(jupiterKm).toBeGreaterThan(7e8);
    expect(jupiterKm).toBeLessThan(8.5e8);
    const io = scene.stateOf("io", WHEN);
    expect(io.center).toBe("jupiter");
    expect(Math.hypot(...io.positionKm)).toBeGreaterThan(4e5); // Io is about 421,800 km from Jupiter
    expect(Math.hypot(...io.positionKm)).toBeLessThan(4.5e5);
    expect(scene.provenanceOf("io").sources.length).toBeGreaterThan(0);
    expect(scene.provenanceOf("jupiter").sources.length).toBeGreaterThan(0);
  });

  it("is harmless twice, and allowed on a scene that is already frozen", async () => {
    const { api, data } = await fresh();
    const scene = jupiterScene(api);
    await scene.load({ data: [data.dataSource] });
    await expect(scene.load({ data: [data.dataSource] })).resolves.toBeUndefined();
    expect(() => scene.check({ data: [data.dataSource] })).not.toThrow(); // building after load still works
    expect(() => scene.setTime(WHEN)).not.toThrow(); // load never froze it
  });

  const refusals: readonly [string, (api: Api) => InstanceType<Api["Scene"]>, (data: Data) => readonly Data["dataSource"][], string][] = [
    ["a moon whose package is not passed", jupiterScene, () => [], "missing-data"],
    ["a window outside the years the moon data covers", (api) => new api.Scene().addBody(api.sun).addBody(api.jupiter).addBody(api.io).setTimeline({ start: "1900-01-01", end: "1900-02-01" }), (data) => [data.dataSource], "out-of-span"],
    ["an empty scene", (api) => new api.Scene(), () => [], "empty-scene"],
  ];
  it.each(refusals)("rejects for %s with %s", async (_name, make, pass, code) => {
    const { api, data } = await fresh();
    await expect(make(api).load({ data: pass(data) })).rejects.toMatchObject({ name: "SceneError", code });
  });
});

describe("Scene.check", () => {
  it("throws what load rejects with for a build fault, loads nothing and does not freeze the scene", async () => {
    const { api } = await fresh();
    const scene = jupiterScene(api);
    expect(thrown(() => scene.check())).toMatch(/^missing-data: /);
    await expect(scene.load()).rejects.toMatchObject({ code: "missing-data" });
    expect(() => scene.setTime(WHEN)).not.toThrow();
    expect(thrown(() => jupiterScene(api).check({ data: [{ name: "stub", provides: ["io"] }] }))).toBe("no error");
    expect(thrown(() => jupiterScene(api).stateOf("jupiter", WHEN))).toMatch(/^missing-data: /); // check loaded nothing
  });
});
