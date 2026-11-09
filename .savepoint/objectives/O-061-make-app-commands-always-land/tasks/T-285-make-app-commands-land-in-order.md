---
id: T-285
title: Make app commands land in order
objective: O-061
status: planned
depends_on: [{task: T-284, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: voyagers-review-20261110}
check_waiver: {task: T-285, reason: 'Owner said "orchestrate O-061" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o061-run-20261110}, recorded_at: '2026-11-09T20:44:20Z'}
---

# Make app commands land in order

## Outcome

The camera, time and view cases from T-284 pass: every host call after `ready` takes effect or throws in call order, before the first frame and inside `onChange` view-switch reports, and a view's follow rule works on a planet other views also show. The README states the order rule.

## User Check

None on screen beyond the end-of-Objective owner look.

## Done When

T-284's camera, time, view and follow-rule tests pass unmarked on both paths; one fix in the host seam, not one per call (STYLE-07); README host section states the order rule; CHANGELOG entry; no existing test changed.

## Context Files

T-284's Technical Evidence and test files; `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/viewerCamera.ts`, `packages/astraeus/src/api/viewerClock.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/app/views.ts`, `packages/astraeus/README.md` (host handle section), `packages/astraeus/CHANGELOG.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (host control seam).

## Guardrails

API-02, API-05, ARCH-02, TEST-01, TEST-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Apply the cause found for each case at the host seam.
2. Unmark the tests; run them on both paths.
3. Write the order rule into the README and the CHANGELOG.
4. Run the gates.

## Boundaries

No new public call; no change to existing call shapes or error codes. Story panels are the next step.

## Technical Verification

`npm run check:gates` (lint, typecheck, build, `npm run test:full`, engine-alone, pack, node and react consumer checks); browser scripts only at the Full Objective Check (`npm run check:browser`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Reconcile the host seam's order rule into Design.md (Interfaces and Data Flow) before the Full Objective Check.
