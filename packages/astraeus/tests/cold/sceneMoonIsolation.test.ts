// O-084 T-354: one scene's moon data must not change another scene's answers (audit AH-03, Codex F01). Cold project, public API only, no viewer.
// "Its own answer" is what the same scene gives built and loaded alone in a fresh module graph. Rows that fail on today's code are `it.fails`, each naming the Task that fixes them.
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jupiterIndex from "astraeus-data-jupiter/index.json";

type Api = typeof import("astraeus");
type DataSource = import("astraeus").DataSource;
type SceneT = InstanceType<Api["Scene"]>;

const folder = `${dirname(createRequire(import.meta.url).resolve("astraeus-data-jupiter/package.json"))}/data/jupiter-moons/`;
const FIX = "(fixed by: give each scene its own moon data)";
const T2016 = "2016-06-01T00:00:00Z";
const T2020 = "2020-03-15T00:00:00Z";
const W2016 = { start: "2016-05-15T00:00:00Z", end: "2016-06-15T00:00:00Z" };
const W2020 = { start: "2020-03-01T00:00:00Z", end: "2020-03-31T00:00:00Z" };

/** The installed Jupiter moon package under a made-up host, so two sources can be told apart. */
function source(host: string): DataSource {
  return {
    name: "astraeus-data-jupiter",
    provides: ["io", "europa", "ganymede", "callisto"],
    moonPositions: { center: "jupiter", loadIndex: async () => jupiterIndex, chunkUrls: new Proxy({}, { get: (_target, path: string) => `https://${host}/${path}` }) as Record<string, string> },
  };
}
const A_SRC = source("a.test");
const B_SRC = source("b.test");

let fetched: string[] = [];
beforeEach(() => {
  fetched = [];
  vi.resetModules();
  vi.stubGlobal("fetch", async (url: string) => {
    fetched.push(url);
    const bytes = readFileSync(`${folder}${new URL(url).pathname.slice(1)}`);
    return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  });
});
afterEach(() => { vi.unstubAllGlobals(); });

const sunJupiter = (api: Api, window?: { start: string; end: string }) => { const s = new api.Scene().addBody(api.sun).addBody(api.jupiter); return window ? s.setTimeline(window) : s; };
const jupiterIo = (api: Api, window: { start: string; end: string }) => new api.Scene().addBody(api.jupiter).addBody(api.io).setTimeline(window);
const ioOnly = (api: Api, window: { start: string; end: string }) => new api.Scene().addBody(api.io).setTimeline(window);

type Build = (api: Api) => SceneT;
/** What the scene answers when built and loaded alone in a fresh module graph. */
async function baseline(build: Build, data: DataSource[], ...reads: [string, string][]) {
  vi.resetModules();
  const api = await import("astraeus");
  const scene = build(api);
  await scene.load({ data });
  const answers = reads.map(([id, when]) => scene.stateOf(id, when));
  vi.resetModules();
  return answers;
}
const km = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const codeOf = (call: () => unknown): string => { try { call(); } catch (error) { return (error as { code?: string }).code ?? "no code"; } return "no error"; };

const buildA1: Build = (api) => sunJupiter(api, W2016);
const buildB1: Build = (api) => jupiterIo(api, W2016);

describe("one scene's moon data against another's", () => {
  it.fails(`A then B: A's Jupiter does not move when B loads ${FIX}`, async () => {
    const [own] = await baseline(buildA1, [], ["jupiter", T2016]);
    const api = await import("astraeus");
    const a = buildA1(api);
    await a.load();
    const before = a.stateOf("jupiter", T2016);
    expect(before).toEqual(own);
    await buildB1(api).load({ data: [A_SRC] });
    const after = a.stateOf("jupiter", T2016);
    console.info(`A then B: A's Jupiter moved ${km(before.positionKm, after.positionKm).toFixed(1)} km`);
    expect(after).toEqual(own);
  });

  it.fails(`B then A: each scene matches its own answer ${FIX}`, async () => {
    const [ownA] = await baseline(buildA1, [], ["jupiter", T2016]);
    const [ownB] = await baseline(buildB1, [A_SRC], ["jupiter", T2016]);
    const api = await import("astraeus");
    const b = buildB1(api);
    await b.load({ data: [A_SRC] });
    const a = buildA1(api);
    await a.load();
    expect(b.stateOf("jupiter", T2016)).toEqual(ownB);
    expect(a.stateOf("jupiter", T2016)).toEqual(ownA);
  });

  it.fails(`concurrent loads from different sources: A's Jupiter outside its chunks matches its own answer ${FIX}`, async () => {
    const buildA: Build = (api) => new api.Scene().addBody(api.sun).addBody(api.jupiter).addBody(api.io).setTimeline(W2016);
    const buildB: Build = (api) => jupiterIo(api, W2020);
    const [own] = await baseline(buildA, [A_SRC], ["jupiter", T2020]).catch((error: unknown) => [error]);
    const api = await import("astraeus");
    fetched = [];
    const a = buildA(api);
    const b = buildB(api);
    await Promise.all([a.load({ data: [A_SRC] }), b.load({ data: [B_SRC] })]);
    expect(new Set(fetched).size).toBe(fetched.length);
    expect(fetched.some((url) => url.startsWith("https://a.test/"))).toBe(true);
    expect(fetched.some((url) => url.startsWith("https://b.test/"))).toBe(true);
    const read = (() => { try { return a.stateOf("jupiter", T2020); } catch (error) { return error; } })();
    expect(String(read)).toBe(String(own)); // both throw alike or both answer; a leak from B makes A answer where it alone cannot
    if (!(own instanceof Error)) expect(read).toEqual(own);
  });

  it.fails(`same source, different windows: A's Io outside its window fails the same way before and after B loads ${FIX}`, async () => {
    const api = await import("astraeus");
    const a = ioOnly(api, W2016);
    await a.load({ data: [A_SRC] });
    const before = codeOf(() => a.stateOf("io", T2020));
    await ioOnly(api, W2020).load({ data: [A_SRC] });
    expect(codeOf(() => a.stateOf("io", T2020))).toBe(before);
    expect(before).toBe("bad-time");
  });

  // Passes today: A, B, C share one install but Jupiter alone does not reveal the leak on these reads; kept as a guard for the fix.
  it(`missing package: B without data is refused, C matches its own answer, A is unchanged`, async () => {
    const [ownC] = await baseline((api) => sunJupiter(api, W2016), [], ["jupiter", T2016]);
    const [ownA] = await baseline(buildA1, [A_SRC], ["jupiter", T2016]);
    const api = await import("astraeus");
    const a = buildA1(api);
    await a.load({ data: [A_SRC] });
    await expect(buildB1(api).load()).rejects.toMatchObject({ code: "missing-data" });
    const c = sunJupiter(api, W2016);
    await c.load();
    expect(c.stateOf("jupiter", T2016)).toEqual(ownC);
    expect(a.stateOf("jupiter", T2016)).toEqual(ownA);
  });

  // Passes today: the later scenes load windows and sources that leave Jupiter at 2016 untouched; kept as a guard for the fix.
  it(`old scene read back: three later scenes leave A's answers as they were`, async () => {
    const instants = [T2016, "2016-06-05T00:00:00Z", "2016-06-10T00:00:00Z"];
    const api = await import("astraeus");
    const a = buildA1(api);
    await a.load({ data: [A_SRC] });
    const first = instants.map((t) => a.stateOf("jupiter", t));
    await jupiterIo(api, W2020).load({ data: [B_SRC] });
    await ioOnly(api, { start: "2023-03-01T00:00:00Z", end: "2023-03-20T00:00:00Z" }).load({ data: [A_SRC] });
    await sunJupiter(api, W2020).load();
    expect(instants.map((t) => a.stateOf("jupiter", t))).toEqual(first);
  });

  // Passes today: the shared install already keeps one fetch per chunk URL when two scenes use the same source and window.
  it("shared bytes: two scenes with the same source and window fetch each chunk URL at most once", async () => {
    const api = await import("astraeus");
    await Promise.all([jupiterIo(api, W2016).load({ data: [A_SRC] }), jupiterIo(api, W2016).load({ data: [A_SRC] })]);
    expect(fetched.length).toBeGreaterThan(0);
    expect(new Set(fetched).size).toBe(fetched.length);
  });
});
