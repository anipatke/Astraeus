// Browser check for a shower built from a settings file (default: Perseids). Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> [ASTRAEUS_SHOWER=perseids] node tools/validate/browser-showers.mjs
//
// T-047 scenario map. Every earlier scenario is kept unchanged; the Sun-Earth composition adds the last block (checkSunEarth).
//   one stream group, listed once, no Apollo objects ........ asserted first, unchanged
//   activity window, peak marker, rate curve ................ asserted on the timeline, unchanged
//   stream drawn and rate readout at start, peak and end .... focusStream + litPixels + the rate readout, unchanged
//   stream visible zoomed out, rate rises to the peak ....... unchanged
//   radiant, illustrative badge, stated limitation .......... unchanged
//   window details .......................................... unchanged
//   Apollo default and synthetic-ring still mount ........... unchanged
//   NEW (replaces the retired Earth-Moon alias scene) ....... Sun at the origin, no Moon item, Earth on its path at start and peak,
//                                                              solar-system scale shows Earth and states its factor, follow Earth
//   T-049 additions (nothing above changed except the declared-path count 2 -> 6 and the listed ids):
//     Mercury, Venus, Mars and Jupiter orbit paths declared ... data-sun-centred is 6, the four `<planet>-orbit` items are listed, each
//                                                              opens an info panel with provenance, Jupiter's states the span passes 2030
//     the four orbits are drawn around the Sun with Earth's .. tan orbit-line pixels appear in the far overview (checkPlanetOrbits)
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const shower = process.env.ASTRAEUS_SHOWER ?? "perseids";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};

async function openPage(viewport) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  return page;
}

// Stream-coloured pixels on the canvas (amber dots, not the grey orbit lines, white text or blue Earth): the stream is visible when its dots are drawn.
const litPixels = async (page) => {
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let lit = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 150 && pixels[i + 1] > 90 && pixels[i + 1] < 215 && pixels[i + 2] < 150 && pixels[i] - pixels[i + 2] > 70) lit += 1;
    return lit;
  }, png);
};

// Pixels in the colours of Earth's path (blue) and the parent's orbit (violet); Earth itself is invisible at true scale, so these are the lines.
const pathPixels = async (page) => {
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    const half = Math.floor(copy.width / 2);
    const count = { blue: 0, violet: 0, left: 0, right: 0, bright: 0 };
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      const x = (i / 4) % copy.width;
      if (b > 90 && b - r > 35 && b - g > 15 && g >= r) { count.blue += 1; if (x < half) count.left += 1; else count.right += 1; }
      if (b > 110 && r - g > 15 && b - r > 25) count.violet += 1;
      if (r + g + b > 60) count.bright += 1;
    }
    return count;
  }, png);
};

const seek = async (page, timeUtcMs) => {
  await page.locator('input[aria-label="Seek timeline"]').evaluate((input, time) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, timeUtcMs);
  await page.waitForTimeout(500);
};

// Planet orbit lines are drawn in the planets' own tan material colours at 70% opacity (about 150,120,90): not the blue of Earth's path,
// the violet of the parent's orbit or the amber of the stream.
const planetOrbitPixels = async (page) => {
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let tan = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      if (r > 110 && r < 200 && r - g > 15 && r - g < 45 && g - b > 15 && g - b < 50 && r - b > 40) tan += 1;
    }
    return tan;
  }, png);
};

// T-049: the four planet orbits are items with provenance, and their lines are drawn around the Sun.
async function checkPlanetOrbits(page, label, shot, canvas, choose, closeInfo) {
  const out = (results[label].planetOrbits = {});
  for (const id of ["mercury", "venus", "mars", "jupiter"]) {
    await page.getByLabel("Select object").selectOption(`${id}-orbit`);
    if (!(await page.locator("#info-panel").count())) await page.getByRole("button", { name: new RegExp(`^Information about .+ orbit$`) }).click();
    await page.locator("#info-panel").waitFor();
    const text = (await page.locator("#info-panel").innerText()).replace(/\s+/g, " ");
    assert.match(text, /orbit/i, `${label}: ${id}'s orbit panel opens`);
    await page.locator("#info-panel .provenance-badge").click();
    const detail = (await page.locator("#info-panel .provenance-detail").innerText()).replace(/\s+/g, " ");
    assert.match(detail, /Horizons/, `${label}: ${id}'s orbit carries the planet's position provenance`);
    if (id === "jupiter") assert.match(detail, /reaches past 2030/, `${label}: Jupiter's orbit states that it passes the compared range`);
    out[id] = detail.slice(0, 200);
    await closeInfo();
  }
  await choose("sun", "Overview");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 12; i += 1) await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1200);
  out.tanPixels = await planetOrbitPixels(page);
  assert.ok(out.tanPixels > 150, `${label}: the planets' orbit lines are drawn around the Sun (${out.tanPixels})`);
  await shot("planet-orbits");
}

// The Sun-Earth composition: the Sun is the scene's zero, Earth moves on its drawn path, no Moon exists, and the solar-system scale shows Earth.
async function checkSunEarth(page, label, shot, canvas) {
  const out = (results[label].sunEarth = {});
  assert.equal(await canvas.getAttribute("data-scene-center"), "sun", `${label}: the Sun is the scene centre`);
  assert.equal(await canvas.getAttribute("data-bodies"), "sun,earth", `${label}: the mounted bodies are the Sun and Earth`);
  assert.equal(await canvas.getAttribute("data-sun-centred"), "6", `${label}: Earth's path, four planet orbits and the parent's orbit are declared`);
  const options = await page.getByLabel("Select object").evaluate((select) => [...select.options].map((o) => o.value));
  for (const id of ["sun", "earth", "earth-path", "mercury-orbit", "venus-orbit", "mars-orbit", "jupiter-orbit", `${shower}-parent-orbit`, `${shower}-stream`]) assert.ok(options.includes(id), `${label}: ${id} is listed`);
  assert.ok(!options.includes("moon"), `${label}: no Moon item`);
  const scales = await page.locator(".scale-choices button[data-scale]").evaluateAll((buttons) => buttons.map((b) => b.dataset.scale));
  assert.deepEqual(scales, ["true-scale", "solar-system"], `${label}: true and solar-system scale`);

  // The Sun at the origin: with the Sun focused the camera is centred on it, so its marker is at the middle of the canvas.
  const closeInfo = async () => { const close = page.locator("#info-panel .info-panel-close"); if (await close.count()) await close.click(); };
  const choose = async (objectId, name) => {
    await page.getByLabel("Select object").selectOption(objectId);
    await closeInfo();
    const compact = page.locator(".object-camera-picker");
    if (await compact.isVisible()) {
      const value = await compact.evaluate((select, text) => [...select.options].find((o) => o.textContent.trim() === text)?.value ?? null, name);
      assert.ok(value, `${label}: preset exists: ${name}`);
      await compact.selectOption(value);
    } else {
      await page.getByRole("button", { name, exact: true }).click();
    }
    await page.waitForTimeout(1500);
  };
  const start = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("min"));
  const peak = Number(await page.locator("button.timeline-window-peak").evaluate((button) => button.dataset.timeUtcMs ?? 0)) || null;
  out.path = {};
  await checkPlanetOrbits(page, label, shot, canvas, choose, closeInfo);
  // Earth on its path at the start and at the peak: overview shows the blue path; following Earth keeps the line passing both sides of it.
  for (const [name, move] of [["start", () => seek(page, start)], ["peak", async () => { await page.locator("button.timeline-window-peak").click(); await page.waitForTimeout(500); await closeInfo(); }]]) {
    await move();
    await choose("sun", "Overview");
    const overview = await pathPixels(page);
    assert.ok(overview.blue > 100, `${label}/${name}: Earth's path is drawn (${overview.blue})`);
    assert.ok(overview.violet > 60, `${label}/${name}: the parent's orbit is drawn (${overview.violet})`);
    await shot(`sun-overview-${name}`);
    await choose("earth", "Focus Earth");
    // Frame Earth with the path in view: pull back a little from the close framing.
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 3; i += 1) await page.mouse.wheel(0, 300);
    await page.waitForTimeout(800);
    const near = await pathPixels(page);
    out.path[name] = { overview, near };
    assert.ok(near.left > 20 && near.right > 20, `${label}/${name}: the path runs on both sides of Earth (${near.left}/${near.right})`);
    await shot(`earth-on-path-${name}`);
  }

  // Solar-system scale: Earth becomes visible, and its info panel states the factor.
  await choose("earth", "Focus Earth");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 6; i += 1) await page.mouse.wheel(0, 600);
  await page.waitForTimeout(800);
  const trueCount = (await pathPixels(page)).bright;
  await page.getByRole("button", { name: "Solar system", exact: true }).click();
  await page.waitForTimeout(1200);
  const solarCount = (await pathPixels(page)).bright;
  out.brightPixels = { trueScale: trueCount, solarSystem: solarCount };
  assert.ok(solarCount > trueCount + 150, `${label}: Earth is visible in the solar-system scale (${trueCount} -> ${solarCount})`);
  await shot("earth-solar-system");
  await page.getByRole("button", { name: /^Information about Earth$/ }).click();
  const earthPanel = (await page.locator("#info-panel").innerText()).replace(/\s+/g, " ");
  assert.match(earthPanel, /Earth/, `${label}: Earth's info panel opens`);
  await page.locator("#info-panel .provenance-badge").click();
  const earthDetail = (await page.locator("#info-panel .provenance-detail").innerText()).replace(/\s+/g, " ");
  assert.match(earthDetail, /400 times larger than life/, `${label}: Earth's factor is stated`);
  out.earthFactor = earthDetail.match(/[^.]*400 times larger[^.]*\./)?.[0] ?? null;
  await closeInfo();

  // Follow Earth through the activity window under the solar-system scale.
  await choose("earth", "Follow Earth");
  const end = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("max"));
  const sizes = [];
  for (const time of [start, start + (end - start) / 2, end]) {
    await seek(page, time);
    await page.waitForTimeout(600);
    sizes.push((await pathPixels(page)).bright);
  }
  out.followBright = sizes;
  assert.ok(sizes.every((count) => count > 500), `${label}: Earth stays in view while followed (${sizes})`);
  await shot("follow-earth-end");
  void peak;
}

async function run(label, viewport) {
  const page = await openPage(viewport);
  const shot = async (name) => { if (outDir) await page.screenshot({ path: `${outDir}/${label}-${name}.png` }); };
  const streamId = `${shower}-stream`;
  try {
    await page.goto(`${base}?experience=shower-${shower}`);
    await page.waitForSelector("canvas");
    await page.getByRole("region", { name: "Timeline controls" }).waitFor();
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.equal(await canvas.getAttribute("data-point-groups"), "1", `${label}: one stream group is mounted`);
    assert.equal(await page.locator(`option[value="${streamId}"]`).count(), 1, `${label}: the stream is listed once`);
    assert.equal(await page.locator('option[value="columbia"]').count(), 0, `${label}: no Apollo objects`);
    assert.equal(await page.locator('option[value="moon"]').count(), 0, `${label}: no Moon item`);
    await page.getByRole("button", { name: "Pause playback" }).click();

    // The activity window and its peak are on the timeline.
    const windowButton = page.locator("button.timeline-window");
    assert.equal(await windowButton.count(), 1, `${label}: one activity window`);
    const peakButton = page.locator("button.timeline-window-peak");
    assert.equal(await peakButton.count(), 1, `${label}: the peak is marked`);
    assert.ok(await page.locator(".timeline-window-curve path").count() >= 2, `${label}: the rate curve is drawn`);
    const windowLabel = await windowButton.getAttribute("aria-label");
    const [startText, endText] = windowLabel.split(", ").slice(1).join(", ").split(" to ");
    results[label] = { windowLabel, startText, endText, readings: {} };

    // Step to window start, peak and end; the stream is drawn and the rate readout follows the curve.
    const panel = page.locator("#info-panel");
    // Select the stream, frame it with the Focus stream preset, then open its details with Info.
    const focusStream = async () => {
      await page.getByLabel("Select object").selectOption("earth");
      await page.getByLabel("Select object").selectOption(streamId);
      const close = page.locator("#info-panel .info-panel-close");
      if (await close.count()) await close.click();
      const compactPicker = page.locator(".object-camera-picker");
      if (await compactPicker.isVisible()) {
        const value = await compactPicker.evaluate((select) => [...select.options].find((o) => o.textContent.trim() === "Focus stream")?.value ?? null);
        assert.ok(value, `${label}: Focus stream preset exists`);
        await compactPicker.selectOption(value);
      } else {
        await page.getByRole("button", { name: "Focus stream", exact: true }).click();
      }
      await page.waitForTimeout(1500);
    };
    const openDetails = async () => {
      if (!(await panel.count())) await page.getByRole("button", { name: /^Information about Perseids stream$/ }).click();
      await panel.waitFor();
      assert.equal(await panel.getAttribute("data-info-id"), streamId, `${label}: the stream's details are shown`);
    };

    const start = await page.locator('input[aria-label="Seek timeline"]').getAttribute("min");
    const end = await page.locator('input[aria-label="Seek timeline"]').getAttribute("max");
    for (const [name, move] of [
      ["start", () => seek(page, Number(start))],
      ["peak", async () => { await peakButton.click(); await page.waitForTimeout(500); }],
      ["end", () => seek(page, Number(end))],
    ]) {
      await move();
      // Jumping to the peak opens the window's details; frame the stream again, then read its own details.
      await focusStream();
      const lit = await litPixels(page);
      assert.ok(lit > 150, `${label}/${name}: stream dots are visible (${lit})`);
      await shot(`${name}-focus`);
      await openDetails();
      const text = await panel.innerText();
      assert.match(text, /Activity rate/, `${label}/${name}: rate readout is shown`);
      results[label].readings[name] = { lit, panel: text.replace(/\s+/g, " ").slice(0, 400) };
      await shot(name);
    }
    // Zoomed far out the stream and Earth are in one view.
    await focusStream();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 8; i += 1) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(800);
    results[label].zoomedOutLit = await litPixels(page);
    assert.ok(results[label].zoomedOutLit > 150, `${label}: stream visible zoomed out (${results[label].zoomedOutLit})`);
    await shot("zoomed-out");
    await openDetails();
    // The readout rises to the peak and falls again.
    const rateOf = (name) => Number(results[label].readings[name].panel.match(/Activity rate\D*([\d.]+)/)?.[1]);
    assert.ok(rateOf("peak") > rateOf("start"), `${label}: rate at the peak is above the start`);
    assert.ok(rateOf("peak") > rateOf("end"), `${label}: rate at the peak is above the end`);

    // The radiant and the published/modelled split are visible in the stream's details.
    const text = await panel.innerText();
    assert.match(text, /Radiant/, `${label}: radiant readout`);
    assert.match(text, /RA 48\.0/, `${label}: radiant right ascension`);
    const badge = panel.locator(".provenance-badge");
    assert.match(await badge.innerText(), /^Illustrative/, `${label}: the stream is marked illustrative`);
    await badge.click();
    const detail = await panel.locator(".provenance-detail").innerText();
    assert.match(detail, /Modelled spread, two-body, not observed/i, `${label}: limitation is stated`);
    await shot("stream-details");

    // The window's own details name the published night and the modelled shape.
    await windowButton.click();
    await page.waitForTimeout(400);
    const windowPanel = await page.locator("#info-panel").innerText();
    assert.match(windowPanel, /activity/i, `${label}: window details open`);
    results[label].windowPanel = windowPanel.replace(/\s+/g, " ").slice(0, 600);
    await shot("window-details");
    await checkSunEarth(page, label, shot, canvas);
  } finally {
    await page.close();
  }
}

try {
  await run("desktop", { width: 1280, height: 800 });
  await run("phone", { width: 390, height: 844 });
  // Existing experiences still mount by their old names.
  const page = await openPage({ width: 1280, height: 800 });
  await page.goto(base);
  await page.waitForSelector("canvas");
  assert.equal(await page.locator('option[value="columbia"]').count(), 1, "Apollo is still the default");
  await page.goto(`${base}?experience=synthetic-ring`);
  await page.waitForSelector("canvas");
  assert.equal(await page.locator('option[value="debris-ring"]').count(), 1, "synthetic-ring still mounts");
  await page.close();
} finally {
  await browser.close();
}
console.log(JSON.stringify({ shower, results, errors }, null, 2));
if (errors.length > 0) process.exit(1);
