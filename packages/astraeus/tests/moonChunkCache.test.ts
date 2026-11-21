import { beforeEach, describe, expect, it } from "vitest";
import { JUPITER_MOON_SYSTEM } from "../src/core/bodies/jupiterMoons";
import { createMoonSystem, type MoonSystemLoad } from "../src/core/bodies/moonSystem";
import { EphemerisChunkMissingError } from "../src/core/chebyshevEphemeris";
import { readBytes, readJson } from "../tools/import/test-io.mjs";
import { moonDataFolder } from "./moonData";

// O-084 T-356 (AH-03): systems made from one configuration and one reader share the decoded chunks of that source; each still answers only for what its own requests asked for.
const folder = moonDataFolder("jupiter");
const index = readJson(`${folder}index.json`) as { bodies: { id: string; chunks: { path: string }[] }[] };
const chunkUrls: Record<string, string> = Object.fromEntries(index.bodies.flatMap((body) => body.chunks.map(({ path }) => [path, `${folder}${path}`])));
const at = (iso: string) => Date.parse(iso);
const reader = () => async () => index;

let fetched: string[] = [];
let failOnce: string | null = null;
const fetchBytes = async (url: string): Promise<Uint8Array> => {
  fetched.push(url.slice(folder.length));
  if (failOnce !== null && url.endsWith(failOnce)) { failOnce = null; throw new Error("network down"); }
  return readBytes(url);
};
const request = (start: string, end: string, bodies: string[] = ["io"]): MoonSystemLoad => ({ window: { startUtcMs: at(start), endUtcMs: at(end) }, bodies, chunkUrls, fetchBytes });
const make = (source: () => Promise<unknown>) => {
  const system = createMoonSystem(JUPITER_MOON_SYSTEM.config);
  system.provideIndex(source);
  return system;
};
const ioAt = (system: ReturnType<typeof make>, iso: string) => system.ephemeris().stateOf("io", at(iso));
const Y2016 = ["2016-03-01T00:00:00Z", "2016-04-01T00:00:00Z"] as const;
const Y2020 = ["2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z"] as const;
const duplicates = (paths: string[]) => paths.filter((path, i) => paths.indexOf(path) !== i);

beforeEach(() => { fetched = []; failOnce = null; });

describe("moon chunk cache", () => {
  it("(1) two systems of one reader fetch each chunk once and both answer", async () => {
    const source = reader();
    const a = make(source);
    const b = make(source);
    await a.load(request(...Y2020));
    const afterA = fetched.length;
    await b.load(request(...Y2020));
    expect(afterA).toBeGreaterThan(0);
    expect(fetched.length).toBe(afterA);
    expect(duplicates(fetched)).toEqual([]);
    expect(() => ioAt(a, "2020-03-15T00:00:00Z")).not.toThrow();
    expect(() => ioAt(b, "2020-03-15T00:00:00Z")).not.toThrow();
  });

  it("(2) a system answers only for the chunks its own requests asked for", async () => {
    const source = reader();
    const a = make(source);
    const b = make(source);
    await a.load(request(...Y2016));
    await b.load(request(...Y2020));
    expect(() => ioAt(a, "2020-03-15T00:00:00Z")).toThrow(EphemerisChunkMissingError);
    expect(() => ioAt(b, "2020-03-15T00:00:00Z")).not.toThrow();
  });

  it("(3) different readers are different sources, each fetched once", async () => {
    const a = make(reader());
    const b = make(reader());
    await a.load(request(...Y2020));
    const perSource = fetched.length;
    await b.load(request(...Y2020));
    expect(fetched.length).toBe(2 * perSource);
    expect(duplicates(fetched).length).toBe(perSource);
    expect(() => ioAt(a, "2020-03-15T00:00:00Z")).not.toThrow();
    expect(() => ioAt(b, "2020-03-15T00:00:00Z")).not.toThrow();
  });

  it("(4) systems loading at once fetch no URL twice", async () => {
    const source = reader();
    const a = make(source);
    const b = make(source);
    await Promise.all([a.load(request(...Y2020)), b.load(request(...Y2020))]);
    expect(fetched.length).toBeGreaterThan(0);
    expect(duplicates(fetched)).toEqual([]);
  });

  it("(5) a failed fetch is not kept: the next request fetches again", async () => {
    const source = reader();
    const a = make(source);
    const b = make(source);
    failOnce = "io/2020.bin";
    await expect(a.load(request(...Y2020))).rejects.toThrow("network down");
    await b.load(request(...Y2020));
    expect(fetched.filter((path) => path === "io/2020.bin").length).toBe(2);
    expect(() => ioAt(b, "2020-03-15T00:00:00Z")).not.toThrow();
  });

  it("(6) the systems hold the same decoded chunk object", async () => {
    const source = reader();
    const a = make(source);
    const b = make(source);
    await a.load(request(...Y2020));
    await b.load(request(...Y2020));
    const mine = a.ephemeris().loadedChunk("io", "io/2020.bin");
    expect(mine).not.toBeNull();
    expect(b.ephemeris().loadedChunk("io", "io/2020.bin")).toBe(mine);
  });
});
