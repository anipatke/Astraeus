import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import baseline from "./fixtures/browserAssertionsBaseline.json";
import { assertionsAt, currentAssertions, extractAssertions, listAssertions } from "../tools/validate/assertion-list.mjs";

// O-060 T-281: the browser check may get faster but never weaker. The list holds every assertion the browser scripts could raise at baseline commit 6aad8e6a;
// a script that loses or loosens one fails here. (Adding assertions is free; the list only grows by an owner-approved rebuild.)
type List = Record<string, string[]>;

/** Each baseline assertion that the `now` scripts no longer hold (counting repeats), as "script: text". */
function missing(before: List, now: List): string[] {
  const lost: string[] = [];
  for (const [script, items] of Object.entries(before)) {
    const left = [...(now[script] ?? [])];
    for (const item of items) {
      const at = left.indexOf(item);
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

  it("every baseline assertion is still in the scripts", () => {
    expect(missing(baselineList, currentAssertions())).toEqual([]);
  });

  it("fails when an assertion is removed, loosened or dropped with its script (planted)", () => {
    const names = Object.keys(baselineList);
    const source: Record<string, string> = Object.fromEntries(names.map((name) => [name, ""]));
    source["journey-views.mjs"] = [
      'assert.equal(await ui.shownView(page), "a", "the scene opens on its first view");',
      'assert.ok(Math.abs(a - b) < 0.002, "holds still");',
    ].join("\n");
    const before = listAssertions(["journey-views.mjs"], () => source["journey-views.mjs"]) as List;
    expect(missing(before, before)).toEqual([]);
    // removed
    const removed = listAssertions(["journey-views.mjs"], () => source["journey-views.mjs"].split("\n")[0]) as List;
    expect(missing(before, removed)).toHaveLength(1);
    // tolerance loosened
    const loosened = listAssertions(["journey-views.mjs"], () => source["journey-views.mjs"].replace("0.002", "0.02")) as List;
    expect(missing(before, loosened)).toHaveLength(1);
    // the whole script gone
    expect(missing(before, {})).toHaveLength(2);
    // a thrown error dropped
    expect(extractAssertions("if (x) throw new Error(`bad ${y}`);")).toEqual(["new Error(`bad ${y}`)"]);
    expect(extractAssertions('// assert.ok(1)\nconst s = "assert.ok(2)";')).toEqual([]);
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
