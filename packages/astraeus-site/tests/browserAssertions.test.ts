import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import baseline from "./fixtures/browserAssertionsBaseline.json";
import { assertionsAt, currentAssertions, extractAssertions, listAssertions } from "../tools/validate/assertion-list.mjs";

// O-060 T-281, I-149: the list holds each raise site of the listed forms (see assertion-list.mjs) that the browser scripts had at baseline commit 6aad8e6a, with the text of the guard that
// decides it. A script that loses one of those sites, or changes the text of its guard, fails here. It proves text for those forms only. It does not see: an edit to a helper a guard
// calls, a changed value it reads, an early `return` ahead of it, an exit code set by assignment, a failure list built by `.push` under a name that is not a failure name
// (`matches`, `found`), or a failure returned as a literal (`ok: false`). tests/browserExitPath.test.ts proves a failing step fails the run; the Full Objective Check's independent
// rebuild is what shows nothing else was lost. (Adding sites is free; the list only grows by an owner-approved rebuild.)
type List = Record<string, string[]>;
type Reviewed = { script: string; was: string; now: string | string[]; reason: string };

/** Baseline sites T-281 deliberately changed, each named with its reason. A site listed here passes only if its exact new text is present (every part of it, when `now` is a list because
 * one site became several); nothing else is forgiven. */
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
    now: ["if (view.journey) => load(browser, view, size)", "if !(view.journey) => load(browser, view, size)"],
    reason: "T-281 split the one call of load in two: `if (view.journey)` calls it for both sizes at once and the else branch one size after another; both halves must be present, so load, which holds the assertions, still runs for every view and size.",
  },
];

/** Each baseline site that the `now` scripts no longer hold (counting repeats), as "script: text". */
function missing(before: List, now: List, reviewed: Reviewed[] = REVIEWED): string[] {
  const lost: string[] = [];
  for (const [script, items] of Object.entries(before)) {
    const left = [...(now[script] ?? [])];
    for (const item of items) {
      const at = left.indexOf(item);
      if (at >= 0) {
        left.splice(at, 1);
        continue;
      }
      const swap = reviewed.find((entry) => entry.script === script && entry.was === item)?.now;
      const parts = swap === undefined ? [] : Array.isArray(swap) ? swap : [swap];
      const places = parts.map((part) => left.indexOf(part));
      if (parts.length === 0 || places.some((place) => place < 0) || new Set(parts).size !== parts.length) lost.push(`${script}: ${item}`);
      else for (const part of parts) left.splice(left.indexOf(part), 1);
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
      for (const part of Array.isArray(entry.now) ? entry.now : [entry.now]) expect(now[entry.script]).toContain(part);
      expect(entry.reason.length).toBeGreaterThan(20);
    }
  });

  it("every baseline assertion is still in the scripts", () => {
    expect(missing(baselineList, currentAssertions())).toEqual([]);
  });

  it("fails when a listed raise site is removed, its guard loosened or disabled, or its script dropped (planted)", () => {
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
    expect(missing(was, { "journey-views.mjs": [exception.now as string] }, [exception])).toEqual([]);
    expect(missing(was, { "journey-views.mjs": ["if (a > 2) => throw new Error(\"x\");"] }, [exception])).toHaveLength(1);
    // a site that became two holds only while both halves are present
    const split: Reviewed = { script: "journey-views.mjs", was: "load(a)", now: ["if (j) => load(a)", "if !(j) => load(a)"], reason: "planted split" };
    const whole = { "journey-views.mjs": ["load(a)"] };
    expect(missing(whole, { "journey-views.mjs": split.now as string[] }, [split])).toEqual([]);
    expect(missing(whole, { "journey-views.mjs": ["if !(j) => load(a)"] }, [split])).toHaveLength(1);
    expect(missing(whole, { "journey-views.mjs": ["if (j) => load(a)"] }, [split])).toHaveLength(1);
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
