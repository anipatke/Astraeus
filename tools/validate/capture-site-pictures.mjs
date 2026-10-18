// Re-shoots every picture on the pitch page, the assets page and the README from the PUBLIC build, at fixed times, views and viewports,
// so the same tree gives the same pictures. By default it does everything itself: it runs `ASTRAEUS_PUBLIC_BUILD=1 npm run build`,
// starts `vite preview` on a free port (5406 by default, --strictPort), waits until it answers, captures, and always stops the server.
//
//   ASTRAEUS_OUT=site ASTRAEUS_SHARE_DIR=public/share \
//     PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js \
//     node tools/validate/capture-site-pictures.mjs
//
// ASTRAEUS_URL        opt-out: base of an already-running preview (e.g. http://localhost:5406). The script then neither builds nor serves, and
//                     refuses (exit 1) unless that site is a production build: app.html must not load /@vite/client (the dev server's
//                     marker) and must load a built /assets/ script. It cannot tell a public build from a plain production build; build the
//                     preview with ASTRAEUS_PUBLIC_BUILD=1 yourself.
// ASTRAEUS_PORT       port for the preview the script starts (default 5406). Ignored when ASTRAEUS_URL is set.
// ASTRAEUS_OUT        directory that receives apollo-moon.jpg, apollo-provenance.jpg, apollo-phone.jpg, perseids-gmn.jpg and readme/perseids-year.gif
//                     (default site). Pass a scratch directory to keep the committed pictures untouched.
// ASTRAEUS_SHARE_DIR  optional: also writes the og:image copy (apollo-moon.jpg) there (the site uses public/share).
// ASTRAEUS_RAW_DIR    optional: keeps the raw PNG frames here (default: a temporary directory that is removed).
// ASTRAEUS_ONLY      comma list of picture groups to shoot: apollo, perseids (default both).
// ASTRAEUS_FRAMES     GIF frame count (default 40).
// Converters: ffmpeg (PNG to JPEG, frames to GIF). The capture log is printed, and written as JSON to ASTRAEUS_LOG when that is set. Exits non-zero on any console or page error.
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as ui from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const externalUrl = process.env.ASTRAEUS_URL;
const port = Number(process.env.ASTRAEUS_PORT ?? 5406);
const base = (externalUrl ?? `http://localhost:${port}`).replace(/\/$/, "").replace(/\/app\.html$/, "");
const out = process.env.ASTRAEUS_OUT ?? "site";
const shareDir = process.env.ASTRAEUS_SHARE_DIR;
const frames = Number(process.env.ASTRAEUS_FRAMES ?? 40);
const raw = process.env.ASTRAEUS_RAW_DIR ?? mkdtempSync(join(tmpdir(), "astraeus-pictures-"));

function fail(message) { console.error(`capture-site-pictures: ${message}`); process.exit(1); }

/** A production build's app.html loads hashed /assets/ scripts and never the dev server's /@vite/client. */
async function requireProductionBuild(url) {
  let html;
  try { const response = await fetch(`${url}/app.html`); if (!response.ok) fail(`${url}/app.html answered ${response.status}.`); html = await response.text(); }
  catch (error) { fail(`cannot reach ${url}/app.html (${error.message}).`); }
  if (html.includes("/@vite/client")) fail(`${url} is a dev server (app.html loads /@vite/client), not a production build. Build with ASTRAEUS_PUBLIC_BUILD=1 npm run build and use vite preview, or unset ASTRAEUS_URL so this script builds and serves.`);
  if (!/<script[^>]+src="[^"]*\/assets\/[^"]+\.js"/.test(html)) fail(`${url}/app.html loads no built /assets/ script, so it is not a production build.`);
}

let server;
const stopServer = () => { if (server && server.exitCode === null) server.kill("SIGTERM"); };
process.on("exit", stopServer);
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => process.exit(130));
if (externalUrl !== undefined) {
  await requireProductionBuild(base);
} else {
  console.log("building: ASTRAEUS_PUBLIC_BUILD=1 npm run build");
  try { execFileSync("npm", ["run", "build"], { stdio: "inherit", env: { ...process.env, ASTRAEUS_PUBLIC_BUILD: "1" } }); }
  catch { fail("the public build failed."); }
  server = spawn(join("node_modules", ".bin", "vite"), ["preview", "--port", String(port), "--strictPort", "--host", "localhost"], { stdio: ["ignore", "inherit", "inherit"] });
  let ready = false;
  for (let k = 0; k < 60 && !ready && server.exitCode === null; k += 1) {
    try { ready = (await fetch(`${base}/app.html`)).ok; } catch { /* not up yet */ }
    if (!ready) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) fail(`vite preview did not answer on ${base} (port busy or failed to start).`);
  await requireProductionBuild(base);
}

mkdirSync(raw, { recursive: true });
mkdirSync(join(out, "readme"), { recursive: true });
if (shareDir !== undefined) mkdirSync(shareDir, { recursive: true });

// ---- Fixed choices (change these, not the code below) ----
/** The owner's Perseids angle (T-063): 40 degrees above the planets' plane, close enough that Jupiter's orbit ring fills about 70% of the width, the inner rings, Earth's crossing, the comet and its orbit line in frame. Same numbers as look.startView in data/showers/perseids.json. */
const PERSEIDS_VIEW = "sun,100,40,250000";
/** The owner's Apollo angle (T-063): from above, Earth, the Moon and the whole outbound and return path. Same numbers as startView in apollo11Definition.tsx. */
const APOLLO_VIEW = "earth,0,70,130";
/** The same picture for a portrait phone: focus on the Moon with Earth above, so the whole path sits between the toolbars and the timeline. */
const APOLLO_PHONE_VIEW = "moon,270,50,214";
const PERSEIDS_PEAK_UTC = "2020-08-12T12:00:00Z";
const APOLLO_TOUCHDOWN_UTC = "1969-07-20T20:17:39Z";
const APOLLO_PANEL_ID = "touchdown";
const JPEG_QUALITY = { "apollo-moon": 6, "apollo-provenance": 6, "apollo-phone": 4, "perseids-gmn": 9 }; // ffmpeg -q:v (2 best, 31 worst)

const only = (process.env.ASTRAEUS_ONLY ?? "apollo,perseids").split(",");
const want = (group) => only.includes(group);
const log = { startedUtc: new Date().toISOString(), base, command: process.argv.join(" "), ffmpeg: execFileSync("ffmpeg", ["-version"]).toString().split("\n")[0], pictures: [], errors: [] };
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

// The Developer panel and its button never appear; "scene" also hides the toolbars and the timeline.
const HIDE_DEVELOPER = ".developer-mode-toggle, .developer-tools { display: none !important }";
const HIDE_CHROME = `${HIDE_DEVELOPER} .shell-top, [aria-label="Timeline controls"], .story-panel, .info-panel { display: none !important }`;

async function open(viewport, query, { css }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => log.errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") log.errors.push(`console: ${message.text()}`); });
  await page.goto(`${base}/app.html?${query}`);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  await page.addStyleTag({ content: css });
  return page;
}
const seek = (page, isoUtc) => ui.seekTo(page, typeof isoUtc === "number" ? isoUtc : Date.parse(isoUtc));
async function settle(page, ms = 3500) {
  await page.waitForTimeout(ms);
  await ui.ensurePaused(page);
}
const closePanels = async (page) => {
  await ui.closeStoryPanelIfPresent(page);
  await ui.closeInfo(page);
};

function toJpeg(name, png, dest, extra = []) {
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, ...extra, "-q:v", String(JPEG_QUALITY[name]), "-pix_fmt", "yuvj420p", dest]);
}
function record(name, dest, detail) {
  const size = statSync(dest).size;
  log.pictures.push({ name, path: dest, bytes: size, capturedUtc: new Date().toISOString(), ...detail });
  console.log(`${name}: ${dest} ${size} bytes ${JSON.stringify(detail)}`);
}

try {
  // ---- Apollo, desktop: the figure-of-eight path from above at touchdown, with the touchdown story panel ----
  if (want("apollo")) {
    const viewport = { width: 1440, height: 900 };
    const query = `view=${APOLLO_VIEW}&scale=true-scale`;
    const page = await open(viewport, query, { css: HIDE_DEVELOPER });
    await seek(page, APOLLO_TOUCHDOWN_UTC);
    await closePanels(page);
    await ui.openStoryPanel(page, APOLLO_PANEL_ID);
    await ui.storyPanel(page, APOLLO_PANEL_ID).waitFor();
    await page.mouse.move(720, 300); // off the marker, so its tooltip does not show
    await page.evaluate(() => document.activeElement?.blur());
    await settle(page);
    const png = join(raw, "apollo-moon.png");
    await page.screenshot({ path: png });
    const dest = join(out, "apollo-moon.jpg");
    toJpeg("apollo-moon", png, dest);
    record("apollo-moon", dest, { viewport, url: `app.html?${query}`, timeUtc: APOLLO_TOUCHDOWN_UTC, panel: APOLLO_PANEL_ID });
    if (shareDir !== undefined) { const share = join(shareDir, "apollo-moon.jpg"); copyFileSync(dest, share); record("apollo-moon-share", share, { copyOf: dest }); }
    await page.close();
  }

  // ---- Apollo, desktop: the Moon close up at touchdown with the info panel of the landing (provenance) ----
  if (want("apollo")) {
    const viewport = { width: 1440, height: 900 };
    const page = await open(viewport, "scale=true-scale", { css: HIDE_DEVELOPER });
    await seek(page, APOLLO_TOUCHDOWN_UTC);
    await closePanels(page);
    await ui.pickBody(page, "moon");
    await closePanels(page);
    await ui.chooseCamera(page, "focus-moon");
    await settle(page, 4000);
    // The landing's info panel: the (i) beside "Just happened".
    await ui.pressInformationButton(page, /^Information about .*Lunar landing/);
    await ui.infoPanel(page).waitFor();
    await ui.openProvenance(page); // opens the source, accuracy and notes
    await settle(page, 1500);
    const png = join(raw, "apollo-provenance.png");
    await page.screenshot({ path: png });
    const dest = join(out, "apollo-provenance.jpg");
    toJpeg("apollo-provenance", png, dest);
    record("apollo-provenance", dest, { viewport, url: "app.html?scale=true-scale (Focus Moon, landing event info with provenance open)", timeUtc: APOLLO_TOUCHDOWN_UTC });
    await page.close();
  }

  // ---- Apollo, phone: the same overview angle ----
  if (want("apollo")) {
    const viewport = { width: 390, height: 844 };
    const query = `view=${APOLLO_PHONE_VIEW}&scale=true-scale`;
    const page = await open(viewport, query, { css: HIDE_DEVELOPER });
    await seek(page, APOLLO_TOUCHDOWN_UTC);
    await closePanels(page);
    await settle(page);
    const png = join(raw, "apollo-phone.png");
    await page.screenshot({ path: png });
    const dest = join(out, "apollo-phone.jpg");
    toJpeg("apollo-phone", png, dest);
    record("apollo-phone", dest, { viewport, url: `app.html?${query}`, timeUtc: APOLLO_TOUCHDOWN_UTC });
    await page.close();
  }

  // ---- Perseids still: the stream at the August peak, scene and labels only ----
  const perseidsQuery = `experience=showers&view=${PERSEIDS_VIEW}&scale=true-scale&up=ecliptic`;
  if (want("perseids")) {
    const viewport = { width: 1200, height: 675 };
    const page = await open(viewport, perseidsQuery, { css: HIDE_CHROME });
    await seek(page, PERSEIDS_PEAK_UTC);
    await settle(page, 4000);
    const png = join(raw, "perseids-gmn.png");
    await page.screenshot({ path: png });
    const dest = join(out, "perseids-gmn.jpg");
    toJpeg("perseids-gmn", png, dest);
    record("perseids-gmn", dest, { viewport, url: `app.html?${perseidsQuery}`, timeUtc: PERSEIDS_PEAK_UTC });
    await page.close();
  }

  // ---- Perseids year GIF: one frame per equal step across the timeline window (a year), same view ----
  if (want("perseids")) {
    const viewport = { width: 1280, height: 720 };
    const page = await open(viewport, perseidsQuery, { css: HIDE_CHROME });
    await settle(page, 3000);
    const range = await ui.seekRange(page);
    const dir = join(raw, "gif");
    mkdirSync(dir, { recursive: true });
    for (let k = 0; k < frames; k += 1) {
      await seek(page, range.min + ((range.max - range.min) * k) / frames);
      await page.waitForTimeout(900);
      await page.screenshot({ path: join(dir, `f${String(k).padStart(3, "0")}.png`) });
    }
    const dest = join(out, "readme", "perseids-year.gif");
    // Dense dots change every frame, so a GIF stays under 2 MB only with few colours and about 40 frames.
    const filter = "scale=960:-1:flags=area,split[a][b];[a]palettegen=max_colors=16:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle";
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", "25/3", "-i", join(dir, "f%03d.png"), "-vf", filter, "-loop", "0", dest]);
    record("perseids-year-gif", dest, { viewport, outputWidth: 960, frames, url: `app.html?${perseidsQuery}`, window: { startUtc: new Date(range.min).toISOString(), endUtc: new Date(range.max).toISOString() } });
    await page.close();
  }
} finally {
  await browser.close();
  stopServer();
  if (process.env.ASTRAEUS_RAW_DIR === undefined && existsSync(raw)) rmSync(raw, { recursive: true, force: true });
}

log.finishedUtc = new Date().toISOString();
if (process.env.ASTRAEUS_LOG !== undefined) writeFileSync(process.env.ASTRAEUS_LOG, `${JSON.stringify(log, null, 2)}\n`);
console.log(`errors: ${log.errors.length}`);
if (log.errors.length > 0) { console.error(log.errors.join("\n")); process.exit(1); }
