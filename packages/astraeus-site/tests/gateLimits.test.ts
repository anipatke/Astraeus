import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { loadLimits, overrun } from "../../../tools/gate-limits.mjs";
import { timeGates } from "../../../tools/time-gates.mjs";
import { runSet } from "../tools/validate/runner.mjs";

// O-060 T-283: every gate has a stated time limit in tools/gate-limits.json. A run over its limit warns; time alone never changes an exit code.
const root = join(import.meta.dirname, "..", "..", "..");
const limits = loadLimits();
const sleeper = (ms: number, exit = 0) => ({ name: "sleeper", command: process.execPath, args: ["-e", `setTimeout(() => process.exit(${exit}), ${ms})`] });

describe("the one limits file", () => {
  it("states a positive limit for every gate and every browser step", () => {
    for (const value of [...Object.values(limits.gates), limits.browser.total, ...Object.values(limits.browser.steps)]) expect(value).toBeGreaterThan(0);
  });

  it("covers every npm gate the timed command runs and every step in run-browser.mjs", () => {
    const scripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts as Record<string, string>;
    for (const name of Object.keys(limits.gates)) expect(scripts[name], name).toBeDefined();
    const source = readFileSync(join(root, "packages/astraeus-site/tools/validate/run-browser.mjs"), "utf8");
    const steps = [...source.matchAll(/\{ name: "([^"]+)"/g)].map((m) => m[1]);
    expect(steps.length).toBeGreaterThan(5);
    expect(Object.keys(limits.browser.steps).sort()).toEqual([...steps].sort());
  });

  it("the total limit is above every step limit", () => {
    expect(limits.browser.total).toBeGreaterThan(Math.max(...Object.values(limits.browser.steps)));
  });
});

describe("docs state the same limits as the file", () => {
  const cells = (line: string) => line.split("|").map((cell) => cell.trim()).filter((cell) => cell !== "");
  const rows = (file: string) => readFileSync(join(root, file), "utf8").split("\n").filter((line) => line.startsWith("|")).map(cells);

  it("docs/agents/build.md has a row per gate ending in its limit", () => {
    const table = rows("docs/agents/build.md");
    for (const [name, limit] of Object.entries(limits.gates)) {
      const row = table.find((r) => r[0] === `\`${name}\``);
      expect(row, `${name} row`).toBeDefined();
      expect(row?.at(-1), name).toBe(`${limit} s`);
    }
    const browser = table.find((r) => r[0] === "`check:browser`");
    expect(browser?.at(-1)).toBe(`${limits.browser.total} s`);
  });

  it("docs/BROWSER_CHECKS.md has a row per step ending in its limit", () => {
    const table = rows("docs/BROWSER_CHECKS.md");
    for (const [name, limit] of Object.entries(limits.browser.steps)) {
      const row = table.find((r) => r[0] === `\`${name}\``);
      expect(row, `${name} row`).toBeDefined();
      expect(row?.at(-1), name).toBe(`${limit} s`);
    }
  });
});

describe("a limit warns and never fails a run", () => {
  it("overrun words a warning only past the limit", () => {
    expect(overrun("lint", 11, 10)).toMatch(/^WARNING: lint took 11s, over its limit of 10s/);
    expect(overrun("lint", 10, 10)).toBe("");
    expect(overrun("lint", 99, undefined)).toBe("");
  });

  it("a timed gate over a planted limit prints a warning and still passes", () => {
    const lines: string[] = [];
    const { ok, rows } = timeGates([sleeper(1200)], { gates: { sleeper: 1 } }, (text) => lines.push(text));
    expect(ok).toBe(true);
    expect(rows[0]?.warning).toMatch(/WARNING: sleeper took .*over its limit of 1s/);
    expect(lines.some((line) => line.startsWith("WARNING:"))).toBe(true);
  });

  it("a timed gate within its limit prints no warning", () => {
    const lines: string[] = [];
    const { ok } = timeGates([sleeper(50)], { gates: { sleeper: 30 } }, (text) => lines.push(text));
    expect(ok).toBe(true);
    expect(lines.join("\n")).not.toMatch(/WARNING/);
    expect(lines.join("\n")).toMatch(/sleeper \| passed \| .*s \| limit 30s/);
  });

  it("a failing gate still fails, with or without a warning", () => {
    expect(timeGates([sleeper(10, 3)], { gates: { sleeper: 30 } }, () => undefined).ok).toBe(false);
  });

  it("the timed command exits 0 over a planted limit through the real command line", async () => {
    const { spawnSync } = await import("node:child_process");
    {
      const run = spawnSync(process.execPath, ["-e", `
        import("${join(root, "tools", "time-gates.mjs").replace(/\\/g, "/")}").then(({ timeGates }) => {
          const { ok } = timeGates([{ name: "slow", command: process.execPath, args: ["-e", "setTimeout(() => {}, 1100)"] }], { gates: { slow: 1 } });
          process.exit(ok ? 0 : 1);
        });`], { encoding: "utf8" });
      expect(run.status).toBe(0);
      expect(run.stdout).toMatch(/WARNING: slow took/);
    }
  });

  it("the browser runner summary warns past a planted total and exits 0; within it, no warning", async () => {
    const out: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((text: unknown) => { out.push(String(text)); });
    const evidence: string[] = [];
    try {
      const planted = await runSet("gate-limit-test", [], { gates: {}, browser: { total: -1, steps: {} } });
      const within = await runSet("gate-limit-test", [], { gates: {}, browser: { total: 600, steps: {} } });
      expect(planted).toBe(0);
      expect(within).toBe(0);
    } finally {
      spy.mockRestore();
      for (const line of out) if (line.startsWith("evidence: ")) evidence.push(line.slice("evidence: ".length));
      for (const dir of evidence) rmSync(dir, { recursive: true, force: true });
    }
    const warnings = out.filter((line) => line.startsWith("WARNING: the browser check took"));
    expect(warnings).toHaveLength(1);
    expect(out.filter((line) => line.startsWith("total ")).length).toBe(2);
  });
});
