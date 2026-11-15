---
id: T-318
objective: O-075
title: Choose which camera buttons show and rename switches
status: done
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

Per criterion:
- Focus choices, overview flag, errors: `camera.setFocusChoices` / `setOverview` in `planCamera.ts`; `cameraPresetsOf(objects, choices)` omits the focus, follow, look-out or overview preset; `ObjectControls` draws no Focus button when `experience.focusListed` is set and the object has no focus preset (the plain-focus fallback stays for scenes with no focus choice, and for selecting an object). Opening-target errors via new `checkOpeningChoices` (moved the follow check out of `assembleScene` to stay under the lint complexity limit). Tests: `tests/cameraChoices.test.ts` table of 11 rows (default, empty, partial across focus, follow, look-out, overview, and the sky-only combination), each rendered through `ObjectControls` for two selected bodies, plus unknown-body, non-list, non-boolean, opening focus and follow outside the choices, opening focus inside; the default scene's presets and absent `focusListed` asserted.
- Switch label: `label?` on `SwitchesInput` and `DisplaySwitchSetting`; `switchesOf` trims and refuses empty, blank or non-string (`bad-switch`); `displaySwitchItems` uses it for the top-bar button and the panel row (rendered through `DisplaySwitches` in the table test, with built-in names unchanged). A later `setSwitches` entry replaces the whole entry (tested).
- DEVIATION: the Developer drawer has no per-switch rows (its controls are fixed, each switch maps to several), so the label applies to the bar and the panel only; README and CHANGELOG say so. Not a replan: nothing else depends on it.
- README rows for the two calls, `label` in the `setSwitches` row, sky-only recipe; CHANGELOG `Unreleased` (two entries); `npm run api:lock` rerun.

Gates (final run): lint pass; typecheck pass; build pass; test 4015 passed, 2 skipped, 1 failed of 4018: `astraeus-site/tests/apiReference.test.ts` load budget, generated API page gzip 44569 bytes against the limit 44500 (baseline without this Task 44490, so +79). Docs already trimmed to one line; not raised. Owner or planner to decide (trim other member docs, or raise the limit).
Test-support edits (not setup changes): `tests/lifecycle.test.ts` camera method list gains `setFocusChoices`, `setOverview`; `tests/sceneInputCopies.test.ts` gains two rows (API-04 walk requires one per mutator-named call); `astraeus-site/tests/migrationTable.test.ts` WIDENED allowlist gains `SwitchesInput` (additive label; allowlist edit, reported).
No browser run (per instruction).
Files: packages/astraeus/src/api/{planCamera,assembleScene,scene,switches}.ts, src/app/displaySwitches.ts, src/shell/{ObjectControls.tsx,experience.ts}, tests/{cameraChoices(new),lifecycle,sceneInputCopies}.test.ts, astraeus-site/tests/migrationTable.test.ts, README.md, CHANGELOG.md, api-surface.lock.json.
Extra reads: src/shell/objectModel.ts (focusPresetFor fallback), src/shell/DisplaySwitches.tsx (bar/panel rows), src/shell/AstraeusShell.tsx and viewCamera.ts (overview-preset fallbacks), src/app/App.tsx and DeveloperSettings.tsx (where switch labels show), tests/sceneInputCopies.test.ts, astraeus-site/tests/{apiReference,migrationTable}.test.ts and tools/site/api-reference.mjs (failing gates).

User Check recipe (host code; closest existing scene is any look-out sky demo on localhost:5490):
```ts
scene.camera.setFocusChoices([]).setFollowChoices([]).setOverview(false).setLookOutChoices(["earth"]);
scene.camera.lookOut("earth", { direction: { raDeg: 83.6, decDeg: 22 }, fovDeg: 60 });
scene.setScale(solarSystemScale, { only: true });
scene.setSwitches({ skyBoundaries: { place: "top-bar", label: "Constellation outlines" } });
```
Expect the bar to show Look out, Info and the relabelled switch, with no Focus, Follow, Overview or scale buttons, at 375x667 and 1280x720.

## Drift Notes

For Design.md reconciliation (Public API shape):
- Camera plan: `SceneCamera` gains `setFocusChoices(ids)` and `setOverview(on)`; their state is kept in a module WeakMap in `planCamera.ts` (read by `cameraChoicesOf`), not public getters, to keep the API page small. `cameraPresetsOf(objects, { focus, follow, lookOut, overview })` takes one choices object (was positional). `checkOpeningChoices` refuses an opening follow or focus outside its choices.
- `ExperienceConfig.focusListed?: boolean` (set only when `setFocusChoices` was called): the Focus button shows only for objects with a focus preset; absent keeps the plain-focus fallback.
- Switch label path: `SwitchesInput[id].label` -> `switchesOf` (trim, `bad-switch`) -> `DisplaySwitchSetting.label` in `definition.displaySwitches` -> `displaySwitchItems` (`label ?? DISPLAY_SWITCH_LABELS[id]`) -> top-bar button and panel row. The Developer drawer keeps its fixed controls.
- With no Overview preset, the shell's overview fallbacks (lost target, view rule) find none and hold the pose.

- Owner decision (2026-11-15T10:29:23Z): api/index.html gzip limit 44,500 -> 45,000 B (`packages/astraeus-site/tools/validate/load-budget.mjs`); owner chose "Raise to 45,000 bytes" (page 44,569 B; covers T-319). `apiReference.test.ts` rerun: 4 passed.
- Owner validation (2026-11-15T10:29:23Z): with a temporary, reverted change to the look-out fixture (empty Focus and Follow choices, Overview off, `setScale(solarSystemScale, { only: true })`, switches labelled "Star patterns" and "Constellation outlines" in the top bar), the owner looked on localhost:5490 `app.html?experience=synthetic-lookout` and answered "looks good". Fixture restored byte for byte.
- Coordinator: accepted the deviations (Developer drawer has no per-switch rows, so labels show in the bar and panel only, as the README says; `SwitchesInput` in the migration `WIDENED` allowlist, an additive field; expected-list additions in `lifecycle.test.ts` and `sceneInputCopies.test.ts`, no setup changed; `checkOpeningChoices` split for complexity). Gates pass with the raised limit; marked done per the owner's "orchestrate O75".
