---
id: T-135
title: Add an illuminate-all switch to the settings
objective: O-039
status: planned
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

Pending execution.

## Drift Notes

Deferred to T-137.
