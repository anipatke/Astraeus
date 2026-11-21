// O-084 T-357: a catalogue bound to one scene's moon data reads only that scene's moon systems, never the process-wide ones.
// The preloaded project (vitest.setup.ts) has loaded the process-wide Jupiter and Saturn systems, so a bound catalogue answering without them is proof.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { catalogue as builtIn, bindCatalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createSceneMoonData } from "../src/core/moonData";
import { NotLoadedError } from "../src/core/planetSeries";
import { createStateResolver } from "../src/core/stateResolver";
import { readBytes } from "../tools/import/test-io.mjs";

const adapter = createOrbAstronomyAdapter();
const T = Date.parse("2016-06-01T00:00:00Z");
const folder = (planet: string) =>
  `${dirname(createRequire(import.meta.url).resolve(`astraeus-data-${planet}/package.json`))}/data/${planet}-moons/`;

const resolverOf = (moonData?: ReturnType<typeof createSceneMoonData>) => {
  const bound = moonData === undefined ? builtIn : bindCatalogue(builtIn, moonData);
  return createStateResolver(bound.definitions(), bound.sources(), adapter);
};
const barycentre = (planet: "jupiter" | "saturn") => adapter.planetPositionFromSunKm(planet, T);
const unbound = resolverOf();

/** The scene's own Jupiter system, its 2016 chunks read from disk the way the setup loads the process-wide one. */
async function loadJupiter(moonData: ReturnType<typeof createSceneMoonData>): Promise<void> {
  const root = folder("jupiter");
  const system = moonData.system("jupiter")!;
  system.provideIndex(async () => JSON.parse(await readFile(`${root}index.json`, "utf8")) as unknown);
  await system.load({
    window: { startUtcMs: Date.UTC(2016, 1, 10), endUtcMs: Date.UTC(2016, 11, 30) },
    bodies: ["io"],
    chunkUrls: new Proxy(
      {},
      { get: (_target, path: string) => (path.endsWith("/2016.bin") ? `${root}${path}` : undefined) },
    ) as Record<string, string>,
    fetchBytes: async (path) => readBytes(path),
  });
}

describe("a catalogue bound to a scene's moon data", () => {
  it.each([
    ["jupiter", "io"],
    ["saturn", "titan"],
  ] as const)(
    "holds %s at its barycentre and refuses %s while the scene's own system is not loaded",
    (planet, moon) => {
      const resolver = resolverOf(createSceneMoonData());
      expect(Array.from(resolver.stateOf(planet, T, "sun").positionKm)).toEqual(Array.from(barycentre(planet)));
      expect(() => resolver.stateOf(moon, T, planet)).toThrow(NotLoadedError);
    },
  );

  it("answers from the scene's system once that is loaded, leaves Saturn at its barycentre, and another scene's data is unaffected", async () => {
    const mine = createSceneMoonData();
    const other = createSceneMoonData();
    await loadJupiter(mine);
    const resolver = resolverOf(mine);
    expect(Array.from(resolver.stateOf("jupiter", T, "sun").positionKm)).toEqual(
      Array.from(unbound.stateOf("jupiter", T, "sun").positionKm),
    );
    expect(resolver.stateOf("io", T, "jupiter").positionKm.length).toBe(3);
    expect(Array.from(resolver.stateOf("saturn", T, "sun").positionKm)).toEqual(Array.from(barycentre("saturn")));
    const second = resolverOf(other);
    expect(Array.from(second.stateOf("jupiter", T, "sun").positionKm)).toEqual(Array.from(barycentre("jupiter")));
    expect(() => second.stateOf("io", T, "jupiter")).toThrow(NotLoadedError);
  });

  it("leaves an unbound catalogue on the process-wide systems: Jupiter carries its offset from the barycentre, Io answers", () => {
    const jupiter = unbound.stateOf("jupiter", T, "sun").positionKm;
    expect(
      Math.hypot(
        jupiter[0] - barycentre("jupiter")[0],
        jupiter[1] - barycentre("jupiter")[1],
        jupiter[2] - barycentre("jupiter")[2],
      ),
    ).toBeGreaterThan(1);
    expect(unbound.stateOf("io", T, "jupiter").positionKm.length).toBe(3);
  });
});
