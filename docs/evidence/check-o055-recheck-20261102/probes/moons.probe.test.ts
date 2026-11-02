// C-144 probe P-MOON-1 (O-055 SC2): independent of moonLoadTwice.test.ts's rows. Real Jupiter fits behind a counting fetch whose answers are released by hand,
// so overlap is exact (not timing): three requests in flight at once over overlapping chunks, a failing chunk under one of them, then a retry, then an
// out-of-span request in flight beside a good one. Oracle: the set answers stateOf for every requested body and time; each path fetched once per success.
import { beforeEach, describe, expect, it } from "vitest";
import { JUPITER_MOON_SYSTEM } from "../../../../packages/astraeus/src/core/bodies/jupiterMoons";
import { MoonOutOfSpanError, type MoonSystemLoad } from "../../../../packages/astraeus/src/core/bodies/moonSystem";
import { readBytes, readJson } from "../../../../packages/astraeus/tools/import/test-io.mjs";
import { moonDataFolder } from "../../../../packages/astraeus/tests/moonData";

const system = JUPITER_MOON_SYSTEM;
const folder = moonDataFolder("jupiter");
const index = readJson(`${folder}index.json`) as { bodies: { chunks: { path: string }[] }[] };
const chunkUrls: Record<string, string> = Object.fromEntries(index.bodies.flatMap((b) => b.chunks.map(({ path }) => [path, `${folder}${path}`])));

let calls: string[] = [];
let pending: { path: string; go: () => void }[] = [];
let failOnce = new Set<string>();
const gatedFetch = (url: string): Promise<Uint8Array> => new Promise((resolve, reject) => {
  const path = url.slice(folder.length);
  calls.push(path);
  pending.push({ path, go: () => (failOnce.delete(path) ? reject(new Error(`HTTP 503 ${path}`)) : resolve(readBytes(url) as Uint8Array)) });
});
const releaseAll = async () => { for (let i = 0; i < 50; i += 1) { const now = pending; pending = []; now.forEach((p) => p.go()); await new Promise((r) => setTimeout(r, 0)); if (pending.length === 0 && i > 3) break; } };
const req = (start: string, end: string, bodies: string[]): MoonSystemLoad => ({ window: { startUtcMs: Date.parse(start), endUtcMs: Date.parse(end) }, bodies, chunkUrls, fetchBytes: gatedFetch });
const answers = (body: string, iso: string) => expect(() => system.ephemeris().stateOf(body, Date.parse(iso)), `${body} ${iso}`).not.toThrow();

beforeEach(() => { calls = []; pending = []; failOnce = new Set(); system.install(null); system.provideIndex(async () => index); });

describe("P-MOON-1 overlapping loads of one planet", () => {
  it("three overlapping requests in flight together each get their chunks, every chunk fetched once", async () => {
    const a = system.load(req("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io"]));
    const b = system.load(req("2020-03-10T00:00:00Z", "2021-02-01T00:00:00Z", ["io", "europa"]));
    const c = system.load(req("2027-06-01T00:00:00Z", "2027-07-01T00:00:00Z", ["callisto"]));
    await releaseAll();
    await Promise.all([a, b, c]);
    answers("io", "2020-03-15T00:00:00Z"); answers("europa", "2021-01-15T00:00:00Z"); answers("callisto", "2027-06-15T00:00:00Z");
    expect(new Set(calls).size).toBe(calls.length);
  });

  it("a chunk that fails under one request rejects it (and any request sharing it), leaves the other's moons, and a retry fetches only what is missing", async () => {
    failOnce.add("europa/2023.bin");
    const good = system.load(req("2020-03-01T00:00:00Z", "2020-04-01T00:00:00Z", ["io"]));
    const bad = system.load(req("2023-03-01T00:00:00Z", "2023-04-01T00:00:00Z", ["europa"]));
    await releaseAll();
    await expect(good).resolves.toBeDefined();
    await expect(bad).rejects.toThrow(/503/);
    answers("io", "2020-03-15T00:00:00Z");
    const before = calls.length;
    const retry = system.load(req("2023-03-01T00:00:00Z", "2023-04-01T00:00:00Z", ["europa"]));
    await releaseAll();
    await retry;
    answers("europa", "2023-03-15T00:00:00Z");
    const again = calls.slice(before);
    // Only the batch that failed is fetched again (the engine fetches a request's missing chunks as one batch), never io's.
    expect(again.every((p) => !p.startsWith("io/"))).toBe(true);
    expect(again).toContain("europa/2023.bin");
  });

  it("an out-of-span request started beside a good one rejects with MoonOutOfSpanError and fetches nothing of its own; the good one completes", async () => {
    const good = system.load(req("2024-03-01T00:00:00Z", "2024-04-01T00:00:00Z", ["io"]));
    const out = system.load(req("2031-01-01T00:00:00Z", "2031-02-01T00:00:00Z", ["io"]));
    await releaseAll();
    await expect(out).rejects.toBeInstanceOf(MoonOutOfSpanError);
    await good;
    answers("io", "2024-03-15T00:00:00Z");
    expect(calls.some((p) => p.includes("2031") || p.includes("2030"))).toBe(false);
  });
});
