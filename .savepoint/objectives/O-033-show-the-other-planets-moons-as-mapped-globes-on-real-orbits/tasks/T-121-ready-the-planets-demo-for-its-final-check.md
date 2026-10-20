---
id: T-121
title: Ready the planets demo for its final check
objective: O-033
status: planned
depends_on: [{task: T-120, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o033-planning-20261020}
---

# Ready the planets demo for its final check

## Outcome

The planets demo has one browser check set the Full Objective Check can run, every planet's download size is within a stated limit, and Design describes what was built.

## User Check

Read the size table per planet and the check map; then look at each planet on the preview (the owner's one look, recorded).

## Done When

1. `npm run check:demo -- planets` (renaming the `jupiter` set) runs the switch, place-tap and moons-panel scenarios from T-117 to T-119 at phone and desktop sizes; every prior Jupiter scenario mapped in `docs/BROWSER_CHECKS.md`; kept short (owner rule, O-034).
2. Load budget: a stated limit per planet view, checked by `tools/validate/load-budget.mjs`; public build passes the asset validator.
3. Design reconciled for every drift note from T-114 to T-120 (reflected or non-architectural with a reason); `README` demo line updated.
4. Configured gates pass fresh; browser sets are run once, by the Full Objective Check, not here.
5. Owner validation recorded after the owner's look on the preview.

## Context Files

`tools/validate/run-demo.mjs`, `tools/validate/load-budget.mjs`, `tools/validate/public-build-assets.mjs`, `docs/BROWSER_CHECKS.md`, `.savepoint/Design.md`, `README.md`.

## Design References

Design: whole document for reconciliation.

## Guardrails

PROV-02, TEST-01, TEST-03, TEST-04.

## Implementation Plan

1. Assemble the demo set; map scenarios.
2. Budgets; reconcile Design; fresh gates; owner look.

## Boundaries

No feature work; a failure found here goes back to its Task or becomes an Issue.

## Technical Verification

Configured gates fresh; browser sets at the Full Objective Check; evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
