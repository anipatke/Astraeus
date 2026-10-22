---
id: T-135
title: Add an illuminate-all switch to the settings
objective: O-039
status: done
check_waiver:
  task: T-135
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the Full Objective Check covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T10:40:06Z'
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o039-planning-20261022}
lane: light
planned_reads: [src/app/sceneLights.ts, src/app/lighting.ts, src/app/sceneFrame.ts, src/app/DeveloperSettings.tsx, src/app/SettingControls.tsx, src/app/App.tsx, src/app/style.css, src/shell/phone.css]
planned_writes: [src/app/sceneLights.ts, src/app/lighting.ts, src/app/sceneFrame.ts, src/app/DeveloperSettings.tsx, src/app/SettingControls.tsx, src/app/App.tsx, src/app/style.css, tests/illuminateAll.test.ts]
---

# Add an illuminate-all switch to the settings

## Outcome

A switch in the settings drawer lights every body in every demo from the camera while it is on, keeping surface shading so night-side places can be read; off by default, which keeps true sunlight (I-055).

## User Check

On the preview, open a planet whose night side faces you, open settings and turn on "Illuminate all": the side facing you lights up with shading; turn it off and sunlight returns. Check on a phone-sized window and on desktop.

## Done When

- A plain function chooses each body's light direction: toward the Sun when off, toward the camera when on; the lighting stage in `sceneFrame.ts` calls it.
- The switch sits in the Sky and Sun settings group (or the nearest fitting group), labelled "Illuminate all", with an accessible name, on phone and desktop layouts, no overlaps or horizontal scroll at 375x667 and 1280x720; default off.
- `tests/illuminateAll.test.ts` covers both choices and the default. Owner verdict recorded. Configured gates pass.

## Context Files

`src/app/sceneLights.ts`, `src/app/lighting.ts`, `src/app/sceneFrame.ts`, `src/app/DeveloperSettings.tsx`, `src/app/SettingControls.tsx`, `src/app/App.tsx`, `src/app/style.css`, `src/shell/phone.css`.

## Design References

Design: Components/Codebase Map row for `src/app/` (`sceneFrame.ts` stages).

## Guardrails

ARCH-01, CODE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Add the light-direction choice as a pure function with its test.
2. Wire it through the lighting stage with the camera position.
3. Add a toggle control beside the existing setting controls (reuse `SettingControls.tsx`).
4. Ask the owner to look on phone and desktop sizes.

## Boundaries

Lighting direction only; ambient and directional strengths per body unchanged. No browser sets, no screenshots.

## Technical Verification

Focused node tests; configured gates at handoff; owner's look on the preview. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built in lane `lane-t135` (no browser, no screenshots).

- `chooseLightDirection` (src/app/lighting.ts): pure; off returns the body's Sun direction, on returns the unit vector from the body to the camera (camera on the body keeps sunlight). `DEFAULT_ILLUMINATE_ALL = false`.
- `placeBodyLights` (sceneLights.ts) takes a `LightViewpoint`; the lighting stage in `sceneFrame.ts` passes `controls.illuminateAll`, `camera.position` and each body's `origin.toLocal(absoluteOf(id))` (all floating-origin local axes, same as the lights).
- `SceneControls.illuminateAll` (AstraeusScene.tsx), initialised in App.tsx from the default; "Illuminate all" aria-pressed button via `SettingButtons` in a new always-shown "Lighting" group at the top of `SkyAndSunSettings` (DeveloperSettings.tsx). No new CSS: it reuses the existing setting-buttons row, so the phone/desktop layout is the same as the existing toggles (Milky Way picture etc.), one short button on one row; no overlap or horizontal scroll expected at 375x667 or 1280x720 (reasoned, not run).
- Strengths per body (ambient/directional) untouched.
- Tests: tests/illuminateAll.test.ts, 4 tests (default off, off keeps sun, on gives unit camera-side direction, camera on body falls back).
- Deviations: new "Lighting" group instead of the "Sky" group, because Sky is hidden when a demo has no sky; planned_writes did not include AstraeusScene.tsx or style.css (AstraeusScene.tsx touched for the control field; style.css not needed). Light-direction scope is the Developer settings drawer, like the other toggles.
- Gates: lint, typecheck, build, test all pass (94 files, 1294 passed, 1 skipped).
- Owner look on preview: pending. Open localhost:5490, any planet demo, settings (Developer) > Lighting > "Illuminate all": the face toward the camera should light up with shading kept (night-side places readable); off returns true sunlight and is the default. Check at 375x667 and 1280x720 that the button sits in its own row with no overlap.

## Drift Notes

Deferred to T-137.
