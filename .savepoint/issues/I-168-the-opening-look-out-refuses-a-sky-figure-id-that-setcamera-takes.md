---
id: I-168
title: The opening look-out refuses a sky figure id that setCamera takes
type: defect
status: resolved
source:
  kind: report
  actor: {role: executor, session: release-0-9-0-builder}
  at: '2026-11-11T09:00:00Z'
checks: [C-169, C-170]
guardrail_ids: [API-01]
severity: medium
resolution:
  disposition: verified
  check: C-170
  actor: {role: checker, session: release-0-9-0-i169-recheck-20261111}
  at: '2026-11-10T23:50:00Z'
  reason: Repair proven by C-170 (CLEAR).
history:
  - at: '2026-11-11T09:00:00Z'
    actor: {role: executor, session: release-0-9-0-builder}
    kind: observed
    note: 'Found by the coordinator in a fresh consumer app built on the packed 0.9.0 packages (2026-11-11). Searched issues for look-out, direction and sky figure: I-162 (opening direction shapes) is the neighbour and is resolved; no duplicate.'
  - at: '2026-11-11T09:40:00Z'
    actor: {role: executor, session: release-0-9-0-builder}
    kind: repair_attempted
    note: 'Direct repair on release-0-9-0 (uncommitted). scene.camera.lookOut takes a sky figure id as direction (kept as ExperienceDefinition.startToward; checked against the scene''s figures when built, bad-camera naming the id; the viewer resolves it to the figure''s label point with openingViewOf, so startView, handle.camera and the share link stay numbers). Story panel cameras and setCamera already took it; setStartView takes a numbers-only sky pose by design. Proof Needed re-run: new tests/lookOutDirectionForms.test.ts enumerates lookOut (figure added before and after), story panel camera and setCamera, each accepts both forms and refuses an unknown id naming it, plus a source scan that fails on a direction typed as a position only: 16 pass. Neighbours: I-162 shape tests in lifecycle.test.ts and story/camera tests unchanged and passing. Gates: lint, typecheck, npm test (249 files, 3686 passed, 2 skipped), build, check:engine-alone, check:pack, check:node-consumer all pass; api:lock regenerated. Unverified: no browser run (owner rule), so the opening turn toward a figure in a real viewer is covered only by the openingViewOf unit test. Not verified or resolved by this entry.'
  - at: '2026-11-11T10:32:00Z'
    actor: {role: executor, session: release-0-9-0-builder}
    kind: repair_attempted
    note: 'Repair reworked under I-169 (see its repair_attempted entry): the startToward/openingViewOf/lookToward mechanism of the entry above is removed; the opening lookOut now uses setCamera''s rule (cameraRequestOf) and runtime path (aimAtFigure, applyLookOut), so a figure id still opens toward it, and an object id now does too. Proof for figure ids: tests/lookOutDirectionForms.test.ts (figure added before and after) and hostCameraDom.test.ts (the opening is aimed at the label point setCamera aims at). Not verified or resolved by this entry.'
  - at: '2026-11-10T23:50:00Z'
    actor: {role: checker, session: release-0-9-0-i169-recheck-20261111}
    kind: rechecked
    note: 'Re-checked by C-170 on the reworked repair: the opening lookOut runs its look through cameraRequestOf and turns toward a figure by aimAtFigure then applyLookOut, as setCamera does. Figure id added before and after accepted, unknown id refused at build naming it (lookOutDirectionForms.test.ts parity rows); hostCameraDom.test.ts aims the opening at the label point setCamera aims at; startView stays numbers for positions, an id opening reads no pose until the first frame (documented). Gates incl. check:browser pass. Note: earlier builder entries on this Issue carry local time labelled UTC.'
    check: C-170
---

# I-168: The opening look-out refuses a sky figure id that setCamera takes

## Summary

`setCamera({ lookOut: "earth", direction: "Leo" })` turns toward the sky figure, but the opening view `scene.camera.lookOut("earth", { direction: "Leo", fovDeg: 80 })` throws `camera.lookOut.direction must be { raDeg, decDeg }`. The mount then never becomes ready. A newcomer naturally uses one form in both places.

## Evidence

- `validateSkyPosition` (`packages/astraeus/src/core/startView.ts`), called from `validateSkyLook` by `SceneCamera.lookOut` (`packages/astraeus/src/api/planCamera.ts`), accepts only `{ raDeg, decDeg }`.
- `LookOutTarget.direction` is `SkyDirection | string`; story panel cameras and `setCamera` take a figure id through `cameraRequestOf`.
- The figure's direction is known only once the star list loads, so the opening view cannot resolve it at the call.

## Proof Needed

Every API entry that takes a look-out direction (`scene.camera.lookOut`, story panel `camera`, `setCamera`) accepts `{ raDeg, decDeg }` and a sky figure id (added before or after the call), and refuses an unknown id with `bad-camera` naming it, at the latest when the scene is built. The opening view turns toward the figure's label point; `handle.camera` and the share link read numbers. A test enumerates the entries and fails when a direction is typed as a position only.
