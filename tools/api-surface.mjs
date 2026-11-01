// The public-surface lock (O-053 T-228, API-01). The lock file lists the root exports of `astraeus` (each value and type: kind and signature text, from the same
// compiler read that builds the API reference) and the `exports` map of every published package. A test compares the tree with the lock; `npm run api:lock` rewrites it.
// This file also finds the types reachable from the root export that are declared outside `packages/astraeus/src/api/`.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript6";
import { collectExports, PUBLIC_ENTRY } from "../packages/astraeus-site/tools/site/api-reference.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(here, "..");
export const PACKAGES_DIR = join(REPO_ROOT, "packages");
export const LOCK_PATH = join(PACKAGES_DIR, "astraeus", "api-surface.lock.json");
export const REGENERATE = "npm run api:lock";
const API_DIR = dirname(PUBLIC_ENTRY);

/** The exports map of every published (not `private`) package, keyed by package name. */
export function publishedExports(packagesDir = PACKAGES_DIR) {
  const out = {};
  for (const entry of readdirSync(packagesDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const manifest = join(packagesDir, entry.name, "package.json");
    if (!entry.isDirectory() || !existsSync(manifest)) continue;
    const json = JSON.parse(readFileSync(manifest, "utf8"));
    if (json.private === true) continue;
    out[json.name] = json.exports ?? {};
  }
  return out;
}

/** The current surface: the root exports (docs left out, they are not the contract) and the published packages' exports maps. */
export function currentSurface(entry = PUBLIC_ENTRY, packagesDir = PACKAGES_DIR) {
  const root = {};
  for (const item of collectExports(entry)) {
    root[item.name] = { kind: item.kind, signature: item.signature, constructors: item.constructors, members: item.members.map((member) => ({ name: member.name, optional: member.optional === true, signature: member.signature })) };
  }
  return { root, packageExports: publishedExports(packagesDir) };
}

export const writeLock = (path = LOCK_PATH) => writeFileSync(path, `${JSON.stringify(currentSurface(), null, 2)}\n`);
export const readLock = (path = LOCK_PATH) => JSON.parse(readFileSync(path, "utf8"));

/** Lines naming each difference between two surfaces (added, removed, changed), for a test to show. */
export function surfaceDifferences(lock, now) {
  const lines = [];
  const compare = (label, a, b) => {
    for (const name of Object.keys(b)) if (!(name in a)) lines.push(`added ${label} ${name}`);
    for (const name of Object.keys(a)) {
      if (!(name in b)) lines.push(`removed ${label} ${name}`);
      else if (JSON.stringify(a[name]) !== JSON.stringify(b[name])) lines.push(`changed ${label} ${name}: ${JSON.stringify(a[name])} -> ${JSON.stringify(b[name])}`);
    }
  };
  compare("root export", lock.root, now.root);
  compare("package exports of", lock.packageExports, now.packageExports);
  return lines;
}

export const OPTIONS = {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX,
  strict: true, skipLibCheck: true, noEmit: true, resolveJsonModule: true, lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"], types: [],
};
export const isOwnFile = (file) => !/node_modules|[\\/]typescript6?[\\/]lib[\\/]/.test(file);
export const privateName = (name) => name.startsWith("#") || name.startsWith("__#");

/**
 * Types reachable from the root export that are declared in a repository file outside the entry's folder (`src/api/`), as `Name (path/relative/to/repo)`, and
 * types declared inside it but not exported from the root, as `Name (path) unexported`.
 * The walk follows exports, members, signatures, type arguments, unions and base types; it records a type declared outside the folder and does not walk into it,
 * so the list names where the public surface meets the internals, not everything behind them. Types from `node_modules` and the TypeScript lib are ignored.
 */
export function outsideApiTypes(entry = PUBLIC_ENTRY, apiDir = dirname(entry), repoRoot = REPO_ROOT) {
  const program = ts.createProgram([entry], OPTIONS);
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const found = new Set();
  const apiTypes = new Set();
  const seen = new Set();
  const inApi = (file) => resolve(file).startsWith(apiDir + "/") || resolve(file).startsWith(apiDir + "\\");
  const note = (symbol) => {
    const declaration = symbol.declarations?.[0];
    if (declaration === undefined) return true;
    const file = declaration.getSourceFile().fileName;
    if (!isOwnFile(file)) return false;
    if (inApi(file)) {
      if (symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Enum)) apiTypes.add(symbol);
      scanSymbol(symbol);
      return true;
    }
    found.add(`${symbol.name} (${relative(repoRoot, file).split("\\").join("/")})`);
    return false;
  };
  // The written types of a public declaration (parameters, returns, property types, heritage), so a name the compiler erases (`type BodyId = string`) or folds (a union alias) is still found.
  const scanned = new Set();
  const scanType = (node) => {
    if (node === undefined) return;
    if (ts.isTypeReferenceNode(node) || ts.isExpressionWithTypeArguments(node)) {
      const name = ts.isTypeReferenceNode(node) ? node.typeName : node.expression;
      let symbol = checker.getSymbolAtLocation(name);
      if (symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
      if (symbol !== undefined && !(symbol.flags & ts.SymbolFlags.TypeParameter)) note(symbol);
    }
    ts.forEachChild(node, scanType);
  };
  const isHidden = (member) => (member.name !== undefined && ts.isPrivateIdentifier(member.name)) || (ts.getCombinedModifierFlags(member) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) !== 0;
  const scanSignature = (node) => { node.typeParameters?.forEach(scanType); node.parameters?.forEach((parameter) => scanType(parameter.type)); scanType(node.type); };
  function scanSymbol(symbol) {
    if (scanned.has(symbol)) return;
    scanned.add(symbol);
    for (const node of symbol.declarations ?? []) {
      if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
        node.typeParameters?.forEach(scanType);
        node.heritageClauses?.forEach(scanType);
        for (const member of node.members) if (!isHidden(member)) { scanSignature(member); if (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) scanType(member.type); }
      } else if (ts.isTypeAliasDeclaration(node)) { node.typeParameters?.forEach(scanType); scanType(node.type); }
      else if (ts.isFunctionDeclaration(node)) scanSignature(node);
      else if (ts.isVariableDeclaration(node)) scanType(node.type);
    }
  }
  const isAnonymous = (symbol) => symbol === undefined || symbol.name === "__type" || symbol.name === "__object" || (symbol.flags & ts.SymbolFlags.TypeLiteral) !== 0;
  const visitArguments = (type) => { if (type.objectFlags & ts.ObjectFlags.Reference) checker.getTypeArguments(type).forEach(visit); };
  const visitProperty = (property) => {
    const declaration = property.declarations?.[0];
    const hidden = declaration === undefined || privateName(property.name) || (ts.getCombinedModifierFlags(declaration) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) !== 0;
    if (!hidden && isOwnFile(declaration.getSourceFile().fileName)) visit(checker.getTypeOfSymbolAtLocation(property, declaration));
  };
  const visitSignature = (signature) => {
    for (const parameter of signature.getParameters()) visit(checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration ?? source));
    visit(signature.getReturnType());
  };
  function visit(type) {
    if (seen.has(type)) return;
    seen.add(type);
    if (type.aliasSymbol !== undefined && !note(type.aliasSymbol)) return;
    type.aliasTypeArguments?.forEach(visit);
    if (type.isUnionOrIntersection()) { type.types.forEach(visit); return; }
    if (!(type.flags & ts.TypeFlags.Object)) return;
    visitArguments(type);
    if (!isAnonymous(type.symbol) && !note(type.symbol)) return;
    if (type.isClassOrInterface()) checker.getBaseTypes(type).forEach(visit);
    type.getProperties().forEach(visitProperty);
    [...type.getCallSignatures(), ...type.getConstructSignatures()].forEach(visitSignature);
  }
  const module = checker.getSymbolAtLocation(source);
  for (const exported of checker.getExportsOfModule(module)) {
    const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    note(target);
    if (target.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Enum)) {
      const declared = checker.getDeclaredTypeOfSymbol(target);
      if (inApi(target.declarations?.[0]?.getSourceFile().fileName ?? "")) visit(declared);
    }
    if (target.flags & (ts.SymbolFlags.Value)) {
      const declaration = target.valueDeclaration ?? target.declarations?.[0];
      if (declaration !== undefined && inApi(declaration.getSourceFile().fileName)) visit(checker.getTypeOfSymbolAtLocation(target, declaration));
    }
  }
  const module2 = checker.getSymbolAtLocation(source);
  const rootNames = new Set(checker.getExportsOfModule(module2).map((exported) => (exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported)));
  for (const symbol of apiTypes) if (!rootNames.has(symbol)) found.add(`${symbol.name} (${relative(repoRoot, symbol.declarations[0].getSourceFile().fileName).split("\\").join("/")}) unexported`);
  return [...found].sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--types") console.log(outsideApiTypes().join("\n"));
  else { writeLock(); console.log(`wrote ${relative(REPO_ROOT, LOCK_PATH)}`); }
}
