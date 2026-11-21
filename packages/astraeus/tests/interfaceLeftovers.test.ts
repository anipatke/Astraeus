// The leftover check (O-079 T-332). An interface stylesheet may only style what the interface draws, the look module may only hold tokens something reads, and
// a stylesheet must be loaded by a component. This test fails on:
//   1. a class selector in an interface stylesheet (every `.css` under `src/shell` and `src/shelf`, and `src/app/style.css`) that no engine source file renders;
//   2. a `--astraeus-*` token of `shell/look/look.css` that no stylesheet or source file reads and that is not one documented for host content;
//   3. an interface stylesheet the one stylesheet (`app/style.css`) does not load, or a stylesheet import anywhere but the entry files (one place loads the styles,
//      so the build writes a Node copy of the entry files only, and a sheet cannot be left unloaded).
// "Renders" is read from the source, not from a drawn page: a class counts when it is a whole word of a string or template literal in a non-test `.ts`/`.tsx`
// file under `src`, standing where a class is set (a `className`, a `classList` call, or a line naming a CARRIERS entry). Any other string (an `aria-label`,
// a pop-up id, a selector string ".name") and a comment do not count. A class built at run
// time (`metric-${kind}`) counts only through FAMILIES, which lists the values the code can build. ALLOWED is the allowlist; it is empty, and an entry needs a reason.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "src");
const LOOK = "shell/look/look.css";
const HOLE = "\u0000";

/** Classes kept though nothing renders them: class name to the reason. Expected empty. */
const ALLOWED: Readonly<Record<string, string>> = {};

/** Classes built at run time: the prefix the source builds from, the values it can append, and the file that states those values (each must hold the value as a string). */
const FAMILIES: Readonly<Record<string, { readonly values: readonly string[]; readonly from: string }>> = {
  "metric-": { values: ["speed", "distance", "rate", "relative-distance", "altitude", "progress", "uncertainty", "phase", "coordinates"], from: "shell/metrics.ts" },
  "tone-": { values: ["good", "warn", "bad"], from: "app/frameStats.ts" },
};

/** Tokens host content may read without the engine reading them (viewer-interface note, section 10, "Documented for host content"). */
const HOST_TOKENS = new Set(["panel", "text", "muted", "accent", "border", "data", "font", "text-size", "text-s", "text-l", "space-1", "space-2", "space-3", "space-4", "space-5", "space-6", "radius", "radius-pill", "motion"].map((name) => `--astraeus-${name}`));

/** Calls and constants whose string literals are class names though no `className` stands beside them; a literal on a line naming one counts. */
const CARRIERS = ["createLabelElement(", "GHOST_CLASS"];

/** One string or template literal: its text (a template's `${…}` is a hole mark), and whether it stands where a class name is set. */
export interface Literal { readonly text: string; readonly isClass: boolean }

const CLASS_LEAD = /(?:\bclassName|\.className|\bclass)\s*[=:]\s*$|\bclassList\.(?:add|remove|toggle)\(\s*$/;

/**
 * The string and template literals of TypeScript source, comments left out; the literals inside a template's hole are returned too. A literal sets a class when it is the
 * value of `className` (JSX attribute, with everything inside its braces; a property; a default; an assignment), an argument of `classList.add/remove/toggle`, or on a
 * line naming one of `carriers`. `closed` is false when the text ends inside a template.
 */
export function literalsOf(source: string, carriers: readonly string[] = CARRIERS): { readonly literals: Literal[]; readonly closed: boolean } {
  const literals: Literal[] = [];
  let closed = true;
  let at = 0;
  let classDepth = 0;
  const push = (text: string, start: number): void => {
    const lineStart = source.lastIndexOf("\n", start) + 1;
    const lineEnd = source.indexOf("\n", start);
    const line = source.slice(lineStart, lineEnd < 0 ? source.length : lineEnd);
    literals.push({ text, isClass: classDepth > 0 || CLASS_LEAD.test(source.slice(Math.max(0, start - 40), start)) || carriers.some((carrier) => line.includes(carrier)) });
  };
  const quoted = (quote: string): void => {
    let text = "";
    for (let i = at + 1; i < source.length; i += 1) {
      const ch = source[i]!;
      if (ch === "\n") return; // not a string (an apostrophe in JSX text): read on as code
      if (ch === "\\") { text += source[i + 1] ?? ""; i += 1; continue; }
      if (ch === quote) { push(text, at); at = i; return; }
      text += ch;
    }
  };
  const template = (): void => {
    const start = at;
    let text = "";
    at += 1;
    for (; at < source.length; at += 1) {
      const ch = source[at]!;
      if (ch === "\\") { text += source[at + 1] ?? ""; at += 1; continue; }
      if (ch === "`") { push(text, start); return; }
      if (ch === "$" && source[at + 1] === "{") { at += 2; code(true); text += HOLE; continue; }
      text += ch;
    }
    closed = false;
  };
  /** Reads code from `at`; inside braces (a template hole, a `className={…}`) it stops on the brace that closes them. */
  function code(inBraces: boolean): void {
    let depth = 0;
    for (; at < source.length; at += 1) {
      const ch = source[at]!;
      const next = source[at + 1];
      if (ch === "/" && next === "/") { const end = source.indexOf("\n", at); at = end < 0 ? source.length : end; continue; }
      if (ch === "/" && next === "*") { const end = source.indexOf("*/", at + 2); at = end < 0 ? source.length : end + 1; continue; }
      if (ch === '"' || ch === "'") { quoted(ch); continue; }
      if (ch === "`") { template(); continue; }
      if (ch === "c" && source.startsWith("className={", at)) { at += "className={".length; classDepth += 1; code(true); classDepth -= 1; continue; }
      if (!inBraces) continue;
      if (ch === "{") depth += 1;
      else if (ch === "}") { if (depth === 0) return; depth -= 1; }
    }
  }
  code(false);
  return { literals, closed };
}

/** What a set of source texts renders: the exact class words, and the prefixes a template builds on (`metric-${kind}` gives `metric-`). */
export function renderedBy(sources: readonly string[]): { readonly exact: Set<string>; readonly prefixes: Set<string> } {
  const exact = new Set<string>();
  const prefixes = new Set<string>();
  for (const source of sources) {
    for (const literal of literalsOf(source).literals) {
      if (!literal.isClass) continue;
      for (const word of literal.text.split(/\s+/)) {
        const hole = word.indexOf(HOLE);
        const fixed = hole < 0 ? word : word.slice(0, hole);
        if (!/^-?[_a-zA-Z][\w-]*$/.test(fixed)) continue;
        if (hole >= 0 && fixed.endsWith("-")) prefixes.add(fixed);
        else exact.add(fixed);
      }
    }
  }
  return { exact, prefixes };
}

/** Comments, `url(…)` text and strings removed, so an attribute value or a data URI is never read as a selector. */
const plain = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/url\([^)]*\)/g, "url()").replace(/"[^"]*"|'[^']*'/g, '""');

/** Every class a stylesheet's selectors name. */
export function classSelectors(css: string): string[] {
  const found = new Set<string>();
  for (const match of plain(css).matchAll(/([^{};]+)\{/g)) {
    const prelude = match[1]!.trim();
    if (prelude.startsWith("@")) continue;
    for (const name of prelude.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) found.add(name[1]!);
  }
  return [...found].sort();
}

/** Whether the source renders `name`: as a whole word, or as a family prefix with one of the family's values. */
function rendered(name: string, by: ReturnType<typeof renderedBy>, families: typeof FAMILIES): boolean {
  if (by.exact.has(name)) return true;
  return Object.entries(families).some(([prefix, family]) => by.prefixes.has(prefix) && name.startsWith(prefix) && family.values.includes(name.slice(prefix.length)));
}

/** The class selectors of `sheets` (file to text) that `sources` never render, each as `file: .class`. */
export function unusedClasses(sheets: Readonly<Record<string, string>>, sources: readonly string[], families: typeof FAMILIES = FAMILIES, allowed: Readonly<Record<string, string>> = ALLOWED): string[] {
  const by = renderedBy(sources);
  return Object.entries(sheets).flatMap(([file, css]) => classSelectors(css).filter((name) => !(name in allowed) && !rendered(name, by, families)).map((name) => `${file}: .${name}`));
}

/** The tokens `look` defines that nothing in `texts` reads with `var(…)` or sets by name, host tokens left out. */
export function unusedTokens(look: string, texts: readonly string[]): string[] {
  const defined = [...new Set([...plain(look).matchAll(/(--astraeus-[a-z0-9-]+)\s*:/g)].map((match) => match[1]!))];
  const all = texts.join("\n");
  return defined.filter((token) => !HOST_TOKENS.has(token) && !new RegExp(`var\\(${token}[,)\\s]`).test(all));
}

/** The one stylesheet the entry files import; it loads every other interface sheet with `@import`. */
const ONE = "app/style.css";
/** The entry files: the only source files that may import a stylesheet. */
const ENTRIES = ["api/mount.ts", "api/AstraeusScene.tsx"];

/** The stylesheets a source text imports (`import "x.css"`, `import x from "x.css"`, `import("x.css")`, `require("x.css")`). */
export function styleImports(source: string): string[] {
  return literalsOf(source).literals.map((literal) => literal.text).filter((text) => /^[^\s]+\.css(\?[\w=&-]*)?$/.test(text) && /^\.{0,2}\//.test(text));
}

/** Stylesheet imports outside the one place: any import in a file that is not an entry file, and an entry file's import of anything but the one stylesheet. Each as `file: specifier`. */
export function strayStyleImports(sources: Readonly<Record<string, string>>, entries: readonly string[] = ENTRIES, one = ONE): string[] {
  return Object.entries(sources).flatMap(([file, text]) => styleImports(text)
    .filter((specifier) => !entries.includes(file) || join("/", file, "..", specifier).split("\\").join("/").slice(1) !== one)
    .map((specifier) => `${file}: ${specifier}`));
}

/** The interface sheets the one stylesheet does not load with an `@import` (itself left out), and the one stylesheet itself when no source imports it. */
export function unloadedSheets(sheets: Readonly<Record<string, string>>, oneIsImported: boolean, one = ONE): string[] {
  const loaded = new Set([...(sheets[one] ?? "").replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/@import\s+"([^"]+)"\s*;/g)].map((match) => join("/", one, "..", match[1]!).split("\\").join("/").slice(1)));
  return Object.keys(sheets).filter((file) => (file === one ? !oneIsImported : !loaded.has(file)));
}

function walk(dir: string, keep: (name: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path, keep) : keep(name) ? [path] : [];
  });
}

const rel = (path: string): string => relative(SRC, path).split("\\").join("/");
const read = (paths: readonly string[]): Record<string, string> => Object.fromEntries(paths.map((path) => [rel(path), readFileSync(path, "utf8")]));
const SHEETS = read([...walk(join(SRC, "shell"), (name) => name.endsWith(".css")), ...walk(join(SRC, "shelf"), (name) => name.endsWith(".css")), join(SRC, "app", "style.css")]);
const SOURCES = read(walk(SRC, (name) => /\.tsx?$/.test(name) && !/\.(test|d)\.tsx?$/.test(name)));

describe("interface leftovers: the stylesheets style only what the interface draws", () => {
  it("reads the stylesheets and the source", () => {
    expect(Object.keys(SHEETS)).toEqual(expect.arrayContaining([LOOK, "shell/areas/areas.css", "app/style.css"]));
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100);
    expect(Object.values(SHEETS).flatMap(classSelectors).length).toBeGreaterThan(150);
  });

  it("reads every source file to its end (no template literal left open by the reader)", () => {
    expect(Object.entries(SOURCES).filter(([, text]) => !literalsOf(text).closed).map(([file]) => file)).toEqual([]);
  });

  it("has no class selector the interface never renders", () => {
    expect(unusedClasses(SHEETS, Object.values(SOURCES))).toEqual([]);
  });

  it("keeps the allowlist empty, or every entry reasoned and still needed", () => {
    expect(ALLOWED).toEqual({});
    const stillUnused = unusedClasses(SHEETS, Object.values(SOURCES), FAMILIES, {}).map((one) => one.split(": .")[1]);
    for (const [name, reason] of Object.entries(ALLOWED)) {
      expect(reason.trim().length, name).toBeGreaterThan(10);
      expect(stillUnused, `${name} is rendered or gone: remove it from ALLOWED`).toContain(name);
    }
  });

  it("builds every run-time class family in the source, from values the named file states", () => {
    const by = renderedBy(Object.values(SOURCES));
    for (const [prefix, family] of Object.entries(FAMILIES)) {
      expect(by.prefixes.has(prefix), `no template builds ${prefix}…`).toBe(true);
      for (const value of family.values) expect(SOURCES[family.from], `${family.from} states "${value}"`).toContain(`"${value}"`);
    }
  });

  it("has no look token that nothing reads", () => {
    expect(unusedTokens(SHEETS[LOOK]!, [...Object.values(SHEETS), ...Object.values(SOURCES)])).toEqual([]);
  });

  it("has no interface stylesheet that the one stylesheet does not load", () => {
    expect(unloadedSheets(SHEETS, Object.values(SOURCES).flatMap(styleImports).length > 0)).toEqual([]);
  });

  it("loads the stylesheets in one place: only the entry files import one, and only the one stylesheet", () => {
    expect(strayStyleImports(SOURCES)).toEqual([]);
    for (const entry of ENTRIES) expect(styleImports(SOURCES[entry]!), entry).toEqual(["../app/style.css"]);
  });
});

describe("the leftover rules see what they must (planted cases)", () => {
  const sheet = { "shell/x.css": ".astraeus-shell .planted-part > .planted-row[data-x=\".not-a-class\"]:hover { top: 0; }\n@container astraeus-viewer (max-width: 900px) { .astraeus-shell .planted-narrow { top: 0; } }" };
  const shell = 'const a = <div className="astraeus-shell" />;';

  it("a class no source renders is named, with its file", () => {
    expect(unusedClasses(sheet, [shell])).toEqual(["shell/x.css: .planted-narrow", "shell/x.css: .planted-part", "shell/x.css: .planted-row"]);
  });
  it("a class in a className, a conditional, a template or a classList call is rendered", () => {
    const source = `${shell}\nconst b = <i className={on ? "planted-part" : ""} />;\nconst c = <i className={\`base\${nested ? " planted-row" : ""}\`} />;\nel.classList.add("planted-narrow");`;
    expect(unusedClasses(sheet, [source])).toEqual([]);
  });
  it("a comment, a selector string, a longer word and a string that sets no class do not render a class", () => {
    const source = `${shell}\n// planted-part "planted-part"\n/* "planted-row" */\nel.closest(".planted-part");\nconst d = <i className="planted-part-more xplanted-row planted-narrower" aria-label="planted-part" data-x="planted-row" />;\nusePopup("planted-narrow");`;
    expect(unusedClasses(sheet, [source])).toEqual(["shell/x.css: .planted-narrow", "shell/x.css: .planted-part", "shell/x.css: .planted-row"]);
  });
  it("a run-time class counts only with a family, and only for the family's values", () => {
    const css = { "shell/x.css": ".astraeus-shell .kind-one { top: 0; } .astraeus-shell .kind-gone { top: 0; }" };
    const source = `${shell}\nconst e = <i className={\`kind kind-\${kind}\`} />;`;
    expect(unusedClasses(css, [source], {})).toEqual(["shell/x.css: .kind-gone", "shell/x.css: .kind-one"]);
    expect(unusedClasses(css, [source], { "kind-": { values: ["one"], from: "x.ts" } })).toEqual(["shell/x.css: .kind-gone"]);
    expect(unusedClasses(css, [shell], { "kind-": { values: ["one"], from: "x.ts" } })).toEqual(["shell/x.css: .kind-gone", "shell/x.css: .kind-one"]);
  });
  it("a class set by a property, a default, an assignment or a carrier line is rendered", () => {
    const source = `${shell}\nconst common = { className: "planted-part" };\nfunction Part({ className = "planted-row" }) {}\nelement.className = \`planted-narrow \${more}\`;`;
    expect(unusedClasses(sheet, [source])).toEqual([]);
    expect(literalsOf('make(label, "planted-part");', ["make("]).literals).toEqual([{ text: "planted-part", isClass: true }]);
    expect(literalsOf('make(label, "planted-part");', []).literals).toEqual([{ text: "planted-part", isClass: false }]);
  });
  it("an allowlisted class is let through", () => {
    expect(unusedClasses(sheet, [shell], {}, { "planted-part": "a reason", "planted-row": "a reason" })).toEqual(["shell/x.css: .planted-narrow"]);
  });
  it("a token nothing reads is named; a read token and a host token are not", () => {
    const look = ".astraeus-shell { --astraeus-planted: 1px; --astraeus-read: 2px; --astraeus-accent: #fff; }";
    expect(unusedTokens(look, [look, ".a { top: var(--astraeus-read); }"])).toEqual(["--astraeus-planted"]);
  });
  it("a stylesheet imported by a component, or a second sheet imported by an entry file, is named", () => {
    const sources = { "api/mount.ts": 'import "../app/style.css";\nimport "../shell/bar/bar.css";', "api/AstraeusScene.tsx": 'import "../app/style.css";', "shell/bar/Bar.tsx": 'import "./bar.css";\nconst a = "not.css in a sentence";', "shell/Late.tsx": 'await import("./late.css");' };
    expect(strayStyleImports(sources)).toEqual(["api/mount.ts: ../shell/bar/bar.css", "shell/bar/Bar.tsx: ./bar.css", "shell/Late.tsx: ./late.css"]);
    expect(strayStyleImports({ "api/mount.ts": 'import "../app/style.css";' })).toEqual([]);
  });
  it("a sheet the one stylesheet does not load is named, and the one stylesheet when nothing imports it", () => {
    const sheets = { "app/style.css": '/* @import "../shell/x/commented.css"; */\n@import "../shell/look/look.css";\n.a { top: 0; }', "shell/look/look.css": "", "shell/x/commented.css": "", "shell/x/left-out.css": "" };
    expect(unloadedSheets(sheets, true)).toEqual(["shell/x/commented.css", "shell/x/left-out.css"]);
    expect(unloadedSheets(sheets, false)).toEqual(["app/style.css", "shell/x/commented.css", "shell/x/left-out.css"]);
  });
  it("an unterminated template is reported by the reader", () => {
    expect(literalsOf("const a = `open ${b} never closed;").closed).toBe(false);
    expect(literalsOf("const a = `shut ${b ? `in` : \"x\"}`; // `").closed).toBe(true);
  });
});
