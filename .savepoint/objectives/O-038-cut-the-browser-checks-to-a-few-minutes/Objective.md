---
id: O-038
title: Cut the browser checks to a few minutes
status: done
depends_on: [O-039]
release: G-007
priority: high
lanes:
  - {key: dom, title: Screen parts in fast tests}
  - {key: scene, title: Scene sums in fast tests}
  - {key: demos, title: Demo rules in fast tests}
  - {key: browser, title: One browser command}
  - {key: close, title: Retire, map and rules}
---

# O-038: Cut the browser checks to a few minutes

## Outcome

Proving Astraeus in a real browser takes a few minutes, not tens: one quick smoke check that opens every page and confirms it loads with no errors, plus two or three journey checks for what matters most. Everything the old browser scripts proved that is logic (what is placed, shown, hidden or read out) is proven by fast node tests instead, and the remaining browser scripts are retired (git history keeps them). Looks stay with the owner on the preview.

## Why

Owner, 2026-10-21, after the O-037 Full Objective Check spent most of its 22 minutes in browser sets and failed one on what may be timing: "There has to be a better way than 90.mins of t3sts", "Even this feels long", then "this is not a big project, this amount of browser testing seems over the top? Is this really best practice?" and "yes plan that as an objective under G-007".

The tree is an inverted test pyramid at the top: 26 browser scripts in the engine and demo sets plus 7 on request, each rendering 3D in software (3 to 4 cores, minutes per script, timing failures under load). On 2026-10-21 the engine set took 272 s (16 steps), the planets set 421 s (7 steps; jupiter-io alone 187 s), showers over 4 minutes before it was stopped, Apollo untimed. The fast suite (about 1,280 tests) runs in under a minute. O-034 split the scripts into sets but did not reduce them; every Objective since has added scripts as its proof and none were retired. O-037 made per-frame scene work plain, testable stages (`src/app/sceneFrame.ts`), so browser-only proofs can now move to node tests.

## Success Conditions

1. One browser command (for example `npm run check:browser`) runs the smoke check and the journey checks in about 3 minutes or less on this machine, one browser at a time; the time is recorded.
2. The smoke check opens every public page and demo view once (desktop and phone size) and fails on any page or console error or a page that does not draw.
3. Two journey checks (Confirmed Decision 1), each passing reliably three runs in a row.
4. Every scenario of the retired scripts is mapped in `docs/BROWSER_CHECKS.md` to the node test that now proves it, the smoke or journey check that covers it, or "the owner's look on the preview", with nothing left unmapped.
5. AGENTS.md's browser-check rules, the Full Objective Check routine and `check-method` usage say: run the one browser command once at a Full Objective Check; no per-Task browser runs; no demo sets.
6. The fast test gate stays under about a minute; typecheck, build, lint and test pass.

## Confirmed Decisions (owner, 2026-10-23)

1. **Journeys**: "Planets on a phone" (switch planet, focus a moon, open a place card at phone size) and "Play a meteor shower" (play, seek, a story panel opens). Apollo and desktop controls get no journey; the smoke check still opens their pages.
2. **Screen-level proofs** (drawers, panels, info cards): "Fast tests with a light pretend-page": a DOM test environment in the fast suite, overriding O-037's out-of-scope note; exact layout and overlap stay with the owner's look on the preview.
3. **On-request scripts** (owner, 2026-10-23, asked "why are these browser scripts? feel like the wrong approach?"): the six that check computed numbers (precision far from the Sun, sky fixed under camera moves, Sun halo size, marker swap, eccentric-orbit framing, marker rule on existing scenes) become fast tests; all seven on-request scripts are retired, the phone frame-time probe included (a measuring tool, kept in git history).
4. **Plan** (owner chose "Yes, write these steps", 2026-10-23): five steps; screen parts, scene sums and the browser command can run side by side in lanes; demo rules wait for the pretend-page set-up; retirement, mapping, rules and the three timed runs come last. The pretend page is `happy-dom` as a dev dependency, switched on per test file (`// @vitest-environment happy-dom`) so the rest of the suite stays on `node`.
5. **Dependency** (owner, 2026-10-23, "Stop waiting on it"): O-037 is dropped from `depends_on`; it closed by owner exception (browser-set timing), which this Objective replaces. O-039 stays.

## Architectural Considerations

Logic proofs move to node tests against the plain modules (`sceneFrame.ts` stages, feature-marker visibility, layout and panel rules, catalogue and settings builders); where a proof needs the DOM, decide at planning between a light DOM test environment and keeping it in the journey checks (O-037 left DOM testing out of scope). Browser checks keep using `tools/validate/harness.mjs` and `driver.mjs`, read the scene's own readouts and never take screenshots. The public-build file checks (`public-build-assets`, `public-addresses`) need no browser and can stay as node tests.

## Boundaries

**In scope:**
- A smoke check and two or three journey checks; retiring the other browser scripts and runner sets
- Node tests that take over the logic the retired scripts proved
- `docs/BROWSER_CHECKS.md`, AGENTS.md browser rules, package scripts
- `tools/validate/runner.mjs`, which reads 27 by lizard (owner, 2026-10-22: left for this Objective rather than split in O-037)

**Out of scope:**
- Any change to what visitors see (G-007 boundary)
- The owner-reported defects I-054 to I-058 (their own repair Objective, O-039)
- Visual regression or screenshot testing (owner rule: no screenshots)
