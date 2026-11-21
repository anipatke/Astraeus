---
id: T-390
title: Sky checks read the camera from the viewer handle
objective: O-086
status: done
depends_on: [{task: T-388, requires: clear}]
check_waiver: {task: T-390, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [packages/astraeus-site/tools/validate/journey-look-out.mjs, packages/astraeus-site/tools/validate/check-hello-sky.mjs, packages/astraeus-site/src/main.tsx, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/app/viewLink.ts, packages/astraeus/src/app/DeveloperSettings.tsx, examples/hello-sky/src/main.ts, packages/astraeus-site/tests/browserAssertions.test.ts]
planned_writes: [packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/driver.d.mts]
---

# Sky checks read the camera from the viewer handle

## Outcome

The `look-out` step reads the camera from the viewer handle the dev page already exposes for that scene (`window.astraeusHost.camera`) instead of opening and closing the Developer drawer for every reading, and both sky steps (`look-out`, `hello-sky`) compare a gliding field of view to a stated tolerance instead of waiting for exact equality (AH-30; Claude I.3 look-out, Gemini matrix rows 6 and 11: about 65 s of drawer opens, about 10 s of glide waits).

## User Check

None visual.

## Done When

- In `driver.mjs`, `cameraReading` and `waitForCameraReading` read `window.astraeusHost.camera` (the synthetic look-out scene sets `exposeHost: true`, `packages/astraeus-site/src/main.tsx` ~56; the handle goes on `window` at ~197) and return the same shape as today: a sky pose as `{ sky: true, body, raDeg, decDeg, fovDeg }`, otherwise `{ sky: false, text }`. They never open the Developer drawer; `waitForCameraReading` polls about every 100 ms up to its `timeout`. `drawerCameraReading` and `DRAWER_REFRESH_MS` are removed if nothing else uses them (search; record).
- One helper rounds every sky reading the driver hands a script, from the handle (`cameraReading`, `waitForCameraReading`) and from an example page (`exampleCamera`, `waitForExampleCamera`): right ascension and declination to 2 decimals (the precision of the view line and links, `viewLink.ts` `round`), field of view to 1 decimal (planner decision 8: a 0.05° tolerance on the glide). The helper's doc comment states the tolerance and why.
- `journey-look-out.mjs` and `check-hello-sky.mjs` are not edited: every assertion and guard keeps its text (the assertion baseline test passes unchanged), and each reading now comes from the handle.
- If the handle's values differ from the drawer's by more than the rounding (for example the handle reports radians or another frame), stop and report rather than adapting assertions.
- Browser runs (one browser job at a time; nothing else running): `npm run check:browser -- --step look-out --step hello-sky` before the change and after it, same machine; both green; step times recorded (planner target: `look-out` well under its 75 s limit, `hello-sky` under 15 s; a miss is reported with the measured cause, not fixed by raising a limit).
- The Developer drawer still opens and works in other steps that use it (`smoke` and `views` do not depend on this change; no other step's run is required).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tools/validate/driver.mjs` (the sky view section: `drawerCameraReading`, `DRAWER_REFRESH_MS`, `cameraReading`, `waitForCameraReading`, ~lines 2855–2905 on the O-093 head; `exampleCamera`, `waitForExampleCamera`, ~2787–2795; `developerOpen`/`openDeveloper`/`closeDeveloper`, ~694–705)
- `packages/astraeus-site/tools/validate/driver.d.mts` (the matching declarations)
- `packages/astraeus/src/api/viewerHandle.ts` (`camera`, line ~33)
- `packages/astraeus/src/app/viewLink.ts` (`round`, `formatView`)
- `packages/astraeus-site/src/main.tsx` (lines ~30–60, ~197)
- `packages/astraeus-site/tools/validate/journey-look-out.mjs` and `check-hello-sky.mjs` (read only: how readings are used)

## Design References

`.savepoint/Design.md` under `The sky view`.

## Guardrails

TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Run the two steps as they are; record times.
2. Read how the handle reports a sky pose; write the rounding helper.
3. Switch the four driver functions; remove the drawer reading if unused.
4. Focused tests (driver guard, assertion baseline, driver d.mts typecheck); the two steps again; gates.

## Boundaries

`driver.mjs` and `driver.d.mts` only. No script, assertion, baseline, scene or engine change; no change to which page exposes `astraeusHost`. Not `docs/BROWSER_CHECKS.md` (draft 08 holds it at the same time; draft 12 updates the look-out line). Trimming the look-out trace matrix is out of scope.

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/browserDriverGuard.test.ts packages/astraeus-site/tests/browserAssertions.test.ts packages/astraeus-site/tests/browserDriverPhoneBar.test.ts`; `npm run typecheck`. Browser: the two step runs above, after draft 07's runs and never alongside another browser job. Handoff: `quality_gates`.

## Technical Evidence

| Done When | Evidence |
|---|---|
| cameraReading / waitForCameraReading read `window.astraeusHost.camera`, same shape, no drawer, 100 ms poll; drawer reader and DRAWER_REFRESH_MS removed | driver.mjs edited; grep showed no other user; `look-out` step green after (68 s) |
| One rounding helper (`roundedPose`: ra/dec 2 dp, fov 1 dp, doc states 0.05 deg tolerance) for handle and example readings | `exampleCamera` and `cameraReading` both use it; `hello-sky` green after |
| Scripts untouched, assertion baseline unchanged | browserAssertions.test.ts passes (3 files, 24 tests) |
| Handle values match the drawer's | no script assertion changed; look-out green with unchanged assertions (handle gives degrees, same frame) |
| Before/after browser runs | before: look-out 108 s, hello-sky 24 s; after: look-out 68 s (limit 75), hello-sky 21 s (limit 15, missed) |
| Drawer still works elsewhere | openDeveloper/closeDeveloper untouched |
| Gates | typecheck clean; focused tests pass; lint: prettier --check warns on 8 other builders' files only (not driver.mjs) |

Extra finding: the handle reports the opening camera before the first frame is drawn, so the first look-out run failed at "the Sun is drawn and in view on opening" (sceneBody empty). Added `firstFrameDrawn` (waits up to 3 s for canvas `data-body-screen`) inside `cameraReading`. Second run green. Browser runs: look-out/hello-sky twice after (1 failed, 1 green), once before.
hello-sky miss cause: the step's time is the example build/pack and its own waits (exampleCamera polls at 200 ms), not camera readings; not fixed. Full build/test gates not run by me (shared checkout; coordinator runs the handoff gates). driver.d.mts needed no change (these functions are not declared there).

Files changed: packages/astraeus-site/tools/validate/driver.mjs; this Task file.

## Drift Notes

`docs/BROWSER_CHECKS.md`'s look-out bullet says the readout is the Developer drawer's view line; draft 12 updates it.

Coordinator (orchestrate-g024-20261121): look-out 108 s -> 68 s and hello-sky green (evidence folders cited); typecheck and focused driver tests green; `driver.mjs` passes prettier (the eight unformatted files were fixed in a separate format-only commit 6832274e). The `firstFrameDrawn` wait is accepted (the handle reports the camera before the first frame; the drawer used to wait for one). hello-sky's 21 s against 15 s is left to T-393 (limits with causes). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
