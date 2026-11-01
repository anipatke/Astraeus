---
id: T-225
title: Let the app point the camera
objective: O-052
status: planned
depends_on: [{task: T-224, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: voyagers-feedback-20261101}
replanned: 'Owner 2026-11-01 (modularity): camera pose read and restore added so a host can compose camera moves itself.'
---

# Let the app point the camera

## Outcome

A host can make the camera follow or frame any shown object, and read the camera pose and restore it later, from `mount` and `AstraeusScene` (O-052 "Host camera").

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `MountedScene.setCamera(target)` through `ViewerLink` and the existing `controls.cameraRequest` path; `target` is `{ follow: id }` / `{ focus: id }` (the forms of a view's `camera`) or a pose from `MountedScene.camera`.
- `MountedScene.camera` returns the current camera as a plain serialisable value (what it follows or focuses, azimuth, elevation, distance; the same pose the view link writes), undefined before `ready` and after `unmount`. `setCamera(handle.camera)` after the visitor has moved the camera puts it back where it was read (test: read, move, restore, compare within rounding). A pose whose object is hidden by the showing view throws `bad-camera`. Unknown id, or one hidden by the showing view, throws `bad-camera` naming it; a malformed argument throws `bad-camera`; before `ready` or after `unmount`, `missing-data`.
- `AstraeusScene` prop `camera` applied once drawn and whenever its value changes (a new object with the same target does not re-apply); errors to `onError`.
- Tests (viewerHostDom-style and through the camera request path as in `viewCameraDom`): follow, focus, pose read and restore, unknown, hidden, malformed, before ready, after unmount, React prop and repeat-value case.
- README rows and API comments; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/sceneCamera.ts`, `packages/astraeus/src/shell/viewCamera.ts`, `packages/astraeus/src/app/viewLink.ts`, `packages/astraeus/tests/viewerHostDom.test.ts`, `packages/astraeus/tests/viewCameraDom.test.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-06, TEST-01, TEST-03, TEST-04, CODE-01; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. `ViewerControl` gains a camera call; `ViewerLink.setCamera` validates against the showing view's objects.
3. A camera read on `ViewerControl` built from the existing view-link pose (`StartView` in `src/app/viewLink.ts`); a pose target goes through the same request path.
4. `mount` and `AstraeusScene` expose both; tests, README, CHANGELOG.

## Boundaries

No camera animation API beyond what the request path already does; no automatic moves (the engine composes none; the next step adds the event zone signal a host composes with).

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, gates, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
