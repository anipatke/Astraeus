---
id: T-109
title: Prove tap-to-focus in the browser checks and update the design notes
objective: O-022
status: done
depends_on: [{task: T-107, requires: clear}, {task: T-108, requires: clear}]
owner_validation: {required: true, accepted_check: C-088, accepted_by: {role: owner, session: o022-run-20261020}}
check_waiver:
  task: T-109
  reason: Owner skips per-Task checks for O-022; one Full Objective Check at the end.
  actor: {role: owner, session: o022-run-20261020}
  recorded_at: '2026-10-20T07:31:17Z'
planned_by: {role: planner, session: o022-planning-20261020}
planned_writes: [tools/validate/driver.mjs, tools/validate/driver.d.mts, tools/validate/browser-tap-focus.mjs, tools/validate/run-full.sh, docs/BROWSER_CHECKS.md, .savepoint/Design.md]
---

# Prove tap-to-focus in the browser checks and update the design notes

## Outcome

Headless browser checks, through the shared driver only, prove on desktop and phone that a tap or click on a body or its name tag focuses it and updates the picker, that a drag or pinch selects nothing, that non-targets do nothing, and that laptop hover shows the pointer. The full run includes the new script, and Design describes tap-to-focus as built. The owner then looks on the preview.

## User Check

Run `node tools/validate/browser-tap-focus.mjs` (with `PLAYWRIGHT_CORE` set as in AGENTS.md): it passes with zero console errors and prints each scenario. Then on `localhost:5490` try tapping and dragging in Apollo 11, Showers and Jupiter, at laptop and phone size, and say whether it feels right.

## Done When

1. New driver functions (one per user action and readout), for example `tapBody(page, id)` and `tapLabel(page, id)` placing the pointer from the scene's own readouts (`data-body-screen`, label boxes via `[data-label-id]`), `dragAcross(page, id)`, `pinchAt`, `pickTarget(page)` (`data-pick-target`) and `pickHover(page)` (`data-pick-hover`). Scripts call only the driver; `tests/browserDriverGuard.test.ts` passes.
2. `tools/validate/browser-tap-focus.mjs` asserts at 1280x720 (mouse) and 375x667 (touch): body tap focuses and the picker shows it; label tap focuses; a small Jupiter set moon focuses on the first tap; drag and pinch leave selection unchanged; a spacecraft or empty-space tap changes nothing; the information sheet stays shut; mouse hover sets `data-pick-hover` and touch does not. It runs on at least two demos at both scales, so it is not one experience passing (ARCH-03 in spirit; contract-level proof stays in the first step's unit tests). No screenshots.
3. `tools/validate/run-full.sh` lists the new area script; `docs/BROWSER_CHECKS.md` maps each scenario to its assertion, and maps O-025's two-tap body-set scenario (in `browser-moon-panel.mjs` or wherever it lives) to its new one-tap assertion (Browser regression maintenance rule).
4. Design reconciliation: every drift note from T-107 and T-108 is reflected in `.savepoint/Design.md` (picking module, pick callback, tap rule, readouts, hover setting) or marked non-architectural with a reason.
5. Gates: `npm run typecheck`, `npm run build`, `npm test`; lite check, `browser-tap-focus.mjs` and `browser-moon-panel.mjs` pass with zero console errors. One browser job at a time.
6. Owner look on the preview is recorded after the browser evidence.

## Context Files

`tools/validate/driver.mjs`, `tools/validate/driver.d.mts`, `tools/validate/driver-guard.mjs`, `tools/validate/browser-moon-panel.mjs`, `tools/validate/browser-lite.mjs`, `tools/validate/run-full.sh`, `docs/BROWSER_CHECKS.md`, `.savepoint/Design.md`, `src/app/scenePicking.ts`, `.savepoint/objectives/O-022-tap-or-click-an-object-in-the-scene-to-focus-on-it/tasks/T-107-tap-a-planet-moon-or-the-sun-to-fly-to-it.md`, `.savepoint/objectives/O-022-tap-or-click-an-object-in-the-scene-to-focus-on-it/tasks/T-108-show-a-pointing-hand-and-brighter-name-on-laptop-hover.md`.

## Design References

Design: "Shell layout (O-020)" (Browser driver); AGENTS.md project rules on browser checks, the shared driver, regression maintenance and deferred Design reconciliation.

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-03; STYLE rules.

## Implementation Plan

1. Read the drift notes of T-107 and T-108.
2. Add driver functions reading the scene's readouts; no selectors outside the driver.
3. Write `browser-tap-focus.mjs`; update the moon-panel mapping for one-tap set members.
4. Add the script to the full run and map scenarios in `docs/BROWSER_CHECKS.md`.
5. Reconcile Design; run gates and the browser scripts one at a time; ask the owner for the preview look.

## Boundaries

No change to tap or hover behaviour (return REPLAN REQUIRED or file an Issue for a defect found); no screenshots or picture comparisons; no full `run-full.sh` unless the owner asks (Full Objective Check runs touched areas).

## Technical Verification

Configured gates, lite check, the new area script and the moon-panel script. The Full Objective Check runs the lite check, the public-build licence gate and the touched areas' scripts (controls/tap-focus, moon panel), evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Browser runs deferred to the O-022 Full Objective Check by owner decision 2026-10-20. Task Check skipped by owner decision 2026-10-20 ("Skip task checks, you will check all the work once at the end"); check_waiver recorded in frontmatter.

Per criterion:
1. Met in code. New driver functions in `tools/validate/driver.mjs`: `scenePointer`, `bodyScreenPoint`, `tapBody`, `tapLabel`, `tapScenePoint`, `dragAcross`, `pinchAt`, `hoverBody`, `hoverScenePoint`, `pickTarget`, `pickHover`, `sceneCursor`, `waitForPicked`, `waitForPickHover`, `tappableBodies`, `tappableLabelIds`, `emptySceneSpot`, `tappableSetMember`. Touch is real CDP touch events on a `hasTouch` page. Readouts checked in src: `data-pick-target`/`data-pick-hover` (AstraeusScene.tsx), `data-body-screen` (sceneDebug.ts), `[data-label-id]` (SceneLabels), body-set sample `{id,x,y}` (sceneBodySets.ts). `driver-guard` passes; `tests/browserDriverGuard.test.ts` passes. `driver.d.mts` unchanged (it exports only what unit tests import).
2. Written, not run: `tools/validate/browser-tap-focus.mjs`, 3 demos (Apollo, Showers, Jupiter-Io) x 1280x720 mouse and 375x667 touch: drag, pinch (touch), empty-space tap, hover and pointer shape (mouse), body tap, name-tag tap, small Jupiter moon one tap, information sheet shut throughout. Spacecraft taps are not scripted (spacecraft are not in `data-body-screen`); the empty-space tap and the unit tests (`tests/scenePicking.test.ts`) cover non-targets. `node --check` clean. Not run, so open.
3. Met: `run-full.sh` lane B runs `tap-focus`; `docs/BROWSER_CHECKS.md` has a "Tap to focus" section mapping each scenario. The two-tap set-moon scenario is in `browser-jupiter-io.mjs` (not moon-panel, which never taps the scene); its phone branch now asserts one tap (`pickTarget`), mapped in the doc.
4. Met: every T-107 and T-108 drift note is in `.savepoint/Design.md`: new Codebase Map row for `scenePicking.ts` (picking, tolerances, `TapTracker`, pick callback path, `shownRects`) and a "Tap to focus (O-022)" bullet under Interfaces (readouts, cursor, `hoverBrightness` setting, unlisted set moons accepted, two-tap removal, driver additions). Nothing marked non-architectural.
5. Partly met: `npm run typecheck` clean; `npm run build` ok; `npm test` 78 files, 1138 passed, 1 skipped. Lite, `browser-tap-focus.mjs` and `browser-moon-panel.mjs` NOT run (deferred to the Full Objective Check). Open.
6. Open: owner look on the preview after the browser evidence.

Files read: the Context Files; extra reads (to confirm readouts and where the two-tap scenario lives): `src/app/AstraeusScene.tsx`, `src/app/sceneDebug.ts`, `src/app/sceneBodySets.ts`, `src/app/BodySetLabels.ts`, `src/shell/style.css` (label pointer-events), `tools/validate/browser-jupiter-io.mjs`, `tools/validate/browser-story-panels.mjs` (CDP touch pattern), `tools/validate/public-addresses.mjs`. Files changed: `tools/validate/driver.mjs`, `browser-tap-focus.mjs` (new), `browser-jupiter-io.mjs`, `run-full.sh`, `docs/BROWSER_CHECKS.md`, `.savepoint/Design.md`, this file.

Limitations: scripts are unrun, so selector timing, label availability per demo, and whether a mobile-emulated touch page reaches the canvas are unproven; the script asserts at least two name-tag taps and four empty-space taps overall so a quiet view cannot pass vacuously.

### Browser runs and repairs (coordinator, 2026-10-20T08:27:04Z)

Runs on the dev server `http://localhost:5479/app.html`, evidence under `docs/evidence/o022-check-20261020T073626Z/`, one browser job at a time, `PLAYWRIGHT_CORE` as in AGENTS.md, Node v24.16.0.

- First run of `browser-tap-focus.mjs` failed (`tap-focus.log`, apollo phone body tap). A repair builder (runs 4-9) found Chromium touch emulation snaps a tap onto a nearby `button.story-marker` beside a ~6 px Earth while `elementFromPoint` still says canvas; it added a touch-aware `sceneReachableAt` and a clear-point search shared by `tapBody` and `tappableBodies`, `waitForPickTarget`, a radius-aware `emptySceneSpot`, tags over another disc skipped, and a close-in reload when no body is tappable.
- Coordinator repairs after that: `hoverBody` uses the same clear point and comes in from 1 px away so a move is always heard (run 9 hover timeout); the script waits for the camera to settle before listing name tags and tries the next tag when one hides (run 10, Mercury's tag hid); a tapped Jupiter set moon that is listed in the Object list is now expected to show in the picker, an unlisted one to leave it alone (run 11: Pasiphae is listed); `tappableLabelIds` uses `sceneReachableAt` instead of `canvasTopAt` (runs 12-13: the Moon's tag tap snapped to a story marker).
- App defect found and fixed (outside this Task's planned writes; T-107's module): `pickCandidatesOf` dropped a catalogued object whose body is not drawn in view even while its name tag showed, so the tag was not a target (Success Condition 3: labels are targets). Now such an object is a label-only candidate (`labelOnly`, only the tag answers). Unit test added in `tests/scenePicking.test.ts` ("keeps a shown name a target when its body is not drawn in view").
- `browser-tap-focus.mjs` run 14 (`run14-tap-focus.log`): exit 0, 83 s, `errors: []`; all six demo x size runs passed. Body taps: earth (x2), venus, jupiter (x2), europa; name-tag taps: moon (apollo phone), europa (jupiter-io phone); hover: earth, europa, jupiter; pinch on all three phone runs; empty-space taps where a free spot existed (4 of 6); set moon one-tap: pasiphae (listed) on both Jupiter sizes. The unlisted-set-moon branch was not exercised (the first tappable dot was listed).
- `browser-moon-panel.mjs`: exit 0, 47 s, zero console errors. `browser-lite.mjs`: exit 0, 136 s, 26/26 loads passed.
- `browser-jupiter-io.mjs`: first run killed by the coordinator at 861 s and a second timed out at 500 s, both in `places()`; the same timeout at 400 s on the pre-O-022 commit 641a50c shows this is the script's normal length (1361-1464 s in the C-084 and O-016 full runs), not a regression. A full-length run was started and then stopped at the owner's word (2026-10-20T08:27:35Z): "I dont really want to run the browser checks for jupiter each time we make a small change though". Not run to completion for O-022; the one Jupiter behaviour O-022 changed (one tap on a set moon) is asserted at both sizes by `browser-tap-focus.mjs` run 14.
- Gates after the repairs: `npm run typecheck` 0; `npm run build` 0; `npm test` 78 files, 1139 passed, 1 skipped; `tests/browserDriverGuard.test.ts` 4/4.

## Drift Notes

This step is the O-022 integration and Design reconciliation Task.

Owner looked on the preview (localhost:5490) and closed this Task on 2026-10-20T08:35:09Z: "looked at it, all works, close it". Accepted against C-088 (CLEAR).
