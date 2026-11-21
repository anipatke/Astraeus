// The frame-loop profile (O-087 T-394), run by run-profile.mjs (never a step of check:browser). 2 scenes x {paused, playing} x {diagnostics on, off}, each 3 times in one Chromium;
// per case the median, min and max of the CDP per-second deltas over a fixed 10 s window. The numbers are recorded, never asserted. Output: ASTRAEUS_PROFILE_OUT.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import * as ui from "./driver.mjs";
import { appUrl, checkScript, openPage } from "./harness.mjs";

const WINDOW_MS = 10000;
const SETTLE_MS = 2000;
const RUNS = 3;
const SCENES = [
  { name: "apollo-11", params: "t=1969-07-20T20:00:00Z" },
  { name: "planets-saturn", params: "experience=planets&planet=saturn&t=2026-06-01T00:00:00Z" },
];
const KEYS = [
  "ScriptDuration",
  "TaskDuration",
  "LayoutCount",
  "LayoutDuration",
  "RecalcStyleCount",
  "RecalcStyleDuration",
  "JSHeapUsedSizeChange",
  "framesDrawnPerSecond",
];

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const summarise = (runs) =>
  Object.fromEntries(
    KEYS.map((key) => {
      const values = runs.map((run) => run[key]);
      return [key, { median: median(values), min: Math.min(...values), max: Math.max(...values) }];
    }),
  );

/** One run: a fresh page at the pinned address, first draw, settle, pause or play, then the metrics window. */
async function oneRun(browser, scene, playing, diagnostics) {
  const page = await openPage(browser, { viewport: { width: 1280, height: 800 } });
  try {
    await ui.requestDiagnostics(page, diagnostics);
    await ui.loadAddress(page, appUrl(scene.params));
    await ui.waitForShell(page);
    await ui.waitForMoreFrames(page, await ui.framesDrawn(page), 1, 30000);
    if (playing) await ui.ensurePlaying(page);
    else await ui.ensurePaused(page);
    await page.waitForTimeout(SETTLE_MS);
    return await ui.frameMetrics(page, WINDOW_MS);
  } finally {
    await page.close();
  }
}

await checkScript({ name: "profile-frame-loop" }, async (page, { browser }) => {
  const cases = [];
  for (const scene of SCENES)
    for (const playing of [false, true])
      for (const diagnostics of [true, false]) {
        const runs = [];
        for (let i = 0; i < RUNS; i++) runs.push(await oneRun(browser, scene, playing, diagnostics));
        cases.push({
          scene: scene.name,
          address: scene.params,
          clock: playing ? "playing" : "paused",
          diagnostics,
          runs: RUNS,
          ...summarise(runs),
        });
        console.log(`case ${scene.name} ${playing ? "playing" : "paused"} diagnostics=${diagnostics}: done`);
      }
  const out = process.env.ASTRAEUS_PROFILE_OUT;
  const result = {
    note: "Per-second deltas over a 10 s window after a 2 s settle, 1280x800; durations are seconds of work per second. Before O-087 draft 02 the diagnostics flag does nothing, so the off rows equal the on rows (expected baseline).",
    viewport: "1280x800",
    windowMs: WINDOW_MS,
    version: browser.version(),
    cases,
  };
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(result, null, 2));
  }
  return result;
});
