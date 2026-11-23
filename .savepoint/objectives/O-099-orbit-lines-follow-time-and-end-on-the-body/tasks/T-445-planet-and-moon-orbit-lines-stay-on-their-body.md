---
id: T-445
title: Planet and moon orbit lines stay on their body
objective: O-099
status: planned
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

Pending execution.

## Drift Notes

Record architecture deltas for reconciliation before the Full Check.
