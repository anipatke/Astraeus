// Browser check for the sky behind every experience (T-053). Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/on-request/browser-sky.mjs
//
// Scenarios, each run for a sample (T-071; moved onto the made-up scene by O-034 T-111): the made-up scene at 1280x800 and 390x844:
//   stars are drawn ........................ the <canvas> element's data-sky-stars is the star count (8920 from the committed HYG file, the only star catalogue
//                                            since O-017 T-067 removed Yale); the scene reports the stars and their brightness; ?sky=off reports none
//   the sky is fixed under a centre change .. Developer mode reads back a probe direction (orientation in, screen position out). After each
//                                            of: the scale toggle (where there is one), Overview, Focus and Follow requests, the screen position equals the
//                                            position computed here from the camera's orientation alone
//   the sky turns with the camera ........... a mouse drag moves the probe
//   the panel cites both sources ............ the Sky item's provenance names the HYG catalogue and ESO/S. Brunier
//   the Milky Way picture switch ........... the picture is off by default, with all the stars; ?milkyway=on draws it (the scene reports the picture shown with it on, not shown with it off); the Developer-mode "Milky Way picture" button toggles it live
//   frame rate .............................. with and without the sky, from the Developer tools counter (recorded, not asserted)
//   zero console errors ..................... page errors and console errors are collected for the whole run
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as ui from "../driver.mjs";
import { launchBrowser, openPage, watchErrors } from "../harness.mjs";

const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
// The stars come from the committed HYG file (public and local builds alike), so the star file is always there.
const starCount = String(JSON.parse(readFileSync(new URL("../../../src/assets/stars/hyg-v42-naked-eye.json", import.meta.url), "utf8")).stars.length);
const browser = await launchBrowser();
const errors = [];
const results = { starSource: "hyg", starCount, runs: {} };

// T-071 (trim): the sky is one component behind every experience, so a sample covers it. Apollo runs at both sizes (the phone once); the
// Perseids are not run (their sky is the same component, behind the shower scenes: browser-showers.mjs asserts the stream with ?sky=off and on). Every other experience's sky is seen in the before/after pictures and its canvas drawing in browser-lite.mjs.
const EXPERIENCES = [["synthetic", "experience=synthetic"]];
const SIZES = [["desktop", { width: 1280, height: 800 }], ["mobile", { width: 390, height: 844 }]];
const SAMPLED = new Set(["synthetic-desktop"]); // the sky is one component; a phone size adds no sky case (O-034 T-111 keeps the engine set under 300 s)
// Must equal SKY_PROBE_DIRECTION in src/app/SkyView.ts (render frame).
const PROBE = (() => { const v = [0.62, 0.35, -0.7]; const n = Math.hypot(...v); return v.map((x) => x / n); })();
const FOV_DEG = 45;

const open = async (viewport, query, deviceScaleFactor = 1) => {
  const page = await openPage(browser, { viewport, deviceScaleFactor });
  watchErrors(page, errors);
  page.milkyRequests = ui.trackRequests(page, /milky-way[^?]*\.jpg$/);
  await page.goto(`${base}?${query}`);
  await page.waitForSelector("canvas");
  // The sky's attribute appears once the scene has mounted; with ?sky=off it never does, so wait for the canvas to settle instead.
  if (!query.includes("sky=off")) await page.waitForFunction(() => document.querySelector("canvas")?.dataset.skyStars !== undefined, null, { timeout: 20000 });
  await page.waitForTimeout(2500);
  // A story panel (Apollo opens one at its first anchor) covers part of the canvas and would cover the sky; close it so the sky is read alone.
  await ui.closeStoryPanelIfOpen(page);
  await page.waitForTimeout(400);
  if (!query.includes("sky=off")) await page.waitForFunction(() => document.querySelector("canvas")?.dataset.skyStars !== "0", null, { timeout: 15000 });
  return page;
};

/** The sky as the scene reports it (T-102; the stars and the Milky Way picture in force, from the canvas readout, never from pixels). */
const skyOf = (page) => ui.sceneSky(page);
const pictureShown = (page, timeout = 15000) => page.waitForFunction(() => document.querySelector("canvas")?.dataset.skyPictureShown === "true", null, { timeout });

/** Where a camera with orientation q (x, y, z, w) puts the probe: rotate the direction by q's inverse, then perspective-project. */
function expectedNdc([qx, qy, qz, qw], aspect) {
  const [x, y, z] = PROBE;
  // v' = q^-1 v q, with q^-1 = (-qx, -qy, -qz, qw)
  const [ix, iy, iz] = [-qx, -qy, -qz];
  const tx = 2 * (iy * z - iz * y);
  const ty = 2 * (iz * x - ix * z);
  const tz = 2 * (ix * y - iy * x);
  const v = [x + qw * tx + (iy * tz - iz * ty), y + qw * ty + (iz * tx - ix * tz), z + qw * tz + (ix * ty - iy * tx)];
  const tan = Math.tan((FOV_DEG * Math.PI) / 360);
  return [v[0] / -v[2] / (tan * aspect), v[1] / -v[2] / tan];
}

const readProbe = async (page) => {
  const raw = await page.locator("canvas").getAttribute("data-sky-probe");
  assert.ok(raw, "the canvas carries data-sky-probe while Developer mode is on");
  const probe = JSON.parse(raw);
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  return { ...probe, aspect: box.width / box.height };
};

const checkProbe = async (page, label, step) => {
  await page.waitForTimeout(900);
  const probe = await readProbe(page);
  const expected = expectedNdc(probe.quaternion, probe.aspect);
  assert.ok(Math.abs(probe.ndc[0] - expected[0]) < 1e-3 && Math.abs(probe.ndc[1] - expected[1]) < 1e-3, `${label}: after ${step} the probe is where the camera orientation alone puts it (got ${probe.ndc}, expected ${expected})`);
  return probe;
};

const fpsOf = async (page) => {
  await page.locator("[data-frame-fps]").waitFor({ timeout: 10000 });
  await page.waitForTimeout(4000);
  return Number(await page.locator("[data-frame-fps]").innerText());
};

try {
  for (const [name, query] of EXPERIENCES) {
    for (const [sizeName, viewport] of SIZES) {
      const label = `${name}-${sizeName}`;
      if (!SAMPLED.has(label)) continue;
      const out = (results.runs[label] = {});
      // The same view without the sky, for the star pixels and the frame-rate comparison.
      const off = await open(viewport, [query, "sky=off"].filter(Boolean).join("&"));
      assert.equal(await off.locator("canvas").getAttribute("data-sky-stars"), null, `${label}: ?sky=off draws no sky`);
      const offSky = await skyOf(off);
      assert.equal(offSky.stars, 0, `${label}: ?sky=off draws no stars (scene readout)`);
      await ui.toggleDeveloper(off);
      out.fpsWithoutSky = await fpsOf(off);
      await off.close();

      const page = await open(viewport, [query, "milkyway=on"].filter(Boolean).join("&"));
      const canvas = page.getByTestId("earth-moon-canvas");
      assert.equal(await page.locator("canvas").getAttribute("data-sky-picture"), "on", `${label}: ?milkyway=on starts with the picture on`);
      const stars = await page.locator("canvas").getAttribute("data-sky-stars");
      out.stars = Number(stars);
      assert.equal(stars, starCount, `${label}: every star of V 6.5 or brighter in the HYG file is drawn`);
      await pictureShown(page);
      const onSky = await skyOf(page);
      out.sky = { on: onSky, off: offSky };
      assert.ok(onSky.stars > offSky.stars && onSky.starBrightness > 0, `${label}: the sky draws stars and the picture where ?sky=off draws none (${onSky.stars} stars at brightness ${onSky.starBrightness}, picture shown ${onSky.pictureShown})`);
      assert.ok(onSky.picture && onSky.pictureShown && onSky.milkyWayBrightness > 0, `${label}: ?milkyway=on shows the picture at a brightness above zero`);

      // The picture switch: the same view with the picture off still draws every star and the picture's light is gone.
      const noPicture = await open(viewport, query); // the default: the picture is off (owner decision 2026-10-15)
      assert.equal(await noPicture.locator("canvas").getAttribute("data-sky-stars"), stars, `${label}: the default (picture off) keeps every star`);
      const noPictureSky = await skyOf(noPicture);
      out.sky.noPicture = noPictureSky;
      assert.ok(noPictureSky.stars > offSky.stars && noPictureSky.starBrightness > 0, `${label}: stars are drawn with the picture off (${noPictureSky.stars} stars at brightness ${noPictureSky.starBrightness})`);
      assert.ok(!noPictureSky.picture && !noPictureSky.pictureShown && onSky.pictureShown, `${label}: the picture is shown with it on and not shown with it off (scene readout)`);
      await ui.toggleDeveloper(noPicture);
      assert.equal(await noPicture.locator("canvas").getAttribute("data-sky-picture"), "off", `${label}: the picture is off by default`);
      out.fpsPictureOff = await fpsOf(noPicture);
      // T-095: nothing of the Milky Way is fetched while the picture is off; switching it on fetches the two tiles, once.
      assert.deepEqual(noPicture.milkyRequests, [], `${label}: no Milky Way request with the picture off`);

      assert.equal(String(await ui.toggleOn(noPicture, "milky-way-picture")), "false", `${label}: the button shows the picture off`);
      await ui.pressToggleNow(noPicture, "milky-way-picture");
      await noPicture.waitForFunction(() => document.querySelector("canvas")?.dataset.skyPicture === "on", null, { timeout: 5000 });
      await noPicture.waitForTimeout(1500);
      assert.equal(noPicture.milkyRequests.length, 2, `${label}: switching the picture on fetches its two tiles (${noPicture.milkyRequests.length})`);
      // The brightness sliders change the star uniform in place: the canvas attribute follows the slider, with no rebuild.
      assert.equal(await noPicture.locator("canvas").getAttribute("data-sky-star-brightness"), "1", `${label}: star brightness starts at 1`);
      await ui.setSlider(noPicture, "star-brightness", "1.5");
      await noPicture.waitForFunction(() => document.querySelector("canvas")?.dataset.skyStarBrightness === "1.5", null, { timeout: 5000 });
      assert.equal(await ui.sliderReadout(noPicture, "star-brightness"), "1.50", `${label}: the slider shows its value`);
      assert.equal(await noPicture.locator("canvas").getAttribute("data-sky-stars"), stars, `${label}: moving the slider keeps every star (no rebuild)`);
      await ui.setSlider(noPicture, "milky-way-brightness", "0.5");
      assert.equal(await ui.sliderReadout(noPicture, "milky-way-brightness"), "0.50", `${label}: the Milky Way slider shows its value`);
      await noPicture.close();
      const urlGain = await open(viewport, [query, "stars=1.4"].filter(Boolean).join("&"));
      assert.equal(await urlGain.locator("canvas").getAttribute("data-sky-star-brightness"), "1.4", `${label}: ?stars=1.4 sets the star brightness`);
      await urlGain.close();
      const forcedOn = await open(viewport, [query, "milkyway=on"].filter(Boolean).join("&"));
      await pictureShown(forcedOn);
      assert.ok((await skyOf(forcedOn)).pictureShown, `${label}: ?milkyway=on draws the picture`);
      assert.equal(forcedOn.milkyRequests.length, 2, `${label}: ?milkyway=on fetches the two tiles`);
      await forcedOn.close();

      // The panel's Sky item.
      await ui.pickBody(page, "sky");
      await ui.openInfo(page);
      await ui.infoPanel(page).waitFor();
      await ui.openProvenance(page);
      const detail = (await ui.provenanceDetail(page).innerText()).replace(/\s+/g, " ");
      assert.match(detail, /HYG star database v4\.2.*CC BY-SA 4\.0/, `${label}: the Sky item cites the HYG star catalogue and its licence`);
      assert.match(detail, /ESO\/S\. Brunier/, `${label}: the Sky item cites the Milky Way image`);
      assert.match(detail, new RegExp(`${starCount} stars`), `${label}: the panel counts the stars`);
      out.panel = detail.slice(0, 400);
      await ui.closeInfoStrict(page);
      await ui.pickBody(page, { index: 0 });

      // Fixed under a centre change; turns with the camera.
      await ui.toggleDeveloper(page);
      out.fpsWithSky = await fpsOf(page);
      const probes = [await checkProbe(page, label, "start")];
      // The scale is one toggle button (T-079): "Scale: Readable. Switch to True" and back. T-085: Apollo 11 has True scale only and no toggle, so its "scale" requests
      // are skipped (pressFirstControlNow returns false); Earth–Moon and the Perseids, which keep both scales, carry the scale requests that Apollo used to.
      for (const request of ["scale", "overview", "focus", "follow", "scale"]) {
        if (!(await ui.pressFirstControlNow(page, request))) continue; // pressed from inside the page: the developer panel covers some controls on a phone
        probes.push(await checkProbe(page, label, request));
      }
      out.probeChecks = probes.length;
      assert.ok(probes.length >= 3, `${label}: at least the start and two requests were checked`);
      const before = probes.at(-1);
      const box = await canvas.boundingBox();
      // A drag needs a point where the canvas itself is on top; the developer panel can cover most of a phone's screen.
      let start = null;
      for (const [fx, fy] of [[0.15, 0.4], [0.5, 0.3], [0.15, 0.15], [0.85, 0.15], [0.5, 0.6]]) {
        const point = { x: box.x + box.width * fx, y: box.y + box.height * fy };
        if (await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === "CANVAS", point)) { start = point; break; }
      }
      if (start === null) {
        out.dragSkipped = "the developer panel covers the whole canvas at this size";
      } else {
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(Math.min(start.x + 120, box.x + box.width - 2), start.y + 40, { steps: 8 });
        await page.mouse.up();
        const after = await checkProbe(page, label, "a drag");
        assert.ok(Math.hypot(after.ndc[0] - before.ndc[0], after.ndc[1] - before.ndc[1]) > 0.02, `${label}: the sky turns with the camera (${before.ndc} -> ${after.ndc})`);
      }
      await page.close();
    }
  }
  // A high-DPI screen: the stars are drawn at the device pixel ratio without errors.
  {
    const page = await open({ width: 1280, height: 800 }, "experience=synthetic&milkyway=off", 2);
    assert.equal(await page.locator("canvas").getAttribute("data-sky-stars"), starCount, "dpr2: every star is drawn");
    await page.close();
  }
  assert.deepEqual(errors, [], "no page or console errors");
  results.errors = 0;
  console.log(JSON.stringify(results, null, 2));
} finally {
  if (outDir) writeFileSync(join(outDir, "browser-sky.json"), `${JSON.stringify({ ...results, errors }, null, 2)}\n`);
  await browser.close();
}
