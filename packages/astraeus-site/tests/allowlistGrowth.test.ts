import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The O-053 allowlists and DEEP_IMPORT_COUNTS can only shrink (C-137 O2, owner decision 2026-11-01). Each current allowlist entry must already be in the base version of the file (git
// `main`, or the ref in ALLOWLIST_BASE), or carry `approved: { by: "owner", at, reason }`; a DEEP_IMPORT_COUNTS value may not be higher than in the base version. A file that the base
// does not have yet (the branch that first adds it) is skipped with a note, as is the whole check when git or the base ref is unavailable (a shallow CI checkout).

const BASE = process.env.ALLOWLIST_BASE ?? "main";
const FILES = ["apiOutsideTypes", "apiTypeLint", "apiErrors", "apiSettings", "apiIsolation"].map((name) => `${name}.allowlist.json`);
const REPO = join(__dirname, "..", "..", "..");
const rel = (file: string): string => `packages/astraeus-site/tests/${file}`;

interface Approval { by: string; at: string; reason: string }
type Json = Record<string, unknown>;

const gitShow = (path: string): string | undefined => {
  const result = spawnSync("git", ["show", `${BASE}:${path}`], { cwd: REPO, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return result.status === 0 ? result.stdout : undefined;
};

/** Every entry of an allowlist as `key -> approval`: list items by their content without `approved`; the `public` map by `public.name=value` (approved in `approvedPublic`). */
export function allowlistEntries(json: Json): Map<string, Approval | undefined> {
  const out = new Map<string, Approval | undefined>();
  for (const [section, value] of Object.entries(json)) {
    if (section === "_about" || section === "approvedPublic") continue;
    if (Array.isArray(value)) {
      for (const item of value as Json[]) { const { approved, ...rest } = item; out.set(`${section} ${JSON.stringify(rest)}`, approved as Approval | undefined); }
    } else if (typeof value === "object" && value !== null) {
      for (const [name, text] of Object.entries(value)) out.set(`${section}.${name}=${JSON.stringify(text)}`, (json.approvedPublic as Record<string, Approval> | undefined)?.[name]);
    }
  }
  return out;
}

const approvalOk = (approval: Approval | undefined): boolean => approval?.by === "owner" && /^\d{4}-\d{2}-\d{2}/.test(approval.at ?? "") && (approval.reason ?? "").length > 10;

/** Entries in `now` that are not in `base` and have no owner approval. */
export function growthOffences(base: Json, now: Json, label: string): string[] {
  const before = allowlistEntries(base);
  return [...allowlistEntries(now)].filter(([key, approval]) => !before.has(key) && !approvalOk(approval))
    .map(([key]) => `${label}: new entry without an owner approval (approved: {by: "owner", at, reason}): ${key.slice(0, 160)}`);
}

/** The `DEEP_IMPORT_COUNTS` literal of packageBoundaries.test.ts, as name -> count. */
export function deepImportCounts(source: string): Record<string, number> {
  const block = /DEEP_IMPORT_COUNTS[^=]*=\s*\{([\s\S]*?)\n\};/.exec(source)?.[1] ?? "";
  return Object.fromEntries([...block.matchAll(/"([^"]+)":\s*(\d+)/g)].map((match) => [match[1], Number(match[2])]));
}

export function countOffences(base: Record<string, number>, now: Record<string, number>): string[] {
  return Object.entries(now).filter(([name, count]) => count > (base[name] ?? 0)).map(([name, count]) => `DEEP_IMPORT_COUNTS ${name}: ${count}, up from ${base[name] ?? 0}; the count may only go down`);
}

const baseAvailable = spawnSync("git", ["rev-parse", "--verify", "--quiet", `${BASE}^{commit}`], { cwd: REPO }).status === 0;

describe("allowlists only shrink (O-053, compared with the base branch)", () => {
  if (!baseAvailable) { it.skip(`skipped: git or ref ${BASE} is not available (shallow checkout?)`, () => undefined); return; }

  for (const file of FILES) {
    it(`${file} gains no entry without an owner approval`, () => {
      const base = gitShow(rel(file));
      if (base === undefined) { console.warn(`allowlist growth: ${BASE} has no ${file} yet; skipped`); return; }
      expect(growthOffences(JSON.parse(base) as Json, JSON.parse(readFileSync(join(__dirname, file), "utf8")) as Json, file)).toEqual([]);
    });
  }

  it("DEEP_IMPORT_COUNTS has no value above the base version", () => {
    const base = gitShow(rel("packageBoundaries.test.ts"));
    const baseCounts = base === undefined ? {} : deepImportCounts(base);
    if (Object.keys(baseCounts).length === 0) { console.warn(`allowlist growth: ${BASE} has no DEEP_IMPORT_COUNTS yet; skipped`); return; }
    expect(countOffences(baseCounts, deepImportCounts(readFileSync(join(__dirname, "packageBoundaries.test.ts"), "utf8")))).toEqual([]);
  });

  it("names a new entry, accepts an approved one and a lowered count, rejects a raised one (made-up data)", () => {
    const approved = { by: "owner", at: "2026-11-01", reason: "a reason that is long enough" };
    const base = { _about: "x", breaks: [{ rule: "id", site: "a" }], public: { view: "A" } };
    const now = { _about: "x", breaks: [{ rule: "id", site: "a" }, { rule: "id", site: "b" }, { rule: "id", site: "c", approved }], public: { view: "A", extra: "B" } };
    expect(growthOffences(base, now, "f")).toEqual([expect.stringContaining('"site":"b"'), expect.stringContaining("public.extra=")]);
    expect(growthOffences(base, { ...now, approvedPublic: { extra: approved }, breaks: now.breaks.slice(0, 1) }, "f")).toEqual([]);
    expect(growthOffences(base, { ...now, breaks: [{ rule: "id", site: "c", approved: { ...approved, by: "agent" } }] }, "f")).toHaveLength(2);
    expect(countOffences({ a: 5, b: 3 }, { a: 6, b: 2, c: 1 })).toHaveLength(2);
    expect(deepImportCounts('const DEEP_IMPORT_COUNTS: Record<string, number> = {\n  "a-b": 12, // x\n  "c": 3,\n};')).toEqual({ "a-b": 12, c: 3 });
  });
});
