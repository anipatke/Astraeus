---
id: T-192
title: Show a path's own name at any distance
objective: O-046
status: done
depends_on: [{task: T-191, requires: clear}]
check_waiver:
  task: T-192
  reason: 'Owner said "orchestrate O-46"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o046-run-20261030}
  recorded_at: '2026-10-30T20:56:21Z'
owner_validation: {required: false}
planned_by: {role: planner, session: o046-planning-20261030}
---

# Show a path's own name at any distance

## Outcome

A path's label shows at its marker and follows `setSwitches({ labels })` at the distances its scene is viewed from: label reach for path items is derived from the scene the same way as for bodies (unlimited in a Sun-centred scene or a fitted zoom-out, the camera reach otherwise) instead of the fixed `labelMaxDistance: 4` at `src/api/scene.ts:590` (I-100).

## User Check

Not owner-facing on its own; the owner looks at the end.

## Done When

- First prove the cause with a failing test (TEST-02): in a made-up scene where body labels show and the path label does not. If the cause is not label reach, record the real cause and fix that instead.
- One shared rule decides label reach for bodies and paths (strategic fix: no separate path constant); a test shows the path label shown in a Sun-centred scene zoomed out, in an Earth-centred scene within reach, hidden beyond reach, and hidden with `setSwitches({ labels: false })`.
- Apollo 11's labels behave as before (name the test or scenario).
- README note on path labels; CHANGELOG line.

## Context Files

`packages/astraeus/src/api/scene.ts` (`#bodyObject`, the tracked items in `toDefinition`), `packages/astraeus/src/app/SceneLabels.ts`, `packages/astraeus/src/shell/experience.ts` (`labelMaxDistance`), `packages/astraeus/tests/publicApiPaths.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Failing test for the missing path label.
3. Share the label-reach rule between bodies and paths.
4. Tests, docs.

## Boundaries

No change to label priority order or label styling.

## Technical Verification

Focused tests while iterating; configured gates at hand-off. No browser run (the label is checked in the browser in the last step). Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

- Cause proven first (TEST-02): `packages/astraeus/tests/publicApiPathLabels.test.ts` failed before the fix with body labels shown (earth, moon) and `probe` hidden at the same camera distance 50; the cause is the fixed `labelMaxDistance: 4` on path items in `toDefinition`, not SceneLabels or units.
- Fix: one private `#labelReach(sunCentred)` in `src/api/scene.ts` used by `#bodyObject` and the path items. README (setReach row) and CHANGELOG line added.
- New tests (4) pass: Earth-centred within reach shown, beyond 500 hidden, raised reach followed, Sun-centred any distance, hidden by id (the labels switch's mechanism).
- Gates: lint ok, typecheck ok, build ok; test 1 failed | 1902 passed | 1 skipped (146 files, 1 failed).
- Owner decision 2026-10-30: add a label-distance option (labelReach) rather than change Apollo's path labels. `labelReach?: number` on `addBody` options and `addTrajectory` input (positive finite, else `bad-body` / `bad-trajectory` naming the field) replaces the shared rule for that item; Apollo 11's scene sets `labelReach: 4` on its paths, so `rebuildComparison.test.ts` passes unedited. Tests added for within/beyond reach, bad values, addBody. README rows and CHANGELOG updated.
- Gates after the last edit: lint ok, typecheck ok, build ok, test 146 files passed, 1905 passed | 1 skipped.

## Drift Notes

Record for the last step's Design reconciliation.

