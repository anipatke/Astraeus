---
id: T-293
title: Add Look out to the camera menu and show it
objective: O-064
status: done
depends_on: [{task: T-292, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-293, reason: 'Owner said "orchestrate o64" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o064-run-20261110}, recorded_at: '2026-11-10T01:37:08Z'}
planned_by: {role: planner, session: o064-planning-20261110}
---

# Add Look out to the camera menu and show it

## Outcome

A visitor can choose "Look out from <body>" in the camera menu for the bodies a scene lists, look around the sky, and choose any other camera entry to go back; a made-up scene on the dev page shows it for the owner's look, the browser check covers it, and Design describes the sky view as built.

## User Check

On `localhost:5490`, open the made-up sky scene at desktop and phone sizes: the scene opens looking out from Earth; drag to pan and pinch or scroll to zoom; the menu offers Look out from Earth and from Mars and nothing overlaps; choosing Focus or Overview returns to the normal view; the share link reopens the sky view.

## Done When

- `scene.camera` gains a list of bodies whose "Look out from" entry the camera menu offers (default none; a body not added throws `unknown-body`); the entries sit with Focus and Follow and work on the bar and the phone drawer; Focus, Follow, Overview and an orbit `setCamera` leave the sky view. Tests in the shell's DOM suite (`tests/cameraAndNamesDom.test.ts` or a new file) on made-up scenes.
- Phone first: no collisions at 375x667 and 1280x720 (fast-suite layout check plus the browser readout).
- A made-up site scene in `packages/astraeus-site/src/synthetic/` built on the public API opens looking out from Earth with Earth and Mars listed; `docs/BROWSER_CHECKS.md` maps the new browser readout; the smoke step (or `check-hello-scene.mjs`) reads through `driver.mjs` that the camera is in the sky view, the stood-in body is not drawn and the menu entry works; no screenshot.
- Design reconciled: each drift note from the three O-064 steps reflected in `.savepoint/Design.md` (Interfaces and Data Flow, Components/Codebase Map) or recorded as non-architectural with a reason, before the Full Objective Check.
- Owner looked on the preview and recorded the result.

## Context Files

`packages/astraeus/src/api/planCamera.ts`, `packages/astraeus/src/shell/experience.ts`, `packages/astraeus/src/shell/objectModel.ts`, `packages/astraeus/src/shell/viewCamera.ts`, `packages/astraeus/src/shell/AstraeusShell.tsx`, `packages/astraeus/tests/cameraAndNamesDom.test.ts`, `packages/astraeus-site/src/synthetic/syntheticViewsScene.ts` (as the pattern for a made-up scene), `packages/astraeus-site/tools/validate/driver.mjs`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`, `.savepoint/Design.md`, `.savepoint/objectives/O-064-look-out-from-a-body/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Views of one scene, O-051; The planets demo and the site on the public way, O-059) and `Components/Codebase Map`.

## Guardrails

API-01, API-02, API-06, ARCH-01, ARCH-03, ARCH-06, STYLE-05, STYLE-09, TEST-01, TEST-03.

## Implementation Plan

1. Confirm the public look-out target from the previous step; return REPLAN REQUIRED if absent.
2. Add the menu-choice list to `scene.camera` and the presets builder; show the entries in the bar and phone drawer.
3. Add DOM tests on made-up scenes, including leaving the sky view by each entry.
4. Add the made-up site scene and the browser readout through the driver; map it in `docs/BROWSER_CHECKS.md`.
5. Reconcile Design from all O-064 drift notes.
6. Run the hand-off gates; leave the one browser run to the Full Objective Check; hand the owner the preview address for the look.

## Boundaries

No sky lines, figures or labels; no Sun or Moon glow change; no horizon; no change to existing scenes' menus.

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`; the browser scripts change, so the new readout may be run once alone while building (browser policy); `npm run check:browser` runs once at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder session (stage build -> test -> audit; step check waived, coordinator marks done after the owner's look). Extra reads (not in Context Files): `src/shell/ObjectControls.tsx`, `src/shell/topBarIcons.tsx`, `src/shell/experience.ts`, `src/app/experienceDefinition.ts` (the places that read a preset's `target`), `src/api/assembleScene.ts` (where the presets are built), `tests/domShell.test.ts`, `tests/domSetup.ts`, `tests/smallSettings.test.ts`, `tests/sceneInputCopies.test.ts`, `tests/lifecycle.test.ts` (harnesses and the mutator list), `packages/astraeus-site/src/main.tsx` (scene registry), `tools/validate/run-browser.mjs`, `public-build-assets.mjs`, `tools/gate-limits.json` (step registry, public-build key list, step limit), T-291 and T-292 Task files (drift notes). T-292's public look-out target confirmed present (no REPLAN).

Per Done-When:
- Menu: `scene.camera.setLookOutChoices(ids)` (default none; `unknown-body` for a body not added, `bad-camera` for a non-list); `cameraPresetsOf` adds `lookout-<id>` ("Look out from <label>") after Follow; `ExperienceCameraRequest` gains the `lookOut` kind and `requestObjectId`; `ObjectControls` shows the entry (`LookOutIcon`, text "Look out") on the bar and the phone drawer (`data-closes-drawer`). Tests: `tests/lookOutMenuDom.test.ts` (4 tests on made-up Earth/Mars/Moon scenes: default none, list, labels and order, unknown body, replace, entry shown only for a listed body beside Focus/Follow, request asked, pressed, Focus/Follow/Overview each ask their own request and unpress the entry); the sky view's own leave rule (focus/follow/overview/pose requests set `lookOut` null) is T-291's `lookOut.test.ts`. `lifecycle.test.ts` mutator list and `sceneInputCopies.test.ts` (copy-in) gain `setLookOutChoices`. Orbit `setCamera` leaving the sky view: T-291/T-292 tests.
- Phone first: layout evidence is the browser step's `cameraEntryFit` (inside the window, no overlap with neighbours, cog, timeline or pill; entry 36 px on desktop (24 needed), 44 px on the phone drawer) at 1280x720 and 375x667; the fast suite's existing phone layout tests pass with the extra button (only a listed body has one).
- Made-up scene: `packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts` (Sun, Earth and Mars on the solar-system scale, opens `camera.lookOut("earth", { direction: { raDeg: 281.6, decDeg: -23 }, fovDeg: 60 })`, `setLookOutChoices(["earth", "mars"])`), registered as `?experience=synthetic-lookout` in `main.tsx` (dev only; added to `SYNTHETIC_KEYS`); test in `tests/syntheticScenes.test.ts`. Browser step `look-out` (`journey-look-out.mjs`, added to `run-browser.mjs` and `gate-limits.json` at 30 s) reads through driver functions `cameraReading`, `waitForCameraReading`, `cameraEntryFit`, `wheelOverCanvas`; mapped in `docs/BROWSER_CHECKS.md`; no screenshot.
- Browser run (alone, once it passed): dev server on port 5483, `ASTRAEUS_URL=http://localhost:5483/app.html ASTRAEUS_EVIDENCE_DIR=<scratch> node packages/astraeus-site/tools/validate/journey-look-out.mjs`; 18 s, ok, zero console errors, desktop and phone. Earlier runs while building failed on my own scene and script (a Solar system scale needs an enlarged body; the picker must select the body first; the Developer drawer keeps its last view line while shut, so the driver now waits one 250 ms refresh) and were fixed; no run repeated the same failure. `npm run check:browser` not run (Full Objective Check). Zodiac and the public build are untouched (a public build leaves `src/synthetic/` out).
- Design reconciled: new paragraph "The sky view (O-064, G-018; T-291 to T-293)" in Interfaces and Data Flow and a Codebase Map mention of `syntheticLookOutScene.ts`; accounting below.
- Owner's look: pending.

Gates (2026-11-10, from /home/user/code/Astraeus): `npm run lint` pass 4 s; `npm run typecheck` pass 10 s; `npm run build` pass 2 s (chunk-size warning as before); `npm test` pass 46 s (238 files, 3406 passed, 2 skipped); `npm run check:pack` pass 23.8 s; `npm run check:node-consumer` pass.

Unverified: real touch drag and pinch feel and the wheel's pace in a live viewer (the step drives one wheel turn on desktop only; pan and pinch maths are in the fast suite); the owner's look at the preview (appearance, the Sun's glow when looking toward it).

### Repair after owner look (2026-11-10)

Owner: "Cant see the sun". Measured on the dev server (driver, no screenshot): the page's time read 2030-05-01T12:00Z (the window's end), and the Sun's readout stood at x 1.338 (outside the view) although the camera read ra 281.6 dec -23. A node projection of the engine's Sun (geocentric ra 282.0, dec -22.8 at 2030-01-01T12Z) with the same camera put it at 0.4998, 0.5001, so the direction was right and the date was wrong.
- Cause 1 (the reported one): `syntheticLookOutScene` gave `rates` and `rate` in milliseconds (`DAY_MS`); the API takes simulated seconds per real second, so the clock played 1000 days per second and reached the window end at once; the Sun had moved ~120 degrees out of the view. Fixed: `rates: [3600, 86400, 604800]`, `rate: 3600` (the Sun stays in view for minutes).
- Cause 2 (found on the way, real but not what the owner saw first): the far plane in look-out was the orbit-framing one (`reach.far ?? 5000` Earth radii) while the Sun is ~23,400 radii from Earth, so the Sun would be clipped even at the right date. Fixed generally: `lookOutFar` (sceneFraming.ts) raises a look-out camera's far plane to 1.5 x the farthest placed body; no body names; the orbit camera is unchanged. Logarithmic depth is on, so a large far with near 1e-3 is safe.
- Labels: the Sun's label already shows in the look-out view (a Sun-centred scene sets no label limit, planBodies.labelReach); the journey step now asserts it. Mars's label shows only when Mars is on screen, as for any body.
- Tests: tests/sceneFrame.test.ts "draws out to the farthest body while looking out" (fails before the fix, TEST-02: stashing src gave 1 failed); astraeus-site tests/syntheticScenes.test.ts "look out: opens with the Sun in the view and plays slowly enough to stay there" (rate and Sun direction at the opening date; fails with the old rates).
- Browser: journey-look-out.mjs now asserts the Sun is drawn, in view near the middle and labelled on opening; ran against my own dev server on 5483 (desktop and phone), passed, server stopped.
- Gates: lint 7 s pass, typecheck 6 s pass, build 3 s pass, test 44 s pass (run after the last edit except build, which ran before a test-only edit).
- Not verified: pixels (no screenshots, by rule); the owner should look again at localhost:5490 (reload).

## Owner Validation (2026-11-10T02:36:42Z)

The owner looked at `localhost:5490/app.html?experience=synthetic-lookout`. First look: "Cant see the sun, looks oK other than that" (cause: the scene's rates in milliseconds and the orbit far plane; repaired in 67f3cd32; a second look first saw the stale preview server, restarted). Then: "there it is...and mars?" (Mars shown left of the Sun with its label), then "looks good go". The owner set the Task done on the board.

## Drift Notes

Record any further deltas here; this step reconciles all O-064 notes into Design.

Design reconciliation accounting (every O-064 drift note, in the paragraph "The sky view (O-064, G-018; T-291 to T-293)" of Design.md Interfaces and Data Flow unless noted):
- T-291 camera mode (`OrbitCameraState.lookOut`, `directionAt`, `CameraRequest` lookOut kind): reflected, items (1).
- T-291 field of view as camera state (5 to 100, opening 60, orbit stays 45, `poseCamera`): reflected, item (1).
- T-291 stood-in body hidden by `hiddenOf`, the single hidden-set path: reflected, item (2).
- T-291 camera at the body centre, target one unit ahead, near 1e-3: reflected, item (1).
- T-292 public shapes (`CameraPose = OrbitPose | SkyPose`, `SkyPose`, `LookOutTarget`, `scene.camera.lookOut`, opening direction is a star-map position only): reflected, items (3) and (4).
- T-292 internal ownership in `core/startView.ts` (`SkyView`, `CameraView`, `isSkyView`, `eqjUnitVector`, ranges), `skyViewOf`, `controls.viewReadout`/`startView`/`readCamera`/`ExperienceDefinition.startView` as `CameraView`, share link fifth part: reflected, item (3).
- T-292 `setCamera` with no direction keeps the current ra/dec while looking out: reflected, item (3).
- T-292 "the planets demo's own start view setting is typed `OrbitPose`": non-architectural (a type annotation inside the demo's settings parser; no boundary or data flow changed).
- T-293 menu entry (`setLookOutChoices`, `lookout-<id>` preset, `ExperienceCameraRequest` lookOut kind, `requestObjectId`, `ObjectControls`), browser readout and the made-up scene: reflected, item (5) and the Codebase Map row of `astraeus-site`.
Drift not reflected: none. Note for the owner: selecting another object in the picker while looking out leaves the sky view (and the Look out entry pressed); only Focus, Follow and Overview leave it.

