---
id: T-308
title: Step the playback clock through each slow-down
objective: O-069
status: planned
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

Pending execution.

## Drift Notes

Record architecture deltas; reconcile Design in this step before the Full Objective Check.
