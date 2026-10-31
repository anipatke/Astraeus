---
id: T-220
title: Let each view steer the camera and let the app pick the view
objective: O-051
status: planned
depends_on: [{task: T-219, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o051-plan-20261101}
---

# Let each view steer the camera and let the app pick the view

## Outcome

Each view's `camera` rule decides what the camera does when the followed or focused object is not in the new view, and the host can set and read the view through `mount` and `AstraeusScene`, hearing changes through `onChange` (I-124, camera and host half).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- Camera rule, applied only when the followed or focused object is not in the new view: `"stay"` (default) keeps the camera pose, stops following and closes the hidden object's card; `"start"` applies the view's own `{ follow | focus: id }` framing, else the scene's start framing; `{ follow: id }` / `{ focus: id }` follows or focuses that object. When the object is still in the new view the camera is untouched (tests for each rule and the untouched case, through the real camera request path as in `sceneCamera`/`startCamera` tests, not browser).
- `MountedScene.view` (current view id; undefined before `ready`, after `unmount`, or with no views) and `setView(id)` (unknown id throws a named error; before `ready` or after `unmount` throws `missing-data`, like `setTime`), through `ViewerLink` attach/publish. `ViewerChange` gains `view`; a visitor switch publishes with cause `visitor`, `setView` with cause `host`. `AstraeusScene` gains a `view` prop applied once drawn and on change, errors to `onError`.
- A scene without views: `view` is undefined, `setView` throws a named error, `onChange` payloads unchanged apart from the optional field.
- Tests: viewerHostDom-style tests for `setView`, `view`, `onChange` causes and the React prop; camera rule tests.
- README rows (`setViews` camera option, `MountedScene.view`/`setView`, `AstraeusScene` `view`) and API comments; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/sceneCamera.ts`, `packages/astraeus/src/shell/AstraeusShell.tsx`, `packages/astraeus/tests/viewerHostDom.test.ts`, `packages/astraeus/tests/sceneCamera.test.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, TEST-04, CODE-01; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Confirm the previous step's view state exists in App; return REPLAN REQUIRED if not.
3. Replace the unavailable-object fallback for view switches with the per-view rule, through the existing camera request path.
4. `ViewerControl`/`ViewerLink` gain the view; `mount` and `AstraeusScene` expose it.
5. Tests, README, CHANGELOG.

## Boundaries

No view in the address; no change to time-based availability ("(Unavailable)" for out-of-span objects stays); no State change (ARCH-02).

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
