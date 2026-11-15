---
id: T-318
objective: O-075
title: Choose which camera buttons show and rename switches
status: planned
depends_on: [{task: T-317, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-318, reason: 'Owner said "orchestrate O75" (orchestrate O-075) under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: plan-o075-20261115}, recorded_at: '2026-11-15T10:09:53Z'}
planned_by: {role: planner, session: plan-o075-20261115}
---

# Choose which camera buttons show and rename switches

## Outcome

A host chooses which bodies offer Focus (`scene.camera.setFocusChoices`) and whether Overview shows (`scene.camera.setOverview`), the same way as Follow and Look-out choices, so a look-out-only scene shows no orbit camera buttons; and a host gives any display switch its own label through `setSwitches` (Zodiac review F-03, F-04).

## User Check

On `localhost:5490`, open a look-out sky demo set up with empty Focus and Follow choices, Overview off and a relabelled switch (for example `skyBoundaries: { place: "top-bar", label: "Constellation outlines" }`): the top bar shows Look out and the new label, with no Focus, Follow, Overview or scale buttons, at 375x667 and 1280x720.

## Done When

- `camera.setFocusChoices(ids)` mirrors `setFollowChoices` (an id not in the scene throws `unknown-body`; undefined = every object, `[]` = none); an opening `focus` target outside the choices throws `bad-camera`, as `follow` does today. `camera.setOverview(on: boolean)` (default true); a non-boolean throws `bad-camera`. `cameraPresetsOf` honours both; with none of a kind, its button does not render.
- `SwitchesInput` entries take `label?: string` (non-empty after trim, else `bad-switch`); the top bar button, the switch panel row and the Developer drawer row use it in place of the built-in label. A later `setSwitches` call keeps replacing the whole entry for that switch.
- Tests: one table over the camera choices (default, empty, partial) for each kind of preset; opening-target errors; switch label shown in each place and `bad-switch` cases; the default scene's buttons and labels are unchanged. Existing tests' setup unchanged.
- README: `camera` rows for the two calls, `setSwitches` row for `label`, and a short sky-only recipe naming `setFocusChoices([])`, `setFollowChoices([])`, `setOverview(false)` and `setScale(x, { only: true })`. CHANGELOG `Unreleased`; `npm run api:lock` rerun; configured gates pass.
- Owner looks at the User Check on `localhost:5490` (one browser job at a time).

## Context Files

- `packages/astraeus/src/api/planCamera.ts`
- `packages/astraeus/src/api/assembleScene.ts` (the camera presets and opening-target checks only)
- `packages/astraeus/src/shell/ObjectControls.tsx`
- `packages/astraeus/src/api/switches.ts`
- `packages/astraeus/src/app/displaySwitches.ts`
- `packages/astraeus/src/shell/TopBar.tsx`
- `packages/astraeus/tests/sceneCamera.test.ts`
- `packages/astraeus/tests/displaySwitches.test.ts`
- `packages/astraeus/README.md` under `The camera` and `Looks, controls and views`
- `packages/astraeus/CHANGELOG.md` under `Unreleased`
- `docs/agents/browser-policy.md`
- `.savepoint/objectives/O-075-panels-controls-and-reads/Objective.md`

## Design References

Design `Public API shape (G-016, owner 2026-11-01)`. Objective O-075 `Design Decisions` D2.

## Guardrails

ARCH-01, ARCH-03, API-02, API-04, API-05, API-06, TEST-01..03.

## Implementation Plan

1. Add focus choices and the overview flag to the camera plan beside follow and look-out choices; check the opening target.
2. Pass them to `cameraPresetsOf`; confirm the controls render nothing for a missing kind.
3. Add `label` to `SwitchesInput`, carry it to the switch list, and use it in the three places a switch shows.
4. Tests, README rows and recipe, CHANGELOG, API lock; ask the owner to look.

## Boundaries

No "sky only" mode, no hiding of the Info or related-object buttons, no top-bar host slots, no change to the scale control (already hideable).

## Technical Verification

Focused tests while iterating; configured gates at handoff, including the browser check per `docs/agents/build.md` since top-bar buttons change. Evaluated later under `agent-skills/references/check-method.md`. Owner judges the look on `localhost:5490`.

## Technical Evidence

Pending execution.

## Drift Notes

Record the new camera plan fields and switch label path for Design reconciliation before the Full Objective Check.
