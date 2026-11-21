import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import baseline from "./fixtures/browserAssertionsBaseline.json";
import {
  assertionsAt,
  currentAssertions,
  extractAssertions,
  listAssertions,
} from "../tools/validate/assertion-list.mjs";

// O-060 T-281, I-149: the list holds each raise site of the listed forms (see assertion-list.mjs) that the browser scripts had at baseline commit 6aad8e6a, with the text of the guard that
// decides it. A script that loses one of those sites, or changes the text of its guard, fails here. It proves text for those forms only. It does not see: an edit to a helper a guard
// calls, a changed value it reads, an early `return` ahead of it, an exit code set by assignment, a failure list built by `.push` under a name that is not a failure name
// (`matches`, `found`), or a failure returned as a literal (`ok: false`). tests/browserExitPath.test.ts proves a failing step fails the run; the Full Objective Check's independent
// rebuild is what shows nothing else was lost. (Adding sites is free; the list only grows by an owner-approved rebuild.)
type List = Record<string, string[]>;
type Retired = { script: string; was: string; movedTo: string; reason: string };
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
    reason:
      "T-281 split the one call of load in two: `if (view.journey)` calls it for both sizes at once and the else branch one size after another; both halves must be present, so load, which holds the assertions, still runs for every view and size.",
  },
];

/** Baseline sites a Task moved into the fast suite on purpose (O-086), each named with the test case that now proves it ("<file from the repo root> > <case title>"). A retired site is forgiven only while that
 * file exists and holds the case title; nothing else is forgiven. */
const RETIRED: Retired[] = [
  {
    script: "journey-views.mjs",
    was: 'assert.deepEqual(options.map((option) => option.id), ["a", "b", "both"], "the bar offers the three views in order")',
    movedTo:
      "packages/astraeus/tests/viewsJourneyState.test.ts > offers the three views in order, labelled, and opens on the first",
    reason: "T-392: the offered views and their order are state the shell holds, read without a browser.",
  },
  {
    script: "journey-views.mjs",
    was: 'assert.deepEqual(options.map((option) => option.label), ["Probe A", "Probe B", "Both"])',
    movedTo:
      "packages/astraeus/tests/viewsJourneyState.test.ts > offers the three views in order, labelled, and opens on the first",
    reason: "T-392: the labels are text in the made-up scene's own view list.",
  },
  {
    script: "journey-views.mjs",
    was: 'assert.equal(await ui.shownView(page), "a", "the scene opens on its first view")',
    movedTo:
      "packages/astraeus/tests/viewsJourneyState.test.ts > offers the three views in order, labelled, and opens on the first",
    reason: "T-392: the opening view is state, read in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: 'assert.equal(await ui.hostView(page), "a", "the host link reports the view showing")',
    movedTo:
      "packages/astraeus/tests/viewerHostDom.test.ts > publishes the view: cause host for setView, visitor for the view choice, and the time and speed stay as they were",
    reason: "T-392: the host handle's view is state, read in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: "assert.equal(await ui.shownView(page), id, `the ${id} button shows as chosen`)",
    movedTo:
      "packages/astraeus/tests/viewsJourneyState.test.ts > switching to %s shows its objects, events and panel markers, and leaves the clock and the speed",
    reason: "T-392: the pressed button is read from the real shell DOM in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: "assert.equal(await ui.clockIso(page), before.clock, `switching to ${id} leaves the clock where it was`)",
    movedTo:
      "packages/astraeus/tests/viewsJourneyState.test.ts > switching to %s shows its objects, events and panel markers, and leaves the clock and the speed",
    reason: "T-392: the clock snapshot is equal across a switch, read in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: "assert.equal(await ui.speed(page), before.speed, `switching to ${id} leaves the speed as it was`)",
    movedTo:
      "packages/astraeus/tests/viewsJourneyState.test.ts > switching to %s shows its objects, events and panel markers, and leaves the clock and the speed",
    reason: "T-392: the rate is equal across a switch, read in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: 'assert.ok(heard.some((change) => change.view === "b" && change.cause === "visitor"), "the host hears the visitor\'s switch to b")',
    movedTo:
      "packages/astraeus/tests/viewerHostDom.test.ts > publishes the view: cause host for setView, visitor for the view choice, and the time and speed stay as they were",
    reason: "T-392: the host change record (view and cause) is state, read in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: 'assert.equal(await ui.hostView(page), "b")',
    movedTo:
      "packages/astraeus/tests/viewerHostDom.test.ts > reads the opening view, switches it, names an unknown id, and refuses before ready and after unmount",
    reason: "T-392: the host handle's view after setView is state, read in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: 'assert.equal(await ui.shownView(page), "b", "the buttons follow a host\'s setView")',
    movedTo:
      "packages/astraeus/tests/viewerHostDom.test.ts > reads the opening view, switches it, names an unknown id, and refuses before ready and after unmount",
    reason: "T-392: the pressed button after setView is read from the real shell DOM in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: 'assert.equal(await ui.clockIso(page), clock, "a host\'s setView leaves the clock where it was")',
    movedTo:
      "packages/astraeus/tests/viewerHostDom.test.ts > publishes the view: cause host for setView, visitor for the view choice, and the time and speed stay as they were",
    reason: "T-392: time and rate equal across setView, read in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: 'assert.deepEqual({ view: last.view, cause: last.cause }, { view: "b", cause: "host" }, "the host hears its own switch as host")',
    movedTo:
      "packages/astraeus/tests/viewerHostDom.test.ts > publishes the view: cause host for setView, visitor for the view choice, and the time and speed stay as they were",
    reason: "T-392: the host change record is state, read in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: 'assert.ok(menu.includes(body), `view ${id}: the Object list holds ${body} (${menu.join(", ")})`)',
    movedTo:
      "packages/astraeus/tests/viewsJourneyState.test.ts > switching to %s shows its objects, events and panel markers, and leaves the clock and the speed",
    reason: "T-392: the menu is read from the real shell DOM in happy-dom (and on opening, in the opening-view case).",
  },
  {
    script: "journey-views.mjs",
    was: "assert.ok(!menu.includes(body), `view ${id}: the Object list leaves out ${body}`)",
    movedTo:
      "packages/astraeus/tests/viewsJourneyState.test.ts > switching to %s shows its objects, events and panel markers, and leaves the clock and the speed",
    reason: "T-392: the menu is read from the real shell DOM in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: 'assert.ok(rows.includes(event), `view ${id}: the timeline lists "${event}"`)',
    movedTo:
      "packages/astraeus/tests/viewsJourneyState.test.ts > switching to %s shows its objects, events and panel markers, and leaves the clock and the speed",
    reason: "T-392: the event rows are read from the real shell DOM in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: 'assert.ok(!rows.includes(event), `view ${id}: the timeline leaves out "${event}"`)',
    movedTo:
      "packages/astraeus/tests/viewsJourneyState.test.ts > switching to %s shows its objects, events and panel markers, and leaves the clock and the speed",
    reason: "T-392: the event rows are read from the real shell DOM in happy-dom.",
  },
  {
    script: "journey-views.mjs",
    was: "assert.deepEqual(await ui.listedStoryPanelIds(page), [...want.panels].sort(), `view ${id}: the timeline carries only this view's panel markers`)",
    movedTo:
      "packages/astraeus/tests/viewsJourneyState.test.ts > switching to %s shows its objects, events and panel markers, and leaves the clock and the speed",
    reason: "T-392: the panel marker ids are read from the real shell DOM in happy-dom.",
  },
];

const repoRoot = new URL("../../../", import.meta.url);

/** True when `movedTo` names a test file that exists and whose text holds the case title. */
function provesIt(movedTo: string): boolean {
  const [file, ...title] = movedTo.split(" > ");
  const path = new URL(file, repoRoot);
  return title.length > 0 && existsSync(path) && readFileSync(path, "utf8").includes(title.join(" > "));
}

/** Each baseline site that the `now` scripts no longer hold (counting repeats), as "script: text". */
function missing(before: List, now: List, reviewed: Reviewed[] = REVIEWED, retired: Retired[] = RETIRED): string[] {
  const lost: string[] = [];
  for (const [script, items] of Object.entries(before)) {
    const left = [...(now[script] ?? [])];
    for (const item of items) {
      const at = left.indexOf(item);
      if (at >= 0) {
        left.splice(at, 1);
        continue;
      }
      if (retired.some((entry) => entry.script === script && entry.was === item && provesIt(entry.movedTo))) continue;
      const swap = reviewed.find((entry) => entry.script === script && entry.was === item)?.now;
      const parts = swap === undefined ? [] : Array.isArray(swap) ? swap : [swap];
      const places = parts.map((part) => left.indexOf(part));
      if (parts.length === 0 || places.some((place) => place < 0) || new Set(parts).size !== parts.length)
        lost.push(`${script}: ${item}`);
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

  it("each retired site names a real baseline site, a present test file and the case in it", () => {
    for (const entry of RETIRED) {
      expect(baselineList[entry.script]).toContain(entry.was);
      expect(provesIt(entry.movedTo), entry.movedTo).toBe(true);
      expect(entry.reason.length).toBeGreaterThan(20);
    }
    expect(new Set(RETIRED.map((entry) => entry.was)).size).toBe(RETIRED.length);
  });

  it("every baseline assertion is still in the scripts", () => {
    expect(missing(baselineList, currentAssertions())).toEqual([]);
  });

  it("fails when a listed raise site is removed, its guard loosened or disabled, or its script dropped (planted)", () => {
    const script = [
      'assert.equal(await ui.shownView(page), "z", "a planted view that no retired entry names");',
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
    expect(
      missing(
        before,
        listOf(script.replace("if (whole.raw > limit.raw) wholeProblems.push(`raw ${whole.raw}`);\n", "")),
      ),
    ).toHaveLength(1);
    expect(
      missing(
        before,
        listOf(
          script.replace(
            'assert.equal(await ui.shownView(page), "z", "a planted view that no retired entry names");\n',
            "",
          ),
        ),
      ),
    ).toHaveLength(1);
    expect(missing(before, {})).toHaveLength(5);
    // a differently named failure list is found by shape, not by name
    expect(extractAssertions("const oddities = [];\nif (x) oddities.push(1);\nreturn { problems: oddities };")).toEqual(
      ["if (x) => oddities.push(1)"],
    );
    expect(extractAssertions('// assert.ok(1)\nconst s = "assert.ok(2)"; const files = []; files.push(1);')).toEqual(
      [],
    );
    // a reviewed exception forgives only its exact new text
    const exception: Reviewed = {
      script: "journey-views.mjs",
      was: 'if (a > 20) => throw new Error("x");',
      now: 'if (a > 21) => throw new Error("x");',
      reason: "planted",
    };
    const was = { "journey-views.mjs": [exception.was] };
    expect(missing(was, { "journey-views.mjs": [exception.now as string] }, [exception])).toEqual([]);
    expect(missing(was, { "journey-views.mjs": ['if (a > 2) => throw new Error("x");'] }, [exception])).toHaveLength(1);
    // a retired site is forgiven only while its named case exists
    const real = RETIRED[0];
    const gone = { [real.script]: [real.was] };
    expect(missing(gone, {})).toEqual([]);
    expect(missing(gone, {}, [], [])).toHaveLength(1);
    expect(
      missing(gone, {}, [], [{ ...real, movedTo: `${real.movedTo.split(" > ")[0]} > a case nobody wrote` }]),
    ).toHaveLength(1);
    expect(
      missing(gone, {}, [], [{ ...real, movedTo: "packages/astraeus/tests/noSuchFile.test.ts > x" }]),
    ).toHaveLength(1);
    // a site that became two holds only while both halves are present
    const split: Reviewed = {
      script: "journey-views.mjs",
      was: "load(a)",
      now: ["if (j) => load(a)", "if !(j) => load(a)"],
      reason: "planted split",
    };
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
