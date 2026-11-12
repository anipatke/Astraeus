---
id: T-307
title: Take the slower speed where two slow-downs overlap
objective: O-069
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: closest-calls-review-20261112}
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

Pending execution.

## Drift Notes

Record architecture deltas; Design is reconciled in the next step.
