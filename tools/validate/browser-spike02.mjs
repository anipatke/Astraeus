// Spike 01/02 browser regression against the current generic shell.
// Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> node tools/validate/browser-spike02.mjs
// Results are isolated under docs/evidence/regression-spike01-02/; committed Spike 02 evidence is untouched.
//
// Sizes (I-023): the whole scenario runs at 1280x800 (desktop) and again at 390x844 (phone), in one browser, the same assertions at both.
// Every desktop assertion is unchanged and runs at the phone size with the same expected values, because each checks telemetry, time,
// the event list or the clock rather than layout. The only difference is how a camera preset is chosen: the phone shell hides the
// camera buttons (.object-camera-actions) and shows a native "Camera mode" select, so chooseCamera picks the option with the same label.
//   desktop assertion                                             phone counterpart
//   six phases: readouts present at True (the only Apollo scale; the both-scales pairs are in browser-shell on Earth–Moon) ... same, at 390x844 (scale buttons clicked with the Developer panel
//                                                                    closed, because the phone panel overlays them)
//   camera presets leave UTC and spacecraft readouts unchanged .... same (select option instead of button)
//   30 events in Developer mode, same list as the timeline, each
//     jump lands on the event's UTC ................................ same
//   four playback rates measure within 0.5x to 1.5x ................ same
//   100x follow track: numeric, monotonic, continuous range ........ same
//   four USNO phases within 1 percentage point ..................... same
//   zero console and page errors ................................... same (one error list across both sizes)
// Phone-only layout assertions are not added here; browser-shell.mjs and browser-spike03.mjs own phone layout.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chooseScale as chooseScaleByLabel, hasScaleControl } from "./driver.mjs";
import * as ui from "./driver.mjs";

import { pw } from "./playwright.mjs";
const chromium = pw.chromium ?? pw.default.chromium;
const url = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const out = process.env.ASTRAEUS_EVIDENCE_DIR ?? "docs/evidence/regression-spike01-02";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let page;
const errors = [];
const sizes = [["desktop", { width: 1280, height: 800 }], ["phone", { width: 390, height: 844 }]];
const results = [];

const pause = () => ui.ensurePaused(page);
const readTime = async () => ui.clockIso(page);
const readMission = async () => (await ui.missionReadouts(page))
  .map((value) => value.replace(/\s+/g, " ").trim());
const seek = async (utc) => {
  await ui.seekToUtcText(page, utc);
  await page.waitForTimeout(150);
};
const selectObject = async (id) => {
  await ui.pickBody(page, id);
  if (!(await ui.infoOpen(page))) return;
  // The phone's open Developer panel overlays the sheet's Close button, so the phone closes the sheet with Escape from the focused Close button (a documented alternative).
  await ui.closeInfoForViewport(page);
  await ui.waitForInfoClosed(page);
};
// On the phone the open Developer panel is a fixed overlay above the scale buttons, so the panel is closed around the scale click
// (the same user path: Developer mode off, choose the scale, Developer mode on). On desktop the button is clicked directly.
const chooseScale = async (scale) => {
  const compactPhone = page.viewportSize().width < 600;
  if (compactPhone) {
    await ui.toggleDeveloper(page);
    await ui.waitForUtcField(page, { state: "hidden" });
  }
  await chooseScaleByLabel(page, scale);
  if (compactPhone) {
    await ui.toggleDeveloper(page);
    await ui.waitForUtcField(page);
  }
};
const chooseCamera = async (objectId, presetId) => {
  await selectObject(objectId);
  await ui.chooseCamera(page, presetId);
  await page.waitForTimeout(700);
};

async function run(label, viewport) {
  page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${label} console: ${message.text()}`); });
  await page.goto(url);
  await page.waitForSelector("canvas");
  await ui.toggleDeveloper(page);
  await ui.waitForUtcField(page);
  await pause();

  // Six mission phases. T-085: Apollo 11 offers True scale only, so the "identical under both scales" pairs moved to browser-shell.mjs (Earth–Moon keeps both
  // scales; its readouts are compared under True and Readable). Here each phase is read at True and Apollo is checked to have no scale control.
  assert.equal(await hasScaleControl(page), false, "Apollo 11 has no scale control (one scale)");
  const phases = [
    { id: "earth-orbit", utc: "1969-07-16 14:30:00", object: "columbia", camera: "follow-columbia" },
    { id: "translunar", utc: "1969-07-18 12:00:00", object: "columbia", camera: "follow-columbia" },
    { id: "lunar-orbit-columbia", utc: "1969-07-21 06:00:00", object: "columbia", camera: "follow-columbia" },
    { id: "lunar-surface-eagle", utc: "1969-07-21 06:00:00", object: "eagle", camera: "follow-eagle" },
    { id: "return", utc: "1969-07-23 12:00:00", object: "columbia", camera: "follow-columbia" },
    { id: "entry", utc: "1969-07-24 16:30:00", object: "columbia", camera: "follow-columbia" },
  ];
  const scaleRuns = [];
  for (const scale of ["True"]) {
    for (const phase of phases) {
      await pause();
      await chooseScale(scale);
      await seek(phase.utc);
      await chooseCamera(phase.object, phase.camera);
      const readouts = await readMission();
      assert.ok(readouts.length > 0, `${phase.id}: spacecraft readouts are present`);
      scaleRuns.push({ id: phase.id, scale, utc: phase.utc, readouts });
    }
  }
  const scalePairs = phases.map(({ id }) => ({ id, same: scaleRuns.some((run) => run.id === id && run.readouts.length > 0) }));

  // Camera selection/presets do not change time or telemetry.
  await pause();
  await seek("1969-07-20 20:17:00");
  await page.waitForTimeout(600); // let the 250 ms telemetry sampler catch up with the fixed seek
  const timeBeforeCameras = await readTime();
  const readoutsBeforeCameras = await readMission();
  const cameraStates = [];
  for (const [object, preset] of [
    ["earth", "focus-earth"],
    ["moon", "focus-moon"],
    ["columbia", "focus-columbia"],
    ["eagle", "focus-eagle"],
    ["columbia", "follow-columbia"],
    ["earth", "overview"],
  ]) {
    await chooseCamera(object, preset);
    const state = { preset, time: await readTime(), readouts: await readMission() };
    assert.equal(state.time, timeBeforeCameras, `${preset}: UTC is unchanged`);
    assert.deepEqual(state.readouts, readoutsBeforeCameras, `${preset}: spacecraft readouts are unchanged`);
    cameraStates.push(state);
  }

  // Each developer event selector entry seeks to that event's timeline timestamp.
  await pause();
  const timelineEvents = await ui.eventRows(page);
  const eventOptions = await ui.missionEventOptions(page);
  assert.equal(eventOptions.length, 30, "all 30 mission events are available in Developer mode");
  assert.equal(timelineEvents.length, eventOptions.length, "timeline and developer event lists have the same size");
  const eventJumps = [];
  for (const option of eventOptions) {
    const timelineEvent = timelineEvents.find((event) => event.label === option.label);
    assert.ok(timelineEvent, `timeline event label matches Developer mode: ${option.label}`);
    await ui.pickMissionEvent(page, option.value);
    await ui.jumpToMissionEvent(page);
    // The shell clock readout is refreshed by App's 100 ms snapshot poll.
    // Under a loaded machine (the full run's parallel lanes) the poll can lag; wait for the readout to reach the event, then assert as before.
    const expected = timelineEvent.utc;
    await ui.waitForClock(page, expected, 5000).catch(() => {});
    const actual = await readTime();
    assert.equal(Date.parse(actual), Date.parse(expected), `event lands at ${option.label}`);
    eventJumps.push({ label: option.label, expected, actual });
  }

  // Check the four supported playback rates against elapsed simulation time.
  const rates = [];
  for (const rate of [1, 100, 1_000, 10_000]) {
    await pause();
    await seek("1969-07-17 00:00:00");
    await ui.setSpeed(page, rate);
    assert.equal(Number(await ui.speed(page)), rate, `${rate}× can be selected`);
    const simulationStart = Date.parse(await readTime());
    await ui.playPlayback(page);
    const wallStart = Date.now();
    await page.waitForTimeout(4_000);
    await pause();
    await page.waitForTimeout(250);
    const wallSeconds = (Date.now() - wallStart) / 1_000;
    const simulationSeconds = (Date.parse(await readTime()) - simulationStart) / 1_000;
    const measuredRate = simulationSeconds / wallSeconds;
    assert.ok(measuredRate > rate * 0.5 && measuredRate < rate * 1.5, `${rate}× measured about ${measuredRate.toFixed(1)}×`);
    rates.push({ rate, measuredRate, simulationSeconds, wallSeconds });
  }

  // Follow through lunar orbit at 100× and sample consecutive physical range/speed values.
  await pause();
  await seek("1969-07-20 17:00:00");
  await chooseCamera("columbia", "follow-columbia");
  await ui.setSpeed(page, 100);
  await ui.playPlayback(page);
  const track = [];
  const rangeReadout = page.locator('[data-metric="columbia-range"] .metric-value');
  const speedReadout = page.locator('[data-metric="columbia-speed"] .metric-value');
  for (let index = 0; index < 30; index += 1) {
    await page.waitForTimeout(400);
    const time = Date.parse(await readTime());
    const rangeKm = Number((await rangeReadout.textContent()).replaceAll(",", ""));
    const speedKmS = Number((await speedReadout.textContent()).replaceAll(",", ""));
    // The readouts are read one after another while playback runs (T-071: under load the gap grew until the bound below failed once), so the range is bounded by the
    // simulated time from the previous sample's first read to this sample's last read, not by the gap between the two time reads alone.
    const timeAfter = Date.parse(await readTime());
    assert.ok(Number.isFinite(time) && Number.isFinite(rangeKm) && Number.isFinite(speedKmS), "follow telemetry stays numeric");
    if (track.length > 0) {
      const previous = track.at(-1);
      const elapsedSeconds = (time - previous.time) / 1_000;
      assert.ok(elapsedSeconds > 0, "follow time advances monotonically");
      assert.ok(Math.abs(rangeKm - previous.rangeKm) <= Math.max(5, Math.max(speedKmS, previous.speedKmS) * ((timeAfter - previous.time) / 1_000) * 1.5), "range changes continuously within the speed bound");
    }
    track.push({ time, rangeKm, speedKmS });
  }
  await pause();
  assert.ok(track.at(-1).time - track[0].time >= 5 * 60_000, "the 100× track spans several simulated minutes");

  // Spike 01 USNO phase dates remain visible through the current developer instrumentation.
  await pause();
  await chooseScale("True");
  await seek("2024-01-04 03:30:00");
  await chooseCamera("moon", "focus-moon");
  const expectedIllumination = [50.1, 0.2, 50.1, 99.8];
  const usnoDates = [
    "2024-01-04 03:30:00",
    "2024-01-11 11:57:00",
    "2024-01-18 03:52:00",
    "2024-01-25 17:54:00",
  ];
  const usno = [];
  for (let index = 0; index < usnoDates.length; index += 1) {
    await seek(usnoDates[index]);
    await page.waitForTimeout(600);
    const text = await page.locator('[data-metric="lunar-illumination"] .metric-value').textContent();
    const illuminationPercent = Number(text.replaceAll(",", ""));
    assert.ok(Math.abs(illuminationPercent - expectedIllumination[index]) <= 1, `${usnoDates[index]} illumination is near ${expectedIllumination[index]}%`);
    usno.push({ utc: usnoDates[index], expectedPercent: expectedIllumination[index], illuminationPercent });
  }

  assert.deepEqual(errors, [], `${label}: console and page errors are empty`);
  const result = {
    url,
    viewport: `${viewport.width}x${viewport.height}`,
    scalePairs,
    cameraStates: cameraStates.map(({ preset, time }) => ({ preset, time })),
    eventJumps,
    rates,
    followTrack: { samples: track.length, start: track[0], end: track.at(-1) },
    usno,
    errors,
  };
  writeFileSync(`${out}/browser-spike02-results${label === "desktop" ? "" : `-${label}`}.json`, JSON.stringify(result, null, 2));
  results.push({
    label,
    scalePairs: scalePairs.length,
    cameraPresets: cameraStates.length,
    eventJumps: eventJumps.length,
    rates,
    followSamples: track.length,
    usno,
  });
  await page.close();
}

try {
  for (const [label, viewport] of sizes) await run(label, viewport);
  assert.deepEqual(errors, [], "console and page errors are empty");
  console.log(JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
