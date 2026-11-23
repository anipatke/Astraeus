---
id: T-445
title: Planet and moon orbit lines stay on their body
objective: O-099
status: done
depends_on: [{task: T-444, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-445, reason: 'Owner said "orchestrate O99" (2026-11-23): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o099-20261123}, recorded_at: '2026-11-23T08:18:33Z'}
planned_by: {role: planner, session: plan-g026-20261123}
planned_reads: [packages/astraeus/src/app/PathView.ts, packages/astraeus/src/app/pathRules.ts, packages/astraeus/src/api/sunOrbit.ts, packages/astraeus/src/core/sunCentredSources.ts, packages/astraeus/tests/pathViewSync.test.ts, packages/astraeus/tests/publicApiSunOrbits.test.ts]
planned_writes: [packages/astraeus/src/app/PathView.ts, packages/astraeus/src/api/sunOrbit.ts, packages/astraeus/tests/orbitLineGap.test.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/planBodies.ts]
---

# Planet and moon orbit lines stay on their body

## Outcome

`PathView` draws every `kind: "orbit"` line with the shared rule from the previous Task: one turn on a fixed grid around the display time, re-sampled when the display time leaves the middle half of the sampled turn, and a fine head ending on the body's live place. Planet Sun-orbit lines (`api/sunOrbit.ts`) give their turn length rather than a fixed opening-time span; composition moon lines move from clock-centred windows onto the grid.

## User Check

Run `npm run preview:owner`; on the planets demo at true scale, focus Earth, zoom to a few Earth radii and play time: the orbit line stays through the planet. Move the timeline years away and repeat. Zoomed out, the lines look as before. Repeat on the Moon's line about Earth.

## Done When

- `tests/orbitLineGap.test.ts` fails on today's code and passes after: Earth, Mars and Jupiter (true scale, planet series loaded) stay under 0.05 planet radii from their drawn line across one turn from the opening time, and across 120 days at 3 years on and 5 years before; the Moon and Io lines meet the same bound against their own radii. The drawn line is read from `PathView` itself (vertices as synced), not rebuilt in the test.
- The osculating fallback re-osculates at the display time when it re-samples; a line from published elements keeps eccentric-anomaly spacing for the far line; both get the head.
- Existing `pathViewSync` and `publicApiSunOrbits` tests pass; any assertion that pinned the old fixed opening-time span is changed only where it stated the old rule, each change named in evidence.
- The known-limitations text in `api/sunOrbit.ts` and the doc comments in `api/scene.ts` and `api/planBodies.ts` that say "one full turn from the opening time" describe the new rule; the API lock is unchanged.
- Configured gates pass; evidence per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/PathView.ts`
- `packages/astraeus/src/app/pathRules.ts`
- `packages/astraeus/src/app/orbitLineRule.ts` (from the previous Task)
- `packages/astraeus/src/api/sunOrbit.ts`
- `packages/astraeus/src/core/sunCentredSources.ts` (`pathTimesUtcMs`, `eccentricPathTimesUtcMs`, `windowTimesUtcMs`, `samplePositionsKm` only)
- `packages/astraeus/tests/pathViewSync.test.ts`
- `packages/astraeus/tests/publicApiSunOrbits.test.ts`
- `/tmp/claude-1000/-home-user-code-Astraeus/6cc292a9-791d-4091-827e-eb5369da02c1/scratchpad/wobble/measure.mjs` (the planner's measurement against 0.10.0; may be gone after a reboot, in which case the G-026 Why numbers stand)

## Design References

`.savepoint/Design.md` under `Views of one scene` and `A lighter frame loop (O-087)`.

## Guardrails

ARCH-02, ARCH-03, ARCH-06, PROV-01, API-01, CODE-02, TEST-01, TEST-02, TEST-03.

## Implementation Plan

1. Confirm the shared module's API covers a whole-turn span and eccentric spacing; if eccentric spacing cannot sit on a fixed grid, keep the far line's spacing and apply the grid and head only where it can, and record why; if neither works, REPLAN REQUIRED.
2. Write the failing gap test.
3. Change `PathView` orbit lines to the rule; the body's live place comes from the same source as the line.
4. Change `sunOrbit.ts` to give the turn length and the new wording; update the doc comments.
5. Run the existing path tests.

## Boundaries

Trajectory paths (`addTrajectory`) are unchanged; a same-symptom finding there becomes an Issue. No look or API change.

## Technical Verification

Focused tests while iterating; configured build and test gates at handoff. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Builder session (orchestrate-o099, 2026-11-23). Stages build -> test -> audit; step Check waived (`check_waiver`).

**Extra reads** (beyond Context Files): `packages/astraeus/src/app/experienceDefinition.ts` lines 86-125, 373-379 (PathSpec/RollingSpan types, default sample counts) to type the change; `src/api/planBodies.ts` `moonOrbitPath` and `sunPath` (doc comment to update, moon line rule for the test); `src/api/scene.ts` `orbit` option doc; `src/core/planetModels.ts` head (series coverage 1950-2045, error type); `vitest.config.ts` and `packages/astraeus/vitest.moons.setup.ts` (why Io needs its fits; the new test loads Io's 2016 fits itself the same way); `tests/orbitLook.test.ts` stale-window case (it failed); `tools/api-surface.mjs` (lock comparison).

**Deviation (coordinator-approved, planned_writes):** functions added to `src/app/orbitLineRule.ts` (`HEAD_SUBSTEPS`, `HEAD_REACH`, `HEAD_BUDGET`, `turnGridTimes`, `eccentricTurnTimes`, `outsideMiddleHalf`, `headAbout`, `fineTimeMs`, `mergedLineTimes`, `headByNearness`) and their tests to `tests/orbitLineRule.test.ts`; existing functions unchanged. Also written outside planned_writes: `tests/orbitLook.test.ts`, one statement (see below).

**Design as built.**
- `PathView` orbit lines (`kind: "orbit"`): far line = one turn on a fixed grid about the display time (`turnGridTimes`; by eccentric anomaly on a fixed anomaly grid, `eccentricTurnTimes`, when the layer has `sampling`). A fixed-span orbit's span now gives only the turn length; the turn is re-sampled when the display time leaves its middle half (`outsideMiddleHalf`; a seek is the same case). A source that does not cover the turn (planet series end) keeps the line it has and is retried only at the next turn-grid step (`#turnHeldAt`); the constructor falls back to the old opening-time span when the centred turn is not covered. Composition (rolling-window) orbit lines keep their re-sample triggers but take grid times, so points do not move on a re-sample; trails keep `windowTimesUtcMs`.
- Head: fine grid points (`HEAD_SUBSTEPS` = 16 per far step) `HEAD_REACH` = 16 fine steps either side of the display time, cached by fine index, at most `HEAD_BUDGET` = 4 new source evaluations a frame (nearest the display time first; none on a same-time re-sync), plus the body's live place (one evaluation per changed frame), merged with the far samples in time order (`mergedLineTimes`). The head reaches one far step either side (not only "from the previous sample up to the display time" as planned) so the chord ahead of the body is fine too.
- Centre/extent framing use the far samples only; ring end fade gives a head point the edge fade of its place in time; vertex buffers sized far + head + live and drawn with `setDrawRange`. Resample work moved into the named stage `#resampleIfDue` (CODE-02; also keeps `sync` under the complexity limit).
- Osculating fallback: `sunOrbitLayer` adds `reosculate(displayUtcMs)` (type `ReosculatingPath`, exported from `PathView.ts`, internal) for the osculating case; `PathView` re-fits the ellipse at the display time when it re-samples the turn, and head/live points come from the same ellipse.
- `sunOrbit.ts`: layer span unchanged (still one turn from the opening time: it carries the turn length), so `publicApiSunOrbits` needed no change; known-limitations and descriptions now state "one turn about the display time ... re-fitted"; `scene.ts` `orbit` doc and `planBodies.ts` `sunPath` doc updated. API lock compared with `currentSurface()`: unchanged.

**Measured gaps** (worst over the run, in the body's own radii, at the body and at the true path +-1 h; `GAP_LOG=1`):

| Body | window | before (HEAD d68be8f8) | after |
|---|---|---|---|
| Earth | turn from 2026-01-01 / 120 d at +3 y / 120 d at -5 y | 0.926 / 1.903 / 1.790 | 0.0036 / 0.0036 / 0.0036 |
| Mars | same | 5.90 / 1.75 / 5.47 | 0.011 / 0.008 / 0.009 |
| Jupiter | same | 0.672 / 0.386 / 4.55 | 0.0004 / 0.0003 / 0.0004 |
| Moon | same | 0.030 / 0.031 / 0.031 | 0.024 / 0.021 / 0.023 |
| Io | turn from 2016-06-01 / 120 d from 2016-08-01 / from 2016-03-01 | 0.032 / 0.026 / 0.026 | 0.036 / 0.036 / 0.036 |

The body itself is a vertex of the line (gap 0 to float precision); the remaining numbers are the +-1 h true-path points, which for the Moon and Io fall beyond the head's reach on the first frame after a 3-day step and sit on far chords (Io's far step is 14 min, its 1-h points are 4 far steps away). Io's +-1 h worst rose 0.026 -> 0.036 because its grid window is no longer centred exactly on the clock; under the bound.

**Done When -> evidence**

| Done When | Evidence |
|---|---|
| `orbitLineGap.test.ts` fails today, passes after; Earth/Mars/Jupiter and Moon/Io < 0.05 radii, line read from `PathView` | `tests/orbitLineGap.test.ts` (15 gap cases, vertices via `screenReadout().vertices` + `vertexAbsolute`). On HEAD code: 9 failed (all planet cases, 0.39-5.90 R), 6 passed (moons). After: 15/15 pass, table above. |
| Osculating fallback re-osculates on re-sample; published-elements line keeps eccentric spacing; both get the head | `orbitLineGap.test.ts` "re-fits an osculating ellipse ... spaced by eccentric anomaly" (Uranus at -25 y: middle sample 16 km from the series vs 29,153,193 km for the opening-time ellipse; unequal spacing); `orbitLineRule.test.ts` "spaces an eccentric turn on a fixed anomaly grid" (grid property for anomaly spacing); head path is shared by all orbit lines (`#assembleLine`). |
| Existing `pathViewSync` and `publicApiSunOrbits` pass; old-rule assertions changed only where they stated it | Both pass unchanged. One other existing assertion stated the old rule: `tests/orbitLook.test.ts` "gives the same arc whether the ring window is stale or freshly built", `expect(stale.timesUtcMs[90]).toBe(date)` (window centred exactly on the clock) -> `toBe(turnGridTimes(date, moonPath.spanMs, 181)[90])` (the grid point nearest the build time); setup untouched. |
| Known-limitations text and doc comments describe the new rule; API lock unchanged | `src/api/sunOrbit.ts` (limitations, descriptions, `sunOrbitLayer` doc), `src/api/scene.ts` `orbit` doc, `src/api/planBodies.ts` `sunPath` doc; `currentSurface()` equals `api-surface.lock.json` ("API lock unchanged"). |
| Configured gates pass | Focused gates below. |

Additional tests: grid property and per-frame cost in `orbitLineGap.test.ts` ("re-samples a turn without moving a far point that stays in it"; "asks the source for at most the live place and a few head points a frame, and only the live place once the head is filled": max 1 + 4 a frame, then exactly 1); rule tests in `orbitLineRule.test.ts` ("one turn about the display time (T-445)", 4 cases).

**Commands and results** (focused gates per builder rules; full gate left to the coordinator)
- `npm run typecheck`: pass.
- `node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js` on the 8 changed files: 0 problems. `npx prettier --check` same files: clean.
- `npx vitest run` (from repo root) on: orbitLineGap, orbitLineRule, orbitLook, pathViewSync, publicApiSunOrbits, viewDisposal, planetOrbitLines, longOrbitPaths, sceneCatalogueReach, errorRule, sceneTargets, publicApiPaths, orbitSetSync, sceneTransforms, publicApiLineStretches, compositionsContract, sceneFrame, shownDuring, lookOut, lookOutGlide, hostCallOrder, publicApiSunPaths, syntheticJourney, frameDiagnostics, nameCheck, sceneViewsDisposalDom, listedOrbitGroup, viewFrame, fitOrbit, sceneCamera, jupiterIo (`.test.ts`): 31 files, 455 passed, 1 skipped.
- No browser runs.

**Files changed:** `packages/astraeus/src/app/PathView.ts`, `packages/astraeus/src/app/orbitLineRule.ts`, `packages/astraeus/src/api/sunOrbit.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/planBodies.ts`, `packages/astraeus/tests/orbitLineGap.test.ts` (new), `packages/astraeus/tests/orbitLineRule.test.ts`, `packages/astraeus/tests/orbitLook.test.ts`.

**Limitations / unverified**
- Per-frame cost not measured at belt scale (the Objective's frame-time check is outside this Task): a planet line now costs one source evaluation (Earth ~29 us) plus a merge and re-map of ~400 vertices per changed frame; head filling adds at most 4 evaluations a frame.
- The head's content depends on play history (filled progressively under the budget); a same-time re-sync takes no new points, so `pathViewSync`'s live-vs-fresh equality holds.
- Near the planet series' ends (within half a turn of 1950 or 2045) a centred turn is not covered: the line keeps its last turn (or the opening-time span) rather than sliding inside the coverage.
- Browser check at true scale and the owner look are not run (owner_validation required).

**Repair after the coordinator's wave gate (2026-11-23; stage build -> audit).** The full `npm test` failed 12 tests in 3 files:
1. `tests/apiImports.test.ts` "only the allowed modules": `api/sunOrbit.ts` imported `app/PathView`. The hook type moved to `app/experienceDefinition.ts` (`PathSpec.turn?: TurnAboutDisplay` with `reosculate`), which `sunOrbit.ts` already imports; `ReosculatingPath` removed from `PathView.ts`. Allowlist unchanged.
2. Previous deviation withdrawn (fixed-span orbits all drawn about the display time). The turn rule is now opt-in: `PathView` applies it (`#ruled`) to a rolling orbit window or a fixed-span orbit whose layer carries `turn` (set only by `sunOrbitLayer`, internal; API lock unchanged). Other fixed-span orbit layers are sampled exactly as before; `packages/astraeus-demo-apollo11/tests/sunCentred.test.ts` passes unchanged. Constructor's fixed-span sampling moved into `#sampleOpening` (complexity limit).
3. `packages/astraeus-demo-apollo11/tests/paths.test.ts` (Moon composition line), expected values only, computed from the rule by a new local `ruleTimes(date)` (turnGridTimes + headAbout/headByNearness/HEAD_BUDGET + mergedLineTimes); setup untouched (coordinator-approved for this file):
   - "has today's vertices and times at ..." (3 dates): expected times/samples were the old clock-centred sampler (`legacySampleOrbitPath`, now removed as unused) -> the turn-grid times and the Moon's positions there; `vertexAbsolute(k)` expected at the drawn time k (head included).
   - "keeps its refresh policy ...": expected centre `dates[0]` etc. (old rule: centre = build time) -> `gridCentre(build time)`; the rebuild/no-rebuild sequence is unchanged.
   - "carries with Earth in a Moon-centred scene by the offset the resolver gives": property still holds; the assertion paired drawn vertex 90 with far sample 90 (old rule: vertices are the samples). Expected now the Moon's position at drawn time 90 plus the same resolver offset, tolerance 1e-9 kept.
   - "through a view, places each vertex at the clock time's offset" and "counts the line's vertices in view": fixed-span layers, fixed by item 2 (code), unchanged.
   Gates after repair: typecheck pass; eslint 0 problems and prettier clean on the 10 changed files (adds `src/app/experienceDefinition.ts`, `packages/astraeus-demo-apollo11/tests/paths.test.ts`); vitest on the 31 files + `apiImports.test.ts` + `packages/astraeus-demo-apollo11/tests`: 44 files, 717 passed, 2 skipped (then the 17-file subset after the `#sampleOpening` refactor: 333 passed, 1 skipped). Gap table re-measured: unchanged. API lock unchanged.

## Drift Notes

- Design `Views of one scene` / `A lighter frame loop (O-087)`: orbit lines (`PathView`, `kind: "orbit"`) are no longer sampled once: a fixed span gives the turn length, the view draws one turn about the display time on a fixed time (or eccentric-anomaly) grid, re-sampled when the display time leaves the middle half; a cached fine head (`orbitLineRule.ts` HEAD_*) plus the body's live place ends the line on the body; one live evaluation per changed frame, at most 4 head points a frame. For reconciliation before the Full Check.
- New internal `PathSpec.turn` (opt-in turn rule; `reosculate`) on Sun-orbit layers; the hook re-fits the osculating fallback whose source ends first (osculating fallback), re-fitted at the display time on re-sample.
- Composition moon windows now sit on the turn grid (`turnGridTimes`) instead of being centred on the clock; re-sample triggers unchanged.

## Coordinator Completion

Wave gate on the first hand-off failed 12 tests in 3 files outside the builder's focused set (`apiImports`: api imported app/PathView; Apollo `sunCentred`: deviation 4 changed fixed-span orbit layers; Apollo `paths`: old clock-centred sampling pinned). Builder repair: hook type moved to `app/experienceDefinition.ts` (`PathSpec.turn`), turn-about-display made opt-in (only `sunOrbitLayer` sets it; deviation 4 withdrawn), Apollo `paths` expectations updated. Second gate failed `packageBoundaries` (Apollo deep imports 125 → 126, the test imported `astraeus/app/orbitLineRule`). Coordinator fix: the Apollo `paths` Moon-line cases no longer import the rule; they assert the grid by its one-line definition (whole multiples of the month's step, centred on the nearest grid point), the samples at those times, vertex 0, the line passing through the Moon's place at the clock time, and the Moon-centred carry on vertex 0; the rule itself stays tested in `tests/orbitLineRule.test.ts`. Setup untouched.

Marked done by the coordinator under the owner's "orchestrate O99" (2026-11-23) after the wave gate passed on 2026-11-23T08:42Z: `npm run typecheck` ok, `npm run lint` ok, `npm test` 339 files, 5516 passed, 2 skipped. Owner validation (look on localhost:5490) is still to come, before the Full Objective Check, together with T-446's.

## Owner Validation

Owner looked on localhost:5490 (`npm run preview:owner`, branch o099-orbit-lines at 2e8de417) on 2026-11-23 — `?experience=synthetic-belt` close zoom on Earth with time playing, zoomed out, and the Apollo page's Moon line — and said "looks good". The acceptance fields are filled in once the Full Objective Check has an id.
