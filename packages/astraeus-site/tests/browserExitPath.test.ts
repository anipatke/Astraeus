import { spawn, spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

// O-060 T-281, I-149: the assertion list proves the raise forms it names. This file proves the other half directly: a failing browser step fails the run. It goes through the real
// tools/validate/harness.mjs (a step that throws exits non-zero) and the real tools/validate/runner.mjs (a non-zero step is reported as failed and the run's result is 1), with tiny
// fixture steps in tests/fixtures/browser-exit and no app page. run-browser.mjs's own exit-code line is checked by its text, because its step list is fixed.
const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, "..");
const root = resolve(site, "..", "..");
const fixtures = join(site, "tests", "fixtures", "browser-exit");
const scratch = mkdtempSync(join(tmpdir(), "astraeus-exit-test-"));
const evidenceDirs: string[] = [];
afterAll(() => {
  rmSync(scratch, { recursive: true, force: true });
  for (const dir of evidenceDirs) rmSync(dir, { recursive: true, force: true });
});

function runNode(args: string[], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", env: { ...process.env, ...env }, timeout: 120_000 });
}

// The harness case opens a real (blank) browser page. The release workflow installs no browser, because the browser checks run on the owner's machine (docs/RELEASING.md, "What is
// checked where"), so this case is skipped only where Playwright reports its browser missing; any other launch failure still fails it.
const browserProbe = spawnSync(process.execPath, ["--input-type=module", "-e", "const { chromium } = await import('playwright-core'); const b = await chromium.launch(); await b.close();"], { cwd: root, encoding: "utf8", timeout: 60_000 });
const browserMissing = browserProbe.status !== 0 && /Executable doesn't exist/.test(browserProbe.stderr);

describe("a failing browser step fails the run", () => {
  it.skipIf(browserMissing)("harness: a step that throws through checkScript exits non-zero, and the same step without the throw exits 0 (skipped where no browser is installed)", () => {
    const pass = runNode([join(fixtures, "passes-through-harness.mjs")]);
    expect(pass.stderr).toBe("");
    expect(pass.status).toBe(0);
    expect(pass.stdout).toContain('"ok": true');
    const fail = runNode([join(fixtures, "throws-through-harness.mjs")]);
    expect(fail.stdout).toContain('"ok": false');
    expect(fail.stdout).toContain("planted assertion failure");
    expect(fail.status).toBe(1);
  }, 150_000);

  // The runner starts servers it does not need for this; `npx` is replaced by a sleeper and the dev address by a stub that answers, so only the step loop and the exit result run.
  async function runSetWith(steps: object[]) {
    const bin = mkdtempSync(join(scratch, "bin-"));
    writeFileSync(join(bin, "npx"), "#!/bin/sh\nexec sleep 60\n");
    chmodSync(join(bin, "npx"), 0o755);
    const stub = createServer((_request, response) => response.end("ok"));
    await new Promise<void>((done) => stub.listen(0, "127.0.0.1", done));
    const port = String((stub.address() as { port: number }).port);
    const code = `import { runSet } from ${JSON.stringify(join(site, "tools", "validate", "runner.mjs"))};
const result = await runSet("exit-test", ${JSON.stringify(steps)});
console.log("RESULT " + result);`;
    const file = join(bin, "drive.mjs");
    writeFileSync(file, code);
    // asynchronous, so the stub's event loop stays free to answer the runner
    const out = await new Promise<{ stdout: string; stderr: string }>((done) => {
      const child = spawn(process.execPath, [file], { cwd: root, env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, DEV_PORT: port } });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => (stdout += d));
      child.stderr.on("data", (d) => (stderr += d));
      child.on("close", () => done({ stdout, stderr }));
    });
    stub.close();
    const evidence = /^evidence: (.+)$/m.exec(out.stdout)?.[1];
    if (evidence !== undefined) evidenceDirs.push(evidence);
    return { ...out, summary: evidence === undefined ? "" : readFileSync(join(evidence, "summary.txt"), "utf8") };
  }
  const step = (name: string, script: string) => ({ name, script: `../../tests/fixtures/browser-exit/${script}`, scene: "fixture" });

  it("runner: a step that exits non-zero is reported as failed and the run's result is 1; passing steps give 0", async () => {
    const good = await runSetWith([step("fine", "exits-zero.mjs")]);
    expect(good.summary).toContain("fine | scene=fixture | exit=0");
    expect(good.stdout).toContain("RESULT 0");
    const bad = await runSetWith([step("fine", "exits-zero.mjs"), step("broken", "exits-three.mjs")]);
    expect(bad.summary).toContain("broken | scene=fixture | exit=3");
    expect(bad.stderr).toContain("FAILED: a step exited non-zero");
    expect(bad.stdout).toContain("RESULT 1");
  }, 150_000);

  it("run-browser.mjs hands the runner's result to the process exit code", () => {
    const text = readFileSync(join(site, "tools", "validate", "run-browser.mjs"), "utf8");
    expect(text).toMatch(/^process\.exitCode = await runSet\("browser", STEPS\);$/m);
  });
});
