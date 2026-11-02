import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JUPITER_MOON_SYSTEM } from "../src/core/bodies/jupiterMoons";
import { installData } from "../src/api/data";
import { MoonOutOfSpanError, type MoonSystemLoad } from "../src/core/bodies/moonSystem";
import { readBytes, readJson } from "../tools/import/test-io.mjs";
import { moonDataFolder } from "./moonData";

// O-055 T-251 (review F1, API-03): a second load of a planet's moons fetches the chunks its own request needs that the set does not hold, whatever loaded first.
// Real Jupiter fits from disk behind a counting fetch; one shared set per system, so each row starts from a fresh one.
const system = JUPITER_MOON_SYSTEM;
const folder = moonDataFolder("jupiter");
const index = readJson(`${folder}index.json`) as { bodies: { id: string; chunks: { path: string }[] }[] };
const chunkUrls: Record<string, string> = Object.fromEntries(index.bodies.flatMap((body) => body.chunks.map(({ path }) => [path, `${folder}${path}`])));
const at = (iso: string) => Date.parse(iso);
const year = (y: number, ...ids: string[]) => ids.map((id) => `${id}/${y}.bin`);

let fetched: string[] = [];
const fetchBytes = async (url: string): Promise<Uint8Array> => { fetched.push(url.slice(folder.length)); return readBytes(url); };
const request = (start: string, end: string, bodies: string[], history?: MoonSystemLoad["history"]): MoonSystemLoad => ({
  window: { startUtcMs: at(start), endUtcMs: at(end) }, bodies, chunkUrls, fetchBytes, ...(history === undefined ? {} : { history }),
});
const sorted = (paths: readonly string[]) => [...paths].sort();

beforeEach(() => {
  fetched = [];
  system.install(null);
  system.provideIndex(async () => index);
});

interface Row {
  readonly name: string;
  readonly first: MoonSystemLoad;
  readonly second: MoonSystemLoad;
  /** Start both at once (the second while the first is in flight) instead of one after the other. */
  readonly together?: boolean;
  /** The paths the second request alone causes to be fetched (with `together`: every path fetched, each once). */
  readonly newPaths: readonly string[];
  /** A body and time the second request must be able to answer for afterwards. */
  readonly answers: readonly [string, string][];
}
// Windows sit mid-year, so a window needs its own year's chunk and the following year's (the orbit ring reads ahead of the clock).
const ROWS: Row[] = [
  {
    name: "(1) same bodies, a later window",
    first: request("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io"]),
    second: request("2023-03-01T00:00:00Z", "2023-04-01T00:00:00Z", ["io"]),
    newPaths: [...year(2023, "io", "jupiter"), ...year(2024, "io", "jupiter")],
    answers: [["io", "2023-03-15T00:00:00Z"]],
  },
  {
    name: "(2) a new moon, same window",
    first: request("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io"]),
    second: request("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io", "europa"]),
    newPaths: [...year(2020, "europa"), ...year(2021, "europa")],
    answers: [["europa", "2020-03-15T00:00:00Z"]],
  },
  {
    name: "(3) a second load started while the first is in flight, needing other chunks",
    first: request("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io"]),
    second: request("2023-03-01T00:00:00Z", "2023-04-01T00:00:00Z", ["europa"]),
    together: true,
    newPaths: [...year(2020, "io", "jupiter"), ...year(2021, "io", "jupiter"), ...year(2023, "europa"), ...year(2024, "europa"), ...year(2023, "jupiter"), ...year(2024, "jupiter")],
    answers: [["europa", "2023-03-15T00:00:00Z"], ["io", "2020-03-15T00:00:00Z"]],
  },
  {
    name: "(4) a second load whose history look-back needs older chunks",
    first: request("2020-01-05T00:00:00Z", "2020-02-01T00:00:00Z", ["callisto"]),
    second: request("2020-01-05T00:00:00Z", "2020-02-01T00:00:00Z", ["callisto"], { bodies: ["callisto"], maxMs: 3 * 365 * 86_400_000 }),
    newPaths: year(2019, "callisto", "jupiter"),
    answers: [["callisto", "2019-12-25T00:00:00Z"]],
  },
  {
    name: "(5) a second load whose year-after-window chunk is new",
    first: request("2020-03-01T00:00:00Z", "2020-12-31T23:00:00Z", ["io"]),
    second: request("2021-03-01T00:00:00Z", "2021-04-01T00:00:00Z", ["io"]),
    newPaths: year(2022, "io", "jupiter"),
    answers: [["io", "2021-03-15T00:00:00Z"]],
  },
];

describe("a second moon load fetches what its own request needs", () => {
  it.each(ROWS)("$name", async (row) => {
    let firstFetched: string[];
    if (row.together) {
      const both = [system.load(row.first), system.load(row.second)];
      await Promise.all(both);
      firstFetched = [];
    } else {
      await system.load(row.first);
      firstFetched = [...fetched];
    }
    const set = await system.load(row.second);
    expect(sorted(fetched.filter((path) => !firstFetched.includes(path)))).toEqual(sorted(row.newPaths.filter((path) => !firstFetched.includes(path))));
    expect(new Set(fetched).size, `a chunk was fetched twice: ${fetched.join(", ")}`).toBe(fetched.length);
    for (const [body, time] of row.answers) expect(() => set.stateOf(body, at(time)), `${body} at ${time}`).not.toThrow();
    expect(system.isLoaded()).toBe(true);
  });

  it("(6) an identical second load fetches nothing", async () => {
    const same = request("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io", "europa"]);
    const first = await system.load(same);
    const count = fetched.length;
    expect(count).toBeGreaterThan(0);
    expect(await system.load(same)).toBe(first);
    expect(fetched.length).toBe(count);
  });

  it("(6b) the same chunk wanted by two requests at once is fetched once", async () => {
    const same = request("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io"]);
    await Promise.all([system.load(same), system.load({ ...same, bodies: ["io"] })]);
    expect(new Set(fetched).size).toBe(fetched.length);
    expect(fetched).toContain("io/2020.bin");
  });

  it("(7) an out-of-span second load rejects with MoonOutOfSpanError and leaves the set usable for the first", async () => {
    const set = await system.load(request("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io"]));
    const count = fetched.length;
    await expect(system.load(request("1940-03-01T00:00:00Z", "1940-04-01T00:00:00Z", ["io"]))).rejects.toBeInstanceOf(MoonOutOfSpanError);
    expect(fetched.length).toBe(count);
    expect(system.ephemeris()).toBe(set);
    expect(() => set.stateOf("io", at("2020-03-15T00:00:00Z"))).not.toThrow();
    await expect(system.load(request("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io"]))).resolves.toBe(set);
  });

  it("a failed fetch is not remembered: the same request loads once the fetch works", async () => {
    const broken = { ...request("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io"]), fetchBytes: async () => { throw new Error("offline"); } };
    await expect(system.load(broken)).rejects.toThrow("offline");
    await expect(system.load(request("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io"]))).resolves.toBeDefined();
  });
});

describe("through the public path (installData)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("two scenes of one planet at different years, each prepared in turn and then together, both get their moons", async () => {
    vi.stubGlobal("fetch", async (url: string) => { fetched.push(url.slice(folder.length)); const bytes = readBytes(url); return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }; });
    const source = { name: "astraeus-data-jupiter", provides: ["io"], moonPositions: { centre: "jupiter", loadIndex: async () => index, chunkUrls } };
    const window2020 = { startUtcMs: at("2020-03-01T00:00:00Z"), endUtcMs: at("2020-04-01T00:00:00Z") };
    const window2023 = { startUtcMs: at("2023-03-01T00:00:00Z"), endUtcMs: at("2023-04-01T00:00:00Z") };
    await installData([source], ["jupiter", "io"], window2020);
    await installData([source], ["jupiter", "io"], window2023);
    const set = system.ephemeris();
    expect(() => set.stateOf("io", at("2020-03-15T00:00:00Z"))).not.toThrow();
    expect(() => set.stateOf("io", at("2023-03-15T00:00:00Z"))).not.toThrow();
    expect(new Set(fetched).size).toBe(fetched.length);
    system.install(null);
    fetched = [];
    await Promise.all([installData([source], ["jupiter", "io"], window2023), installData([source], ["jupiter", "io"], window2020)]);
    expect(() => system.ephemeris().stateOf("io", at("2020-03-15T00:00:00Z"))).not.toThrow();
    expect(() => system.ephemeris().stateOf("io", at("2023-03-15T00:00:00Z"))).not.toThrow();
    expect(new Set(fetched).size).toBe(fetched.length);
  });
});
