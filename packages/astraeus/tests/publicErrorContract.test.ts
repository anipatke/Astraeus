// O-083: every throw a host can reach through the public API is a coded SceneError. One table of calls and the code each must throw (API-05: the code, never the message).
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import jupiterIndex from "astraeus-data-jupiter/index.json";
import { Scene, SceneError, earth, io, jupiter, mars, mercury, neptune, saturn, sun, uranus, venus, type DataSource } from "astraeus";

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
