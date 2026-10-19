// I-030: both showers in the PUBLIC build (ASTRAEUS_PUBLIC_BUILD=1 npm run build, then `vite preview`), in headless Chromium (software GL).
//   PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_URL=http://localhost:5405/app.html ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-public-showers.mjs
// Per shower (every data/showers/<name>.json): the stream is drawn from the story's shipped copy (one stream group, the panel states the shipped file's orbit count
// and the GMN credit: licence, months, counts and both citations), no data/local file is served, the removed ?source=cams address is ignored (the shipped stream is still
// drawn and no CAMS file is requested), the Developer panel offers no source switch (GMN is the only source), and with the shipped file blocked the stream's panel says
// in plain words that the build has no orbits (no fetch command). The GMN credit and the shipped-copy checks of the removed browser-showers-gmn.mjs (checkShipped) live here (T-067).
// Zero console errors. Results go to <dir>.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import * as ui from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5405/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (!outDir) throw new Error("set ASTRAEUS_EVIDENCE_DIR to a fresh folder");
mkdirSync(outDir, { recursive: true });
const showersDir = new URL("../../data/showers/", import.meta.url);
const names = readdirSync(showersDir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};

async function open(name, query, route) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  const requests = [];
  page.on("response", (r) => requests.push({ url: r.url(), status: r.status() }));
  if (route) await route(page);
  await page.goto(`${base}?experience=showers&shower=${name}${query}`);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  await page.waitForTimeout(3000);
  return { page, requests };
}

async function streamPanel(page, name, label) {
  await ui.pickBody(page, `${name}-stream`);
  await ui.openInfo(page, `${label} stream`);
  const description = (await ui.infoPanel(page).innerText()).replace(/\s+/g, " ");
  await ui.openProvenance(page);
  const detail = (await ui.provenanceDetail(page).innerText()).replace(/\s+/g, " ");
  return { description, detail };
}

for (const name of names) {
  const settings = JSON.parse(readFileSync(new URL(`${name}.json`, showersDir), "utf8"));
  const iau = settings.stream.iauCode;
  const kept = JSON.parse(readFileSync(new URL(`../../data/stories/${name}/gmn-iau-${iau}.json`, import.meta.url), "utf8")).provenance.counts.kept;
  const shipped = new RegExp(`/gmn-iau-${iau}[^/]*\\.json$`);
  const r = (results[name] = { kept });
  // 1. plain load, and the removed ?source=cams address, both draw the shipped GMN stream.
  for (const [tag, query] of [["default", "&sky=off"], ["source-cams-ignored", "&sky=off&source=cams"]]) {
    const { page, requests } = await open(name, query);
    try {
      await ui.pausePlayback(page);
      const fromShipped = requests.filter((q) => shipped.test(new URL(q.url).pathname));
      assert.ok(fromShipped.length >= 1 && fromShipped.every((q) => q.status === 200), `${name}/${tag}: loaded from the shipped copy`);
      assert.ok(!requests.some((q) => q.url.includes("/data/local/") && q.status === 200), `${name}/${tag}: no data/local file is served`);
      assert.ok(!requests.some((q) => /cams-iau/.test(q.url) && q.status === 200), `${name}/${tag}: no CAMS file is served`);
      assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "1", `${name}/${tag}: one stream group is drawn`);
      const panel = await streamPanel(page, name, settings.label);
      assert.match(panel.description, new RegExp(`${kept} measured meteoroid orbits`), `${name}/${tag}: the panel counts the shipped orbits`);
      for (const text of ["Global Meteor Network", "CC BY 4.0", "Vida", "506(4)", "491(2)", ...settings.stream.sources.gmn.months, `${kept} bound orbits in the file`]) assert.ok(panel.detail.includes(text), `${name}/${tag}: credits "${text}"`);
      assert.ok(!/CAMS Meteoroid Orbit Database|cams\.seti|Jenniskens et al\. 2018/.test(panel.detail), `${name}/${tag}: the panel cites no CAMS data source`);
      assert.ok(!/not fetched|does not include/.test(panel.description), `${name}/${tag}: no absence message`);
      await ui.toggleDeveloper(page);
      assert.equal(await ui.orbitSourceButtons(page).count(), 0, `${name}/${tag}: no source switch is offered`);
      assert.ok(await ui.orbitSetButtons(page).count() >= 2, `${name}/${tag}: the orbit-set switch is still offered`);
      r[tag] = { requests: fromShipped, description: panel.description.slice(0, 200) };
    } finally {
      await page.close();
    }
  }
  // 2. the shipped file blocked: nothing drawn and the panel says so in plain words.
  const { page } = await open(name, "&sky=off", (p) => p.route(shipped, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>app</title>" })));
  try {
    assert.notEqual(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "1", `${name}/absent: no stream group`);
    const panel = await streamPanel(page, name, settings.label);
    assert.match(panel.description, new RegExp(`This build does not include measured orbits for the ${settings.label}, so no stream is drawn`), `${name}/absent: the panel says so`);
    assert.ok(!/fetch-meteoroid-orbits|Run "/.test(panel.description), `${name}/absent: no fetch command in a public build`);
    r.absent = panel.description.slice(0, 300);
  } finally {
    await page.close();
  }
}
await browser.close();
results.consoleErrors = errors;
console.log(JSON.stringify(results, null, 1));
assert.deepEqual(errors, [], "zero console errors");
console.log("OK: public build probe passed for", names.join(", "));
