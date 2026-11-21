// The look drift check (viewer-interface note, section 9; O-079 T-330). Every raw colour and size of the interface lives in `shell/look/look.css`; every other
// interface stylesheet reads the tokens. This test scans each `.css` under `src/shell` and `src/shelf`, `src/app/style.css`, and the `style={…}` objects of the `.tsx`
// files under those folders, and fails on a typed colour, a length other than 0 and 1px, a z-index that is not a layer token, or an `@media` outside `areas.css`.
// It allows var(--astraeus-*), calc(), color-mix() of tokens, %, fr, unitless numbers and the viewer-relative units cqw and cqh (the viewer's own size). A breakpoint
// in an `@container` condition is not a drawn size and is not scanned. There is no allowlist.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "src");
const LOOK = "shell/look/look.css";
const AREAS = "shell/areas/areas.css";

const NAMED_COLOURS = new Set(("aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen").split(" "));

/** One thing wrong: where and what. */
export interface Finding { readonly where: string; readonly problem: string }

const LENGTH = /(?<![\w.#-])-?(\d*\.?\d+)(px|em|rem|ch|ex|vw|vh|vmin|vmax|dvh|dvw|svh|svw|lvh|lvw|pt|pc|cm|mm|in)\b/g;
const COLOUR_FUNCTION = /\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(/i;
const HEX = /#[0-9a-fA-F]{3,8}\b/;

/** Removes comments, and the text of `url(...)` and strings (a data URI may hold a colour; the one place for it is look.css). */
function plain(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/url\([^)]*\)/g, "url()").replace(/"[^"]*"|'[^']*'/g, '""');
}

interface Block { readonly prelude: string; readonly declarations: readonly string[] }

/** Splits sheet text into blocks: each `{ … }` with its prelude and its own declarations (nested blocks are their own entries). */
function blocks(css: string): Block[] {
  const out: Block[] = [];
  const stack: { prelude: string; text: string }[] = [];
  let chunk = "";
  const flush = () => {
    const top = stack.at(-1);
    if (top !== undefined) top.text += chunk;
    chunk = "";
  };
  for (const ch of css) {
    if (ch === "{") {
      const top = stack.at(-1);
      const lastSemi = chunk.lastIndexOf(";");
      if (top !== undefined && lastSemi >= 0) { top.text += chunk.slice(0, lastSemi + 1); chunk = chunk.slice(lastSemi + 1); }
      stack.push({ prelude: chunk.trim(), text: "" });
      chunk = "";
    } else if (ch === "}") {
      flush();
      const done = stack.pop();
      if (done !== undefined) out.push({ prelude: done.prelude, declarations: done.text.split(";").map((d) => d.trim()).filter((d) => d !== "") });
      chunk = "";
    } else chunk += ch;
  }
  return out;
}

/** What is wrong with one declaration value (property `name`). */
function valueProblems(name: string, value: string): string[] {
  const problems: string[] = [];
  const stripped = value.replace(/var\(--[\w-]+/g, "var(");
  if (name === "z-index") {
    if (!/^var\(--astraeus-layer-[a-z]+\)$/.test(value.trim())) problems.push(`z-index must be a var(--astraeus-layer-*) token, got ${value.trim()}`);
    return problems;
  }
  if (HEX.test(stripped)) problems.push(`typed hex colour in "${name}: ${value.trim()}"`);
  if (COLOUR_FUNCTION.test(stripped)) problems.push(`typed colour function in "${name}: ${value.trim()}"`);
  if (/^(color|background|background-color|border|border-\w+|outline|fill|stroke|box-shadow|text-shadow|accent-color|caret-color|filter|--[\w-]+)$/.test(name) || /color/.test(name)) {
    for (const word of stripped.toLowerCase().match(/[a-z]+/g) ?? []) if (NAMED_COLOURS.has(word)) problems.push(`named colour "${word}" in "${name}: ${value.trim()}"`);
  }
  for (const match of stripped.matchAll(LENGTH)) {
    const number = Number(match[1]);
    const unit = match[2];
    if (number === 0 || (number === 1 && unit === "px" && !match[0].startsWith("-"))) continue;
    problems.push(`typed length ${match[0]} in "${name}: ${value.trim()}"`);
  }
  return problems;
}

/** Everything the drift rules flag in one stylesheet's text. `file` is its path under `src`, `look.css` is exempt from value rules, `areas.css` from the `@media` rule. */
export function cssFindings(file: string, css: string): Finding[] {
  const findings: Finding[] = [];
  for (const block of blocks(plain(css))) {
    if (block.prelude.startsWith("@media") && file !== AREAS) findings.push({ where: file, problem: `@media outside ${AREAS}: ${block.prelude}` });
    if (file === LOOK) continue;
    for (const declaration of block.declarations) {
      const colon = declaration.indexOf(":");
      if (colon < 0) continue;
      const name = declaration.slice(0, colon).trim();
      for (const problem of valueProblems(name, declaration.slice(colon + 1))) findings.push({ where: `${file} (${block.prelude.slice(0, 60)})`, problem });
    }
  }
  return findings;
}

/** Findings in the `style={{ … }}` objects of a `.tsx` file: a typed colour or length as a string value. */
export function styleObjectFindings(file: string, source: string): Finding[] {
  const findings: Finding[] = [];
  for (const match of source.matchAll(/style=\{\{([^}]*)\}\}/g)) {
    const text = match[1] ?? "";
    for (const entry of text.split(",")) {
      const colon = entry.indexOf(":");
      if (colon < 0) continue;
      const name = entry.slice(0, colon).trim().replace(/["']/g, "");
      const value = entry.slice(colon + 1).replace(/\$\{[^}]*\}/g, "");
      for (const problem of valueProblems(name, value)) findings.push({ where: file, problem });
    }
  }
  return findings;
}

function walk(dir: string, extension: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path, extension) : name.endsWith(extension) ? [path] : [];
  });
}

const rel = (path: string): string => relative(SRC, path).split("\\").join("/");
const SHEETS = [...walk(join(SRC, "shell"), ".css"), ...walk(join(SRC, "shelf"), ".css"), join(SRC, "app", "style.css")];
const SOURCES = [...walk(join(SRC, "shell"), ".tsx"), ...walk(join(SRC, "shelf"), ".tsx")];

describe("look drift: every raw colour and size lives in the look module", () => {
  it("finds the look module and the areas sheet", () => {
    expect(SHEETS.map(rel)).toEqual(expect.arrayContaining([LOOK, AREAS]));
  });

  it("flags no typed colour, length, z-index or @media outside the look module and the areas sheet", () => {
    const findings = SHEETS.flatMap((path) => cssFindings(rel(path), readFileSync(path, "utf8")));
    expect(findings).toEqual([]);
  });

  it("flags no typed colour or length in a style object of the interface components", () => {
    expect(SOURCES.flatMap((path) => styleObjectFindings(rel(path), readFileSync(path, "utf8")))).toEqual([]);
  });

  it("the look module itself holds the raw values (it is not empty of them)", () => {
    const look = readFileSync(join(SRC, LOOK), "utf8");
    expect(look).toMatch(/--astraeus-accent: #/);
    expect(look).toMatch(/--astraeus-space-4: 8px/);
  });
});

describe("the drift rules see what they must (samples that must trip them)", () => {
  const trips = (css: string, file = "shell/x.css") => cssFindings(file, css).length > 0;
  it("a typed hex, rgb, hsl or named colour", () => {
    expect(trips(".a { color: #fff; }")).toBe(true);
    expect(trips(".a { background: rgba(0, 0, 0, .5); }")).toBe(true);
    expect(trips(".a { border-color: hsl(10, 10%, 10%); }")).toBe(true);
    expect(trips(".a { color: red; }")).toBe(true);
    expect(trips(".a { box-shadow: 0 0 var(--astraeus-space-2) white; }")).toBe(true);
  });
  it("a typed length, in a value, in calc and in a custom property", () => {
    expect(trips(".a { padding: 8px; }")).toBe(true);
    expect(trips(".a { width: calc(100% - 12px); }")).toBe(true);
    expect(trips(".a { max-width: 90vw; }")).toBe(true);
    expect(trips(".a { letter-spacing: .1em; }")).toBe(true);
    expect(trips(".a { --x: 5px; }")).toBe(true);
  });
  it("a z-index that is not a layer token, and an @media outside the areas sheet", () => {
    expect(trips(".a { z-index: 5; }")).toBe(true);
    expect(trips("@media (max-width: 700px) { .a { color: var(--astraeus-text); } }")).toBe(true);
    expect(trips("@media (max-width: 700px) { .a { color: var(--astraeus-text); } }", AREAS)).toBe(false);
  });
  it("a style object with a typed value", () => {
    expect(styleObjectFindings("shell/X.tsx", 'const a = <div style={{ color: "#fff", width: "10px" }} />;').length).toBe(2);
  });
  it("lets the tokens, calc of tokens, zero, 1px, percent and viewer units through", () => {
    expect(trips(".a { padding: var(--astraeus-space-4) 0; border: 1px solid var(--astraeus-border); width: calc(100% - var(--astraeus-space-5)); max-width: 90cqw; z-index: var(--astraeus-layer-bar); color: color-mix(in srgb, var(--astraeus-text) 40%, transparent); background: transparent; }")).toBe(false);
    expect(trips("@container astraeus-viewer (max-width: 900px) { .a { gap: var(--astraeus-space-2); } }")).toBe(false);
  });
  it("lets the look module hold raw values", () => {
    expect(trips(".astraeus-shell { --astraeus-accent: #e8b06a; --astraeus-space-4: 8px; }", LOOK)).toBe(false);
  });
});
