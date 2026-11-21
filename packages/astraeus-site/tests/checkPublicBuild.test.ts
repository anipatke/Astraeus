import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHECKS, checkPublicBuild, runChecks } from "../../../tools/check-public-build.mjs";

// O-086 T-389: the public-build file checks run as one build gate and leave evidence whether they pass or fail. No real site build here.
const made: string[] = [];
const scratch = () => {
  const dir = mkdtempSync(join(tmpdir(), "public-build-test-"));
  made.push(dir);
  return dir;
};
afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});
const failing = (dir: string) => {
  const script = join(dir, "fails.mjs");
  writeFileSync(script, 'console.error("planted failure"); process.exit(1);');
  return { name: "planted", script };
};
const passing = (dir: string) => {
  const script = join(dir, "passes.mjs");
  writeFileSync(script, 'console.log("fine");');
  return { name: "fine", script };
};

describe("check:public-build", () => {
  it("names the two file checks", () => {
    expect(CHECKS.map((c) => c.name)).toEqual(["public-build-assets", "public-addresses"]);
  });

  it("runChecks fails and leaves evidence when a check fails, and passes when none does", () => {
    const dir = scratch();
    const lines: string[] = [];
    const bad = runChecks({
      distDir: dir,
      evidenceDir: join(dir, "bad"),
      checks: [passing(dir), failing(dir)],
      log: (t) => lines.push(t),
    });
    expect(bad.ok).toBe(false);
    expect(bad.rows.map((r) => r.passed)).toEqual([true, false]);
    expect(readFileSync(join(dir, "bad", "planted.log"), "utf8")).toContain("planted failure");
    expect(readFileSync(join(dir, "bad", "summary.txt"), "utf8")).toContain("planted | FAILED (exit 1)");
    expect(lines.some((l) => l.startsWith("fine | passed"))).toBe(true);
    const good = runChecks({
      distDir: dir,
      evidenceDir: join(dir, "good"),
      checks: [passing(dir)],
      log: () => undefined,
    });
    expect(good.ok).toBe(true);
  });

  it("the real public-addresses check fails on a planted retired link", () => {
    const dir = scratch();
    const dist = join(dir, "dist");
    mkdirSync(dist);
    writeFileSync(join(dist, "index.html"), '<a href="app.html?experience=earth-moon">old</a>');
    const result = runChecks({
      distDir: dist,
      evidenceDir: join(dir, "ev"),
      checks: [CHECKS[1]],
      log: () => undefined,
    });
    expect(result.ok).toBe(false);
    expect(readFileSync(join(dir, "ev", "public-addresses.log"), "utf8")).toContain(
      "index.html: experience=earth-moon",
    );
  });

  it("checkPublicBuild returns non-zero, keeps its evidence folder and removes the scratch build on a failing check", () => {
    const dir = scratch();
    let built = "";
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const code = checkPublicBuild({
      build: (out: string) => {
        built = out;
        mkdirSync(out, { recursive: true });
        return { status: 0 };
      },
      checks: [failing(dir)],
      evidenceRoot: join(dir, "evidence"),
    });
    expect(code).toBe(1);
    expect(existsSync(built)).toBe(false);
    const [folder] = readdirSync(join(dir, "evidence"));
    expect(folder).toMatch(/^public-build-/);
    expect(readFileSync(join(dir, "evidence", folder, "summary.txt"), "utf8")).toContain("FAILED");
  });

  it("checkPublicBuild reports a failed build and still leaves evidence", () => {
    const dir = scratch();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const code = checkPublicBuild({
      build: () => ({ status: 1, stderr: "boom" }),
      checks: [passing(dir)],
      evidenceRoot: join(dir, "evidence"),
    });
    expect(code).toBe(1);
    const [folder] = readdirSync(join(dir, "evidence"));
    expect(readFileSync(join(dir, "evidence", folder, "public-build.log"), "utf8")).toContain("boom");
  });
});
