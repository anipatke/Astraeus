import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import baseline from "./fixtures/browserAssertionsBaseline.json";
import { assertionsAt, currentAssertions, extractAssertions, listAssertions } from "../tools/validate/assertion-list.mjs";

// O-060 T-281, I-149: the browser check may get faster but never weaker. The list holds every raise site the browser scripts had at baseline commit 6aad8e6a, each with the text of the
// guard that decides it. A script that loses a site, or changes the text of its guard, fails here. The test proves text, not meaning: an edit to a helper a guard calls, a changed
// value it reads, or an early `return` ahead of it is outside what it sees. (Adding sites is free; the list only grows by an owner-approved rebuild.)
type List = Record<string, string[]>;
type Reviewed = { script: string; was: string; now: string; reason: string };

/** Baseline sites T-281 deliberately changed, each named with its reason. A site listed here passes only if its exact new text is present; nothing else is forgiven. */
const REVIEWED: Reviewed[] = [
  {
    script: "browser-smoke.mjs",
    was: 'if (!(await ui.zoomOutFully(page))) => throw new Error("no free point on the scene to zoom from");',
    now: 'if (!(await ui.zoomOutFully(page, "traveller"))) => throw new Error("no free point on the scene to zoom from");',
    reason: "T-281 gave zoomOutFully a body/path id to read its zoom from; the guard and the error are unchanged.",
  },
  {
    script: "browser-smoke.mjs",
    was: "load(browser, view, size)",
    now: "if !(view.journey) => load(browser, view, size)",
    reason: "T-281 runs the journey views' two sizes side by side (`if (view.journey)` calls load for both sizes at once) and the others one after another; load, which holds the assertions, still runs for every view and size.",
  },
];

/** Each baseline site that the `now` scripts no longer hold (counting repeats), as "script: text". */
function missing(before: List, now: List, reviewed: Reviewed[] = REVIEWED): string[] {
  const lost: string[] = [];
  for (const [script, items] of Object.entries(before)) {
    const left = [...(now[script] ?? [])];
    for (const item of items) {
      const swap = reviewed.find((entry) => entry.script === script && entry.was === item)?.now;
      const at = left.indexOf(item) >= 0 ? left.indexOf(item) : swap === undefined ? -1 : left.indexOf(swap);
      if (at < 0) lost.push(`${script}: ${item}`);
      else left.splice(at, 1);
    }
  }
  return lost;
}

const baselineList = baseline.assertions as List;

describe("the browser check keeps every assertion it had at 6aad8e6a", () => {
  it("holds the baseline list", () => {
    expect(baseline.commit).toBe("6aad8e6a");
    expect(Object.values(baselineList).flat().length).toBeGreaterThan(150);
  });

  it("each reviewed exception names a real baseline site and a present new one", () => {
    const now = currentAssertions() as List;
    for (const entry of REVIEWED) {
      expect(baselineList[entry.script]).toContain(entry.was);
      expect(now[entry.script]).toContain(entry.now);
      expect(entry.reason.length).toBeGreaterThan(20);
    }
  });

  it("every baseline assertion is still in the scripts", () => {
    expect(missing(baselineList, currentAssertions())).toEqual([]);
  });

  it("fails when a raise site is removed, its guard loosened or disabled, or its script dropped (planted)", () => {
    const script = [
      'assert.equal(await ui.shownView(page), "a", "the scene opens on its first view");',
      'if (!(saturn.radiusPx > 20)) throw new Error("Saturn is too small");',
      'if (depthMode !== "logarithmic") throw new Error("depth");',
      "const wholeProblems = [];",
      "if (whole.raw > limit.raw) wholeProblems.push(`raw ${whole.raw}`);",
      "if (whole.gzip > limit.gzip) wholeProblems.push(`gzip ${whole.gzip}`);",
      "return { problems: wholeProblems };",
    ].join("\n");
    const listOf = (text: string) => listAssertions(["journey-views.mjs"], () => text) as List;
    const before = listOf(script);
    expect(before["journey-views.mjs"]).toHaveLength(5);
    expect(missing(before, before)).toEqual([]);
    expect(missing(before, listOf(script.replace("> 20", "> 2")))).toHaveLength(1);
    expect(missing(before, listOf(script.replace("if (depthMode", "if (false && depthMode")))).toHaveLength(1);
    expect(missing(before, listOf(script.replace("if (whole.raw > limit.raw) wholeProblems.push(`raw ${whole.raw}`);\n", "")))).toHaveLength(1);
    expect(missing(before, listOf(script.replace('assert.equal(await ui.shownView(page), "a", "the scene opens on its first view");\n', "")))).toHaveLength(1);
    expect(missing(before, {})).toHaveLength(5);
    // a differently named failure list is found by shape, not by name
    expect(extractAssertions("const oddities = [];\nif (x) oddities.push(1);\nreturn { problems: oddities };")).toEqual(["if (x) => oddities.push(1)"]);
    expect(extractAssertions('// assert.ok(1)\nconst s = "assert.ok(2)"; const files = []; files.push(1);')).toEqual([]);
    // a reviewed exception forgives only its exact new text
    const exception: Reviewed = { script: "journey-views.mjs", was: "if (a > 20) => throw new Error(\"x\");", now: "if (a > 21) => throw new Error(\"x\");", reason: "planted" };
    const was = { "journey-views.mjs": [exception.was] };
    expect(missing(was, { "journey-views.mjs": [exception.now] }, [exception])).toEqual([]);
    expect(missing(was, { "journey-views.mjs": ["if (a > 2) => throw new Error(\"x\");"] }, [exception])).toHaveLength(1);
  });

  it("the committed list is what the baseline commit holds", () => {
    let built: List | undefined;
    try {
      execFileSync("git", ["cat-file", "-e", "6aad8e6a^{commit}"], { stdio: "ignore" });
      built = assertionsAt("6aad8e6a") as List;
    } catch {
      built = undefined; // a clone without that commit cannot rebuild it; the committed list stands
    }
    if (built !== undefined) expect(built).toEqual(baselineList);
  });
});
