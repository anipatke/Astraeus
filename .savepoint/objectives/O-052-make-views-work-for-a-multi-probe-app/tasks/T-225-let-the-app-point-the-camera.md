---
id: T-225
title: Let the app point the camera
objective: O-052
status: done
depends_on: [{task: T-224, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-225, reason: 'Owner said "orchestrate 052" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o052-run-20261101}, recorded_at: '2026-11-01T04:08:36Z'}
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

Files read: the Task's Context Files, plus (extra reads, logged) `packages/astraeus/src/app/CameraController.tsx` (CameraRequest, switchFocus, resolveCamera: where the request kind and the easing live), `packages/astraeus/src/app/viewHiding.ts` (`hiddenByView`: the hidden set the target check reads), `packages/astraeus/src/api/index.ts` (public exports), `packages/astraeus/tests/sceneCamera.test.ts` (existing camera-step test setup), `packages/astraeus/CHANGELOG.md`.

Files changed: `src/app/CameraController.tsx` (new `CameraRequest` kind `pose`), `src/app/sceneCamera.ts` (applies it: `switchFocus` to the pose's object, eases the target angles and distance), `src/app/viewerPort.ts` (`ViewerControl` gains `cameraTargets`, `readCamera`, `setCamera`), `src/app/App.tsx` (implements them from `controls.viewHidden`, `controls.viewReadout`, `controls.cameraRequest`), `src/api/viewerLink.ts` (`ViewerLink.camera`, `setCamera`, validation; types `CameraPose`, `CameraTarget`), `src/api/mount.ts`, `src/api/AstraeusScene.tsx` (`camera` prop, compared by value), `src/api/index.ts`, `README.md`, `CHANGELOG.md`; tests `tests/hostCameraDom.test.ts` (new), `tests/sceneCamera.test.ts`, and the two hand-made `ViewerControl` objects in `tests/viewerHostDom.test.ts` and `tests/viewerHostReady.test.ts`.

Gates (all pass): `npm run lint`; `npm run typecheck`; `npm run build`; `npm test` (178 files, 2184 passed, 1 skipped; run without the junit reporter flags). No browser run.

### Done When -> test

H = `tests/hostCameraDom.test.ts`, S = `tests/sceneCamera.test.ts` (describe "a pose read and restored").

| Done When claim | Proving test(s) |
|---|---|
| `setCamera` with `{ follow: id }` goes through `ViewerLink` and `controls.cameraRequest` | H "follow: sends a follow request for a shown object..." |
| `setCamera` with `{ focus: id }` likewise | H "focus: sends a focus request for a shown object" |
| `setCamera` takes a pose from `camera` (through the same request path) | H "read, move, restore: the restore request carries exactly the pose that was read" |
| The scene camera follows an object and eases to the pose's angles and distance | S "puts the camera back where it was read after the visitor moved it" |
| `camera` returns a plain serialisable value (focus, azimuth, elevation, distance; the view-link pose) | H "is a plain serialisable value that survives JSON, and later camera moves do not change a value already read" |
| `camera` is undefined before `ready` | H "is undefined before ready and after unmount, and defined between" |
| `camera` is undefined after `unmount` | same test |
| `camera` is defined as soon as `ready` resolves (opening pose, before the first frame) and `setCamera(camera)` works at once | H "is the opening pose as soon as a bare await ready resolves..." |
| ... and is the scene's start view when it has one | H "is the scene's start view when it has one" |
| Read, move, restore, compare within rounding | S "puts the camera back where it was read..." (`near`: 0.1 deg, 1e-4 relative distance) |
| Restore works for each input changed alone (focus, azimuth, elevation, distance) | S "each input alone: only the focus, only the azimuth, only the elevation or only the distance differs" |
| Restore works when the followed object moves between read and restore | S "the followed object moves between read and restore..." |
| Restore works when the camera was following a moving object and kept up | S "restores after the camera was following a moving object..." |
| A pose whose object the showing view hides throws `bad-camera` | H "a pose whose object the showing view hides throws bad-camera" |
| Unknown id throws `bad-camera` naming it | H "an unknown id throws bad-camera naming it, and sends nothing" |
| Id hidden by the showing view throws `bad-camera` naming it (and works once its view shows) | H "an object the showing view hides throws bad-camera, and is accepted once its view shows" |
| Malformed argument throws `bad-camera` | H "malformed arguments throw bad-camera" (15 cases: non-objects, empty, empty/non-string id, both keys, extra key, bad pose fields, elevation > 89, distance 0, missing focus) |
| Before `ready`: `missing-data` | H "before ready and after unmount: missing-data" |
| After `unmount`: `missing-data` | same test |
| `AstraeusScene` `camera` applied once drawn | H "is applied once drawn, and again when its target changes" |
| ... and whenever its value changes | same test; H "does not re-apply a new object with the same target, but does for a changed pose" |
| A new object with the same target does not re-apply | H "does not re-apply a new object with the same target..." (follow and pose) |
| Errors go to `onError` | H "an unknown or hidden target goes to onError as bad-camera" |
| No prop: camera left alone | H "without the prop the camera is left alone" |
| Hold (stay rule) is escaped by a restore | S "also takes the camera out of a hold (the stay rule)" |
| README rows and API comments | README (mount row, `<AstraeusScene>` row, three new rows under "Reading and setting the time"); doc comments on `MountedScene`, `AstraeusSceneProps`, `ViewerLink`. Reviewed by reading; no test |
| CHANGELOG `Unreleased` line | `CHANGELOG.md` first Unreleased bullet. Reviewed by reading; no test |

Limitations and unverified: no browser run, so the real scene's `viewReadout` feeding `camera` is covered only by reading the existing wiring (`sceneFrame.ts` writes it every frame) and by tests that set it by hand. The restore eases (about a second), so `camera` read straight after `setCamera` is mid-move. Before the first frame `camera` is the seeded opening pose (start view, else default framing); the scene's first-frame overview adjustment of the distance is not reflected until that frame.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- `CameraRequest` gains a `pose` kind (`src/app/CameraController.tsx`) and `ViewerControl` gains `cameraTargets`, `readCamera`, `setCamera` (`src/app/viewerPort.ts`); Design.md "Interfaces and Data Flow" to be reconciled in the last step.
- A camera held by a view's `stay` rule reads as its last focus id with angles and distance relative to that object, not where it actually looks (a `StartView` cannot express a fixed point); restoring such a pose re-centres on that object. Documented in the README. A strategic follow-up could add a fixed-point pose field if hosts need it.
- The "target must be shown" check uses the experience's object list minus `controls.viewHidden.objects`; a focusable id outside that list is refused.
