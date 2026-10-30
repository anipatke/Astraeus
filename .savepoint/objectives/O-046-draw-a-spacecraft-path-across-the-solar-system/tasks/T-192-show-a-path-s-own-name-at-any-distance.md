---
id: T-192
title: Show a path's own name at any distance
objective: O-046
status: planned
depends_on: [{task: T-191, requires: clear}]
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

Pending execution.

## Drift Notes

Record for the last step's Design reconciliation.
