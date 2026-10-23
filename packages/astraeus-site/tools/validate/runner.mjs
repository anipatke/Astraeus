// Shared by the browser command, run-browser.mjs (O-034 T-110; O-038 retired run-engine.mjs and run-demo.mjs): start the project's own dev server, run a set's scripts one after another (one browser job at a time),
// print a one-line summary per script and a total, stop the servers, and set a non-zero exit code on any failure or console error.
// No script takes or saves a picture. The evidence directory holds summary.txt and each step's own results files only (O-037 T-123); step logs, dev-server.log and
// preview-server.log go to a scratch folder under the OS temp directory whose path the summary prints.
//
// A step is { name, script, scene?, args?, env?, public?, example? } (`scene` is the experience the step opens, printed in the summary). `public` steps read a scratch PUBLIC build: a script with no browser gets its directory as the last argument, a browser
// script gets ASTRAEUS_URL pointing at a preview of it. An `example` step builds examples/hello-scene from the packed tarballs (`tools/build-example.mjs`, once) and gets ASTRAEUS_URL pointing at a preview of it. Other steps get ASTRAEUS_URL for the dev server and ASTRAEUS_EVIDENCE_DIR for a fresh directory of their own.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The repository root (this file is packages/astraeus-site/tools/validate/).
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const DEV_PORT = process.env.DEV_PORT ?? "5479";
const PUBLIC_PORT = process.env.PUBLIC_PORT ?? "5480";
const EXAMPLE_PORT = process.env.EXAMPLE_PORT ?? "5481";
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
const ERROR_LINE = /console error|pageerror|page error/i;
const ZERO_ERRORS = /zero console errors/i;
const clock = (ms) => new Date(ms).toISOString().slice(11, 19);

async function waitFor(url) {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(url)).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no answer from ${url}`);
}

function runStep(step, ctx) {
  const url = step.example ? ctx.exampleUrl : step.public ? ctx.publicUrl : ctx.devUrl;
  const dir = join(ctx.evidence, step.name);
  const args = [join("packages/astraeus-site/tools/validate", step.script), ...(step.args ?? [])];
  if (step.public && step.noBrowser) args.push(ctx.publicDir);
  const started = Date.now();
  const run = spawnSync(process.execPath, args, {
    cwd: root, encoding: "utf8", maxBuffer: 2 ** 28,
    env: { ...process.env, ASTRAEUS_URL: url, ASTRAEUS_EVIDENCE_DIR: dir, ASTRAEUS_OUT: dir, ...step.env },
  });
  const log = String(run.stdout) + String(run.stderr);
  ctx.writeLog(`${step.name}.log`, log);
  const errors = log.split("\n").filter((l) => ERROR_LINE.test(l) && !ZERO_ERRORS.test(l)).length;
  const seconds = Math.round((Date.now() - started) / 1000);
  const sceneText = step.scene ?? (step.noBrowser ? "none (files only)" : "?");
  const line = [step.name, `scene=${sceneText}`, `exit=${run.status}`, `${clock(started)}-${clock(Date.now())}`, `${seconds}s`, `error-lines=${errors}`].join(" | ");
  console.log(line);
  appendFileSync(join(ctx.evidence, "summary.txt"), `${line}\n`);
  return run.status === 0 && errors === 0;
}

/** Start the dev server, the scratch public build and its preview, as far as `steps` need them, and wait until each answers. */
async function startServers(steps, ctx) {
  const needsDev = steps.some((s) => !s.example && (!s.public || !s.noBrowser));
  const needsPreview = steps.some((s) => s.public && !s.noBrowser);
  if (needsDev) ctx.serve("dev-server.log", ["vite", "packages/astraeus-site", "--port", DEV_PORT, "--strictPort"]);
  if (steps.some((s) => s.public)) {
    const build = spawnSync("npx", ["vite", "build", "packages/astraeus-site", "--outDir", ctx.publicDir, "--emptyOutDir"], { cwd: root, encoding: "utf8", env: { ...process.env, ASTRAEUS_PUBLIC_BUILD: "1" } });
    ctx.writeLog("public-build.log", `${build.stdout}${build.stderr}`);
    if (build.status !== 0) throw new Error("public build failed (see public-build.log)");
  }
  if (needsPreview) ctx.serve("preview-server.log", ["vite", "preview", "packages/astraeus-site", "--outDir", ctx.publicDir, "--port", PUBLIC_PORT, "--strictPort", "--host", "localhost"]);
  if (steps.some((s) => s.example)) {
    const build = spawnSync(process.execPath, ["tools/build-example.mjs"], { cwd: root, encoding: "utf8" });
    ctx.writeLog("example-build.log", `${build.stdout}${build.stderr}`);
    if (build.status !== 0) throw new Error("example build failed (see example-build.log)");
    ctx.serve("example-server.log", ["vite", "preview", "examples/hello-scene", "--port", EXAMPLE_PORT, "--strictPort", "--host", "localhost"]);
    await waitFor(ctx.exampleUrl);
  }
  if (needsDev) await waitFor(ctx.devUrl);
  if (needsPreview) await waitFor(ctx.publicUrl);
}

/** The run's context: its fresh evidence folder, scratch folders, URLs, and `serve`/`stop` for the server processes it starts. */
function makeContext(setName) {
  const evidence = join(root, "docs", "evidence", `${setName}-${stamp()}`);
  mkdirSync(evidence, { recursive: true });
  const scratch = mkdtempSync(join(tmpdir(), "astraeus-check-"));
  const logs = mkdtempSync(join(tmpdir(), "astraeus-check-logs-"));
  const children = [];
  const writeLog = (name, text) => appendFileSync(join(logs, name), text);
  const serve = (name, args) => {
    const child = spawn("npx", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"], detached: true });
    child.stdout.on("data", (d) => writeLog(name, d));
    child.stderr.on("data", (d) => writeLog(name, d));
    children.push(child);
  };
  // npx starts the server as a grandchild, so stop each child's whole process group.
  const stop = () => { for (const c of children) try { process.kill(-c.pid); } catch { /* already gone */ } rmSync(scratch, { recursive: true, force: true }); };
  appendFileSync(join(evidence, "summary.txt"), `logs: ${logs}\n`);
  console.log(`logs: ${logs}`);
  return {
    evidence, logs, publicDir: join(scratch, "public"), serve, stop, writeLog,
    devUrl: `http://localhost:${DEV_PORT}/app.html`, publicUrl: `http://localhost:${PUBLIC_PORT}/app.html`, exampleUrl: `http://localhost:${EXAMPLE_PORT}/`,
  };
}

/** Run `steps` (see above) as the set `setName`; resolves to the process exit code. */
export async function runSet(setName, steps) {
  const ctx = makeContext(setName);
  process.on("SIGINT", () => { ctx.stop(); process.exit(130); });
  const start = Date.now();
  let ok = true;
  try {
    await startServers(steps, ctx);
    for (const step of steps) ok = runStep(step, ctx) && ok;
  } catch (error) {
    console.error(String(error.message ?? error));
    ok = false;
  } finally {
    ctx.stop();
  }
  const total = `total ${Math.round((Date.now() - start) / 1000)}s (servers and public build included)`;
  appendFileSync(join(ctx.evidence, "summary.txt"), `${total}\n`);
  console.log(`${total}\nevidence: ${ctx.evidence}`);
  if (!ok) console.error("FAILED: a step exited non-zero or logged a console error (see summary above)");
  return ok ? 0 : 1;
}
