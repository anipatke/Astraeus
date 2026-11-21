// O-084 T-359: a resolver bound to a scene's moon data drops its remembered states when that data changes, so a state worked out before the load is not reused.
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
const root = `${dirname(createRequire(import.meta.url).resolve("astraeus-data-jupiter/package.json"))}/data/jupiter-moons/`;

const resolverOf = (moonData: ReturnType<typeof createSceneMoonData>) => {
  const bound = bindCatalogue(builtIn, moonData);
  return createStateResolver(bound.definitions(), bound.sources(), adapter, bound.moonData);
};
const load = (moonData: ReturnType<typeof createSceneMoonData>, chunk = "2016.bin") => {
  const system = moonData.system("jupiter")!;
  system.provideIndex(async () => JSON.parse(await readFile(`${root}index.json`, "utf8")) as unknown);
  return system.load({
    window: { startUtcMs: Date.UTC(2016, 1, 10), endUtcMs: Date.UTC(2016, 11, 30) },
    bodies: ["io"],
    chunkUrls: new Proxy({}, { get: (_target, path: string) => (path.endsWith(`/${chunk}`) ? `${root}${path}` : undefined) }) as Record<string, string>,
    fetchBytes: async (path) => readBytes(path),
  });
};
const km = (v: ArrayLike<number>, w: ArrayLike<number>) => Math.hypot(v[0] - w[0], v[1] - w[1], v[2] - w[2]);

describe("a scene resolver after its moon data loads", () => {
  it("serves Jupiter's centre, not the barycentre it remembered before the load", async () => {
    const data = createSceneMoonData();
    const resolver = resolverOf(data);
    const before = resolver.stateOf("jupiter", T, "sun").positionKm;
    await load(data);
    const after = resolver.stateOf("jupiter", T, "sun").positionKm;
    const fresh = resolverOf(data).stateOf("jupiter", T, "sun").positionKm;
    expect(Array.from(after)).toEqual(Array.from(fresh));
    expect(km(after, before)).toBeGreaterThan(100);
  });

  it("refuses Io before the load and answers after it, at the same time", async () => {
    const data = createSceneMoonData();
    const resolver = resolverOf(data);
    expect(() => resolver.stateOf("io", T, "jupiter")).toThrow(NotLoadedError);
    await load(data);
    expect(resolver.stateOf("io", T, "jupiter").positionKm.length).toBe(3);
  });

  /** A resolver over `data` whose provider for `body` counts its evaluations. */
  const counted = (body: string, data?: ReturnType<typeof createSceneMoonData>) => {
    const calls = { n: 0 };
    const bound = data === undefined ? builtIn : bindCatalogue(builtIn, data);
    const sources = bound.sources().map((b) => b.body !== body ? b : {
      body: b.body,
      create: (a: typeof adapter, m?: Parameters<typeof b.create>[1]) => { const p = b.create(a, m); return { ...p, stateAt: (t: number, c?: never) => { calls.n += 1; return p.stateAt(t, c); } }; },
    });
    return { calls, resolver: createStateResolver(bound.definitions(), sources, adapter, bound.moonData) };
  };

  it("keeps remembered states when a load fails", async () => {
    const data = createSceneMoonData();
    const { calls, resolver } = counted("jupiter", data);
    resolver.stateOf("jupiter", T, "sun");
    await expect(load(data, "nope.bin")).rejects.toBeDefined();
    resolver.stateOf("jupiter", T, "sun");
    expect(calls.n).toBe(1);
  });

  it("still remembers a state for an unbound resolver", () => {
    const { calls, resolver } = counted("mars");
    resolver.stateOf("mars", T, "sun");
    resolver.stateOf("mars", T, "sun");
    expect(calls.n).toBe(1);
  });
});
