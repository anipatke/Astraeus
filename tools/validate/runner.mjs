// Shared by run-engine.mjs and run-demo.mjs (O-034 T-110): start the project's own dev server, run a set's scripts one after another (one browser job at a time),
// log each to a fresh evidence directory, print a one-line summary per script and a total, stop the servers, and set a non-zero exit code on any failure or console error.
// No script takes or saves a picture; the evidence directory holds logs and summary.txt only.
//
// A step is { name, script, args?, env?, public? }. `public` steps read a scratch PUBLIC build: a script with no browser gets its directory as the last argument, a browser
// script gets ASTRAEUS_URL pointing at a preview of it. Other steps get ASTRAEUS_URL for the dev server and ASTRAEUS_EVIDENCE_DIR for a fresh directory of their own.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEV_PORT = process.env.DEV_PORT ?? "5479";
const PUBLIC_PORT = process.env.PUBLIC_PORT ?? "5480";
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
const clock = (ms) => new Date(ms).toISOString().slice(11, 19);

async function waitFor(url) {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(url)).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no answer from ${url}`);
}

function runStep(step, ctx) {
  const url = step.public ? ctx.publicUrl : ctx.devUrl;
  const dir = join(ctx.evidence, step.name);
  const args = [join("tools/validate", step.script), ...(step.args ?? [])];
  if (step.public && step.noBrowser) args.push(ctx.publicDir);
  const started = Date.now();
  const run = spawnSync(process.execPath, args, {
    cwd: root, encoding: "utf8", maxBuffer: 1 << 28,
    env: { ...process.env, ASTRAEUS_URL: url, ASTRAEUS_EVIDENCE_DIR: dir, ASTRAEUS_OUT: dir, ...step.env },
  });
  const log = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  ctx.write(`${step.name}.log`, log);
  const errors = log.split("\n").filter((l) => /console error|pageerror|page error/i.test(l) && !/zero console errors/i.test(l)).length;
  const seconds = Math.round((Date.now() - started) / 1000);
  const line = `${step.name} | exit=${run.status} | ${clock(started)}-${clock(Date.now())} | ${seconds}s | error-lines=${errors}`;
  console.log(line);
  appendFileSync(join(ctx.evidence, "summary.txt"), `${line}\n`);
  return run.status === 0 && errors === 0;
}

/** Run `steps` (see above) as the set `setName`; resolves to the process exit code. */
export async function runSet(setName, steps) {
  const evidence = join(root, "docs", "evidence", `${setName}-${stamp()}`);
  if (existsSync(evidence) && readdirSync(evidence).length) { console.error(`${evidence} is not empty`); return 2; }
  mkdirSync(evidence, { recursive: true });
  const scratch = mkdtempSync(join(tmpdir(), "astraeus-check-"));
  const children = [];
  const ctx = {
    evidence, publicDir: join(scratch, "public"),
    devUrl: `http://localhost:${DEV_PORT}/app.html`, publicUrl: `http://localhost:${PUBLIC_PORT}/app.html`,
    write: (name, text) => appendFileSync(join(evidence, name), text),
  };
  const serve = (name, args) => {
    const child = spawn("npx", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"], detached: true });
    child.stdout.on("data", (d) => ctx.write(name, d));
    child.stderr.on("data", (d) => ctx.write(name, d));
    children.push(child);
  };
  // npx starts the server as a grandchild, so stop each child's whole process group.
  const stop = () => { for (const c of children) try { process.kill(-c.pid); } catch { /* already gone */ } rmSync(scratch, { recursive: true, force: true }); };
  process.on("SIGINT", () => { stop(); process.exit(130); });
  const start = Date.now();
  let ok = true;
  try {
    const needsDev = steps.some((s) => !s.public || !s.noBrowser);
    const needsPublic = steps.some((s) => s.public);
    const needsPreview = steps.some((s) => s.public && !s.noBrowser);
    if (needsDev) serve("dev-server.log", ["vite", "--port", DEV_PORT, "--strictPort"]);
    if (needsPublic) {
      const build = spawnSync("npx", ["vite", "build", "--outDir", ctx.publicDir, "--emptyOutDir"], { cwd: root, encoding: "utf8", env: { ...process.env, ASTRAEUS_PUBLIC_BUILD: "1" } });
      ctx.write("public-build.log", `${build.stdout}${build.stderr}`);
      if (build.status !== 0) throw new Error("public build failed (see public-build.log)");
    }
    if (needsPreview) serve("preview-server.log", ["vite", "preview", "--outDir", ctx.publicDir, "--port", PUBLIC_PORT, "--strictPort", "--host", "localhost"]);
    if (needsDev) await waitFor(ctx.devUrl);
    if (needsPreview) await waitFor(ctx.publicUrl);
    for (const step of steps) if (!runStep(step, ctx)) ok = false;
  } catch (error) {
    console.error(String(error.message ?? error));
    ok = false;
  } finally {
    stop();
  }
  const total = `total ${Math.round((Date.now() - start) / 1000)}s (servers and public build included)`;
  appendFileSync(join(evidence, "summary.txt"), `${total}\n`);
  console.log(`${total}\nevidence: ${evidence}`);
  if (!ok) console.error("FAILED: a step exited non-zero or logged a console error (see summary above)");
  return ok ? 0 : 1;
}
