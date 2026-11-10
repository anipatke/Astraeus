---
id: T-292
title: Let apps open, turn and read the sky view
objective: O-064
status: planned
depends_on: [{task: T-291, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-292, reason: 'Owner said "orchestrate o64" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o064-run-20261110}, recorded_at: '2026-11-10T01:37:08Z'}
planned_by: {role: planner, session: o064-planning-20261110}
---

# Let apps open, turn and read the sky view

## Outcome

An app, through `mount` or `AstraeusScene`, can open a scene looking out from a body, turn the camera to a star-map position or toward an object, read the camera as an orbit reading or a sky reading, hear each change, save and restore either kind, and share a link that reopens the sky view.

## User Check

None for the owner at this step; the owner looks at the finished sky view in the last step.

## Done When

- `CameraTarget` gains a look-out target: the body to stand in, an optional direction (`{ raDeg, decDeg }`, J2000 equatorial degrees, or an object id to turn toward) and an optional `fovDeg`; `CameraPose` becomes an orbit reading (today's fields) or a sky reading (the body, `raDeg`, `decDeg`, `fovDeg`, rounded like today's), both exported and documented; names follow API-04.
- `setCamera` checks the target at the call: an unknown or hidden body or object, a direction or field of view out of range, or a malformed shape throws `bad-camera`; `onCameraChange` and `camera` report sky readings; putting a read reading back restores it.
- `scene.camera` gains an opening that looks out (and `setStartView` takes a sky reading); the last opening call wins as today; the scene build refuses a body not added (`unknown-body`).
- The share link (`?view=`, `core/startView.ts` shared with the view link) writes and reads a sky reading; a bad one is refused as today's bad view is; the address-to-setting mapping test passes (API-06).
- One lifecycle suite runs the look-out calls on both embedding paths (`tests/lifecycle.test.ts`, API-02); host calls land in order with the camera's host slot (O-061 rule).
- API-surface lock, reachable-type check, public-type lint, README camera section and CHANGELOG (the reading's two kinds, with the one-line check an app reading `distance` needs) updated in the same change (API-01, API-07); no body name in `src/api/` (ARCH-06).

## Context Files

`packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/viewerCamera.ts`, `packages/astraeus/src/api/planCamera.ts`, `packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/core/startView.ts`, `packages/astraeus/src/app/viewLink.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/tests/hostCameraDom.test.ts`, `packages/astraeus/tests/startCamera.test.ts`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/objectives/O-064-look-out-from-a-body/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (One handle, one lifecycle, O-054; Host calls land in order, O-061; Views fixes for a multi-probe app, O-052 item 4) and under `Decisions` (Public API shape, G-016).

## Guardrails

API-01, API-02, API-03, API-04, API-05, API-06, API-07, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Confirm the previous step's internal look-out request exists and its readout; return REPLAN REQUIRED if not.
2. Define the two reading kinds and the look-out target in `viewerLink.ts`; extend the shared parser in `core/startView.ts` so the host check, the opening and the share link read one shape.
3. Extend `setCamera`, `camera` and `onCameraChange`; convert star-map degrees to the internal direction in one helper.
4. Add the opening call on `scene.camera` and the `setStartView` sky reading.
5. Extend the view link text; update the lock, README, CHANGELOG.
6. Tests: both embedding paths, bad inputs per field, round trips of both kinds, made-up body cases (ARCH-03); run the hand-off gates and `npm run check:pack`.

## Boundaries

No camera menu entry (the next step); no ecliptic-longitude input; no view camera rule for look-out; no sky figures.

## Technical Verification

Focused Vitest runs while building; hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack` and `npm run check:node-consumer` (public surface change); no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record the public camera shapes for Design reconciliation in the last step of O-064.
