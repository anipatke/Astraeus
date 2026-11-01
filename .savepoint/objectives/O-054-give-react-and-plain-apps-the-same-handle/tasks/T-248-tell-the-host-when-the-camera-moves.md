---
id: T-248
title: Tell the host when the camera moves
objective: O-054
status: planned
depends_on: [{task: T-247, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o054-planning-20261101}
---

# Tell the host when the camera moves

## Outcome

Both paths' handle can hear the camera pose change, as its own signal, so a host can follow what a visitor does with the camera (O-054 Success Condition 7, third part; review F10).

## User Check

Not owner-facing: the change shows only to a host page's code and its tests. The owner sees the result at the end of the Objective.

## Done When

- `src/api/viewerCamera.ts` gains `onCameraChange(listener)` returning a stop function; on each viewer publish (the existing 100 ms tick and host or visitor publishes) it reads the pose and reports it to listeners when any of `focus`, `azimuthDeg`, `elevationDeg`, `distance` differs from the last report (the pose is already rounded), so at most about ten reports a second. The opening pose is read, not reported; a camera that follows a moving object at a fixed pose reports nothing. Listeners run through the O-054 listener helper.
- `ViewerHandle` gains `onCameraChange(listener: (camera: CameraPose) => void): () => void` (name and payload per the O-054 planned decisions).
- Named tests with a fake control (as in `viewerLinkPin.test.ts`) and one DOM test: a `setCamera` that eases reports changes then stops when the pose settles; an unchanged pose reports nothing; nothing after unmount; a throwing listener does not stop others.
- The `it.todo` for `onCameraChange` in `lifecycle.test.ts` is a real case on both paths; the member table includes it.
- README handle rows list it.
- **Surface recorded:** `npm run api:lock` regenerated `packages/astraeus/api-surface.lock.json`; `packages/astraeus/CHANGELOG.md` Unreleased has one entry for this step ending in a one-line migration note for app makers (what to change in an app built on 0.7.0); `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/viewerCamera.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/tests/viewerLinkPin.test.ts`, `packages/astraeus/tests/hostCameraDom.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md` under the `mount` API section.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-054 Objective under `Success Conditions` and `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F10).

## Guardrails

API-01, API-02, API-05, ARCH-02, TEST-01, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Add the last-reported pose and `publish` to the camera part; call it from `ViewerLink.publish`.
3. Add `onCameraChange` to `ViewerHandle`.
4. Tests, README rows, `npm run api:lock`, CHANGELOG (new; no migration needed), O-053 tests, gates.

## Boundaries

Signal only; no change to how the camera moves, no new React prop, no per-frame work added to the 3D frame loop (CODE-02).

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read and changed, and limitations, recorded after the work lands.

## Drift Notes

Record any architecture delta here and name T-249 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
