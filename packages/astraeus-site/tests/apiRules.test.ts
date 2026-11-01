import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { addressParameters, allowlistOffences, errorBreaks, errorCodes, errorTable, ERROR_TABLE_END, ERROR_TABLE_START, idLiteralBreaks, publicTypeBreaks, readmeApiBreaks, readmeErrorTable, selectorBreaks, styleSelectorBreaks, type Break } from "../../../tools/api-rules.mjs";
import { currentSurface, type Surface } from "../../../tools/api-surface.mjs";

// The rules on shape, errors, settings and page isolation are checked here (O-053 T-229; Guardrails API-03 to API-06). Each check finds today's breaks, compares them with an allowlist
// next to this file (one entry per break, with reason, review finding and the Objective expected to remove it) and fails on a new break and on an entry that no longer matches one.
// Every check is also shown failing on a made-up sample, so a check that has gone blind fails here too.

const read = <T>(name: string): T => JSON.parse(readFileSync(join(__dirname, name), "utf8")) as T;
interface Entry { rule: string; site: string; reason: string; finding: string; removedBy: string }
interface TypeLint { unitless: { field: string; reason: string }[]; exceptions: { rule: string; site: string; reason: string }[]; breaks: Entry[] }
const typeLint = read<TypeLint>("apiTypeLint.allowlist.json");
const errors = read<{ breaks: Entry[] }>("apiErrors.allowlist.json");
const isolation = read<{ breaks: Entry[] }>("apiIsolation.allowlist.json");
const settings = read<{ public: Record<string, string>; addressOnly: { param: string; reason: string; finding: string; removedBy: string }[] }>("apiSettings.allowlist.json");
const README = join(__dirname, "..", "..", "astraeus", "README.md");

const withDir = <T>(files: Record<string, string>, run: (dir: string) => T): T => {
  const dir = mkdtempSync(join(tmpdir(), "astraeus-api-rules-"));
  try {
    for (const [name, text] of Object.entries(files)) { mkdirSync(join(dir, name, ".."), { recursive: true }); writeFileSync(join(dir, name), text); }
    return run(dir);
  } finally { rmSync(dir, { recursive: true, force: true }); }
};
const metadata = (entries: Entry[], label: string): void => {
  for (const entry of entries) {
    expect(entry.reason.length, `${label} ${entry.site}`).toBeGreaterThan(10);
    expect(entry.finding, `${label} ${entry.site}`).toMatch(/^F\d+$/);
    expect(entry.removedBy, `${label} ${entry.site}`).toMatch(/^O-\d{3}$/);
  }
};

describe("public-type lint (API-04)", () => {
  let found: Break[];
  beforeAll(() => { found = publicTypeBreaks(); }, 60_000);

  /** The lint hits that are neither a number with no unit by design (`unitless`) nor a permanent exception, compared with the break list. */
  const offences = (hits: Break[], list: TypeLint): string[] => {
    const unitNames = new Set(hits.filter((hit) => hit.rule === "unit").map((hit) => hit.site.split(": ").pop()));
    const unitlessStale = list.unitless.filter((entry) => !unitNames.has(entry.field)).map((entry) => `stale unitless entry ${entry.field}; delete it from apiTypeLint.allowlist.json`);
    const left = hits.filter((hit) => !(hit.rule === "unit" && list.unitless.some((entry) => entry.field === hit.site.split(": ").pop())));
    const exceptionKey = (item: { rule: string; site: string }): string => `${item.rule} ${item.site}`;
    const exceptionKeys = new Set(list.exceptions.map(exceptionKey));
    const exceptionStale = list.exceptions.filter((entry) => !left.some((hit) => exceptionKey(hit) === exceptionKey(entry))).map((entry) => `stale exception ${exceptionKey(entry)}; delete it from apiTypeLint.allowlist.json`);
    return [...unitlessStale, ...exceptionStale, ...allowlistOffences(left.filter((hit) => !exceptionKeys.has(exceptionKey(hit))), list.breaks, "type lint")];
  };

  it("finds no public type break beyond the allowlist, which can only shrink", () => {
    expect(offences(found, typeLint)).toEqual([]);
  });

  it("keeps a reason on every unitless field, exception and break, and a finding and Objective on every break", () => {
    typeLint.unitless.forEach((entry) => expect(entry.reason.length, entry.field).toBeGreaterThan(10));
    typeLint.exceptions.forEach((entry) => expect(entry.reason.length, entry.site).toBeGreaterThan(10));
    metadata(typeLint.breaks, "type lint");
  });

  it("names today's breaks from the API review", () => {
    const keys = new Set(found.map((hit) => `${hit.rule} ${hit.site}`));
    for (const key of [
      "centre MoonPositions.centre", "span PacingInput: from/to", "unit PacingInput.near.within: within", "unit PacingInput.ramp: ramp", "unit AddBodyOptions.labelReach: labelReach", "unit TrajectoryBase.labelReach: labelReach",
      "time StoryPanelsInput.panels: at.utc (ISO text ending in Z only)", "frame ElementsBodyRecord.frame", "loose StoryPanelsInput.panels",
    ]) expect(keys.has(key), key).toBe(true);
  });

  it("fails on a made-up public type with every kind of break", () => {
    const sample = `
      export interface Pos { readonly centre: string; readonly radius: number; readonly rangeKm: number }
      export interface Window { readonly from: string; readonly to: string; readonly at: string; readonly timeUtc: number }
      export interface Rec { readonly frame: "EQJ"; readonly plane: "EQJ"; readonly data: unknown; readonly list: readonly any[] }
      export type TimeInput = string | number | Date;
      export interface Good { readonly start: TimeInput; readonly end: TimeInput; readonly distanceKm: number; readonly label: string }
      export function take(input: unknown): void { void input; }
    `;
    const hits = withDir({ "api/index.ts": sample }, (dir) => publicTypeBreaks(join(dir, "api", "index.ts")));
    expect(hits.map((hit) => `${hit.rule} ${hit.site}`)).toEqual([
      "centre Pos.centre",
      "frame Rec.frame",
      "loose Rec.data",
      "loose Rec.list",
      "loose take(input)",
      "span Window: from/to",
      "time Window.at: string",
      "time Window.from: string",
      "time Window.timeUtc: number",
      "time Window.to: string",
      "unit Pos.radius: radius",
      "unit Window.timeUtc: timeUtc",
    ].sort());
    expect(offences(hits, { unitless: [], exceptions: [], breaks: [] }).length).toBe(hits.length);
    expect(offences([], { unitless: [{ field: "gone", reason: "a stale entry" }], exceptions: [{ rule: "time", site: "X.to: string", reason: "a stale entry" }], breaks: [{ rule: "frame", site: "Y.frame", reason: "a stale entry", finding: "F4", removedBy: "O-057" }] })).toEqual([
      expect.stringContaining("stale unitless entry gone"), expect.stringContaining("stale exception time X.to: string"), expect.stringContaining("stale allowlist entry frame Y.frame"),
    ]);
  });
});

describe("errors (API-05)", () => {
  // The real-source scan builds a TypeScript program over src/api/, which grows with the source: run it once, under a stated hook limit, not inside a case's 5 s default (I-135, as I-080 did).
  let found: Break[];
  beforeAll(() => { found = errorBreaks(); }, 60_000);

  it("throws only SceneError from src/api/ and recognises no error by its message, beyond the allowlist", () => {
    expect(allowlistOffences(found, errors.breaks, "errors")).toEqual([]);
    metadata(errors.breaks, "errors");
  });

  it("fails on a plain throw and on a message match in a made-up api folder (a rethrow and a SceneError pass)", () => {
    const sample = `
      export class SceneError extends RangeError { constructor(readonly code: string, message: string) { super(message); } }
      const bad = (what: string): SceneError => new SceneError("bad-time", what);
      export function ok(x: number): void { if (x > 1) throw new SceneError("bad-time", "x"); if (x > 2) throw bad("y"); try { ok(x); } catch (error) { throw error; } }
      export function plain(x: number): void { if (x > 1) throw new RangeError("x"); if (x > 2) throw new Error("y"); }
      export function byText(error: Error): boolean { return error.message.startsWith("the") || /no turn/.test(error.message) || error.message === "z"; }
    `;
    const hits = withDir({ "api/sample.ts": sample }, (dir) => errorBreaks(join(dir, "api")));
    expect(hits.map((hit) => hit.rule)).toEqual(["message", "message", "message", "throw", "throw"]);
    expect(allowlistOffences(hits, [], "errors")).toHaveLength(5);
  });

  it("documents every SceneErrorCode with a one-line meaning", () => {
    const codes = errorCodes();
    expect(codes.length).toBeGreaterThan(20);
    for (const { code, meaning } of codes) {
      expect(meaning.length, code).toBeGreaterThan(10);
      expect(meaning, code).not.toContain("\n");
    }
    expect(new Set(codes.map((entry) => entry.code)).size).toBe(codes.length);
  });

  it("keeps the README error table equal to the one generated from the SceneErrorCode doc comments", () => {
    const readme = readFileSync(README, "utf8");
    expect(readme).toContain(ERROR_TABLE_START);
    expect(readme).toContain(ERROR_TABLE_END);
    expect(readmeErrorTable(readme), "run `npm run api:errors`").toBe(errorTable());
  });

  it("sees a README table that has drifted from the code list", () => {
    const readme = `${ERROR_TABLE_START}\n${errorTable().replace("`bad-time`", "`bad-times`")}\n${ERROR_TABLE_END}`;
    expect(readmeErrorTable(readme)).not.toBe(errorTable());
    expect(readmeErrorTable("no markers")).toBeUndefined();
  });
});

describe("settings mapping (API-06)", () => {
  // Both scans build a TypeScript program over the whole source: once each, under a stated hook limit (I-135).
  let surface: Surface;
  let addressed: string[];
  beforeAll(() => { surface = currentSurface(); addressed = addressParameters(); }, 60_000);

  /** Offences of the address parameters read against the mapping and the address-only allowlist, and of the mapped keys against the real surface. */
  const offences = (params: string[], list: typeof settings, now: Surface): string[] => {
    const exists = (key: string): boolean => {
      const [name, member] = key.split(".") as [string, string];
      const item = (now.root as Record<string, { members?: { name: string }[]; signature?: string }>)[name];
      return item !== undefined && ((item.members ?? []).some((candidate) => candidate.name === member) || new RegExp(`\\b${member}\\??:`).test(item.signature ?? ""));
    };
    const only = new Set(list.addressOnly.map((entry) => entry.param));
    return [
      ...params.filter((param) => list.public[param] === undefined && !only.has(param)).map((param) => `address setting "${param}" has no public setting key; add it to \`public\` with the key that sets it, or to \`addressOnly\` with a finding`),
      ...Object.entries(list.public).filter(([, key]) => !exists(key)).map(([param, key]) => `"${param}" maps to ${key}, which is not on the public surface`),
      ...Object.keys(list.public).filter((param) => !params.includes(param)).map((param) => `stale public entry "${param}": the viewer no longer reads it`),
      ...list.addressOnly.filter((entry) => !params.includes(entry.param)).map((entry) => `stale addressOnly entry "${entry.param}": the viewer no longer reads it; delete it`),
      ...list.addressOnly.filter((entry) => list.public[entry.param] !== undefined).map((entry) => `stale addressOnly entry "${entry.param}": it has a public key now; delete it`),
    ];
  };

  it("gives every setting the viewer reads from the page address a public setting key, beyond the address-only allowlist", () => {
    expect(offences(addressed, settings, surface)).toEqual([]);
    for (const entry of settings.addressOnly) { expect(entry.reason.length, entry.param).toBeGreaterThan(10); expect(entry.finding, entry.param).toMatch(/^F\d+$/); expect(entry.removedBy, entry.param).toMatch(/^O-\d{3}$/); }
  });

  it("fails on a made-up address setting with no public key, and on stale entries", () => {
    const sample = `
      export function a(search: string): string | null { return new URLSearchParams(search).get("newlook"); }
      function bounded(search: string, name: string): string | null { return new URLSearchParams(search).get(name); }
      export const b = (search: string) => bounded(search, "viaName");
      export function c(search: string, key: "one" | "two"): boolean { return new URLSearchParams(search).has(key); }
    `;
    const params = withDir({ "app/sample.ts": sample }, (dir) => addressParameters(dir));
    expect(params).toEqual(["newlook", "one", "two", "viaName"]);
    expect(offences(params, { public: { newlook: "Scene.setScale" }, addressOnly: [] }, surface)).toHaveLength(3);
    expect(offences(["t"], { public: { t: "Scene.noSuchSetter", gone: "Scene.setScale" }, addressOnly: [{ param: "t", reason: "r", finding: "F11", removedBy: "O-056" }, { param: "old", reason: "r", finding: "F11", removedBy: "O-056" }] }, surface)).toEqual([
      expect.stringContaining('"t" maps to Scene.noSuchSetter'), expect.stringContaining('stale public entry "gone"'), expect.stringContaining('stale addressOnly entry "old"'), expect.stringContaining('stale addressOnly entry "t": it has a public key'),
    ]);
  });
});

describe("viewer isolation (API-03)", () => {
  it("writes no fixed element id literal in src/shell or src/app beyond the allowlist, which can only shrink", () => {
    const entries = isolation.breaks.filter((entry) => entry.rule === "id");
    expect(allowlistOffences(idLiteralBreaks(), entries, "ids")).toEqual([]);
  });

  it("styles nothing outside the viewer's root class in any stylesheet under src beyond the allowlist, which can only shrink", () => {
    const entries = isolation.breaks.filter((entry) => entry.rule === "selector");
    expect(allowlistOffences(styleSelectorBreaks(), entries, "selectors")).toEqual([]);
    metadata(isolation.breaks, "isolation");
  });

  it("fails on a fixed id literal in a made-up shell folder (a generated id passes)", () => {
    const sample = `
      declare const useId: () => string;
      export const A = () => <aside id="info-panel" aria-labelledby="info-title"><h2 id="info-title">x</h2></aside>;
      export const B = () => { const id = useId(); return <aside id={id} aria-labelledby={\`\${id}-t\`}><h2 id={\`\${id}-t\`}>x</h2></aside>; };
      export const C = () => <Collapsible id={\`moons-\${"x"}\`} />;
      declare const Collapsible: (p: { id: string }) => null;
      export const d = () => document.getElementById("boot");
    `;
    const hits = withDir({ "shell/Sample.tsx": sample, "app/none.ts": "export {};" }, (dir) => idLiteralBreaks(dir));
    expect(hits.map((hit) => hit.site)).toEqual([
      'shell/Sample.tsx: aria-labelledby="info-title"',
      'shell/Sample.tsx: document.getElementById("boot")',
      'shell/Sample.tsx: id="info-panel"',
      'shell/Sample.tsx: id="info-title"',
      "shell/Sample.tsx: id={`moons-${\"x\"}`}",
    ]);
  });

  it("scans every stylesheet in the folder, a new one included, and names the file", () => {
    const hits = withDir({ "app/style.css": ".astraeus-shell .a { top: 0; }", "shell/new.css": "body { margin: 0; }", "deep/er/more.css": ".x { top: 0; }", "shell/Note.ts": "body {}" }, (dir) => styleSelectorBreaks(dir));
    expect(hits.map((hit) => hit.site)).toEqual(["deep/er/more.css: .x", "shell/new.css: body"]);
  });

  it("fails on a selector outside the root class and on :root, html, body and #app (rules under the root class pass, inside @media too)", () => {
    const css = `
      :root { --a: 1; }
      html, body, #app { height: 100%; }
      .hud { top: 0; }
      .astraeus-shell .hud, .astraeus-shell > .row { top: 0; }
      .astraeus-shell { color: red; }
      .astraeus-shellx { color: red; }
      @media (max-width: 700px) { .setting { gap: 0; } .astraeus-shell .setting:not(.a, .b) { gap: 1px; } }
      @keyframes spin { from { opacity: 0; } to { opacity: 1; } }
    `;
    expect(selectorBreaks(css).map((hit) => hit.site)).toEqual([":root", "html", "body", "#app", ".hud", ".astraeus-shellx", ".setting"]);
  });
});

describe("README API tables (API-07)", () => {
  let members: { MountedScene: string[]; MountOptions: string[]; AstraeusSceneProps: string[] };
  beforeAll(() => {
    const root = currentSurface().root;
    const namesOf = (name: string): string[] => (root[name] as { members: { name: string }[] }).members.map((member) => member.name);
    members = { MountedScene: namesOf("MountedScene"), MountOptions: namesOf("MountOptions"), AstraeusSceneProps: namesOf("AstraeusSceneProps") };
  }, 60_000);

  it("lists every MountedScene member, MountOptions key and AstraeusSceneProps prop, and every README row names a real one", () => {
    expect(members.MountedScene.length).toBeGreaterThan(0);
    expect(readmeApiBreaks(readFileSync(README, "utf8"), members)).toEqual([]);
  });

  it("fails on a member the README leaves out, a name it invents, and a row that names a member that does not exist", () => {
    const readme = readFileSync(README, "utf8");
    const lacking = readme.replace("address? })`", "})`").replace(" onEventZone? address?", " onEventZone?").replace("setCamera(target), ", "");
    expect(readmeApiBreaks(lacking, members)).toEqual([
      "mount options (MountOptions): README does not list address",
      "mount handle (MountedScene): README does not list setCamera",
      "<AstraeusScene> props (AstraeusSceneProps): README does not list address",
    ]);
    const invented = readme.replace("onChange?, address? })", "onChange?, address?, speed? })").replace("| `handle.ready` |", "| `handle.readyNow` |");
    expect(readmeApiBreaks(invented, members)).toEqual([
      "mount options (MountOptions): README lists speed, which is not a real member",
      "README row `handle.readyNow`: handle.readyNow is not a MountedScene member",
    ]);
  });
});
