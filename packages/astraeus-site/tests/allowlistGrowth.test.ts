import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Counted per group (file, section, rule, finding, removing Objective), owner 2026-11-01: a re-key inside a group passes, a new break or a new group needs an owner approval.
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

/**
 * The group an entry counts in (owner decision 2026-11-01, "count per finding, not per name"): its section, rule or kind, finding and removing Objective, whichever the entry carries; a `public`
 * map entry is grouped by its section alone. A re-key inside a group (a type renamed, a member moved) keeps the count; a new break in a group, or a new group, raises it.
 */
export function entryGroup(section: string, item: Json | undefined): string {
  if (item === undefined) return section;
  return [section, item.rule ?? "", item.finding ?? "", item.removedBy ?? ""].join("|");
}

/** Groups whose count is above the base's by more than the owner-approved entries added to them, each with the unapproved added entries. */
/**
 * The `public` section of `apiSettings.allowlist.json` records resolved mappings (address parameter to the public setting that now sets it), not breaks, so it never counts as growth
 * (owner decision 2026-11-03, O-056 T-261). Only the break sections, such as `addressOnly`, are judged.
 */
const UNCOUNTED_SECTION = "public";

export function growthOffences(base: Json, now: Json, label: string): string[] {
  const count = (json: Json): Map<string, number> => {
    const out = new Map<string, number>();
    for (const [section, value] of Object.entries(json)) {
      if (section === "_about" || section === "approvedPublic" || section === UNCOUNTED_SECTION) continue;
      const items: (Json | undefined)[] = Array.isArray(value) ? (value as Json[]) : Object.keys(value as object).map(() => undefined);
      for (const item of items) { const group = entryGroup(section, item); out.set(group, (out.get(group) ?? 0) + 1); }
    }
    return out;
  };
  const before = allowlistEntries(base);
  const baseCount = count(base);
  const added = new Map<string, { approved: number; unapproved: string[] }>();
  for (const [section, value] of Object.entries(now)) {
    if (section === "_about" || section === "approvedPublic" || section === UNCOUNTED_SECTION) continue;
    const items: [string, Json | undefined][] = Array.isArray(value) ? (value as Json[]).map((item) => [entryGroup(section, item), item]) : Object.keys(value as object).map((name) => [entryGroup(section, undefined), { name } as Json]);
    for (const [group, item] of items) {
      const key = Array.isArray(value) ? (() => { const { approved: _a, ...rest } = item!; return `${section} ${JSON.stringify(rest)}`; })() : `${section}.${item!.name as string}=${JSON.stringify((value as Json)[item!.name as string])}`;
      if (before.has(key)) continue;
      const approval = Array.isArray(value) ? (item!.approved as Approval | undefined) : (now.approvedPublic as Record<string, Approval> | undefined)?.[item!.name as string];
      const entry = added.get(group) ?? { approved: 0, unapproved: [] };
      if (approvalOk(approval)) entry.approved += 1; else entry.unapproved.push(key.slice(0, 160));
      added.set(group, entry);
    }
  }
  const nowCount = count(now);
  return [...nowCount].filter(([group, n]) => n - (baseCount.get(group) ?? 0) > (added.get(group)?.approved ?? 0))
    .map(([group, n]) => `${label}: group ${group} grew from ${baseCount.get(group) ?? 0} to ${n} without an owner approval (approved: {by: "owner", at, reason}); added: ${(added.get(group)?.unapproved ?? []).join("; ")}`);
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

  it("counts per group: a re-key passes, a new break or group fails, an approved one passes (made-up data)", () => {
    const approved = { by: "owner", at: "2026-11-01", reason: "a reason that is long enough" };
    const g = { rule: "id", finding: "F3", removedBy: "O-055" };
    const base = { _about: "x", breaks: [{ ...g, site: "a" }], public: { view: "A" } };
    expect(growthOffences(base, { ...base, breaks: [{ ...g, site: "renamed" }] }, "f")).toEqual([]);
    expect(growthOffences(base, { ...base, breaks: [{ ...g, site: "a" }, { ...g, site: "b" }] }, "f")).toEqual([expect.stringContaining("grew from 1 to 2")]);
    expect(growthOffences(base, { ...base, breaks: [{ ...g, site: "a" }, { ...g, rule: "unit", site: "b" }] }, "f")).toHaveLength(1);
    expect(growthOffences(base, { ...base, breaks: [{ ...g, site: "a" }, { ...g, site: "b", approved }] }, "f")).toEqual([]);
    expect(growthOffences(base, { ...base, breaks: [{ ...g, site: "a" }, { ...g, site: "b", approved: { ...approved, by: "agent" } }] }, "f")).toHaveLength(1);
    // The `public` section holds resolved mappings, not breaks: it never counts (owner 2026-11-03).
    const settings = { _about: "x", public: { view: "A" }, addressOnly: [{ param: "stars", finding: "F11", removedBy: "O-056" }] };
    const cases: readonly [string, Record<string, unknown>, number][] = [
      ["a new public entry passes", { ...settings, public: { view: "A", extra: "B" } }, 0],
      ["moving an entry from addressOnly to public passes", { ...settings, public: { view: "A", stars: "L.s" }, addressOnly: [] }, 0],
      ["a new addressOnly entry without approval fails", { ...settings, addressOnly: [...settings.addressOnly, { param: "sky", finding: "F11", removedBy: "O-056" }] }, 1],
      ["a new addressOnly entry with owner approval passes", { ...settings, addressOnly: [...settings.addressOnly, { param: "sky", finding: "F11", removedBy: "O-056", approved }] }, 0],
    ];
    for (const [name, now, offences] of cases) expect(growthOffences(settings, now, "f"), name).toHaveLength(offences);
    expect(countOffences({ a: 5, b: 3 }, { a: 6, b: 2, c: 1 })).toHaveLength(2);
    expect(deepImportCounts('const DEEP_IMPORT_COUNTS: Record<string, number> = {\n  "a-b": 12, // x\n  "c": 3,\n};')).toEqual({ "a-b": 12, c: 3 });
  });
});
