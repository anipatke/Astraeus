// Photographs every real experience and the site pages from the PUBLIC build at fixed views, times and sizes, so a "before" run and an "after" run of
// the same tree give comparable pictures (O-017: T-066 shoots "before", T-072 shoots "after" and compares). It also records, per page, the files a
// first load downloads (bytes raw and gzipped) and every console or page error.
//
//   PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js \
//     node tools/validate/capture-experience-pictures.mjs --out docs/evidence/o017-before-<UTC> [--port 5460] [--url http://localhost:5460]
//
// --out   (required) the directory that receives the pictures, manifest.json and first-load.json. It must not already hold pictures.
// --port  port for the preview this script starts (default 5460, --strictPort). Ignored when --url is given.
// --url   opt-out: base of an already-running preview of a public build; the script then neither builds nor serves.
// --only  comma list of view ids to shoot (default: all). VIEWS below is the single list; change it there, never in the code below.
// By default it builds fresh into a scratch directory (`ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir <scratch>`), serves it with
// `npx vite preview --outDir <scratch>`, captures, stops the server and removes the scratch build. Nothing under dist/ is touched.
// Time stands still: each page loads with ?t=, playback is paused, the time is set again exactly, story panels (auto-open needs playback) and the
// info panel are closed, then the scene settles 4 s with the pointer parked off the controls. The Developer button and panel are hidden by CSS.
// Still moving after that (noted, not hidden): nothing in the scene advances while paused; the camera eases for under a second after load and the
// star twinkle, if any, is part of the picture. Pixel-for-pixel equality is not promised: compare with a tolerance (T-072).
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import * as ui from "./driver.mjs";

// ---- The one list of pictures (change these, not the code below) ----
export const SIZES = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };
/** `query` is the address after app.html?; `t` is the pinned UTC time; `phoneQuery` replaces `query` on the phone when the same view would not frame well. */
export const VIEWS = [
  { id: "apollo11-overview", page: "app.html", query: "view=earth,0,70,130&scale=true-scale", phoneQuery: "view=moon,270,50,214&scale=true-scale", t: "1969-07-20T20:17:39Z" },
  { id: "apollo11-moon", page: "app.html", query: "view=moon,0,30,6&scale=true-scale", t: "1969-07-20T20:17:39Z" },
  { id: "earth-moon-wide", page: "app.html", query: "experience=earth-moon&view=earth,30,30,130&scale=true-scale", t: "2025-01-10T00:00:00Z" },
  { id: "earth-moon-close", page: "app.html", query: "experience=earth-moon&view=earth,30,30,4&scale=true-scale", t: "2025-01-10T00:00:00Z" },
  { id: "jupiter-io-wide", page: "app.html", query: "experience=jupiter-io&view=jupiter,30,30,200&scale=true-scale", t: "2000-01-05T00:00:00Z" },
  { id: "jupiter-io-close", page: "app.html", query: "experience=jupiter-io&view=jupiter,30,30,40&scale=true-scale", t: "2000-01-05T00:00:00Z" },
  { id: "perseids", page: "app.html", query: "experience=showers&view=sun,100,40,250000&scale=true-scale&up=ecliptic", t: "2020-08-12T12:00:00Z" },
  { id: "geminids", page: "app.html", query: "experience=showers&shower=geminids&view=sun,100,40,100000&scale=true-scale&up=ecliptic", t: "2019-12-14T04:33:33Z" },
  { id: "site-index", page: "index.html", site: true },
  { id: "site-assets", page: "assets.html", site: true },
];
export const SETTLE_MS = 4000;

// ---- Arguments ----
const args = process.argv.slice(2);
const arg = (name, fallback) => { const k = args.indexOf(`--${name}`); return k >= 0 ? args[k + 1] : fallback; };
const fail = (message) => { console.error(`capture-experience-pictures: ${message}`); process.exit(1); };
const out = arg("out");
if (out === undefined) fail("--out <directory> is required.");
if (existsSync(out) && readdirSync(out).some((f) => /\.(png|jpg)$/.test(f))) fail(`${out} already holds pictures; use a fresh directory (earlier evidence is never overwritten).`);
const port = Number(arg("port", 5460));
const externalUrl = arg("url");
const only = arg("only")?.split(",");
const base = (externalUrl ?? `http://localhost:${port}`).replace(/\/$/, "");

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;

let server;
let scratch;
const stopServer = () => { if (server && server.exitCode === null) server.kill("SIGKILL"); };
const cleanup = () => { stopServer(); if (scratch !== undefined && existsSync(scratch)) rmSync(scratch, { recursive: true, force: true }); };
process.on("exit", cleanup);
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => process.exit(130));

if (externalUrl === undefined) {
  // A port that already answers belongs to someone else's server (possibly an older build): never shoot against it by accident.
  try { await fetch(`${base}/app.html`); fail(`port ${port} already answers; pass a free --port.`); } catch (error) { if (String(error.message).startsWith("capture-experience-pictures")) throw error; }
  scratch = mkdtempSync(join(tmpdir(), "astraeus-public-"));
  console.log(`building: ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir ${scratch}`);
  try { execFileSync("npx", ["vite", "build", "--outDir", scratch, "--emptyOutDir"], { stdio: "inherit", env: { ...process.env, ASTRAEUS_PUBLIC_BUILD: "1" } }); }
  catch { fail("the public build failed."); }
  server = spawn(join("node_modules", ".bin", "vite"), ["preview", "--outDir", scratch, "--port", String(port), "--strictPort", "--host", "localhost"], { stdio: ["ignore", "inherit", "inherit"] });
  let ready = false;
  for (let k = 0; k < 60 && !ready && server.exitCode === null; k += 1) {
    try { ready = (await fetch(`${base}/app.html`)).ok; } catch { /* not up yet */ }
    if (!ready) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) fail(`vite preview did not answer on ${base} (port busy or failed to start).`);
}
const html = await (await fetch(`${base}/app.html`)).text();
if (html.includes("/@vite/client") || !/<script[^>]+src="[^"]*\/assets\/[^"]+\.js"/.test(html)) fail(`${base} is not a production build.`);

mkdirSync(out, { recursive: true });
const manifest = { startedUtc: new Date().toISOString(), command: process.argv.join(" "), base, node: process.version, pictures: [], errors: [] };
const firstLoad = [];
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
manifest.chromium = browser.version();

const HIDE_DEVELOPER = ".developer-mode-toggle, .developer-tools { display: none !important }";
const seek = (page, timeMs) => ui.seekTo(page, timeMs);

try {
  for (const view of VIEWS.filter((v) => only === undefined || only.includes(v.id))) {
    for (const [sizeName, viewport] of Object.entries(SIZES)) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
      const fetched = new Map();
      page.on("response", async (response) => { try { const body = await response.body(); fetched.set(response.url(), { raw: body.length, gzip: gzipSync(body).length }); } catch { /* redirects have no body */ } });
      page.on("pageerror", (error) => manifest.errors.push(`${view.id}/${sizeName} pageerror: ${error.message}`));
      page.on("console", (message) => { if (message.type() === "error") manifest.errors.push(`${view.id}/${sizeName} console: ${message.text()}`); });
      const query = sizeName === "phone" && view.phoneQuery !== undefined ? view.phoneQuery : view.query;
      const search = view.site ? "" : `?${query}&t=${view.t}`;
      const url = `${base}/${view.page}${search}`;
      await page.goto(url, { waitUntil: "load" });
      let timeUtc = null;
      if (!view.site) {
        await page.waitForSelector("canvas");
        await ui.waitForShell(page);
        // A DOM click, not a pointer click: the heaviest scenes draw so slowly in software GL that the button never counts as "stable".
        const pauseNow = () => ui.pausePlaybackNow(page);
        await pauseNow();
        await seek(page, Date.parse(view.t));
        await page.addStyleTag({ content: HIDE_DEVELOPER });
        await ui.closeAllPanelsNow(page);
        await page.mouse.move(viewport.width - 5, viewport.height / 2);
        await page.evaluate(() => document.activeElement?.blur());
        await page.waitForTimeout(SETTLE_MS);
        await pauseNow();
        timeUtc = await ui.seekPositionIso(page);
      } else {
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);
      }
      const file = `${view.id}-${sizeName}.png`;
      await page.screenshot({ path: join(out, file), fullPage: view.site === true });
      let bytes = 0; let gzip = 0;
      for (const f of fetched.values()) { bytes += f.raw; gzip += f.gzip; }
      firstLoad.push({ id: view.id, size: sizeName, url, files: fetched.size, bytes, gzipBytes: gzip });
      manifest.pictures.push({ id: view.id, size: sizeName, file, viewport, url, pinnedTimeUtc: view.t ?? null, timelineReadsUtc: timeUtc });
      console.log(`${file}  ${url}  first load ${fetched.size} files ${bytes} B (${gzip} B gzip)`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
manifest.finishedUtc = new Date().toISOString();
writeFileSync(join(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(out, "first-load.json"), `${JSON.stringify(firstLoad, null, 2)}\n`);
console.log(`pictures: ${manifest.pictures.length}  errors: ${manifest.errors.length}`);
if (manifest.errors.length > 0) console.error(manifest.errors.join("\n"));
process.exit(manifest.errors.length > 0 ? 1 : 0); // explicit: the preview server is a child that would otherwise keep the process alive
