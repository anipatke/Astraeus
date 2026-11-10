---
id: I-169
title: The opening look-out refuses an object id that setCamera and story panels take
type: defect
status: resolved
source:
  kind: check
  check: C-169
  actor: {role: checker, session: release-0-9-0-i168-check-20261111}
  at: '2026-11-10T22:50:00Z'
checks: [C-169, C-170]
guardrail_ids: [API-07, API-01]
severity: medium
resolution:
  disposition: verified
  check: C-170
  actor: {role: checker, session: release-0-9-0-i169-recheck-20261111}
  at: '2026-11-10T23:50:00Z'
  reason: Repair proven by C-170 (CLEAR).
history:
  - at: '2026-11-10T22:50:00Z'
    actor: {role: checker, session: release-0-9-0-i168-check-20261111}
    kind: observed
    note: 'Found by C-169 while checking the I-168 repair (uncommitted on release-0-9-0 over 18fc22a7). Searched issues for look-out, direction, object id and setCamera: I-162 (opening direction shapes, resolved) and I-168 (figure ids, the repair under check) are neighbours; no duplicate.'
  - at: '2026-11-11T10:32:00Z'
    actor: {role: executor, session: release-0-9-0-builder}
    kind: repair_attempted
    note: 'Direct repair reworked on release-0-9-0 (uncommitted, over 18fc22a7): one rule and one path for look-out directions. Shape: scene.camera.lookOut now runs its look through cameraRequestOf (the check setCamera and story panel cameras use), so it takes a position, flat raDeg/decDeg, an object or sky figure id, or none, and refuses what setCamera refuses. Ids: setCamera''s id check is extracted as checkCameraIds/checkToward (api/cameraRequest.ts); the opening runs checkToward when the scene is built against the objects the opening view shows (plus groups) and the sky figures (checkOpeningLook, api/planCamera.ts), bad-camera with setCamera''s wording. Resolution: an id opening is handed to the viewer as a look-out request in startView (OpeningView = CameraView | LookOutRequest); App aims a figure with aimAtFigure and the first frame runs applyLookOut, as setCamera does. Removed from the I-168 repair: ExperienceDefinition.startToward, checkLookToward, openingViewOf (and its rounding), the public SceneCamera.lookToward getter; validateSkyLook removed as unused; the default opening field of view moved to core SKY_OPENING_FOV_DEG. Pose: after an id lookOut, scene.camera.pose is undefined and handle.camera reads undefined before the first frame (doc comments, README, CHANGELOG say so). Public surface vs HEAD: only lookOut''s direction widens to SkyDirection | string (api:lock regenerated). Proof Needed re-run: tests/lookOutDirectionForms.test.ts rewritten: setCamera is the reference; lookOut (figure before and after) and story panel camera are each fed 12 forms (position, flat ra/dec, none, body id, trajectory id, figure id, unknown id, the body itself, empty id, half position, both forms, fov out of range) and must match setCamera''s accept or refuse; scans fail when a second api file checks a direction''s shape or a direction is typed position-only; opening-view hiding refused at build; 43 pass. sceneCamera.test.ts: an opening request turns the camera exactly as the same setCamera request, and a host request still wins. hostCameraDom.test.ts: the mounted viewer gets the same request setCamera sends (object and figure), handle.camera undefined before the first frame. Neighbours: I-162 shape tests (lifecycle.test.ts) pass unchanged. apiImports.test.ts allow list gains app/viewHiding (reason recorded). Gates: lint, typecheck, npm test (249 files, 3716 passed, 2 skipped), build, check:engine-alone, check:pack, check:node-consumer pass. Unverified: no browser run (owner rule; coordinator runs check:browser), so a real viewer opening toward a body or figure id is covered at unit and DOM level only. Not verified or resolved by this entry.'
  - at: '2026-11-10T23:50:00Z'
    actor: {role: checker, session: release-0-9-0-i169-recheck-20261111}
    kind: rechecked
    note: 'Re-checked by C-170: one shape rule (cameraRequestOf; scan fails on a second validateSky check in src/api), one id check (checkCameraIds/checkToward shared by setCamera and the opening), one runtime path (aimAtFigure, applyLookOut). Parity test drives 12 shared forms through setCamera, lookOut (figure before/after) and story panel camera; all match. Independent probes: sun not added refused naming the opening view objects; null/NaN/unknown key refused at the call; ra wrap kept. Lock diff is the lookOut widening only; lookToward removed; CHANGELOG/README/doc comments state the forms and the undefined pose truthfully. Gates incl. check:browser pass.'
    check: C-170
---

# I-169: The opening look-out refuses an object id that setCamera and story panels take

## Summary

`setCamera`'s look-out `direction` is "a star-map position, or the id of an object or sky figure to turn toward" (`LookOutTarget`, `api/viewerLink.ts:97`), and a story panel camera takes the same. The I-168 repair widened `scene.camera.lookOut`'s `direction` to `SkyDirection | string` but accepts only a sky figure id, so `scene.camera.lookOut("earth", { direction: "moon" })` type-checks and then throws `bad-camera` ("direction \"moon\" is not a sky figure of the scene") when the scene is built, while `setCamera({ lookOut: "earth", direction: "moon" })` and a story panel `camera: { lookOut: "earth", direction: "moon" }` both accept it. This is the trap I-168 named (a newcomer uses one form in both places) for the third form.

The repair's public words claim parity that does not hold (API-07): the CHANGELOG line "`scene.camera.lookOut` takes the same `direction` forms as `setCamera`" and the `lookOut` doc comment ("the same two forms as `setCamera`'s look-out") omit the object id form `setCamera` takes. The parity test's header says the same, but its rows feed only a position and a figure id, and its source scan checks only that a declared `direction` type includes `string`: a runtime refusal of a form another entry takes passes it.

## Evidence

- C-169 probe (vitest, happy-dom, working tree): `lookOut("earth", { direction: "moon" })` then build: `bad-camera`; story panel camera `direction: "moon"`: accepted; `setCamera` resolves a string direction through `lookDirectionOf` (`app/sceneCamera.ts:125`), body or sky figure.
- `checkLookToward` (`api/planCamera.ts`) checks the id against sky figure ids only; the opening path resolves only figures (`openingViewOf`, `app/skyFigures.ts`). The look-out direction rule now lives in two places: `cameraRequestOf`/`lookDirection` (`api/cameraRequest.ts`) for `setCamera` and story panels, `SceneCamera.lookOut` plus `checkLookToward` for the opening.
- Also from the I-168 diff (API-01): the new public getter `SceneCamera.lookToward` is in the API lock but not in the CHANGELOG; `scene.camera.pose` after `lookOut(..., { direction: "<figure>" })` reads a placeholder `raDeg: 0, decDeg: 0`.

## Proof Needed

Strategic fix first: one rule decides which look-out directions an entry takes. Every entry that takes a look-out direction (`scene.camera.lookOut`, story panel `camera`, `setCamera`) accepts the same forms: `{ raDeg, decDeg }`, a sky figure id, and an object id that `setCamera` would turn toward (or, if the planner decides an opening cannot turn toward an object, the docs and types say so and the refusal names the reason; owner choice). The parity test drives every entry with every form from one shared list, so adding a form to one entry and not another fails it. The CHANGELOG and doc comments state the forms truthfully; `SceneCamera.lookToward` is documented in the CHANGELOG or not public; `scene.camera.pose` after a figure-id `lookOut` does not report a direction it will not open at, or the docs say what it reads.
