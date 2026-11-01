// Checks for the API rules on shape, errors, settings and page isolation (O-053 T-229; Guardrails API-03 to API-06). Each function returns the breaks it finds as
// `{ rule, site }` objects; a test compares them with an allowlist next to it, so a new break fails and a fixed one must be taken off the list.
// The type lint reads the public entry with the same compiler read as the surface lock (tools/api-surface.mjs).
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import ts from "typescript6";
import { PUBLIC_ENTRY } from "../packages/astraeus-site/tools/site/api-reference.mjs";
import { isOwnFile, OPTIONS, privateName, REPO_ROOT } from "./api-surface.mjs";

export const ENGINE_SRC = join(REPO_ROOT, "packages", "astraeus", "src");
const rel = (file, base = ENGINE_SRC) => relative(base, file).split("\\").join("/");
const oneLine = (text, max = 90) => { const flat = text.replace(/\s+/g, " ").trim(); return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat; };

// ---------- Public-type lint (API-04) ----------

/** A numeric field's name must end in one of these (a unit), or be on the unitless list. */
export const UNIT_SUFFIX = /(Km|KmS|Km3S2|Deg|Degrees|Px|Ms|Seconds|Minutes|Hours|Days|Years|EarthRadii|Au|Rad|Hz|Fps|Kg|Metres|Jd|JdTdb|Fraction)$|^(km|jd|au|deg|px|ms)$/;
const TIME_LIKE = /^(time|at|from|to|start|end|until|since|when|utc|date|moment)$|(Time|Utc|Date|Moment)$/;
const FRAME_LIKE = /^frame$|Frame$|^referenceSystem$|^coordinateSystem$/;

/** The name a declaration is reported under: `Type`, `Type.field`, `Type.method(param)`. */
const NAMED_DECLARATION = [ts.isInterfaceDeclaration, ts.isClassDeclaration, ts.isTypeAliasDeclaration, ts.isFunctionDeclaration];
const MEMBER_DECLARATION = [ts.isPropertySignature, ts.isPropertyDeclaration, ts.isMethodSignature, ts.isMethodDeclaration, ts.isGetAccessorDeclaration, ts.isSetAccessorDeclaration];
const SIGNATURE_DECLARATION = [ts.isCallSignatureDeclaration, ts.isConstructSignatureDeclaration, ts.isFunctionTypeNode, ts.isConstructorDeclaration];
const matches = (list, node) => list.some((is) => is(node));
function ownerName(node) {
  for (let at = node; at !== undefined; at = at.parent) {
    if (matches(NAMED_DECLARATION, at)) return at.name?.text ?? "anonymous";
    if (ts.isVariableDeclaration(at)) return at.name.getText();
    if (matches(MEMBER_DECLARATION, at)) return `${ownerName(at.parent)}.${at.name.getText()}`;
    if (ts.isParameter(at)) return `${ownerName(at.parent)}(${at.name.getText()})`;
    if (matches(SIGNATURE_DECLARATION, at)) return `${ownerName(at.parent)}${ts.isConstructorDeclaration(at) ? ".constructor" : ""}`;
  }
  return "anonymous";
}

/**
 * Breaks of the shape rules over every type reachable from the root export: `unit` (a number without a unit in its name), `centre` (the spelling), `time` (a moment not typed
 * `TimeInput`), `span` (a span not written `{ start, end }`), `frame` (a frame field not named `plane`), `loose` (`unknown` or `any` in a public type).
 * `site` is `Type.field`; `unit` and `time` also name the field's type so an allowlist entry cannot hide a different break.
 */
export function publicTypeBreaks(entry = PUBLIC_ENTRY) {
  const program = ts.createProgram([entry], OPTIONS);
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const breaks = new Map();
  const add = (rule, site, node) => breaks.set(`${rule} ${site}`, { rule, site, file: node === undefined ? undefined : rel(node.getSourceFile().fileName) });
  const seen = new Set();
  const stripped = (type) => (type.isUnion() ? type.types.filter((part) => !(part.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null))) : [type]);
  const isNumber = (type) => { const parts = stripped(type); return parts.length > 0 && parts.every((part) => part.flags & ts.TypeFlags.NumberLike); };
  const numericShape = (type) => {
    const parts = stripped(type);
    if (isNumber(type)) return true;
    return parts.length === 1 && (checker.isArrayType(parts[0]) || checker.isTupleType(parts[0])) && checker.getTypeArguments(parts[0]).length > 0 && checker.getTypeArguments(parts[0]).every(isNumber);
  };
  // `unknown` and `any` are read from the written types of a declaration (a library's own generics, such as `ReactElement<any>`, are not ours to lint); an inline object type is read member by member.
  const KEYWORDS = new Set([ts.SyntaxKind.AnyKeyword, ts.SyntaxKind.UnknownKeyword]);
  const looseIn = (node, owner) => {
    if (node === undefined) return;
    if (KEYWORDS.has(node.kind)) { add("loose", owner, node); return; }
    if (ts.isTypeLiteralNode(node)) return;
    ts.forEachChild(node, (child) => looseIn(child, owner));
  };
  const looseDeclaration = (declaration, owner) => {
    if (ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration) || ts.isVariableDeclaration(declaration) || ts.isTypeAliasDeclaration(declaration)) looseIn(declaration.type, owner);
    else if (declaration.parameters !== undefined) { declaration.parameters.forEach((parameter) => looseIn(parameter.type, `${owner}(${parameter.name.getText()})`)); looseIn(declaration.type, `${owner}()`); }
  };
  const scanSignatures = (type, owner) => {
    for (const signature of [...type.getCallSignatures(), ...type.getConstructSignatures()]) {
      for (const parameter of signature.getParameters()) {
        const parameterType = checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration ?? source);
        if (/centre/i.test(parameter.name)) add("centre", `${owner}(${parameter.name})`);
        visit(parameterType);
      }
      visit(signature.getReturnType());
    }
  };
  const fieldRules = (property, declaration, owner, propertyType) => {
    const name = property.name;
    const written = declaration.type?.getText() ?? checker.typeToString(propertyType);
    if (/centre/i.test(name)) add("centre", owner, declaration);
    if (numericShape(propertyType) && !UNIT_SUFFIX.test(name)) add("unit", `${owner}: ${name}`, declaration);
    if (TIME_LIKE.test(name) && !/\bTimeInput\b/.test(written) && (isNumber(propertyType) || stripped(propertyType).some((part) => part.flags & ts.TypeFlags.StringLike) || /Date/.test(written))) add("time", `${owner}: ${oneLine(written, 60)}`, declaration);
    if (FRAME_LIKE.test(name)) add("frame", owner, declaration);
    looseDeclaration(declaration, owner);
  };
  const spanBreaks = (names, ownerOfType, declared) => {
    if (names.includes("from") && names.includes("to")) add("span", `${ownerOfType}: from/to`, declared);
    const starts = names.filter((n) => /^(start|from|begin)[A-Z]/.test(n));
    const ends = names.filter((n) => /^(end|to|until)[A-Z]/.test(n));
    if (starts.length > 0 && ends.length > 0) add("span", `${ownerOfType}: ${starts[0]}/${ends[0]}`, declared);
  };
  const isOwnMember = (declaration, name) => declaration !== undefined && !privateName(name) && isOwnFile(declaration.getSourceFile().fileName) && !(ts.getCombinedModifierFlags(declaration) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected));
  function visit(type) {
    if (seen.has(type)) return;
    seen.add(type);
    if (type.aliasSymbol !== undefined && !isOwnFile(type.aliasSymbol.declarations?.[0]?.getSourceFile().fileName ?? "")) return;
    type.aliasTypeArguments?.forEach(visit);
    if (type.isUnionOrIntersection()) { type.types.forEach(visit); return; }
    if (!(type.flags & ts.TypeFlags.Object)) return;
    if (type.objectFlags & ts.ObjectFlags.Reference) checker.getTypeArguments(type).forEach(visit);
    const declared = type.symbol?.declarations?.[0];
    if (declared === undefined || !isOwnFile(declared.getSourceFile().fileName)) return;
    for (const property of type.getProperties()) {
      const declaration = property.declarations?.[0];
      if (!isOwnMember(declaration, property.name)) continue;
      const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
      const owner = ownerName(declaration);
      fieldRules(property, declaration, owner, propertyType);
      scanSignatures(propertyType, owner);
      visit(propertyType);
    }
    const ownerOfType = ownerName(declared);
    spanBreaks(type.getProperties().map((p) => p.name), ownerOfType, declared);
    scanSignatures(type, ownerOfType);
    if (type.isClassOrInterface()) checker.getBaseTypes(type).forEach(visit);
  }
  const moduleSymbol = checker.getSymbolAtLocation(source);
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const declaration = target.declarations?.[0];
    if (declaration === undefined) continue;
    if (/centre/i.test(target.name)) add("centre", target.name);
    if (target.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Enum)) {
      const declaredType = checker.getDeclaredTypeOfSymbol(target);
      visit(declaredType);
      if (ts.isTypeAliasDeclaration(declaration)) looseDeclaration(declaration, target.name);
    }
    if (target.flags & ts.SymbolFlags.Value) {
      const valueType = checker.getTypeOfSymbolAtLocation(target, target.valueDeclaration ?? declaration);
      if (ts.isFunctionDeclaration(declaration) || ts.isVariableDeclaration(declaration)) looseDeclaration(declaration, target.name);
      scanSignatures(valueType, target.name);
      visit(valueType);
    }
  }
  // The story panel input is untyped (`panels: unknown[]`), so its moment form cannot be read from a type: read the parser, which takes `at.utc` as ISO text ending in Z only.
  const panels = join(ENGINE_SRC, "shell", "storyPanels.ts");
  if (entry === PUBLIC_ENTRY && /"at\.utc"[\s\S]{0,400}\/Z\$\/\.test\(/.test(readFileSync(panels, "utf8"))) add("time", "StoryPanelsInput.panels: at.utc (ISO text ending in Z only)", source.statements[0]);
  return [...breaks.values()].sort((a, b) => `${a.rule} ${a.site}`.localeCompare(`${b.rule} ${b.site}`));
}

// ---------- Errors (API-05) ----------

/** The `.ts` files directly in a folder, as absolute paths. */
export const filesIn = (dir) => readdirSync(dir).filter((name) => /\.tsx?$/.test(name)).sort().map((name) => join(dir, name));

/** Breaks where something thrown from `dir` is not a `SceneError`, or an error is recognised by its message text. Each is `{ rule: "throw" | "message", site: "file: source text" }`. */
export function errorBreaks(dir = join(ENGINE_SRC, "api")) {
  const program = ts.createProgram(filesIn(dir), OPTIONS);
  const checker = program.getTypeChecker();
  const breaks = new Map();
  const add = (rule, file, node) => breaks.set(`${rule} ${rel(file.fileName, dir)}: ${oneLine(node.getText(file))}`, { rule, site: `${rel(file.fileName, dir)}: ${oneLine(node.getText(file))}` });
  const isSceneError = (type) => type.getSymbol()?.name === "SceneError";
  // A rethrow passes on what was caught: the catch variable, or an `unknown` parameter of a rejection handler. It adds no error of its own, so it is not judged here.
  const isCaught = (identifier) => {
    const declaration = checker.getSymbolAtLocation(identifier)?.declarations?.[0];
    if (declaration === undefined) return false;
    if (ts.isVariableDeclaration(declaration) && ts.isCatchClause(declaration.parent)) return true;
    return ts.isParameter(declaration) && (checker.getTypeAtLocation(declaration).flags & ts.TypeFlags.Unknown) !== 0;
  };
  const allowed = (thrown) => {
    if (ts.isParenthesizedExpression(thrown)) return allowed(thrown.expression);
    if (ts.isBinaryExpression(thrown) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken].includes(thrown.operatorToken.kind)) return allowed(thrown.left) && allowed(thrown.right);
    if (ts.isConditionalExpression(thrown)) return allowed(thrown.whenTrue) && allowed(thrown.whenFalse);
    if (ts.isIdentifier(thrown) && isCaught(thrown)) return true;
    return isSceneError(checker.getNonNullableType(checker.getTypeAtLocation(thrown)));
  };
  const MATCHERS = new Set(["startsWith", "endsWith", "includes", "indexOf", "match", "matchAll", "search", "test", "exec"]);
  const mentionsMessage = (node) => { let found = false; const walk = (n) => { if (ts.isPropertyAccessExpression(n) && n.name.text === "message") found = true; else ts.forEachChild(n, walk); }; walk(node); return found; };
  for (const file of program.getSourceFiles().filter((f) => dir === dirname(f.fileName))) {
    const visit = (node) => {
      if (ts.isThrowStatement(node) && node.expression !== undefined) {
        const thrown = node.expression;
        const ok = allowed(thrown);
        if (!ok) add("throw", file, node);
      }
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && MATCHERS.has(node.expression.name.text)
        && (mentionsMessage(node.expression.expression) || node.arguments.some(mentionsMessage))) add("message", file, node);
      if (ts.isBinaryExpression(node) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(node.operatorToken.kind)
        && (mentionsMessage(node.left) || mentionsMessage(node.right)) && !/null|undefined/.test(node.left.getText(file) + node.right.getText(file))) add("message", file, node);
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  return [...breaks.values()].sort((a, b) => `${a.rule} ${a.site}`.localeCompare(`${b.rule} ${b.site}`));
}

/** `[{ code, meaning }]` read from the doc comment of each member of `SceneErrorCode` in `errors.ts`. A member without a comment has an empty meaning. */
export function errorCodes(file = join(ENGINE_SRC, "api", "errors.ts")) {
  const text = readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true);
  const codes = [];
  const find = (node) => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === "SceneErrorCode" && ts.isUnionTypeNode(node.type)) {
      let from = node.type.pos; // the doc comment sits before the `|` that opens each member, so read from where the previous member ended
      for (const member of node.type.types) {
        const comments = ts.getLeadingCommentRanges(text, from) ?? [];
        from = member.end;
        const doc = comments.map((range) => text.slice(range.pos, range.end)).filter((c) => c.startsWith("/**")).at(-1) ?? "";
        const meaning = doc.replace(/^\/\*\*|\*\/$/g, "").replace(/^\s*\*\s?/gm, "").replace(/\s+/g, " ").trim();
        codes.push({ code: member.getText(sourceFile).replace(/"/g, ""), meaning });
      }
    } else ts.forEachChild(node, find);
  };
  find(sourceFile);
  return codes;
}

export const ERROR_TABLE_START = "<!-- error-table:start (generated from the SceneErrorCode doc comments in packages/astraeus/src/api/errors.ts by `npm run api:errors`) -->";
export const ERROR_TABLE_END = "<!-- error-table:end -->";
/** The README error table (markdown), one row per `SceneErrorCode`. */
export const errorTable = (codes = errorCodes()) => ["| `code` | Meaning |", "|---|---|", ...codes.map(({ code, meaning }) => `| \`${code}\` | ${meaning.replace(/\|/g, "\\|")} |`)].join("\n");
/** The table between the markers in `readme`, or undefined when the markers are missing. */
export function readmeErrorTable(readme) {
  const start = readme.indexOf(ERROR_TABLE_START);
  const end = readme.indexOf(ERROR_TABLE_END);
  return start < 0 || end < start ? undefined : readme.slice(start + ERROR_TABLE_START.length, end).trim();
}

// ---------- Settings mapping (API-06) ----------

/**
 * The page-address parameter names the viewer reads: string literals given to `.get`/`.has`/`.set` on a `URLSearchParams`, and, where a function passes its parameter to `.get`, the literals
 * at that position in its callers (or the literal types the parameter admits). Files are every `.ts`/`.tsx` under `src`.
 */
export function addressParameters(src = ENGINE_SRC) {
  const files = allSources(src);
  const program = ts.createProgram(files, OPTIONS);
  const checker = program.getTypeChecker();
  const found = new Set();
  const own = program.getSourceFiles().filter((f) => f.fileName.startsWith(src) && !f.fileName.endsWith(".d.ts"));
  const isParamsCall = (call) => ts.isPropertyAccessExpression(call.expression) && ["get", "has", "set", "getAll", "delete"].includes(call.expression.name.text) && call.arguments.length > 0
    && (/URLSearchParams/.test(checker.typeToString(checker.getTypeAtLocation(call.expression.expression))) || (ts.isNewExpression(call.expression.expression) && call.expression.expression.expression.getText() === "URLSearchParams"));
  const viaParameter = [];
  for (const file of own) {
    const visit = (node) => {
      if (ts.isCallExpression(node) && isParamsCall(node)) {
        const arg = node.arguments[0];
        if (ts.isStringLiteralLike(arg)) found.add(arg.text);
        else if (ts.isIdentifier(arg)) {
          const declaration = checker.getSymbolAtLocation(arg)?.declarations?.[0];
          if (declaration !== undefined && ts.isParameter(declaration)) {
            const fn = declaration.parent;
            viaParameter.push({ name: fn.name?.getText(), index: fn.parameters.indexOf(declaration) });
            const type = checker.getTypeAtLocation(declaration);
            if (type.isUnion()) type.types.filter((t) => t.isStringLiteral()).forEach((t) => found.add(t.value));
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  for (const file of own) {
    const visit = (node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        for (const via of viaParameter) if (via.name === node.expression.text) { const arg = node.arguments[via.index]; if (arg !== undefined && ts.isStringLiteralLike(arg)) found.add(arg.text); }
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  return [...found].sort();
}

// ---------- Viewer isolation (API-03) ----------

export function allSources(dir, pattern = /\.(ts|tsx)$/) {
  return readdirSync(dir).sort().flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? allSources(path, pattern) : pattern.test(name) && !name.endsWith(".d.ts") ? [path] : [];
  });
}

const literal = (node) => node !== undefined && (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node) || (ts.isJsxExpression(node) && node.expression !== undefined && literal(node.expression)));
const ID_ATTRIBUTES = new Set(["id", "aria-labelledby", "aria-controls", "aria-describedby", "htmlFor"]);
const calledMethod = (node) => (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : undefined);
/** True when `node` writes a fixed element id: a JSX id attribute, `getElementById("…")`, `setAttribute("id", …)` or `.id = …` with a literal that is not built on a `useId()` name. */
function isFixedId(node, usesUseId) {
  if (ts.isJsxAttribute(node)) return ID_ATTRIBUTES.has(node.name.getText()) && literal(node.initializer) && !usesUseId(node.initializer);
  if (calledMethod(node) === "getElementById") return literal(node.arguments[0]);
  if (calledMethod(node) === "setAttribute") return ts.isStringLiteralLike(node.arguments[0] ?? node) && node.arguments[0]?.text === "id" && literal(node.arguments[1]);
  return ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(node.left) && node.left.name.text === "id" && literal(node.right);
}

/** Fixed DOM ids written as literals in `dirs` (relative to src): a JSX `id`, `aria-labelledby`, `aria-controls` or `htmlFor` with a literal, `getElementById("…")`, `.id = "…"`, `setAttribute("id", …)`. Each `{ rule: "id", site: "file: text" }`. */
export function idLiteralBreaks(src = ENGINE_SRC, dirs = ["shell", "app"]) {
  const breaks = new Map();
  for (const dir of dirs) {
    for (const path of allSources(join(src, dir))) {
      const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.ES2022, true, path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      // a name bound to `useId()` makes an id per viewer: a literal that builds on one is not fixed
      const generated = []; const collect = (n) => { if (ts.isVariableDeclaration(n) && n.initializer !== undefined && ts.isCallExpression(n.initializer) && /^(React\.)?useId$/.test(n.initializer.expression.getText())) generated.push(n.name.getText()); ts.forEachChild(n, collect); }; collect(file);
      const usesUseId = (node) => generated.some((name) => new RegExp(`\\b${name}\\b`).test(node.getText()));
      const add = (node) => { const site = `${rel(path, src)}: ${oneLine(node.getText(file))}`; breaks.set(site, { rule: "id", site }); };
      const visit = (node) => {
        if (isFixedId(node, usesUseId)) add(node);
        ts.forEachChild(node, visit);
      };
      visit(file);
    }
  }
  return [...breaks.values()].sort((a, b) => a.site.localeCompare(b.site));
}

/** The selectors of a stylesheet, one per comma-separated part, with at-rules (`@media`) read through: ["a b", "c"]. Keyframe steps and `@font-face` are skipped. */
export function cssSelectors(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  const splitList = (list) => { const parts = []; let depth = 0; let at = 0; for (let i = 0; i < list.length; i += 1) { const c = list[i]; if (c === "(" || c === "[") depth += 1; else if (c === ")" || c === "]") depth -= 1; else if (c === "," && depth === 0) { parts.push(list.slice(at, i)); at = i + 1; } } parts.push(list.slice(at)); return parts.map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean); };
  const walk = (body) => {
    let i = 0;
    while (i < body.length) {
      const open = body.indexOf("{", i);
      if (open < 0) return;
      const header = body.slice(i, open).trim();
      let depth = 1; let j = open + 1;
      while (j < body.length && depth > 0) { if (body[j] === "{") depth += 1; else if (body[j] === "}") depth -= 1; j += 1; }
      const inner = body.slice(open + 1, j - 1);
      if (header.startsWith("@")) { if (/^@(media|supports|layer|container)/.test(header)) walk(inner); } else out.push(...splitList(header));
      i = j;
    }
  };
  walk(text);
  return out;
}

/** The class every viewer style must sit under (the shell's root element, `src/shell/AstraeusShell.tsx`). */
export const ROOT_CLASS = ".astraeus-shell";
/** Selectors in `css` that are not under the viewer's root class, or that name `:root`, `html`, `body` or `#app` anywhere. A selector is under the root when its first compound is the root class. */
export function selectorBreaks(css) {
  const PAGE_WIDE = /(^|[\s>+~,(])(:root|html|body|#app)(?![\w-])/;
  const underRoot = (selector) => selector === ROOT_CLASS || new RegExp(`^${ROOT_CLASS.replace(".", "\\.")}(?![\\w-])`).test(selector);
  return [...new Set(cssSelectors(css))].filter((selector) => PAGE_WIDE.test(selector) || !underRoot(selector)).map((selector) => ({ rule: "selector", site: selector }));
}

const stylePath = join(ENGINE_SRC, "app", "style.css");
export const styleSelectorBreaks = (path = stylePath) => selectorBreaks(readFileSync(path, "utf8"));

// ---------- Allowlists ----------

/** Offences of `found` breaks against allowlist `entries` (`{ rule, site, reason, finding, removedBy }`): a new break and an entry that no longer matches one. */
export function allowlistOffences(found, entries, name) {
  const key = (item) => `${item.rule} ${item.site}`;
  const known = new Set(entries.map(key));
  const real = new Set(found.map(key));
  return [
    ...found.filter((item) => !known.has(key(item))).map((item) => `${name}: new break ${key(item)}`),
    ...entries.filter((entry) => !real.has(key(entry))).map((entry) => `${name}: stale allowlist entry ${key(entry)}; delete it (${entry.finding}, ${entry.removedBy})`),
  ];
}

if (process.argv[1] !== undefined && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const what = process.argv[2];
  const show = (items) => console.log(items.map((item) => `${item.rule}\t${item.site}`).join("\n"));
  if (what === "readme") {
    const path = join(REPO_ROOT, "packages", "astraeus", "README.md");
    const readme = readFileSync(path, "utf8");
    const start = readme.indexOf(ERROR_TABLE_START) + ERROR_TABLE_START.length;
    writeFileSync(path, `${readme.slice(0, start)}\n${errorTable()}\n${readme.slice(readme.indexOf(ERROR_TABLE_END))}`);
    console.log("wrote the error table in packages/astraeus/README.md");
  } else if (what === "types") show(publicTypeBreaks());
  else if (what === "errors") show(errorBreaks());
  else if (what === "ids") show(idLiteralBreaks());
  else if (what === "css") show(styleSelectorBreaks());
  else if (what === "params") console.log(addressParameters().join("\n"));
  else if (what === "codes") console.log(JSON.stringify(errorCodes(), null, 1));
}
