---
id: T-107
title: Tap a planet, moon or the Sun to fly to it
objective: O-022
status: planned
depends_on: []
owner_validation: {required: false}
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

Pending execution.

## Drift Notes

Record Design deltas here for reconciliation by T-109 (browser checks and Design reconciliation).
