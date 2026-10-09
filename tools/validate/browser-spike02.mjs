// Spike 01/02 browser regression against the current generic shell.
// Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> node tools/validate/browser-spike02.mjs
// Results are isolated under docs/evidence/regression-spike01-02/; committed Spike 02 evidence is untouched.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const url = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const out = "docs/evidence/regression-spike01-02";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

const click = (name) => page.getByRole("button", { name, exact: true }).click();
const pause = async () => {
  const button = page.getByRole("button", { name: "Pause playback", exact: true });
  if (await button.count()) await button.click();
};
const readTime = async () => page.locator(".timeline-time").getAttribute("datetime");
const readMission = async () => (await page.locator(".mission .readout").allTextContents())
  .map((value) => value.replace(/\s+/g, " ").trim());
const seek = async (utc) => {
  const input = page.getByLabel("UTC date and time");
  await input.fill(utc);
  await click("Seek (UTC)");
  await page.waitForTimeout(150);
};
const selectObject = async (id) => {
  await page.getByLabel("Select object").selectOption(id);
  const close = page.locator("#info-panel .info-panel-close");
  if (await close.count()) await close.click();
};
const chooseCamera = async (objectId, name) => {
  await selectObject(objectId);
  await click(name);
  await page.waitForTimeout(700);
};

try {
  await page.goto(url);
  await page.waitForSelector("canvas");
  await page.getByRole("button", { name: "Developer mode" }).click();
  await page.getByLabel("UTC date and time").waitFor();
  await pause();

  // Six mission phases at both scales: scientific telemetry must be identical.
  const phases = [
    { id: "earth-orbit", utc: "1969-07-16 14:30:00", object: "columbia", camera: "Follow Columbia (CSM)" },
    { id: "translunar", utc: "1969-07-18 12:00:00", object: "columbia", camera: "Follow Columbia (CSM)" },
    { id: "lunar-orbit-columbia", utc: "1969-07-21 06:00:00", object: "columbia", camera: "Follow Columbia (CSM)" },
    { id: "lunar-surface-eagle", utc: "1969-07-21 06:00:00", object: "eagle", camera: "Follow Eagle (LM)" },
    { id: "return", utc: "1969-07-23 12:00:00", object: "columbia", camera: "Follow Columbia (CSM)" },
    { id: "entry", utc: "1969-07-24 16:30:00", object: "columbia", camera: "Follow Columbia (CSM)" },
  ];
  const scaleRuns = [];
  for (const scale of ["Readable", "True"]) {
    for (const phase of phases) {
      await pause();
      await page.getByRole("button", { name: scale, exact: true }).click();
      await seek(phase.utc);
      await chooseCamera(phase.object, phase.camera);
      const readouts = await readMission();
      assert.ok(readouts.length > 0, `${phase.id}: spacecraft readouts are present`);
      scaleRuns.push({ id: phase.id, scale, utc: phase.utc, readouts });
    }
  }
  const scalePairs = phases.map(({ id }) => {
    const readable = scaleRuns.find((run) => run.id === id && run.scale === "Readable");
    const trueScale = scaleRuns.find((run) => run.id === id && run.scale === "True");
    const same = JSON.stringify(readable?.readouts) === JSON.stringify(trueScale?.readouts);
    assert.equal(same, true, `${id}: physical readouts match under both scales`);
    return { id, same };
  });

  // Camera selection/presets do not change time or telemetry.
  await pause();
  await seek("1969-07-20 20:17:00");
  await page.waitForTimeout(600); // let the 250 ms telemetry sampler catch up with the fixed seek
  const timeBeforeCameras = await readTime();
  const readoutsBeforeCameras = await readMission();
  const cameraStates = [];
  for (const [object, preset] of [
    ["earth", "Focus Earth"],
    ["moon", "Focus Moon"],
    ["columbia", "Focus Columbia (CSM)"],
    ["eagle", "Focus Eagle (LM)"],
    ["columbia", "Follow Columbia (CSM)"],
    ["earth", "Earth–Moon overview"],
  ]) {
    await chooseCamera(object, preset);
    const state = { preset, time: await readTime(), readouts: await readMission() };
    assert.equal(state.time, timeBeforeCameras, `${preset}: UTC is unchanged`);
    assert.deepEqual(state.readouts, readoutsBeforeCameras, `${preset}: spacecraft readouts are unchanged`);
    cameraStates.push(state);
  }

  // Each developer event selector entry seeks to that event's timeline timestamp.
  await pause();
  const timelineEvents = await page.locator(".timeline-event-list li button").evaluateAll((buttons) => buttons.map((button) => ({
    label: button.querySelector("span")?.textContent?.trim() ?? "",
    utc: button.querySelector("time")?.getAttribute("datetime") ?? "",
  })));
  const eventPicker = page.getByLabel("Mission event");
  const eventOptions = await eventPicker.locator("option").evaluateAll((options) => options.map((option) => ({
    value: option.value,
    label: option.textContent?.trim() ?? "",
  })));
  assert.equal(eventOptions.length, 30, "all 30 mission events are available in Developer mode");
  assert.equal(timelineEvents.length, eventOptions.length, "timeline and developer event lists have the same size");
  const eventJumps = [];
  for (const option of eventOptions) {
    const timelineEvent = timelineEvents.find((event) => event.label === option.label);
    assert.ok(timelineEvent, `timeline event label matches Developer mode: ${option.label}`);
    await eventPicker.selectOption(option.value);
    await click("Jump to event");
    // The shell clock readout is refreshed by App's 100 ms snapshot poll.
    await page.waitForTimeout(150);
    const actual = await readTime();
    const expected = timelineEvent.utc;
    assert.equal(Date.parse(actual), Date.parse(expected), `event lands at ${option.label}`);
    eventJumps.push({ label: option.label, expected, actual });
  }

  // Check the four supported playback rates against elapsed simulation time.
  const playback = page.getByLabel("Playback speed");
  const rates = [];
  for (const rate of [1, 100, 1_000, 10_000]) {
    await pause();
    await seek("1969-07-17 00:00:00");
    await playback.selectOption(String(rate));
    assert.equal(Number(await playback.inputValue()), rate, `${rate}× can be selected`);
    const simulationStart = Date.parse(await readTime());
    await click("Play playback");
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
  await chooseCamera("columbia", "Follow Columbia (CSM)");
  await playback.selectOption("100");
  await click("Play playback");
  const track = [];
  const rangeReadout = page.locator('[data-metric="columbia-range"] .metric-value');
  const speedReadout = page.locator('[data-metric="columbia-speed"] .metric-value');
  for (let index = 0; index < 30; index += 1) {
    await page.waitForTimeout(400);
    const time = Date.parse(await readTime());
    const rangeKm = Number((await rangeReadout.textContent()).replaceAll(",", ""));
    const speedKmS = Number((await speedReadout.textContent()).replaceAll(",", ""));
    assert.ok(Number.isFinite(time) && Number.isFinite(rangeKm) && Number.isFinite(speedKmS), "follow telemetry stays numeric");
    if (track.length > 0) {
      const previous = track.at(-1);
      const elapsedSeconds = (time - previous.time) / 1_000;
      assert.ok(elapsedSeconds > 0, "follow time advances monotonically");
      assert.ok(Math.abs(rangeKm - previous.rangeKm) <= Math.max(5, Math.max(speedKmS, previous.speedKmS) * elapsedSeconds * 1.5), "range changes continuously within the speed bound");
    }
    track.push({ time, rangeKm, speedKmS });
  }
  await pause();
  assert.ok(track.at(-1).time - track[0].time >= 5 * 60_000, "the 100× track spans several simulated minutes");

  // Spike 01 USNO phase dates remain visible through the current developer instrumentation.
  await pause();
  await page.getByRole("button", { name: "True", exact: true }).click();
  await seek("2024-01-04 03:30:00");
  await chooseCamera("moon", "Focus Moon");
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

  assert.deepEqual(errors, [], "console and page errors are empty");
  const result = {
    url,
    viewport: "1280x800",
    scalePairs,
    cameraStates: cameraStates.map(({ preset, time }) => ({ preset, time })),
    eventJumps,
    rates,
    followTrack: { samples: track.length, start: track[0], end: track.at(-1) },
    usno,
    errors,
  };
  writeFileSync(`${out}/browser-spike02-results.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({
    scalePairs: scalePairs.length,
    cameraPresets: cameraStates.length,
    eventJumps: eventJumps.length,
    rates,
    followSamples: track.length,
    usno,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
