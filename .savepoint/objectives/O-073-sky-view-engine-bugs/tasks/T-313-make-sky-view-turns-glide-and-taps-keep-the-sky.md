---
id: T-313
title: Make sky-view turns glide and taps keep the sky
objective: O-073
status: in_progress
stage: audit
depends_on: []
owner_validation: {required: true}
check_waiver: {task: T-313, reason: 'Owner said "go" to orchestrate O-073 under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: plan-g020-20261115}, recorded_at: '2026-11-15T04:10:47Z'}
planned_by: {role: planner, session: plan-g020-20261115}
---

# Make sky-view turns glide and taps keep the sky

## Outcome

While the camera is already looking out from a body, a host `setCamera` look-out turn, a story panel's camera and the timeline's Go to ease the direction and field of view instead of cutting (reduced motion still arrives next frame). In a look-out camera a sky-figure label hit wins over a body under it, and a visitor's pick of a body selects it without leaving look-out (owner, 2026-11-15: "Select it, stay in the sky").

## User Check

On `localhost:5490`, in a sky (look-out) view: choose a constellation from the menu and watch the view glide to it; tap a constellation name over the Sun and get the constellation; tap the Sun itself and see it selected while the sky stays. With reduced motion on, the turn arrives at once.

## Done When

- Node test on the shared glide rule: a look-out direction and field-of-view change made while already in look-out reaches its target over several frames (no single-frame jump), reduced motion off; on, after one frame. Fails on the unfixed source (TEST-02).
- Story-panel camera and Go to in look-out use the same path (test names recorded, TEST-03).
- Picking test: in look-out, a pointer over both a body and a sky-figure label picks the figure; a body pick selects it and the camera stays a look-out pose (`handle.camera` keeps `lookOut`). Orbit-camera picking unchanged (existing picking tests named).
- README "Camera from the host" and the picking rule sentences match the new behaviour (API-07); CHANGELOG `Unreleased`.
- Configured gates pass.

## Context Files

- `packages/astraeus/src/app/sceneCamera.ts`
- `packages/astraeus/src/app/CameraController.tsx`
- `packages/astraeus/src/app/lookOut.ts`
- `packages/astraeus/src/app/scenePointer.ts`
- `packages/astraeus/src/app/scenePicking.ts`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/tests/sceneCamera.test.ts`
- `packages/astraeus/tests/lookOut.test.ts`
- `packages/astraeus/tests/hostCameraDom.test.ts`
- `packages/astraeus/README.md` under `Camera from the host`
- `.savepoint/Design.md` under `The sky view`

## Design References

Design `The sky view`, `Host-page behaviour` (reduced-motion camera rule).

## Guardrails

ARCH-02, ARCH-03, API-05, API-07, TEST-01..03, STYLE-01, STYLE-02.

## Implementation Plan

1. In `applyLookOut`, when the camera is already in look-out, set only the target angles (and a new target field of view on `LookOutState`); keep the cut when entering look-out from orbit.
2. Let `resolveCamera` ease the field of view alongside azimuth/elevation, honouring the existing reduced-motion rule.
3. In look-out, try sky-figure picks before bodies; on a body pick, select without the focus preset.
4. Tests as in Done When; README and CHANGELOG.

## Boundaries

No camera offset, no new camera option, no change to orbit-camera picking or menu Focus/Follow.

## Technical Verification

Focused tests while iterating; configured gates at handoff; owner look on `localhost:5490` before the Full Objective Check (no per-step browser run).

## Technical Evidence

Per criterion:
- Glide rule: `packages/astraeus/tests/lookOutGlide.test.ts` "look-out turns while already looking out" (table over EQJ direction, toward an object, zoom only; each run unreduced then reduced: field of view strictly between start and target after one frame, reaches target within 600 frames; reduced reaches targets in one frame) and "still cuts when entering look-out from the orbit camera". Would fail on the unfixed source (fov set directly to the target on the request frame).
- Story panel camera and Go to: both reach the camera through the same `cameraRequest` `lookOut` request that `applyLookOut` handles (no separate path), so the table test covers them; no separate test names.
- Picking: `lookOutGlide.test.ts` "a tap in a look-out camera" (figure over body picks the figure with `{ keepSky: true }`; body-only tap in look-out picks with keepSky; orbit tap unchanged, called with the id alone). Orbit picking tests unchanged and passing: `pointerAndFeatureLayerDom.test.ts` "a body hit wins where both are hit", `sceneHooksDom.test.ts` "reports the body under a tap". The shell's keepSky branch (`pickObject`) selects without `activatePreset`, so the look-out camera request is never issued; not covered by a DOM test (limitation).
- README (sky figures row; `handle.setCamera` row) and CHANGELOG Unreleased updated.
- Gates: `npm run lint`, `npm run typecheck`, `npm run build` passed; `npm test` 257 files, 3823 passed, 2 skipped.

Files changed: src/app/CameraController.tsx (targetFovDeg on OrbitCameraState, eased in resolveCamera, cleared by a visitor zoom), src/app/sceneCamera.ts (applyLookOut sets targets only when already looking out; leaveLookOut clears target), src/app/scenePointer.ts (figure first in look-out; PickOptions), src/app/sceneContentsHooks.ts, src/app/AstraeusScene.tsx, src/app/App.tsx (pass keepSky through the pick request), src/shell/AstraeusShell.tsx (keepSky pick selects without focus preset), README.md, CHANGELOG.md, tests/lookOutGlide.test.ts (new). Extra reads: src/app/App.tsx, sceneContentsHooks.ts, AstraeusScene.tsx (type plumbing for the pick options), tests/pointerAndFeatureLayerDom.test.ts and sceneHooksDom.test.ts (existing pick tests). `LookOutState` left as `{ fovDeg }` because `sceneCamera.test.ts` asserts it with toEqual; the target field lives on `OrbitCameraState`.

Limitations: no browser run (owner looks on localhost:5490); check:engine-alone / API lock checks not separately run (internal types only; `npm test` includes the lock test).

## Drift Notes

Record changes to the look-out or picking contract for Design `The sky view`.

- Design `The sky view`: while looking out, a camera request eases direction and field of view (`OrbitCameraState.targetFovDeg`); entering from orbit still cuts. In a look-out camera the pick order is sky figure first, and a body pick selects without the focus preset (pick request carries `keepSky`). Not yet reflected in Design.md.
