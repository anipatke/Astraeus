---
id: T-287
title: Let an app select an object
objective: O-061
status: planned
depends_on: [{task: T-285, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: voyagers-review-20261110}
check_waiver: {task: T-287, reason: 'Owner said "orchestrate O-061" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o061-run-20261110}, recorded_at: '2026-11-09T20:44:20Z'}
---

# Let an app select an object

## Outcome

The viewer handle gains one call that selects an object the showing view shows, or clears the selection, on `mount` and React alike; `onSelect` reports it with `cause: "host"`; a bad id throws one named `SceneError` code; it follows the order rule.

## User Check

None on screen beyond the end-of-Objective owner look.

## Done When

Name and shape follow the existing setters (`setView`, `setScale`): proposed `setSelected(id: string | undefined)`, with `bad-selection` for an unknown or hidden id; the executor confirms no clash in the API lock before using them. Tests on both paths (lifecycle suite): select, clear, hidden id, unknown id, before `ready` (`not-mounted`), straight after `ready`, `onSelect` cause. API lock, README table (generated error table), CHANGELOG updated in the same change; the `selected` doc no longer says the host cannot select.

## Context Files

`packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/viewerSelection.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/tests/selectionCauseDom.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md` (handle table, error table), `packages/astraeus/CHANGELOG.md`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-02, API-04, API-05, API-07, ARCH-02, TEST-01, STYLE-05.

## Implementation Plan

1. Add the call to the handle type and the host seam, checked as `setCamera` checks its id.
2. Report through `onSelect` with `cause: "host"`.
3. Add the error code, lock, README rows and CHANGELOG.
4. Tests on both paths; run the gates.

## Boundaries

No `setCamera({ select })` variant: selection stays its own call (modular over consumer-shaped). Opening the info panel follows existing selection behaviour.

## Technical Verification

`npm run check:gates` (lint, typecheck, build, `npm run test:full`, engine-alone, pack, node and react consumer checks); browser scripts only at the Full Objective Check (`npm run check:browser`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Reconcile the new call into Design.md (Public API shape) before the Full Objective Check.
