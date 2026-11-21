---
id: T-403
title: A scene with nothing drawn fails the run
objective: O-088
status: done
depends_on: [{task: T-402, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-403, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [packages/astraeus-site/tools/validate/harness.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tests/browserExitPath.test.ts, packages/astraeus-site/tools/validate/assertion-list.mjs]
planned_writes: [packages/astraeus-site/tests/browserDrawnControl.test.ts, packages/astraeus-site/tests/fixtures/browser-exit/draws-through-harness.mjs, packages/astraeus-site/tools/validate/stream-check.mjs, packages/astraeus-site/tools/validate/stream-check.d.mts, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tests/streamCheck.test.ts, packages/astraeus-site/tests/browserAssertions.test.ts]
---

# A scene with nothing drawn fails the run

## Outcome

The third outcome negative control: a page whose scene reports zero drawn dots (and, separately, no body, dot or path at all) fails the browser step with a non-zero exit, proved through a real browser page, the real interface driver readouts, the real assertion and the real harness (AH-33; OpenAI F07 "zero visible dots").

## User Check

None visual. `npx vitest run packages/astraeus-site/tests/browserDrawnControl.test.ts packages/astraeus-site/tests/streamCheck.test.ts` passes; each planted break makes a case fail.

## Done When

- `browser-smoke.mjs`'s inline "nothing drawn" throw (`drawsSomething`, ~59: `if (content(drawn) === 0) throw new Error(...)`) moves into `stream-check.mjs` as `assertSceneDrawn(drawn, label)` beside `assertStreamDrawn`, with the same condition (bodies + dots + paths, stars not counted) and a message that names the label; `browser-smoke.mjs` calls it. The polling loops in `drawsSomething` are unchanged. `stream-check.d.mts` declares it.
- `browserAssertions.test.ts` gets one `REVIEWED` entry for the moved site (its `was` text from the baseline, its `now` the new call in `browser-smoke.mjs`), with the reason "O-088: moved to stream-check.mjs so the zero-content control covers it". This keeps the pin green until draft 03 retires it; run `npx vitest run packages/astraeus-site/tests/browserAssertions.test.ts` to confirm. If the moved call leaves no raise site in `browser-smoke.mjs` (a plain call to an imported function is not one of the listed forms), the `now` text is the call as the list prints it from `stream-check.mjs`'s caller, or the entry records the site as moved; follow what the list reports and record it.
- `streamCheck.test.ts` gains table cases for `assertSceneDrawn`: all zero fails; stars only fails; one body, one dot or one path passes.
- New `browserDrawnControl.test.ts` runs one fixture step `draws-through-harness.mjs` through the real `checkScript`, in which a blank page gets a `<canvas>` whose `data-points` and `data-body-screen` attributes (the readouts `ui.sceneDotsInView` and `ui.sceneDrawsSomething` read, `driver.mjs` ~815–845 and `scenePoints` ~1060) are set from an environment variable, then calls `assertSceneDrawn` and `assertStreamDrawn` on the driver's reads. Three runs: zero members in view (exit 1, message names the stream), nothing in view at all (exit 1, message names the scene), one drawn group with members in view (exit 0). The readout attribute names come from the driver, not retyped in the test where the driver exports them. Skipped only where Playwright reports the browser missing (same probe as `browserExitPath.test.ts`).
- Planted breaks, recorded then reverted: `assertStreamDrawn`'s `!(dots > 0)` changed to `dots < 0` makes the zero-dots run exit 0 and the case fail; `sceneDotsInView` summing `group.count` instead of `group.inView` makes the zero-in-view run pass and the case fail.
- If O-087 has made the readouts opt-in (a diagnostics flag), the fixture sets the attributes directly and is unaffected; record it.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tools/validate/browser-smoke.mjs` (`drawsSomething`, ~45–70 only)
- `packages/astraeus-site/tools/validate/stream-check.mjs`, `stream-check.d.mts` (whole, short)
- `packages/astraeus-site/tools/validate/driver.mjs` (`sceneDotsInView`, `sceneDrawsSomething`, `scenePoints`, `sceneBodies`, `scenePaths`, `sceneSky` only)
- `packages/astraeus-site/tests/streamCheck.test.ts` (whole, short)
- `packages/astraeus-site/tests/browserAssertions.test.ts` (`REVIEWED` and `missing`, ~15–60)
- `packages/astraeus-site/tests/browserExitPath.test.ts` (browser-missing probe and the harness case only, as the pattern)
- `packages/astraeus-site/tests/fixtures/browser-exit/throws-through-harness.mjs`

## Design References

None beyond `docs/BROWSER_CHECKS.md` under `Scene readouts instead of pictures (T-102, TEST-03)`.

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Move the throw into `assertSceneDrawn`; call it from `drawsSomething`; add the `REVIEWED` entry; run `browserAssertions.test.ts`.
2. Add the unit table cases.
3. Write the fixture and the three-run control.
4. Planted breaks one at a time; record; revert.
5. Focused runs, then gates.

## Boundaries

No other change to `browser-smoke.mjs` or the driver. No `npm run check:browser` run here: the moved check runs in the browser in draft 04's one clean run (this Task's browser cases are blank pages). Draft 01 owns `browserExitPath.test.ts`; do not edit it.

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/browserDrawnControl.test.ts packages/astraeus-site/tests/streamCheck.test.ts packages/astraeus-site/tests/browserAssertions.test.ts packages/astraeus-site/tests/browserDriverGuard.test.ts`. Handoff: `quality_gates`.

## Technical Evidence

Extra reads (beyond Context Files): harness.mjs `checkScript` (pattern, O-087 diagnostics flag: the fixture writes `data-points`, `data-body-screen` and `data-paths` itself, so it is unaffected); `assertion-list` behaviour via `browserAssertions.test.ts` `missing`/`provesIt`.

| Done When | Evidence |
|---|---|
| `assertSceneDrawn` in stream-check.mjs, smoke calls it, d.mts declares it | `stream-check.mjs`, `stream-check.d.mts`, `browser-smoke.mjs` (`drawsSomething` calls `assertSceneDrawn(drawn, view.id)`; polling unchanged) |
| browserAssertions entry for the moved site | A plain call is not a listed raise form, so a REVIEWED `now` cannot be present; recorded as a RETIRED entry (movedTo the `streamCheck.test.ts` describe) instead, as the Task allows; `browserAssertions.test.ts` green |
| streamCheck table cases | `streamCheck.test.ts` `it.each`: all zero and stars only fail; one body / dot / path pass |
| Three-run control | `browserDrawnControl.test.ts` runs `fixtures/browser-exit/draws-through-harness.mjs` (DRAWN_CASE zero-dots: exit 1 naming the stream; nothing: exit 1 naming the scene; drawn: exit 0); runs with the real browser here |
| Planted breaks | `!(dots > 0)` to `dots < 0`: browserDrawnControl and the I-071 streamCheck case went red. `sceneDotsInView` summing `group.count`: browserDrawnControl red. Both restored (git diff on driver.mjs empty, stream-check diffed identical to the pre-break copy) |
| Readouts opt-in flag | Fixture sets the attributes directly; unaffected |
| Gates | see handoff below |

Commands: focused vitest (4 files, 18 passed), planted breaks under flock, lint/typecheck/build/test under flock.
Driver readout names are retyped in the fixture (the driver does not export the attribute names); limitation.

## Drift Notes

None.

## Coordinator (gates)

Set done by the orchestrating session after the combined handoff gates passed with T-402..T-404 and T-406..T-412 together (owner: "I mark them as they pass", O-038; G-024 decision 7 "Orchestrate each objective to completion"; owner 2026-11-22 "I am remote now, add park the check and move on"): lint and Prettier clean, typecheck clean, `npm test` 324 files, 5319 passed, 2 skipped; `npm run check:pack` pass, engine 1,836,372 B raw (cap 1,838,000), 525,692 B gzip (cap 527,000).
