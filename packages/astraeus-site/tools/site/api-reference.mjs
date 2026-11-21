// The developer API reference (O-040 T-165): read from the engine's public entry (packages/astraeus/src/api/index.ts) with the TypeScript compiler API and
// its doc comments, then written as one static page served at /api. TypeDoc was not used: it adds a dependency for what the compiler API already gives, and
// this runs on the same side-by-side TypeScript 6 the lint gate uses (`typescript6`, package.json; the root `typescript` is 7, which has no such API).
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript6";

const here = dirname(fileURLToPath(import.meta.url));
/** The public entry of the `.` export of `astraeus`. */
export const PUBLIC_ENTRY = resolve(here, "..", "..", "..", "astraeus", "src", "api", "index.ts");

const OPTIONS = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  resolveJsonModule: true,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  types: [],
};
const FORMAT = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
const isOwn = (declaration) =>
  !/node_modules|[\\/]typescript6?[\\/]lib[\\/]/.test(declaration.getSourceFile().fileName);

const text = (parts) => ts.displayPartsToString(parts).trim();
const privateName = (name) => name.startsWith("#") || name.startsWith("__#");

/** A signature as the compiler reads it, whatever the source layout: whitespace runs are one space, a separator or trailing comma before a closing brace is dropped, and a leading `|` of a multi-line union is dropped. */
const layoutFree = (text) => text.replace(/\s+/g, " ").replace(/[;,]\s*}/g, " }");

function describeMembers(checker, type, at) {
  return type
    .getProperties()
    .filter(
      (property) =>
        !privateName(property.name) &&
        (property.declarations ?? []).some(isOwn) &&
        !(
          ts.getCombinedModifierFlags(property.declarations[0]) &
          (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)
        ),
    )
    .map((property) => {
      const declaration = property.declarations[0];
      const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
      const calls = propertyType.getCallSignatures();
      const isMethod = property.flags & ts.SymbolFlags.Method;
      return {
        name: property.name,
        optional: (property.flags & ts.SymbolFlags.Optional) !== 0,
        signature:
          isMethod && calls.length > 0
            ? calls.map((signature) => checker.signatureToString(signature, at, FORMAT)).join("\n")
            : checker.typeToString(propertyType, at, FORMAT),
        method: Boolean(isMethod),
        doc: text(property.getDocumentationComment(checker)),
      };
    });
}

function kindOf(target, declaration) {
  if (target.flags & ts.SymbolFlags.Class) return "class";
  if (target.flags & ts.SymbolFlags.Interface) return "interface";
  if (target.flags & ts.SymbolFlags.TypeAlias) return "type";
  if (target.flags & ts.SymbolFlags.Function) return "function";
  return declaration && ts.isVariableDeclaration(declaration) ? "const" : "other";
}

/**
 * Every export of `entry`, in source order: [{ name, kind, doc, examples, signature, members, constructors }]. `doc` is empty when the export has no doc comment.
 * `shelf` is true when its doc comment carries `@shelf` (a story-component shelf factory, O-080); `module` is the declaring file relative to the engine's `src` (`shelf/panel/factory.ts`); `kind` is class, interface, type, function or const; a const whose type is `BodyRef` is a ready-made body (`body: true`).
 */
export function collectExports(entry = PUBLIC_ENTRY) {
  const program = ts.createProgram([entry], OPTIONS);
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const module = checker.getSymbolAtLocation(source);
  if (module === undefined) throw new Error(`${entry} has no exports`);
  return checker.getExportsOfModule(module).map((exported) => {
    const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const declaration = target.declarations?.[0];
    const kind = kindOf(target, declaration);
    const entryNode = declaration ?? source;
    const out = {
      name: exported.name,
      kind,
      doc: text(target.getDocumentationComment(checker)),
      examples: target
        .getJsDocTags(checker)
        .filter((tag) => tag.name === "example")
        .map((tag) => text(tag.text ?? [])),
      shelf: target.getJsDocTags(checker).some((tag) => tag.name === "shelf"),
      module:
        declaration === undefined
          ? ""
          : relative(dirname(dirname(entry)), declaration.getSourceFile().fileName)
              .split(sep)
              .join("/"),
      signature: "",
      members: [],
      constructors: [],
      body: false,
    };
    if (kind === "class" || kind === "interface") {
      const declared = checker.getDeclaredTypeOfSymbol(target);
      out.members = describeMembers(checker, declared, entryNode);
      if (kind === "class")
        out.constructors = checker
          .getTypeOfSymbolAtLocation(target, entryNode)
          .getConstructSignatures()
          .map((signature) => checker.signatureToString(signature, entryNode, FORMAT).replace(/:\s*\w+$/, ""));
      if (kind === "interface")
        out.signature =
          declared
            .getBaseTypes()
            ?.map((base) => checker.typeToString(base))
            .join(", ") ?? "";
    } else if (kind === "type") {
      out.signature = ts.isTypeAliasDeclaration(declaration)
        ? layoutFree(declaration.type.getText()).replace(/^\| /, "")
        : "";
    } else if (kind === "function") {
      out.signature = layoutFree(
        checker
          .getTypeOfSymbolAtLocation(target, entryNode)
          .getCallSignatures()
          .map((signature) => `${exported.name}${checker.signatureToString(signature, entryNode, FORMAT)}`)
          .join("\n"),
      );
    } else {
      out.signature = checker.typeToString(checker.getTypeOfSymbolAtLocation(target, entryNode), entryNode, FORMAT);
      out.body = out.signature === "BodyRef";
    }
    return out;
  });
}

/** The names of the exports of `entry` that have no doc comment. */
export const undocumentedExports = (entry = PUBLIC_ENTRY) =>
  collectExports(entry)
    .filter((item) => item.doc === "")
    .map((item) => item.name);

const escape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Doc text with `code` spans turned into <code>. */
const prose = (value) => escape(value).replace(/`([^`]+)`/g, "<code>$1</code>");
const slug = (name) => name.toLowerCase();
const code = (value) => `<pre><code>${escape(value)}</code></pre>`;

function renderMembers(members) {
  if (members.length === 0) return "";
  const rows = members
    .map(
      (member) =>
        `<tr><td><code>${escape(member.name)}${member.optional ? "?" : ""}</code></td><td><code>${escape(member.signature)}</code></td><td>${prose(member.doc)}</td></tr>`,
    )
    .join("");
  return `<div class="scroll"><table><thead><tr><th>Name</th><th>Type</th><th>What it does</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/**
 * An interface that extends others on the page lists only its own members, under a link to each base, so a member is written once (O-079 T-332: `MountedScene`
 * repeated all of `ViewerHandle`). A member counts as the base's when its name, type and text are the same there; one the interface restates differently stays.
 */
function ownMembers(item, byName) {
  const bases =
    item.kind === "interface" && item.signature !== ""
      ? item.signature
          .split(", ")
          .map((name) => byName.get(name))
          .filter((base) => base !== undefined && base !== item)
      : [];
  if (bases.length === 0) return { bases, members: item.members };
  const same = (a, b) =>
    a.name === b.name && a.optional === b.optional && a.signature === b.signature && a.doc === b.doc;
  return {
    bases,
    members: item.members.filter(
      (member) => !bases.some((base) => base.members.some((inherited) => same(inherited, member))),
    ),
  };
}

function renderItem(item, byName = new Map()) {
  const head = `<h3 id="${slug(item.name)}"><code>${escape(item.name)}</code> <small>${item.kind}</small></h3>`;
  const parts = [head, `<p>${prose(item.doc)}</p>`];
  const { bases, members } = ownMembers(item, byName);
  if (bases.length > 0)
    parts.push(
      `<p>Has every member of ${bases.map((base) => `<a href="#${slug(base.name)}"><code>${escape(base.name)}</code></a>`).join(" and ")}${members.length > 0 ? ", and its own:" : "."}</p>`,
    );
  if (item.constructors.length > 0)
    parts.push(code(item.constructors.map((signature) => `new ${item.name}${signature}`).join("\n")));
  if (item.kind === "function" || item.kind === "type")
    parts.push(code(item.kind === "type" ? `type ${item.name} = ${item.signature}` : item.signature));
  if (item.kind === "const") parts.push(code(`const ${item.name}: ${item.signature}`));
  parts.push(renderMembers(members));
  for (const example of item.examples) parts.push(`<p class="eg">Example</p>${code(example)}`);
  return `<section class="item">${parts.join("")}</section>`;
}

const SECTIONS = [
  [
    "Scene",
    "Build a scene",
    (item) =>
      [
        "Scene",
        "SceneCamera",
        "AddBodyOptions",
        "ElementsBodyRecord",
        "SwitchesInput",
        "ViewsOptions",
        "ViewInput",
        "ViewCameraInput",
        "AnchorInput",
        "ReadoutInput",
        "TimeInput",
        "TrajectoryInput",
        "TrajectorySampleInput",
        "FollowView",
      ].includes(item.name),
  ],
  [
    "Groups",
    "Groups of dots and activity",
    (item) =>
      [
        "GroupInput",
        "GroupOrbitInput",
        "GroupClumpInput",
        "GroupReadoutInput",
        "ActivityInput",
        "ActivitySampleInput",
        "ActivitySourceInput",
      ].includes(item.name),
  ],
  [
    "Story",
    "Story: events, panels and the timeline",
    (item) =>
      [
        "EventInput",
        "AddEventsOptions",
        "StoryPanelInput",
        "StoryPanelAt",
        "StoryPanelPlaybackInput",
        "TimelineInput",
      ].includes(item.name),
  ],
  [
    "Draw it",
    "Draw it",
    (item) => ["mount", "MountOptions", "MountedScene", "AstraeusScene", "AstraeusSceneProps"].includes(item.name),
  ],
  [
    "Data packages",
    "Data packages",
    (item) => ["DataSource", "MoonPositions", "Pictures", "TextureRef", "AssetLicence"].includes(item.name),
  ],
  [
    "Scale and state",
    "Scale and state",
    (item) => ["trueScale", "readableScale", "solarSystemScale", "ScalePolicy", "State"].includes(item.name),
  ],
  ["Provenance", "Provenance", (item) => ["Provenance", "ProvenanceSourceType"].includes(item.name)],
  ["Errors", "Errors", (item) => ["SceneError", "SceneErrorCode"].includes(item.name)],
];

/**
 * The shelf page's exports (O-080 T-336): every export declared under the engine's `src/shelf/` (the `@shelf` factories, their inputs, controls and events, and the
 * descriptor types `PanelPart`, `BlockPart`, `AnyPart`, `ControlFor`). The main page lists them by name only, so it keeps its size however many parts the shelf gains.
 */
export const shelfExports = (items) => items.filter((item) => item.shelf || item.module.startsWith("shelf/"));

/** The page frame both reference pages share: the site's look, inline styles, no script. */
function referencePage({ title, description, canonical, home, heading, lead, nav, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
:root { --bg: #07070a; --raised: #0d0d11; --ink: #f5f5f7; --body: rgba(245, 245, 247, 0.78); --muted: rgba(245, 245, 247, 0.55); --faint: rgba(245, 245, 247, 0.38); --rule: rgba(255, 255, 255, 0.08); --rule-strong: rgba(255, 255, 255, 0.16);
  --sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; --mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace; color-scheme: dark; }
* { box-sizing: border-box; }
html { background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--body); font-family: var(--sans); line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
a { color: var(--ink); text-decoration: none; }
a:focus-visible { outline: 2px solid #ffb347; outline-offset: 3px; border-radius: 6px; }
.wrap { max-width: 920px; margin: 0 auto; padding: 0 max(16px, env(safe-area-inset-left, 0px)); }
.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 60px; }
.brand { font-weight: 600; color: var(--ink); }
.pillink { font-family: var(--mono); font-size: 0.78rem; border: 1px solid var(--rule-strong); border-radius: 999px; padding: 5px 14px; }
h1, h2, h3 { color: var(--ink); margin: 0; font-weight: 600; text-wrap: balance; }
h1 { font-size: clamp(2rem, 6vw, 3rem); letter-spacing: -0.04em; margin-top: 28px; }
h2 { font-size: 1.6rem; letter-spacing: -0.03em; margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--rule); }
h3 { font-size: 1.1rem; display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
h3 small { font-family: var(--mono); font-size: 0.68rem; font-weight: 400; color: var(--faint); letter-spacing: 0.1em; text-transform: uppercase; }
.lead { margin: 14px 0 0; color: var(--body); max-width: 60ch; }
nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
nav a { font-family: var(--mono); font-size: 0.74rem; border: 1px solid var(--rule-strong); border-radius: 999px; padding: 4px 12px; }
.item { margin-top: 28px; min-width: 0; }
.item p { margin: 8px 0 0; }
.names { display: flex; flex-wrap: wrap; gap: 6px; }
code { font-family: var(--mono); font-size: 0.84em; }
p code, td code { color: var(--ink); }
pre { margin: 12px 0 0; padding: 14px 16px; background: var(--raised); border: 1px solid var(--rule); border-radius: 12px; overflow-x: auto; font-size: 0.8rem; line-height: 1.7; color: var(--muted); }
.eg { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--faint); margin-top: 14px; }
.scroll { overflow-x: auto; margin-top: 12px; }
table { border-collapse: collapse; width: 100%; font-size: 0.86rem; }
th, td { text-align: left; vertical-align: top; padding: 8px 12px 8px 0; border-bottom: 1px solid var(--rule); }
th { font-family: var(--mono); font-size: 0.68rem; font-weight: 500; color: var(--faint); letter-spacing: 0.1em; text-transform: uppercase; }
td:nth-child(2) code { color: var(--muted); }
footer { margin: 64px 0 40px; color: var(--faint); font-size: 0.85rem; }
footer a { border-bottom: 1px solid var(--rule-strong); }
</style>
</head>
<body>
<div class="wrap">
<header class="top"><a class="brand" href="${home}">Astraeus</a><span><a class="pillink" href="${home}">Home</a> <a class="pillink" href="https://github.com/anipatke/Astraeus">GitHub</a></span></header>
<main>
<h1>${heading}</h1>
<p class="lead">${lead}</p>
<nav aria-label="Sections">${nav}</nav>
${body}
</main>
<footer>Generated from <code>packages/astraeus/src/api/index.ts</code>. <a href="https://www.npmjs.com/package/astraeus">astraeus on npm</a></footer>
</div>
</body>
</html>
`;
}

/** The reference page for `items` (from `collectExports`): one built page with the site's look, inline styles, no script. The shelf parts' own exports (`shelfExports`) are listed by name only, each a link to `api/shelf.html` (`renderShelfApiPage`). */
export function renderApiPage(items) {
  const byName = new Map(items.map((item) => [item.name, item]));
  const shelf = new Set(shelfExports(items));
  const bodies = items.filter((item) => item.body);
  const rest = items.filter((item) => !item.body && !shelf.has(item));
  const taken = new Set();
  const sections = SECTIONS.map(([id, title, wants]) => {
    const mine = rest.filter((item) => wants(item));
    mine.forEach((item) => taken.add(item.name));
    return { id, title, items: mine };
  });
  const others = rest.filter((item) => !taken.has(item.name));
  if (others.length > 0) sections.push({ id: "Other", title: "Other exports", items: others });
  const bodyList = `<section class="item"><h3 id="bodies">Ready-made bodies <small>${bodies.length} constants</small></h3><p>Each is a <code>BodyRef</code> for <code>scene.addBody</code>; a moon also names the data package it needs.</p><p class="names">${bodies.map((body) => `<code>${escape(body.name)}</code>`).join(" ")}</p>${renderMembers(items.find((item) => item.name === "BodyRef")?.members ?? [])}</section>`;
  const nav = [
    ...sections.map((section) => `<a href="#${slug(section.id)}">${escape(section.title)}</a>`),
    `<a href="#bodies">Bodies</a>`,
  ].join("");
  const body = sections
    .map(
      (section) =>
        `<h2 id="${slug(section.id)}">${escape(section.title)}</h2>${section.items.map((item) => renderItem(item, byName)).join("")}`,
    )
    .join("");
  const shelfList =
    shelf.size === 0
      ? ""
      : `<h2 id="shelf">Shelf parts</h2><section class="item"><p>Ready-made story parts for <code>scene.addParts</code> and their controls from <code>handle.part</code>: ${shelf.size} names, on <a href="shelf.html">their own page</a>. See them run in the <a href="../components.html">parts catalogue</a>.</p><p class="names">${[...shelf].map((item) => `<a href="shelf.html#${slug(item.name)}"><code>${escape(item.name)}</code></a>`).join(" ")}</p></section>`;
  return referencePage({
    title: "Astraeus API reference",
    description:
      "Every public call, option and the React component of the astraeus npm package, generated from its types and doc comments.",
    canonical: "https://astraeus.anipatke.com/api/",
    home: "../",
    heading: "API reference",
    lead: `Everything the <code>astraeus</code> npm package exports: ${items.length} names, read from its types and doc comments when the site is built. Anything not listed here is internal. The package is a 0.2 preview, so the API may still change between <code>0.x</code> versions; each change is in the <a href="https://github.com/anipatke/Astraeus/blob/main/packages/astraeus/CHANGELOG.md">changelog</a>.`,
    nav: shelf.size === 0 ? nav : `${nav}<a href="#shelf">Shelf parts</a>`,
    body: `${body}\n${shelfList}\n${bodyList}`,
  });
}

/** The shelf parts' reference page (`api/shelf.html`, O-080 T-336): the `@shelf` factories, then the inputs, controls and events only they use (`shelfExports`). */
export function renderShelfApiPage(items) {
  const byName = new Map(items.map((item) => [item.name, item]));
  const shelf = shelfExports(items);
  const sections = [
    { id: "parts", title: "Parts", items: shelf.filter((item) => item.shelf) },
    { id: "types", title: "Inputs, controls and events", items: shelf.filter((item) => !item.shelf) },
  ];
  return referencePage({
    title: "Astraeus shelf parts API",
    description:
      "The ready-made story parts of the astraeus npm package: factories, inputs, controls and events, generated from its types and doc comments.",
    canonical: "https://astraeus.anipatke.com/api/shelf.html",
    home: "../",
    heading: "Shelf parts API",
    lead: `The story parts an app adds with <code>scene.addParts</code> and drives with <code>handle.part</code>: ${shelf.length} names, read from the package's types and doc comments when the site is built. <code>Scene</code>, <code>ViewerHandle</code> and the rest are on the <a href="./">API reference</a>; each part runs on the <a href="../components.html">parts catalogue</a>.`,
    nav: sections.map((section) => `<a href="#${section.id}">${escape(section.title)}</a>`).join(""),
    body: sections
      .map(
        (section) =>
          `<h2 id="${section.id}">${escape(section.title)}</h2>${section.items.map((item) => renderItem(item, byName)).join("")}`,
      )
      .join(""),
  });
}

/** The finished page for the engine's public entry. */
export const buildApiPage = (entry = PUBLIC_ENTRY) => renderApiPage(collectExports(entry));

/** Both finished pages from one read of the entry: `api/index.html` and `api/shelf.html`. */
export function buildApiPages(entry = PUBLIC_ENTRY) {
  const items = collectExports(entry);
  return { index: renderApiPage(items), shelf: renderShelfApiPage(items) };
}
