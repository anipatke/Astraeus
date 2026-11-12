---
id: T-307
title: Take the slower speed where two slow-downs overlap
objective: O-069
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: closest-calls-review-20261112}
check_waiver: {task: T-307, reason: 'Owner said "orchestrate O-069" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o069-run-20261112}, recorded_at: '2026-11-12T03:50:52Z'}
---

# Take the slower speed where two slow-downs overlap

## Outcome

Wherever pacing pieces overlap or their ramps meet, the paced speed is the slowest of the speeds each piece alone would give at that time, as the README says, instead of the product of their eases that is slower than both.

## User Check

None for the owner at this step.

## Done When

- `pacedRate` returns, at every time, the minimum over the base rate and each applicable piece's own blended rate (each piece alone over the base, log-space smoothstep as today); a time touched by no piece returns exactly the base rate; result continuous in time; order-independent.
- Regression test (TEST-02) in `tests/pacing.test.ts`: two pieces whose ramps meet, each alone giving about 1,659× and 8,477× (F-15 shape: base cruise, two pieces at 1,200× with 4 h and 1 h ramps), now give the smaller, not 1,305×; plus nested and touching cases, view-filtered zones, and the existing cases unchanged.
- README "Paced playback": the "slowest speed wins" sentence names the ramp case too. CHANGELOG Unreleased entry (fix).
- No public API change (`api-surface.lock.json` unchanged).

## Context Files

`packages/astraeus/src/core/pacing.ts`, `packages/astraeus/tests/pacing.test.ts`, `packages/astraeus/tests/pacingViews.test.ts`, `packages/astraeus/README.md` under `Paced playback`, `packages/astraeus/CHANGELOG.md`, `.savepoint/objectives/O-069-playback-never-skips-a-slow-down/Objective.md`.

## Design References

`.savepoint/Design.md` under `Journeys across years` (pacing, O-047) and `Views fixes for a multi-probe app` (items 3 and 5: pacing per view, zone reports).

## Guardrails

ARCH-03, ARCH-04, API-07, TEST-01, TEST-02, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm `pacedRate` and `inLayerOrder` are as the Objective describes; REPLAN REQUIRED if not.
2. Compute each applicable piece's own rate over the base and take the minimum; drop the layer order if nothing else needs it.
3. Tests as above; README sentence; CHANGELOG.

## Boundaries

No new pacing option (no separate ease-in and ease-out); no change to clock advance (next step).

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`; no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

| Done When | Evidence |
|---|---|
| `pacedRate` = slowest of each touching piece's own blend; untouched = exact base; continuous; order-independent | `src/core/pacing.ts` `pacedRate` (layer order removed); `pacing.test.ts` "nested, touching and unordered zones" compares to per-piece solo rates over a minute grid, reversed order equal, continuity bound, untouched `toBe(base)` |
| F-15 regression, nested, touching, view-filtered, existing cases unchanged | `pacing.test.ts` "overlapping ramps take the slower speed (O-069 T-307, F-15)" (3 tests; 1,200x pieces with 4 h and 1 h ramps give the slower solo rate, not the layered product); existing pacing, pacingViews and syntheticJourney tests pass unchanged |
| README sentence and CHANGELOG | `packages/astraeus/README.md` Paced playback; `packages/astraeus/CHANGELOG.md` `## Unreleased` fix |
| No public API change | `api-surface.lock.json` not modified (git status) |

Gates: `npm run lint` pass, `npm run typecheck` pass, `npm run build` pass, `npm test` 249 files pass, 3719 passed, 2 skipped, 0 failed. No browser run. The regression test checks the equality with the slower solo rate at a probe time rather than pinning the F-15 absolute 1,659x figure (its base differs).

Note: a piece faster than the base still raises speed where it alone touches a time (cruise spans); the minimum is over touching pieces only, with base where none touches.

Repair (C-171, I-170/I-171, 2026-11-12): `pacedRate` now lays spans as the cruise and eases each event rule from it (I-170); evidence in I-170 and `tests/pacingRepairs.test.ts`.

Repair (C-172, I-172, 2026-11-12, owner decision): `pacedRate` is now cruise = max(base, each faster span's blend), result = min(cruise, each slower span's and each rule's blend from the cruise); the layered span blend is gone. Evidence in I-172, `tests/pacingOverlaps.test.ts` and the T-307 spans test in `pacing.test.ts`.


## Drift Notes

Record architecture deltas; Design is reconciled in the next step.

- `inLayerOrder` and its WeakMap cache removed from `pacing.ts`; `pacedRate` now takes the minimum of per-piece blends (Design `Journeys across years` pacing wording "laid fastest first" if present should say minimum of each piece alone). Not an API change.

Coordinator (2026-11-12T03:55:46Z): gates pass per hand-off (lint, typecheck, build, test 3719 passed / 2 skipped / 0 failed); status done under the owner's "orchestrate O-069" standing rule ("I mark them as they pass"). Deviation accepted: the minimum runs over touching pieces only, not the base, because a piece may be faster than the base (cruise spans); a time touched by no piece is exactly the base, as Done When requires.
