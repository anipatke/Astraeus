---
id: T-291
title: Let the camera stand inside a body and look out
objective: O-064
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-291, reason: 'Owner said "orchestrate o64" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o064-run-20261110}, recorded_at: '2026-11-10T01:37:08Z'}
planned_by: {role: planner, session: o064-planning-20261110}
---

# Let the camera stand inside a body and look out

## Outcome

Inside the viewer (no public API yet), a new camera request puts the camera at a body's centre looking out along a direction, with the field of view as its zoom: drag pans the sky, wheel and pinch change the field of view within about 5 to 100 degrees (opening about 60), the stood-in body is not drawn, and Focus, Follow, Overview or a pose request returns to today's orbit camera unchanged.

## User Check

None for the owner at this step; the owner looks at the finished sky view in the last step.

## Done When

- `CameraRequest` gains a look-out kind naming a body, a direction (unit vector in EQJ, or an object id to turn toward) and an optional field of view; the camera state carries the mode, the look direction and the field of view.
- The frame stage places the camera at the body's scaled centre, points it along the direction with the scene's up (`equatorial` or `ecliptic`) as today, and sets `camera.fov` from state; the near plane stays positive in look-out (no `distance - focusRadius` underflow); the floating origin keeps working when the body moves.
- Drag pans by direct manipulation (the sky moves with the finger), scaled by the field of view so a narrow view pans slowly; elevation stays within ±89 degrees; wheel and pinch change the field of view inside the range, never the distance.
- The stood-in body's mesh, label, atmosphere glow and rings are hidden while looking out, through the existing hidden-set path (no second hiding mechanism, STYLE-07), and shown again on return.
- Every reader of `camera.fov` (markers, labels, body screens) works at a changed field of view; the Canvas constant 45 stays the orbit camera's field of view.
- Node tests (`tests/sceneFrame.test.ts` and a camera test): look-out from Earth and from Mars puts the camera at the body centre with the requested direction on screen centre; pan and zoom limits; near plane positive; return to orbit restores today's pose behaviour; existing camera tests unchanged and passing.

## Context Files

`packages/astraeus/src/app/CameraController.tsx`, `packages/astraeus/src/app/sceneCamera.ts`, `packages/astraeus/src/app/sceneFrame.ts`, `packages/astraeus/src/app/sceneFraming.ts`, `packages/astraeus/src/app/viewUp.ts`, `packages/astraeus/src/app/viewHiding.ts`, `packages/astraeus/src/app/AstraeusScene.tsx`, `packages/astraeus/src/app/SkyView.ts`, `packages/astraeus/tests/sceneFrame.test.ts`, `packages/astraeus/tests/sceneCamera.test.ts`, `.savepoint/objectives/O-064-look-out-from-a-body/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Host calls land in order, O-061; Views of one scene, O-051; Near planets and rings, O-048 log depth).

## Guardrails

ARCH-02, ARCH-03, ARCH-06, CODE-01, CODE-02, STYLE-05, STYLE-07, TEST-01, TEST-03.

## Implementation Plan

1. Read the camera request flow from `App` through the frame stage to `poseCamera`; confirm the request and orbit state can carry a mode without touching State; return REPLAN REQUIRED if the frame owns the camera in a way that cannot.
2. Add the look-out request kind and camera state (direction, field of view, mode) with pure helpers for direction from azimuth and elevation about the up in force, and back.
3. Add look-out branches to the resolve and pose steps as named functions (CODE-02); keep the orbit path byte-for-byte in behaviour.
4. Route gestures by mode: pan and field-of-view zoom in look-out, today's orbit and distance zoom otherwise.
5. Hide the stood-in body through the existing hidden set while in look-out.
6. Write the node tests above with made-up and Earth/Mars cases; run focused tests, then the hand-off gates.

## Boundaries

No public API change (the next step), no camera menu entry, no sky lines or labels, no Sun or Moon glow change, no horizon.

## Technical Verification

Focused Vitest runs while building; hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`; no browser run (browser policy). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas (camera modes, field of view as state) for Design reconciliation in the last step of O-064.
