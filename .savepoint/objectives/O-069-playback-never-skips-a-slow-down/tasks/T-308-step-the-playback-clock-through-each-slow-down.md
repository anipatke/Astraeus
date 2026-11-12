---
id: T-308
title: Step the playback clock through each slow-down
objective: O-069
status: done
depends_on: [{task: T-307, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: closest-calls-review-20261112}
check_waiver: {task: T-308, reason: 'Owner said "orchestrate O-069" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o069-run-20261112}, recorded_at: '2026-11-12T03:50:52Z'}
---

# Step the playback clock through each slow-down

## Outcome

While pacing sets the speed, each frame advances the clock by integrating the paced rate over that frame's real elapsed time, so no frame, however long, passes over a slow-down zone or its ramp; zone entries and exits are reported with cause `playback` as for slow frames today.

## User Check

None for the owner at this step.

## Done When

- A pure function in `src/core/pacing.ts` (planner suggests `pacedAdvance(pacing, fromUtcMs, realElapsedMs, shown?)` returning the new whole-millisecond time) integrates simulated time against real time under `pacedRate`, sub-stepping so that a sub-step never jumps a zone or ramp edge (for example, cap each sub-step's simulated length by the distance to the next edge and a fraction of the local ramp), with a bounded number of sub-steps per call; forward and backward rates; no story names (ARCH-01).
- The frame stage that applies pacing (`src/app/sceneFrame.ts` and the `App.tsx` call sites, CODE-02) moves the clock by that amount while pacing is in charge (`paceAuto`); the clock keeps no pacing knowledge (a seek or re-anchor through its public methods). A chosen speed, a pause, seeking, looping (`wrapWithin`), the end stop and the view-switch pace ease behave as before.
- Node test (ARCH-03, synthetic): six-year span, cruise about 26 days per second, ten event zones of ± 1.5 h at 1,200× with 4 h ramps; advancing in real frames of 16, 33, 100, 250 and 1,000 ms enters every zone, the simulated time spent inside each agrees across frame lengths within a stated tolerance, and `activeEventZones` sees every zone at least once per pass. Regression test (TEST-02) that the old one-rate-per-frame advance skips zones at those frame lengths.
- Existing pacing, pacing-view, synthetic-journey and scene-frame tests pass unchanged (TEST-03 names them in evidence).
- README "Paced playback" says playback eases into every zone whatever the frame rate; CHANGELOG Unreleased (fix). Design reconciled from this Objective's drift notes (both steps) before the Full Objective Check.
- No public API change.

## Context Files

`packages/astraeus/src/core/pacing.ts`, `packages/astraeus/src/core/clock.ts`, `packages/astraeus/src/app/sceneFrame.ts`, `packages/astraeus/src/app/App.tsx` (pacing call sites near `applyPacing`), `packages/astraeus/src/app/openClock.ts`, `packages/astraeus/tests/pacing.test.ts`, `packages/astraeus/tests/pacingViews.test.ts`, `packages/astraeus/tests/syntheticJourney.test.ts`, `packages/astraeus/tests/sceneFrame.test.ts`, `packages/astraeus/README.md` under `Paced playback`, `packages/astraeus/CHANGELOG.md`, `.savepoint/Design.md` under `Journeys across years` and `Views fixes for a multi-probe app`, `.savepoint/objectives/O-069-playback-never-skips-a-slow-down/Objective.md`.

## Design References

`.savepoint/Design.md` under `Journeys across years` (pacing, O-047) and `Views fixes for a multi-probe app` (items 3 and 5: pacing per view, zone reports).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, API-02, API-07, CODE-01, CODE-02, TEST-01, TEST-02, TEST-03, STYLE-02, STYLE-07.

## Implementation Plan

1. Confirm the previous step landed and that the clock advances at one rate per frame as described; REPLAN REQUIRED if the frame loop differs materially.
2. Write the integrator and its node tests first (skip regression, frame-rate independence, edges, reverse).
3. Wire it into the pacing frame stage; keep seek, loop, end stop and the pace ease working.
4. README, CHANGELOG, Design reconciliation; gates.

## Boundaries

No new public option; unpaced playback unchanged; no timeline zoom.

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`; one `npm run check:browser` at the Full Objective Check (not at hand-off). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Step 1 confirmed: the clock ran at one rate per frame (`frameTime` and the 100 ms interval in `App.tsx` each called `applyPacing`, which sets one rate for the clock's current time); no replan.

Gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` all pass (250 files, 3,731 passed, 2 skipped). No browser run. `api-surface.lock.json` unchanged.

| Done When | Evidence |
|-----------|----------|
| Pure `pacedAdvance` in `core/pacing.ts`, sub-stepped, bounded, forward and backward, no story names | `pacedAdvance(pacing, fromUtcMs, realElapsedMs, shown?, direction)`; sub-step stops at the next zone or ramp edge, at most 1/32 of a ramp inside one, trapezoid-timed, `MAX_PACE_STEPS` 4096, whole ms. Tests in `tests/pacedAdvance.test.ts`: "returns a whole millisecond...", "runs backward...", "is bounded...", "copes with a pacing without zones and with zero-width ramps", "honours the view filter". |
| Frame stage moves the clock by it while `paceAuto`; clock keeps no pacing knowledge; chosen speed, pause, seek, loop, end stop, ease unchanged | `stepPacing` (core/pacing.ts) uses only `clock.seek`/`setRate`/`now`; `frameTime` (sceneFrame.ts) calls it, then wrap/stop, and re-applies the paced rate after a wrap or stop; App's 100 ms interval now calls `frameTime`; `seekTo` clears `PaceView.last`. Tests: "does not step through a seek, a pause or a changed rate", "falls back to one rate for the frame while a view-switch ease runs"; existing sceneFrame loop/stop tests unchanged. |
| Synthetic node test: six years, ~26 d/s, ten zones of +-1.5 h at 1,200x, 4 h ramps; frames 16/33/100/250/1,000 ms | "enters every zone at every frame length, and activeEventZones sees each at least once"; "spends about the same real time crossing each zone, and the whole journey": whole pass within 1% + one frame of the 1 ms reference (about 224 s), per-zone in-zone real time (9 s) within two frames. |
| Regression: old one-rate-per-frame advance skips zones | "regression: one rate per frame (the old advance) skips zones at these frame lengths": at 100, 250 and 1,000 ms it misses zones; at 16 and 33 ms it misses zones or is off by more than 1% in pass time. |
| Zone reports follow | "moves a long frame through the slow-down it crosses, and reports each zone enter and leave with cause playback": `frameTime` at 1,000 ms frames feeding `ViewerZones.publish`; heard enter/leave for z0..z2, cause `playback`. |
| Existing tests pass unchanged | `tests/pacing.test.ts`, `tests/pacingViews.test.ts`, `tests/syntheticJourney.test.ts`, `tests/sceneFrame.test.ts`, `tests/eventZonesDom.test.ts` pass with no edits (full suite green). |
| README and CHANGELOG | README "Paced playback" says playback eases into every slow-down whatever the frame rate; CHANGELOG `## Unreleased` has a second Fix entry. Design reconciliation left to the coordinator, per the run brief. |
| No public API change | `api-surface.lock.json` not modified; `pacedAdvance`, `stepPacing`, `MAX_PACE_STEPS` and `PaceView.last` are internal to `core/pacing.ts`. |

Repair (C-171, I-170/I-171, 2026-11-12): `pacedAdvance` integrates a running view-switch ease and `stepPacing` no longer falls back mid-ease (I-171, partly proven; see the Issue); evidence in `tests/pacingRepairs.test.ts`.


## Drift Notes

- `PaceView` gained `last?: { timeUtcMs, rate, nowMs }` (where the last pacing step left the clock). New `core/pacing.ts` exports `pacedAdvance`, `stepPacing`, `MAX_PACE_STEPS`; `applyPacing` is kept (the fallback inside `stepPacing`, the seek, the "auto" switch and the open-time call). Design `Journeys across years` pacing paragraph: playback integrates `pacedRate` per frame instead of one rate per frame.
- `stepPacing` detects a move it did not make (seek, pause/play, rate change) by comparing the clock's own advance with the real time elapsed (slack 5 ms + 2/rate); `App.seekTo` also clears `last`. During a view-switch ease (about 1 s) the frame falls back to the old one-rate advance.
- The 100 ms interval in `App.tsx` now calls `frameTime` (shared with the frame stage) instead of its own wrap/stop/pace lines; order is pace step, then wrap or stop, then re-apply paced rate if the clock was wrapped or stopped.
- Pacing rates are positive only, so the live path is forward; `pacedAdvance`'s `direction` argument (-1) is exercised in tests only.
- Frames longer than 4,096 sub-steps drop the remaining real time (slows rather than skips). These notes are for the coordinator's Design reconciliation (T-308 is the integration Task for them).

Coordinator (2026-11-12T04:00:59Z): gates pass per hand-off (lint, typecheck, build, test 3731 passed / 2 skipped / 0 failed); status done under the owner's "orchestrate O-069" standing rule ("I mark them as they pass"). Reviewed: `stepPacing` falls back to the one-rate step on the first step, while paused, during the ~1 s view-switch ease (Success Condition 2 keeps that ease as today) and after an outside move; the 100 ms interval and the render frame share `frameTime`, and steps compose from `PaceView.last`.
