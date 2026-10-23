// The one shared harness for browser-check scripts (O-037 T-126): launches Chromium with the project's software-rendering flags, watches a page for errors, and runs a script's checks.
// A script keeps its own data loading and assertions and touches the interface only through driver.mjs; it never calls chromium.launch itself (driver-guard.mjs forbids it).
//   checkScript({ name, viewports }, run)   the whole lifecycle: launch, one page per viewport, error collection, run(page, ctx), close, results.json, non-zero exit on any failure
//   launchBrowser(extraArgs)                 only the launch, for a script whose pages are opened in its own pattern
//   watchErrors(page, errors, label)         pageerror and console-error collection onto `errors` (the runner counts these lines)
import { mkdirSync, writeFileSync } from "node:fs";
import { pw } from "./playwright.mjs";

const chromium = pw.chromium ?? pw.default.chromium;
export const SOFTWARE_RENDERING_ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
export const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

/** Chromium with the software-rendering flags every check uses, plus any `extraArgs`. */
export function launchBrowser(extraArgs = []) {
  return chromium.launch({ args: [...SOFTWARE_RENDERING_ARGS, ...extraArgs] });
}

/** Collect `page`'s uncaught errors and console errors onto `errors`, each line prefixed by `label` when given. */
export function watchErrors(page, errors, label = "") {
  const prefix = label === "" ? "" : `${label} `;
  page.on("pageerror", (error) => errors.push(`${prefix}pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${prefix}console: ${message.text()}`); });
}

/** The app address a script opens: ASTRAEUS_URL (the runner sets it) or the dev server, with the query `params` added. */
export function appUrl(params = "") {
  const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
  return params === "" ? base : `${base}${base.includes("?") ? "&" : "?"}${params}`;
}

/**
 * Run one script's checks. `viewports` is a list of `{ name?, width, height, ...pageOptions }` (default one 1280x800); `run(page, context)` is called once per viewport with
 * `context = { browser, errors, viewport, name }` and may return a value that is recorded in results. Any thrown assertion or collected error fails the script (exit code 1).
 * Results go to stdout and, when ASTRAEUS_EVIDENCE_DIR (or `outDir`) is set, to results.json there.
 */
export async function checkScript({ name, viewports = [DEFAULT_VIEWPORT], extraArgs = [], outDir = process.env.ASTRAEUS_EVIDENCE_DIR }, run) {
  const started = new Date().toISOString();
  const browser = await launchBrowser(extraArgs);
  const errors = [];
  const results = [];
  let failure;
  try {
    for (const viewport of viewports) {
      const { name: viewportName = `${viewport.width}x${viewport.height}`, ...pageOptions } = viewport;
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, ...pageOptions });
      watchErrors(page, errors, viewports.length > 1 ? viewportName : "");
      try { results.push({ viewport: viewportName, result: await run(page, { browser, errors, viewport, name: viewportName }) }); } finally { await page.close(); }
    }
  } catch (error) {
    failure = error;
  } finally {
    await browser.close();
  }
  const ok = failure === undefined && errors.length === 0;
  const summary = { name, at: started, ok, results, errors, ...(failure === undefined ? {} : { failure: String(failure?.stack ?? failure) }) };
  console.log(JSON.stringify(summary, null, 2));
  if (outDir !== undefined) { mkdirSync(outDir, { recursive: true }); writeFileSync(`${outDir}/results.json`, JSON.stringify(summary, null, 2)); }
  if (!ok) process.exitCode = 1;
  return summary;
}

/** A page on `browser` with a script's own page options (viewport, touch, scale factor); the one place a script's page is opened. */
export function openPage(browser, options) {
  return browser.newPage(options);
}

/** A browser context with a script's own options (viewport, touch, permissions, reduced motion). */
export function openContext(browser, options) {
  return browser.newContext(options);
}

/** A page inside a context made by `openContext`. */
export function pageIn(context) {
  return context.newPage();
}
