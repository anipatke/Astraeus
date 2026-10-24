---
id: T-180
title: Test the 3D drawing code and recount coverage
objective: O-043
status: planned
depends_on: [{task: T-179, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o043-planning-20261024}
---

# Test the 3D drawing code and recount coverage

## Outcome

Coverage counts the code a developer runs: the data-import tools leave the count with the reason written in Design, and new tests of real behaviour bring `packages/astraeus/src/app/` to 80% or more of statements and the overall figure to 80% or more under `npm run test:full`. Design is reconciled for all of O-043.

## User Check

None required; the owner reads the before-and-after coverage figures in the hand-off.

## Done When

- `vitest.config.ts` `test.coverage.include` no longer lists `packages/*/tools/import/**`; a one-line comment says why (maintainer-run JPL import scripts, not in the npm package; owner 2026-10-24). No other exclusion is added.
- New or extended node tests cover behaviour in the least-covered drawing files (from the 2026-10-24 measure: `sceneContentsHooks.ts`, `App.tsx`, `FeatureMarkers.ts`, `CameraController.tsx`, `RingView.ts`, `sceneHooks.ts`, `SceneLabels.ts`, `BodySetLabels.ts`, `StoryMarkers.ts`, `bodyDraw.ts`), each asserting outcomes (positions, visibility, labels, camera targets, settings applied), not just that code ran. Pure logic buried in a hook or component may be lifted into a named function to test it (CODE-02 for frame work), as a small behaviour-preserving move.
- `npm run test:full` reports overall statements at 80% or more and `packages/astraeus/src/app/` at 80% or more; figures before and after (overall, per area) recorded in Technical Evidence with the command and time.
- `.savepoint/Design.md` reconciled: Code Health paragraph (coverage scope and why), the bundle measurement command and figures, the on-demand developer panels (T-179); every O-043 Drift Note accounted for as reflected or non-architectural with a reason.
- Hand-off gates plus `npm run test:full` and `npm run check:engine-alone` green.

## Context Files

`vitest.config.ts`, `packages/astraeus/src/app/sceneContentsHooks.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/FeatureMarkers.ts`, `packages/astraeus/src/app/CameraController.tsx`, `packages/astraeus/src/app/RingView.ts`, `packages/astraeus/src/app/sceneHooks.ts`, `packages/astraeus/src/app/SceneLabels.ts`, `packages/astraeus/src/app/BodySetLabels.ts`, `packages/astraeus/src/app/StoryMarkers.ts`, `packages/astraeus/src/app/bodyDraw.ts`, `packages/astraeus/src/app/sceneFrame.ts`, `packages/astraeus/tests/featureMarkers.test.ts`, `packages/astraeus/tests/sceneFrame.test.ts`, `packages/astraeus/tests/sceneCamera.test.ts`, `.savepoint/Design.md`, the T-178 and T-179 Task files.

## Design References

Design Current Technical State (Code Health signals); Components/Codebase Map (`src/app/`).

## Guardrails

ARCH-03, CODE-01, CODE-02, TEST-01, TEST-03, STYLE-02, STYLE-03, STYLE-10.

## Implementation Plan

1. Change the coverage scope; run `npm run test:full` for the new baseline per area.
2. Write tests file by file, largest gap first, until both targets hold; lift pure logic out of hooks only where it cannot be reached otherwise.
3. Run `npm run test:full`; record the figures.
4. Reconcile Design for O-043.

## Boundaries

No new exclusions beyond the import tools; no browser-run screenshots (project rule); no behaviour change in the drawing code; no tests of the import tools in this Objective.

## Technical Verification

Hand-off gates from AGENTS.md plus `npm run test:full` (writes `coverage/coverage-final.json`) and `npm run check:engine-alone`. No `npm run check:browser` per Task; one run at the Full Objective Check, where `savepoint health check O-043` takes the official snapshot. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

This Task is the O-043 integration step for deferred Design notes.
