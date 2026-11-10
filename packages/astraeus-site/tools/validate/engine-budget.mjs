// The engine's own size budget (O-051 T-221, owner decision "split engine and demo limits"): the plain example's first download, what `node tools/measure-example.mjs` measures
// (`examples/hello-scene`, built from the packed `astraeus` tarball: the engine's code and styles on first open, nothing else). One limit, raw and gzipped, enforced by `public-build-assets.mjs`,
// which runs after the example is built in the same browser check; a demo page's limit (`load-budget.mjs`) holds only what the page adds beyond the engine, so engine growth trips only this limit.
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { measureBuild } from "../../../../tools/measure-example.mjs";
import { checkLoadBudget } from "./load-budget.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
/** The example whose first download is the engine's size. */
export const ENGINE_EXAMPLE_DIR = join(root, "examples", "hello-scene", "dist");
/**
 * Measured 1,652,588 B raw / 472,895 B gzip on 2026-11-01 (after O-051 T-218 to T-220), plus 5%, rounded up to the next 1,000 bytes (owner decision, 2026-11-01).
 * Reset 2026-11-10 (owner decision "Reset limit, add fast test", I-164, after O-065): measured 1,745,198 B raw / 501,483 B gzip, plus 5%, rounded up to the next 1,000 bytes.
 * `packages/astraeus-site/tests/packagePacks.test.ts` (right after the package build it owns) builds the example and holds it to this limit in `npm test`.
 */
export const ENGINE_LIMIT = { rawLimit: 1_833_000, gzipLimit: 527_000 };

/** The plain example's first download against the engine limit. Returns { ok, raw, gzip, rawLimit, gzipLimit, problems }. */
export function checkEngineBudget({ exampleDir = ENGINE_EXAMPLE_DIR, limit = ENGINE_LIMIT } = {}) {
  if (!existsSync(join(exampleDir, "index.html"))) {
    return { ok: false, raw: 0, gzip: 0, ...limit, problems: [`engine: ${exampleDir} has no build, so the engine's size is unknown (run \`node tools/build-example.mjs\` first)`] };
  }
  const { totals } = measureBuild(exampleDir);
  const problems = [];
  if (totals.raw > limit.rawLimit) problems.push(`engine: the plain example's first download is ${totals.raw} bytes raw, over the engine limit of ${limit.rawLimit}`);
  if (totals.gzip > limit.gzipLimit) problems.push(`engine: the plain example's first download is ${totals.gzip} bytes gzipped, over the engine limit of ${limit.gzipLimit}`);
  return { ok: problems.length === 0, raw: totals.raw, gzip: totals.gzip, ...limit, problems };
}

/**
 * Proves the two limits are independent, on made-up builds: engine growth (the engine chunk of the page and the example both grow) trips only the engine limit, and the page, whose limit is
 * its own share, stays within its limit; demo growth (only the demo chunk grows) trips only the page's limit. Returns { base, engineGrown, demoGrown }, each { page, engine } with `ok` flags.
 */
export function proveEngineDemoSplit() {
  const temp = mkdtempSync(join(tmpdir(), "astraeus-engine-split-"));
  try {
    // Noise does not gzip away, so the made-up sizes are what the limits see.
    const noise = (length) => Buffer.from(Array.from({ length }, (_, k) => (k * 2654435761 >>> 7) & 255));
    const pageLimits = { rawLimit: 4_000, gzipLimit: 4_500 };
    const engineLimit = { rawLimit: 4_000, gzipLimit: 4_500 };
    const make = (name, { engine = 3_000, demo = 3_000 } = {}) => {
      const dir = join(temp, name);
      mkdirSync(join(dir, "assets"), { recursive: true });
      writeFileSync(join(dir, "app.html"), "<html></html>");
      writeFileSync(join(dir, "assets", "engine-AbCdEf12.js"), noise(engine));
      writeFileSync(join(dir, "assets", "demo-AbCdEf12.js"), noise(demo));
      writeFileSync(join(dir, "engine-share.json"), JSON.stringify({ "assets/engine-AbCdEf12.js": { engine: engine, total: engine }, "assets/demo-AbCdEf12.js": { engine: 0, total: demo } }));
      const example = join(temp, `${name}-example`);
      mkdirSync(join(example, "assets"), { recursive: true });
      writeFileSync(join(example, "index.html"), '<script type="module" src="/assets/engine.js"></script>');
      writeFileSync(join(example, "assets", "engine.js"), noise(engine));
      const page = checkLoadBudget({ distDir: dir, pages: [{ id: "page", files: ["app.html", "engine.js", "demo.js"], ...pageLimits }], buildLimit: { id: "whole build", rawLimit: 99_000, gzipLimit: 99_000 } }).pages[0];
      const engineResult = checkEngineBudget({ exampleDir: example, limit: engineLimit });
      return { page: { ok: page.problems.length === 0, problems: page.problems }, engine: { ok: engineResult.ok, problems: engineResult.problems } };
    };
    return { base: make("base"), engineGrown: make("engine-grown", { engine: 9_000 }), demoGrown: make("demo-grown", { demo: 6_000 }) };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
