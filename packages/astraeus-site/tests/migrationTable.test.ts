import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readLock } from "../../../tools/api-surface.mjs";

// O-057 T-280, API-01: the CHANGELOG's one migration table agrees with the public surface. `fixtures/api-surface-0.7.0.json` is the root of the surface at tag v0.7.0, which had no lock: `currentSurface` run on a `git archive` of that tag.
// A row's old names must have existed at 0.7.0 and its new names must be in the lock, and every removed or changed public name must have a row, so a rename cannot slip past the table.

interface Member { name: string; optional: boolean; signature: string }
interface Entry { kind: string; signature: string; constructors?: string[]; members: Member[] }
type Root = Record<string, Entry>;
interface Row { kind: string; old: string; now: string; todo: string }

const OLD = (JSON.parse(readFileSync(join(__dirname, "fixtures", "api-surface-0.7.0.json"), "utf8")) as { root: Root }).root;
const LOCK = readLock().root as Root;
const changelog = readFileSync(join(__dirname, "..", "..", "astraeus", "CHANGELOG.md"), "utf8");

/** Changes between the surfaces that ask nothing of a host: each only widens what is accepted or adds to what is there. */
const WIDENED = new Map([
  ["AddBodyOptions.orbit", "also takes { lapDays, fades? }"],
  ["SceneCamera.setReach", "gains an optional second argument"],
  ["AstraeusScene", "takes more optional props"],
  ["MountedScene", "now extends ViewerHandle, which adds reads and calls"],
]);

const rowsOf = (text: string): Row[] => {
  const start = text.indexOf("### Migration from 0.7.0 to 0.8.0");
  const lines = text.slice(start).split("\n").filter((line) => line.startsWith("| ")).slice(1);
  const end = lines.findIndex((line) => !/^\| (removed|renamed|changed|read|behaviour) \|/.test(line));
  return (end === -1 ? lines : lines.slice(0, end)).map((line) => {
    const [kind, old, now, todo] = line.slice(2, -2).split(" | ");
    return { kind, old, now, todo };
  });
};
const rows = rowsOf(changelog);

/** The backticked names in a cell that start with a public root name: `Scene.bodies`, `PacingInput.near.within`. */
const namesIn = (cell: string): string[] => [...cell.matchAll(/`([A-Z][A-Za-z]*(?:\.[A-Za-z]+)*)`/g)].map((match) => match[1]).filter((name) => name.split(".")[0] in OLD || name.split(".")[0] in LOCK);

/** Whether a surface holds `name`: a root entry, then a member, then deeper fields as words in the member's or the alias's signature. */
function holds(root: Root, name: string): boolean {
  const [first, second, ...rest] = name.split(".");
  const entry = root[first];
  if (entry === undefined) return false;
  if (second === undefined) return true;
  const member = entry.members.find((item) => item.name === second);
  const words = member === undefined ? [second, ...rest] : rest;
  return words.every((word) => new RegExp(`\\b${word}\\b`).test(member?.signature ?? entry.signature));
}

/** Every removed or changed public name between two surfaces, as `Type` or `Type.member`. */
function brokenNames(before: Root, after: Root): string[] {
  const names: string[] = [];
  for (const [name, entry] of Object.entries(before)) {
    const now = after[name];
    if (now === undefined) { names.push(name); continue; }
    if (entry.signature !== now.signature || JSON.stringify(entry.constructors) !== JSON.stringify(now.constructors)) names.push(name);
    for (const member of entry.members) {
      const kept = now.members.find((item) => item.name === member.name);
      if (kept === undefined || kept.signature !== member.signature || kept.optional !== member.optional) names.push(`${name}.${member.name}`);
    }
  }
  return names;
}

describe("the 0.8.0 migration table (API-01)", () => {
  it("is one table, with something in every cell", () => {
    expect(changelog.match(/### Migration from 0\.7\.0 to 0\.8\.0/g)).toHaveLength(1);
    expect(rows.length).toBeGreaterThan(40);
    for (const row of rows) for (const cell of [row.old, row.now, row.todo]) expect(cell?.trim(), JSON.stringify(row)).toBeTruthy();
  });

  it.each(rows.filter((row) => row.kind === "renamed" || row.kind === "removed"))("$kind $old: the old name was public at 0.7.0 unless it had no type, and is gone", ({ old }) => {
    for (const name of namesIn(old)) {
      expect(holds(OLD, name), `${name} at 0.7.0`).toBe(true);
      expect(holds(LOCK, name), `${name} in the lock`).toBe(false);
    }
  });

  it.each(rows.filter((row) => row.kind === "changed"))("changed $old: the name is in both surfaces and differs", ({ old }) => {
    const names = namesIn(old);
    expect(names.length).toBeGreaterThan(0);
    const name = names[0];
    expect(holds(OLD, name) && holds(LOCK, name), name).toBe(true);
    expect(brokenNames(OLD, LOCK), name).toContain(name);
  });

  it.each(rows)("$kind $old: every new name is in the lock", ({ now }) => {
    for (const name of namesIn(now)) expect(holds(LOCK, name), name).toBe(true);
  });

  it("names a public type in every row but the behaviour rows, which no type can show", () => {
    for (const row of rows.filter((item) => item.kind !== "behaviour")) expect(namesIn(row.old).length + namesIn(row.now).length, row.old).toBeGreaterThan(0);
  });

  it("has a row for every removed or changed public name", () => {
    const named = rows.flatMap((row) => namesIn(row.old));
    const covered = (name: string) => named.some((item) => item === name || item.startsWith(`${name}.`));
    expect(brokenNames(OLD, LOCK).filter((name) => !WIDENED.has(name) && !covered(name))).toEqual([]);
  });

  it("keeps the widened list honest: each entry is a real difference", () => {
    for (const name of WIDENED.keys()) expect(brokenNames(OLD, LOCK)).toContain(name);
  });

  it("fails on a made-up surface change no row covers (planted-case proof)", () => {
    const planted = structuredClone(LOCK);
    delete planted.Scene;
    expect(brokenNames(LOCK, planted)).toEqual(["Scene"]);
    expect(holds(OLD, "SceneCamera.reach")).toBe(true);
    expect(holds(LOCK, "SceneCamera.reach")).toBe(false);
    expect(holds(OLD, "PacingInput.near.within")).toBe(true);
    expect(holds(LOCK, "PacingInput.near.within")).toBe(false);
  });
});
