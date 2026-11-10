---
id: T-292
title: Let apps open, turn and read the sky view
objective: O-064
status: done
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

Builder session (stage build -> test -> audit; step check waived, coordinator marks done). Extra reads (not in Context Files): `src/app/sceneCamera.ts` and `src/app/sceneFrame.ts` (the viewReadout write and the opening view, both named by the hand-off), `src/app/lookOut.ts`, `src/app/CameraController.tsx`, `src/app/viewUp.ts` and `src/app/renderCoordinates.ts` (the T-291 internals this step builds on), `src/app/DeveloperSettings.tsx`, `src/app/AstraeusScene.tsx`, `src/app/experienceDefinition.ts` (types that carried the orbit-only view), `tests/sceneFrame.test.ts`, `tests/lookOut.test.ts`, `tests/sceneInputCopies.test.ts`, `tests/domMenuAndLink.test.ts` (the tests those types broke and the harness for new ones).

T-291 internals confirmed present (no REPLAN): the internal `lookOut` request, `OrbitCameraState.lookOut`, `directionAt`, `orbitAnglesFor`.

Per Done-When:
- Types: `OrbitPose` (today's fields), `SkyPose { lookOut, raDeg, decDeg, fovDeg }`, `CameraPose = OrbitPose | SkyPose`, `SkyDirection { raDeg, decDeg }`, `LookOutTarget { lookOut, direction?: SkyDirection | string, fovDeg? }`, `CameraTarget` gains `LookOutTarget`; all exported from `src/api/index.ts`, documented. Evidence: typecheck, api-surface lock (`api-surface.lock.json`), reachable-type check and public-type lint inside `npm test`.
- `setCamera` check (`src/api/viewerCamera.ts`): unknown or hidden body, unknown object direction, direction equal to the body, ra/dec not finite, dec beyond +-90, fov outside 5..100, extra keys, a half-given ra/dec pair, direction with raDeg/decDeg together: all `bad-camera` at the call (`tests/lifecycle.test.ts` "look out: setCamera ...", both paths, 15 bad shapes). Sky readings read, heard and put back (flat pose form), orbit readings still put back. The viewer's `viewReadout` is now a sky reading while `orbit.lookOut` is set (`sceneFrame.ts`; `tests/sceneFrame.test.ts`).
- Opening: `scene.camera.lookOut(body, { direction?, fovDeg? })` and `setStartView(sky pose)`; last opening call wins; unknown body -> `unknown-body`, bad values -> `bad-camera`; the first frame applies a sky start view as a look-out (`tests/sceneFrame.test.ts` "opens looking out"); `handle.camera` reads the sky opening before the first frame (lifecycle, both paths). `unknown-body` for a body not added is raised at the call and again when the scene is built via the same `#has` check.
- Share link: `?view=body,raDeg,decDeg,fovDeg,sky` (fifth part tells the kinds apart); `core/startView.ts` `validateSkyView`/`validateCameraView`, `app/viewLink.ts` `formatView`/`parseView`; bad sky views are refused like a bad orbit view (`tests/domMenuAndLink.test.ts`, 8 bad texts). The address-to-setting mapping (API-06) is unchanged in kind: the view address overrides the public camera readings; `apiRules` passes.
- Lifecycle suite on both embedding paths (mount, AstraeusScene, StrictMode) in `tests/lifecycle.test.ts`; the host's slot (`hostCameraRequest`) is the same object as the request (O-061 order rule); the frozen-scene mutator list gains `lookOut`.
- Docs: lock, README (camera rows, handle rows, `AstraeusScene camera`, onCameraChange), CHANGELOG (Unreleased: two kinds, one-line check). No body name in `src/api/` (ARCH-06; `apiRules` passes). Made-up bodies in tests: Mars and Moon as well as Earth (ARCH-03); a sky reading round trip for both ups over five directions (`tests/lookOut.test.ts`).

Gates (from /home/user/code/Astraeus): `npm run lint` 3.6 s pass; `npm run typecheck` 6.0 s pass; `npm run build` 5.5 s pass; `npm test` 44.0 s pass (237 files, 3397 passed, 2 skipped); `npm run check:pack` 14.6 s pass; `npm run check:node-consumer` 4.8 s pass. No browser run.

Not verified: no browser run, so the drag/pinch pan and the real readout in a live viewer rest on T-291's frame test plus this step's frame test; `npm run check:browser` is for the Full Check.

## Drift Notes

Public camera shapes for Design reconciliation (O-064, last step): `CameraPose = OrbitPose | SkyPose`; `SkyPose { lookOut, raDeg, decDeg, fovDeg }` (the discriminant is `"lookOut" in pose`); `LookOutTarget { lookOut, direction?: SkyDirection | id, fovDeg? }`; `scene.camera.lookOut(body, { direction?: SkyDirection, fovDeg? })` (the opening direction is a star-map position only; an object id is a `setCamera` input, since an opening has no resolved scene yet). Internally `core/startView.ts` owns `SkyView`, `CameraView`, `isSkyView`, `eqjUnitVector`, the range checks and `SKY_FOV_RANGE_DEG` (app/lookOut re-exports the range); `controls.viewReadout`, `controls.startView`, `ViewerControl.readCamera` and `ExperienceDefinition.startView` are `CameraView`; `app/lookOut.ts` `skyViewOf` is the render-to-EQJ readout; the share link's fifth part `sky` tells the kinds apart. `setCamera` with no direction while already looking out keeps the current ra/dec (read from `camera`); otherwise ra 0, dec 0. The planets demo's own start view setting is typed `OrbitPose`.
