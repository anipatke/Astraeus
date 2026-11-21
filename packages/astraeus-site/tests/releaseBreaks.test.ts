import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readLock } from "../../../tools/api-surface.mjs";

// O-088 T-411, API-01: the public surface is compared with the last release, not with a fixed old tag. `fixtures/api-surface-previous.json` is the root of the lock at the newest released version; the open `## x.y.z (proposed)` section of the changelog must name, in its "Breaking changes" list, every public name removed or changed since.
// The changelog is read by headings only: the top section and the newest dated heading; older sections are history and never parsed.

interface Member {
  name: string;
  optional: boolean;
  signature: string;
}
interface Entry {
  kind: string;
  signature: string;
  constructors?: string[];
  members: Member[];
}
type Root = Record<string, Entry>;

const PREVIOUS_FILE = JSON.parse(readFileSync(join(__dirname, "fixtures", "api-surface-previous.json"), "utf8")) as {
  version: string;
  root: Root;
};
const PREVIOUS = PREVIOUS_FILE.root;
const LOCK = readLock().root as Root;
const changelog = readFileSync(join(__dirname, "..", "..", "astraeus", "CHANGELOG.md"), "utf8");
const REFRESH =
  "node -e to write {version, root} from the lock into fixtures/api-surface-previous.json (docs/RELEASING.md, step 3)";

/** Changes since the last release that ask nothing of a host: each only widens what is accepted or adds to what is there. Name -> why. */
const NOT_BREAKING = new Map<string, string>([]);

/** The backticked names in a cell that start with a public root name: `Scene.bodies`, `PacingInput.near.within`. */
const namesIn = (cell: string): string[] =>
  [...cell.matchAll(/`([A-Z][A-Za-z]*(?:\.[A-Za-z]+)*)`/g)]
    .map((match) => match[1])
    .filter((name) => name.split(".")[0] in PREVIOUS || name.split(".")[0] in LOCK);

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
/** A signature with its top-level union members in a fixed order: the compiler lists a union's members by when it first met each one, so an unrelated new literal elsewhere can reorder `"a" | "b"` without changing what is accepted. */
const canonical = (written: string): string => {
  const signature = written.replace(/^\| /, ""); // a multi-line union is written with a leading `|`, which says nothing about what is accepted
  return signature.includes("(") || signature.includes("<") ? signature : signature.split(" | ").sort().join(" | ");
};

function brokenNames(before: Root, after: Root): string[] {
  const names: string[] = [];
  for (const [name, entry] of Object.entries(before)) {
    const now = after[name];
    if (now === undefined) {
      names.push(name);
      continue;
    }
    if (
      canonical(entry.signature) !== canonical(now.signature) ||
      JSON.stringify(entry.constructors) !== JSON.stringify(now.constructors)
    )
      names.push(name);
    for (const member of entry.members) {
      const kept = now.members.find((item) => item.name === member.name);
      if (
        kept === undefined ||
        canonical(kept.signature) !== canonical(member.signature) ||
        kept.optional !== member.optional
      )
        names.push(`${name}.${member.name}`);
    }
  }
  return names;
}

/** The changelog's `## ` headings with their text, newest first. */
const sections = changelog.split(/^(?=## )/m).filter((part) => part.startsWith("## "));
const headingOf = (section: string): string => section.split("\n", 1)[0];
const isDated = (heading: string): boolean => /^## \d+\.\d+\.\d+ \(\d{4}-\d{2}-\d{2}\)/.test(heading);
const newestDated = sections.map(headingOf).find(isDated);
const top = sections[0];
const topOpen = !isDated(headingOf(top));

/** The section's "### Breaking changes in <version>" list: text from that heading to the next heading. */
function breakingList(section: string): string {
  const version = /^## (\d+\.\d+\.\d+)/.exec(headingOf(section))?.[1] ?? "";
  const start = section.indexOf(`### Breaking changes in ${version}`);
  if (start === -1) return "";
  const rest = section.slice(start + 4);
  const next = rest.search(/^#{2,3} /m);
  return next === -1 ? rest : rest.slice(0, next);
}

/** Broken names that neither the list names (the name itself or its type) nor NOT_BREAKING excuses. */
function unnamed(before: Root, after: Root, list: string, excused: Map<string, string>): string[] {
  const named = namesIn(list);
  const covered = (name: string) => named.some((item) => item === name || item === name.split(".")[0]);
  return brokenNames(before, after).filter((name) => !excused.has(name) && !covered(name));
}

describe("breaking changes since the last release (API-01)", () => {
  it("has a fixture at the newest released version", () => {
    expect(newestDated, "a dated changelog heading").toBeDefined();
    expect(`## ${PREVIOUS_FILE.version} (`, `fixture is stale; refresh it: ${REFRESH}`).toBe(
      (newestDated ?? "").slice(0, `## ${PREVIOUS_FILE.version} (`.length),
    );
  });

  it("names every removed or changed public name in the open version's Breaking changes list", () => {
    if (!topOpen) return;
    const list = breakingList(top);
    expect(list, "the open section needs a '### Breaking changes in <version>' list").not.toBe("");
    expect(unnamed(PREVIOUS, LOCK, list, NOT_BREAKING)).toEqual([]);
  });

  it("has no surface change after a release unless a new section is open", () => {
    if (topOpen) return;
    expect(brokenNames(PREVIOUS, LOCK), "open a new changelog section for this change").toEqual([]);
    expect(LOCK).toEqual(PREVIOUS);
  });

  it("keeps the not-breaking list honest: each entry is a real difference", () => {
    for (const name of NOT_BREAKING.keys()) expect(brokenNames(PREVIOUS, LOCK)).toContain(name);
  });

  it("fails on a made-up surface change no line names (planted-case proof)", () => {
    const planted = structuredClone(LOCK);
    delete planted.Scene;
    expect(brokenNames(LOCK, planted)).toEqual(["Scene"]);
    expect(unnamed(LOCK, planted, "- Something else changed (`Camera`).", new Map())).toEqual(["Scene"]);
    expect(unnamed(LOCK, planted, "- `Scene` is gone.", new Map())).toEqual([]);
    expect(unnamed(LOCK, planted, "", new Map([["Scene", "excused"]]))).toEqual([]);
    expect(holds(PREVIOUS, "Scene")).toBe(true);
    expect(holds(planted, "Scene")).toBe(false);
  });

  it("fails on a not-breaking entry with no real difference (planted-case proof)", () => {
    expect(brokenNames(LOCK, structuredClone(LOCK))).not.toContain("Scene");
  });
});
