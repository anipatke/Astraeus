import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// O-088 T-403 (AH-33): a scene with nothing drawn fails the browser step. A blank page gets the canvas readouts the driver reads, and the real driver, assertions and harness decide the exit.
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const fixture = join(here, "fixtures", "browser-exit", "draws-through-harness.mjs");

// Skipped only where Playwright reports its browser missing (the same probe as browserExitPath.test.ts); any other launch failure still fails.
const probe = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    "const { chromium } = await import('playwright-core'); const b = await chromium.launch(); await b.close();",
  ],
  { cwd: root, encoding: "utf8", timeout: 60_000 },
);
const browserMissing = probe.status !== 0 && /Executable doesn't exist/.test(probe.stderr);

const run = (drawnCase: string) =>
  spawnSync(process.execPath, [fixture], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, DRAWN_CASE: drawnCase },
    timeout: 120_000,
  });

describe("a scene with nothing drawn fails the run", () => {
  it.skipIf(browserMissing)(
    "zero stream dots in view fails naming the stream, nothing in view fails naming the scene, a drawn group passes",
    () => {
      const noDots = run("zero-dots");
      expect(noDots.status).toBe(1);
      expect(noDots.stdout).toContain("fixture-stream: the meteor stream is not drawn (0 dots in view)");
      const nothing = run("nothing");
      expect(nothing.status).toBe(1);
      expect(nothing.stdout).toContain("fixture-view: the scene shows no body, dot or path in view");
      const drawn = run("drawn");
      expect(drawn.stderr).toBe("");
      expect(drawn.status).toBe(0);
      expect(drawn.stdout).toContain('"ok": true');
    },
    400_000,
  );
});
