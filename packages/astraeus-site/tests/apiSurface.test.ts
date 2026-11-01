import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { currentSurface, outsideApiTypes, publishedExports, readLock, REGENERATE, surfaceDifferences, type Surface } from "../../../tools/api-surface.mjs";

// The public surface is locked (O-053 T-228, Guardrails API-01): what `astraeus` exports at the root, and every published package's `exports` map, equals the checked-in lock
// (`packages/astraeus/api-surface.lock.json`, written by `npm run api:lock`). No public type may be declared outside `packages/astraeus/src/api/`, or be unexported, unless it is on the
// allowlist next to this test; the allowlist can only shrink (an entry that no longer matches fails too).

interface Entry { type: string; reason: string; finding: string; removedBy: string }
const allowlist = JSON.parse(readFileSync(join(__dirname, "apiOutsideTypes.allowlist.json"), "utf8")) as { entries: Entry[] };

/** Offences of a type list against an allowlist: new types and entries that no longer match. */
const typeOffences = (found: string[], entries: Entry[]): string[] => [
  ...found.filter((type) => !entries.some((entry) => entry.type === type)).map((type) => `not allowed: ${type}; declare it in packages/astraeus/src/api/ and export it from the root, or remove it from the public signature`),
  ...entries.filter((entry) => !found.includes(entry.type)).map((entry) => `stale allowlist entry: ${entry.type}; delete it from apiOutsideTypes.allowlist.json (${entry.finding}, ${entry.removedBy})`),
];

describe("public surface lock (API-01)", () => {
  let now: Surface;
  beforeAll(() => { now = currentSurface(); }, 60_000);

  it("matches the checked-in lock", () => {
    const differences = surfaceDifferences(readLock(), now);
    expect(differences, `The public surface changed. If this is intended, list it in packages/astraeus/CHANGELOG.md and run \`${REGENERATE}\`.`).toEqual([]);
  });

  it("names added, removed and changed exports (proved on a made-up surface)", () => {
    const lock = { root: { kept: { kind: "const" }, gone: { kind: "const" }, edited: { kind: "function", signature: "(a: 1)" } }, packageExports: { p: { ".": "./a.ts" } } } as unknown as Surface;
    const later = { root: { kept: { kind: "const" }, added: { kind: "const" }, edited: { kind: "function", signature: "(a: 2)" } }, packageExports: { p: { ".": "./b.ts" }, q: {} } } as unknown as Surface;
    expect(surfaceDifferences(lock, later)).toEqual([
      "added root export added",
      "removed root export gone",
      'changed root export edited: {"kind":"function","signature":"(a: 1)"} -> {"kind":"function","signature":"(a: 2)"}',
      "added package exports of q",
      'changed package exports of p: {".":"./a.ts"} -> {".":"./b.ts"}',
    ]);
  });

  it("covers every published package's exports map and none of the private ones", () => {
    expect(Object.keys(now.packageExports)).toContain("astraeus");
    expect(Object.keys(now.packageExports)).not.toContain("astraeus-site");
  });

  it("allowlists every allowlist entry with a reason, a finding and an Objective", () => {
    for (const entry of allowlist.entries) {
      expect(entry.reason.length, entry.type).toBeGreaterThan(10);
      expect(entry.finding, entry.type).toMatch(/^F\d+$/);
      expect(entry.removedBy, entry.type).toMatch(/^O-\d{3}$/);
    }
  });

  it("allows no public type declared outside src/api/ (or left unexported) beyond the allowlist, which can only shrink", () => {
    expect(typeOffences(outsideApiTypes(), allowlist.entries)).toEqual([]);
  }, 60_000);

  it("fails on a type made reachable from a made-up entry, and on a stale entry", () => {
    const dir = mkdtempSync(join(tmpdir(), "astraeus-api-types-"));
    try {
      mkdirSync(join(dir, "api"));
      writeFileSync(join(dir, "internal.ts"), "export interface Hidden { readonly a: number }\nexport interface Fine { readonly b: number }\n");
      writeFileSync(join(dir, "api", "index.ts"), 'import type { Hidden } from "../internal";\ninterface Local { readonly c: number }\nexport interface Opts { readonly h: Hidden; readonly l: Local }\nexport function f(o: Opts): Hidden { return o.h; }\n');
      const found = outsideApiTypes(join(dir, "api", "index.ts"), join(dir, "api"), dir);
      expect(found).toEqual(["Hidden (internal.ts)", "Local (api/index.ts) unexported"]);
      const entries = [{ type: "Hidden (internal.ts)", reason: "r", finding: "F7", removedBy: "O-057" }, { type: "Gone (x.ts)", reason: "r", finding: "F7", removedBy: "O-057" }];
      expect(typeOffences(found, entries)).toEqual([expect.stringContaining("not allowed: Local (api/index.ts) unexported"), expect.stringContaining("stale allowlist entry: Gone (x.ts)")]);
      expect(publishedExports(dir)).toEqual({});
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
