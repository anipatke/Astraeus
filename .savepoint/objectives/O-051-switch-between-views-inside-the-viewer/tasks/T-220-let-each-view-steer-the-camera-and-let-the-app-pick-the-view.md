---
id: T-220
title: Let each view steer the camera and let the app pick the view
objective: O-051
status: done
depends_on: [{task: T-219, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-220, reason: 'Owner said "Let''s do the scene switching now" under the standing run rules (no per-step checks, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o051-run-20261101}, recorded_at: '2026-10-31T23:16:44Z'}
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

Built 2026-11-01 on o051-views (uncommitted). No extra reads beyond Context Files; read `src/app/views.ts`, `src/app/viewHiding.ts`, `src/api/views.ts` (T-218/T-219 outputs, named in the brief) and `CameraController.tsx` `switchFocus`.

Per criterion:
- Camera rule: `shell/viewCamera.ts` `presetForViewRule` + `AstraeusShell` `useViewSwitch`/`applyViewRule`, applied only on a view switch when the active follow/focus target is not in the new view's experience; goes through `onCameraRequest` (`controls.cameraRequest`) and `activePresetId`. Tests `tests/viewCameraDom.test.ts` (stay, written-out stay, start, follow, focus, untouched for stay/start/follow when the object stays, card closes, no request on open) and `tests/sceneCamera.test.ts` (no request keeps focus/pose; follow/focus requests through `stepCameraTarget`).
- Host: `ViewerControl.views/setView`, `ViewerState.view`, `ViewerLink.view/setView`, `ViewerChange.view`, `MountedScene.view/setView`, `AstraeusScene` `view` prop; App publishes `visitor` on the button, link publishes `host` on `setView`. Unknown id and no-views throw `bad-view`; before ready/after unmount `missing-data`. Tests in `tests/viewerHostDom.test.ts` (no-views scene: view undefined, bad-view, no `view` key in payloads; opening view, switch, unknown, ready/unmount; causes; React prop and onError).
- README rows (setViews camera, `view`/`setView`, onChange, `<AstraeusScene view />`, API comments) and CHANGELOG Unreleased line written.
- Removed T-219's "falls back when the selected object leaves the view" test from `viewsDom.test.ts`: superseded by viewCameraDom (the fallback to overview for view switches is replaced by the rule).

Hold follow-up (coordinator request): tests `tests/sceneCamera.test.ts` > "a held camera (a view's stay rule)": keeps the target and camera still while the object it was on moves on, and keeps the distance and angles; is replaced by the next focus: picking a new object focuses it normally and the target follows it again; is released by a focus on the very object it was held on; rescales its point with the visual scale, like the transition. `tests/viewCameraDom.test.ts` stay cases now expect `{ kind: "hold" }`. Gates below are the final rerun after this change.

Gates (all pass): `npm run lint`; `npm run typecheck`; `npm run build`; `npm test` 171 files, 2123 passed, 1 skipped; `npm run check:pack` pass. First lint run failed (AstraeusShell complexity 22); fixed by extracting `useViewSwitch`, rerun clean. No browser run (rules of this run).

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- (Supersedes the earlier `stay` note, owner direction via coordinator.) `stay` holds the camera: new generic `CameraRequest` kind `{ kind: "hold" }` sets `OrbitCameraState.fixedPoint`, the target's current position (tween included) in the scene frame, so the target stays put against the scene centre while the clock runs; distance and angles are kept. `cameraTargetAbsolute` (sceneCamera.ts) gives `fixedPoint ?? focusAbsoluteOf`; `switchFocus` clears it (a focus or follow on the same id also releases it); `rescaleCameraForPolicy` scales it with the visual scale. The shell gets `onCameraHold` (View `stay` calls it) and still clears its active preset and closes the card. Scene-frame camera state only, no State change (ARCH-02). `focus` still names the hidden id for zoom limits and the view readout.
- Rule applies from the new view's `camera` (the view switched to), for visitor and host switches alike; not on open.
- `ViewerControl` gains `views` and `setView`; `ViewerState` gains optional `view` (also compared in `ViewerLink.publish`). `AstraeusShell` gains prop `viewCamera`. Design.md `Interfaces and Data Flow` should list the view in the host link and the camera rule at reconciliation (last step).
