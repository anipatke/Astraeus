// One-off: unused exports and unreachable files for T-066. Usage: node scan-unused.mjs  (cwd = repo root)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
const walk = (d, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (f === "node_modules") continue; statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
const src = walk("src").filter((f) => /\.(ts|tsx)$/.test(f));
const tests = walk("tests").filter((f) => /\.(ts|tsx|mjs)$/.test(f));
const tools = walk("tools").filter((f) => /\.(mjs|ts)$/.test(f));
const read = (f) => readFileSync(f, "utf8");
const text = Object.fromEntries([...src, ...tests, ...tools, "vite.config.ts", "vitest.setup.ts"].map((f) => [f, read(f)]));
const html = ["index.html", "app.html", "assets.html"].map(read).join("\n");
// ---- exports
const re = /^export\s+(?:declare\s+)?(?:async\s+)?(?:const|function\*?|class|type|interface|enum|let)\s+([A-Za-z0-9_$]+)/gm;
const rows = [];
for (const f of src) {
  const t = text[f]; let m;
  while ((m = re.exec(t))) {
    const name = m[1]; const w = new RegExp(`\\b${name.replace(/\$/g, "\\$")}\\b`, "g");
    let inSrcOther = 0, inTests = 0, inTools = 0, inSelf = (t.match(w) ?? []).length - 1;
    for (const [g, u] of Object.entries(text)) { if (g === f) continue; const n = (u.match(w) ?? []).length; if (!n) continue; if (g.startsWith("src/")) inSrcOther += n; else if (g.startsWith("tests/")) inTests += n; else inTools += n; }
    if (inSrcOther === 0) rows.push({ file: f, name, self: inSelf, tests: inTests, tools: inTools });
  }
}
console.log("## exports with no use in other src files");
for (const r of rows.sort((a, b) => a.file.localeCompare(b.file))) console.log(`${r.file}\t${r.name}\tself=${r.self}\ttests=${r.tests}\ttools=${r.tools}${r.self === 0 && r.tests === 0 && r.tools === 0 ? "\tUNUSED" : r.self === 0 ? "\tTEST/TOOL-ONLY" : "\tLOCAL-ONLY(drop export)"}`);
// ---- reachability
const resolveImp = (from, spec) => { if (!spec.startsWith(".")) return null; const base = resolve(dirname(from), spec); for (const c of [base, base + ".ts", base + ".tsx", join(base, "index.ts"), join(base, "index.tsx")]) if (text[relative(".", c)] !== undefined || /\.(json|css|png|jpg)$/.test(c)) return relative(".", c); return null; };
const seen = new Set(); const q = ["src/main.tsx"];
for (const m of html.matchAll(/src="\/?([^"]+\.(?:tsx?|js))"/g)) q.push(m[1]);
while (q.length) { const f = q.pop(); if (seen.has(f)) continue; seen.add(f); const t = text[f]; if (!t) continue; for (const m of t.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["'](\.[^"']+)["']/g)) { const r = resolveImp(f, m[1]); if (r) q.push(r); } }
console.log("\n## src files not reachable from src/main.tsx (static + dynamic imports)");
for (const f of src) if (!seen.has(f)) { const base = f.replace(/\.(tsx?)$/, ""); const inTests = Object.entries(text).filter(([g, u]) => g.startsWith("tests/") && u.includes(base.split("/").pop())).map(([g]) => g); console.log(`${f}\timported-by-tests=${inTests.length}`); }
console.log("\n## package.json dependencies vs imports");
const pkg = JSON.parse(read("package.json"));
for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) { const used = Object.entries(text).filter(([, u]) => u.includes(`"${dep}`) || u.includes(`'${dep}`)).map(([g]) => g.split("/")[0]); console.log(dep, [...new Set(used)].join(",") || "NOT IMPORTED");}
