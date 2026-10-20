---
id: T-107
title: Tap a planet, moon or the Sun to fly to it
objective: O-022
status: done
depends_on: []
owner_validation: {required: false}
check_waiver:
  task: T-107
  reason: Owner skips per-Task checks for O-022; one Full Objective Check at the end.
  actor: {role: owner, session: o022-run-20261020}
  recorded_at: '2026-10-20T07:24:11Z'
planned_by: {role: planner, session: o022-planning-20261020}
planned_writes: [src/app/scenePicking.ts, tests/scenePicking.test.ts, src/app/CameraController.tsx, src/app/BodySetLabels.ts, src/app/SceneLabels.ts, src/app/AstraeusScene.tsx, src/app/sceneCamera.ts, src/app/App.tsx, src/shell/AstraeusShell.tsx, tests/bodySet.test.ts, tests/focusPreset.test.ts]
---

# Tap a planet, moon or the Sun to fly to it

## Outcome

A tap (touch) or click (mouse) on a planet, a moon or the Sun, or on its shown name tag, flies the camera to it exactly as choosing it in the top-bar picker's focus does, and the picker shows it. Drags and pinches never select. Jupiter's body-set moons fly on the first tap (O-022 Decision 4). Spacecraft, comets, streams, catalogue points and empty space do nothing.

## User Check

On the preview (`localhost:5490`): in Apollo 11 click the Moon, then Earth; in Jupiter click Io, then a small outer moon's dot; on a phone-sized window tap a name tag. Each time the camera flies there and the picker names it; the information sheet stays shut. Drag across a body: the view turns, nothing is selected. Click Columbia or Eagle: nothing happens.

## Done When

1. A pure, generic picking module (`src/app/scenePicking.ts`) returns the target under a pointer from screen-space candidates: projected disc plus a minimum tolerance (touch tolerance larger than mouse) and shown label rectangles; nearest wins; none returns null. Unit tests with made-up candidates cover disc hit, tolerance hit on a sub-pixel body, label hit, overlap (nearest wins), miss, hidden label ignored.
2. One tap-versus-drag rule shared with `attachOrbitGestures`: one pointer, movement within the slop, no second pointer during the press. Tests cover small move (tap), large move (drag), pinch (never a tap), mouse and touch.
3. Tap targets are objects resolving to a catalogued body through `bodyIdFor`, plus body-set members; no `ExperienceObject` field is added and no experience is named (ARCH-01). A test with a synthetic or alternative composition proves a non-Apollo, non-Jupiter set of bodies is tappable and a tracked non-catalogue subject is not (ARCH-03).
4. A scene pick reaches the shell through one controls callback (like `onStoryMarker`); the shell activates `focusPresetFor` for the available object (selection and picker update, no information opened). `BodySetLabelLayer` no longer writes `cameraRequest` and its two-tap rule is gone; hover naming stays. Story and feature marker taps keep priority over a body behind them.
5. Works at both scales and through the floating origin (positions come from the same projections the labels use).
6. The canvas exposes `data-pick-target` (last picked id) for the browser driver; no screenshots.
7. Gates: `npm run typecheck`, `npm run build`, `npm test` pass; the lite browser check (`tools/validate/browser-lite.mjs`) and `tools/validate/browser-moon-panel.mjs` pass with zero console errors (scene-affecting fuller gate). Tap-specific browser scripts belong to the third step.

## Context Files

`src/app/BodySetLabels.ts`, `src/app/SceneLabels.ts`, `src/app/AnchorLabels.ts`, `src/app/CameraController.tsx`, `src/app/AstraeusScene.tsx`, `src/app/sceneTargets.ts`, `src/app/sceneCamera.ts`, `src/app/App.tsx`, `src/app/StoryMarkers.ts`, `src/app/FeatureMarkers.ts`, `src/app/BodySetView.ts`, `src/shell/AstraeusShell.tsx`, `src/shell/objectModel.ts`, `src/shell/experience.ts`, `tests/bodySet.test.ts`, `tests/focusPreset.test.ts`, `tools/validate/browser-moon-panel.mjs`.

## Design References

Design: Components/Codebase Map row for `src/app/scene*.ts`; "Shell layout (O-020)" (Top bar, Phone, Browser driver); Interfaces, Name rule. O-022 Confirmed Decisions 1, 2, 4 and Planned Technical Decisions.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, TEST-01, TEST-03; STYLE rules.

## Implementation Plan

1. Confirm `bodyIdFor`, the label projections and `focusPresetFor` behave as the Objective's Planned Technical Decisions describe; return REPLAN REQUIRED if a tap cannot reach the shell's focus without changing State.
2. Extract the tap rule (slop, single pointer) so the orbit gestures and picking share it.
3. Write `scenePicking.ts` and its tests.
4. Build candidates each frame from catalogued bodies (projected position and screen radius) and shown labels (`SceneLabelLayer` rectangles), plus body-set member screens.
5. Add the controls pick callback; wire the shell to `focusPresetFor` without opening information; move the body-set path onto it and drop the two-tap rule.
6. Add `data-pick-target`; run the gates and the two browser scripts.

## Boundaries

No information sheet on tap, no hover cursor or label brightening (next step), no new browser scripts or driver functions (third step), no State, provider or `ExperienceObject` contract change, no spacecraft, comet, stream or catalogue-point targets.

## Technical Verification

Focused unit tests while iterating; at handoff the configured gates plus the lite browser check and the moon-panel area script. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Owner Task-check waiver: Task T-107, reason "owner skips per-Task checks for O-022; one Full Objective Check at the end", actor owner, time 2026-10-20T07:24:11Z.

Browser checks deferred to the O-022 Full Objective Check by owner decision 2026-10-20 (browser-moon-panel not run at handoff). Disclosure: the lite check (`browser-lite.mjs`) had already finished before that decision arrived: 26/26 loads passed, zero failures (scratchpad run directory `lite-20261020T072118`); it is a smoke result, not a tap test. `browser-moon-panel.mjs` was not run; it may assert O-025's two-tap rule, which Decision 4 removes (T-109 owns browser scripts).

Commands: `npm run typecheck` clean; `npm run build` ok (chunk-size warning only); `npm test` 78 files, 1135 passed, 1 skipped.

Per criterion:
1. `src/app/scenePicking.ts` `pickTarget` (disc plus tolerance 10 px mouse / 22 px touch, label rectangles, nearest wins); `tests/scenePicking.test.ts` covers disc, tolerance, label, hidden label, overlap, miss.
2. `TapTracker` (slop 6 mouse / 10 touch, single pointer, pinch never a tap) is used by `attachOrbitGestures` (`onTap`); tests: small move, large move, pinch, cancel, mouse and touch.
3. `pickCandidatesOf` takes listed objects whose id resolves through `bodyIdFor` plus body-set members; no `ExperienceObject` change; a synthetic-composition test shows a non-Apollo body tappable and tracked, orbit and off-screen objects not.
4. `SceneControls.onPickObject` -> App `pickRequest` -> shell `pickObject` -> `focusPresetFor` via `activatePreset` (no information opened). `BodySetLabelLayer` lost its tap, `onFocus` and `cameraRequest` write; hover naming stays. Story and feature markers are buttons that stop pointerdown, so a canvas tap never reaches a body behind them.
5. Positions come from `bodyScreenReadouts` and the label layer's rectangles (same projections as labels); not browser-verified at both scales.
6. Canvas `data-pick-target` holds the last picked id.
7. Gates above pass; browser gate deferred.

Extra reads: `src/app/experienceDefinition.ts` (experienceWithGroups, to see whether set members are objects) and the heads of `tests/focusPreset.test.ts`.
Files changed: src/app/scenePicking.ts (new), tests/scenePicking.test.ts (new), src/app/CameraController.tsx, src/app/SceneLabels.ts, src/app/BodySetLabels.ts, src/app/AstraeusScene.tsx, src/app/App.tsx, src/shell/AstraeusShell.tsx, tests/bodySet.test.ts.
Limitations: no pointer-event or in-browser tap test; shell wiring verified by typecheck only.

## Drift Notes

Design deltas for reconciliation by T-109:
- Design (Components, Interfaces): new `src/app/scenePicking.ts` (pure picking and the shared tap rule); `SceneControls.onPickObject`, shell `pickRequest` prop; `SceneLabelLayer.shownRects`; canvas readout `data-pick-target`.
- Body-set members that are not listed objects (small outer moons) fly through `onCameraRequest` directly, so the picker keeps its previous selection (it cannot list them). Design should decide whether that is acceptable.
- O-025 two-tap rule removed from `BodySetLabelLayer`; `membersToName` no longer takes a tapped member (tapped names gone; hover and near-zoom naming remain). `browser-moon-panel.mjs` may assert the two-tap rule: T-109 to update.

Owner closed this Task on 2026-10-20T07:28:29Z through the coordinator (structured question: "Yes, mark them done", owner authorised marking each O-022 step done once its build and tests pass). No Task Check by owner waiver; the O-022 Full Objective Check covers it.
