---
id: T-313
title: Make sky-view turns glide and taps keep the sky
objective: O-073
status: planned
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

Pending execution.

## Drift Notes

Record changes to the look-out or picking contract for Design `The sky view`.
