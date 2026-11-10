---
id: T-295
title: Draw figures, outlines and the ecliptic and equator on the sky
objective: O-065
status: done
depends_on: [{task: T-294, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-295, reason: 'Owner said "orchestrate O65" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o065-run-20261110}, recorded_at: '2026-11-10T03:16:41Z'}
planned_by: {role: planner, session: o065-planning-20261110}
---

# Draw figures, outlines and the ecliptic and equator on the sky

## Outcome

An app, through `mount` or `AstraeusScene`, adds named sky figures and boundary outlines that are drawn at infinity like the stars, each with a label, and can switch on the ecliptic and the celestial equator; the visitor can switch each kind on and off.

## User Check

None for the owner at this step; the owner looks in the last step.

## Done When

- A public scene call adds sky figures (planner suggests `scene.addSkyFigures(figures)`; final name follows the verb grammar table, `tests/verbGrammar.test.ts`): each has an `id`, a `label`, `kind` (`"figure"` default or `"boundary"`), `segments` (pairs of ends, an end being `{ star: <HIP> }` or `{ raDeg, decDeg }`) for a figure or `points` (a closed loop of positions) for a boundary, and an optional `labelAt` position (default: the mean direction of its ends). Shapes are checked at the call (`bad-sky-figure`, one cause per code, API-05); a star id not in the star list throws `unknown-star`; a repeated id throws as other repeated ids do. Codes join the README error table.
- Figures are drawn at infinity in the EQJ frame like the stars (presentation only, ARCH-02), visible from the orbit camera and from a look-out view; lines and labels draw above the Sun's glow (owner decision 3), so the glow never hides them.
- The ecliptic (J2000 obliquity, one constant) and the celestial equator are built-in great circles; four display switches (`skyFigures` default on, `skyBoundaries`, `ecliptic`, `celestialEquator` default off; final names follow the switch table) through `setSwitches` and the visitor's controls, as `orbitLines` works.
- Sky labels join the existing label layout (`SceneLabelLayer`) and its collision and hysteresis rule; no second layer (STYLE-07); no collisions at 375x667 and 1280x720.
- Reads: the scene and the handle read the added figures (ids, labels, kinds) on both paths (API-02, `tests/lifecycle.test.ts`).
- Per-frame work is a named stage in `app/sceneFrame.ts` with a node test (CODE-02). Tests use made-up figures only (ARCH-03); no constellation name in `src/`.
- API lock, reachable-type check, public-type lint, README and CHANGELOG updated (API-01, API-07). Colours here use fixed defaults; the next step makes them looks.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/assembleScene.ts`, `packages/astraeus/src/api/switches.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/app/SkyView.ts`, `packages/astraeus/src/app/sceneSky.ts`, `packages/astraeus/src/app/SceneLabels.ts`, `packages/astraeus/src/app/displaySwitches.ts`, `packages/astraeus/src/app/sceneFrame.ts`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/assets/sky.ts`, `packages/astraeus/tests/sceneFrame.test.ts`, `packages/astraeus/tests/displaySwitches.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/objectives/O-065-draw-and-trace-figures-on-the-sky/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Scene and host-link split, O-058; the sky view, O-064; Headless use and looks as settings, O-056) and under `Decisions` (Public API shape, G-016).

## Guardrails

API-01, API-02, API-03, API-04, API-05, API-06, API-07, ARCH-01, ARCH-02, ARCH-03, ARCH-06, CODE-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Confirm the previous step's star-id lookup exists; return REPLAN REQUIRED if not.
2. Add a sky-figure planner in `src/api/` (input types, checks, resolution of star ids to directions in `assembleScene`), joined like the other plans.
3. Draw figures, outlines and the two reference circles beside `SkyView` (depth off, render order above the Sun's glow); add the switches.
4. Feed sky labels into the existing label layout with a far-away anchor.
5. Reads on both paths; lock, README, CHANGELOG; tests (bad shapes per field, unknown star, switches, draw order, made-up figures).

## Boundaries

No tracing (step 4); no colour or font looks (step 3); no clicking or cards (O-066); no constellation data (O-067).

## Technical Verification

Focused Vitest runs while building; hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack` and `npm run check:node-consumer` (public surface change); no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Per Done-When item (public names: `scene.addSkyFigures(figures)`, `scene.skyFigures`, `handle.skyFigures`; switches `skyFigures`, `skyBoundaries`, `ecliptic`, `celestialEquator`; codes `bad-sky-figure`, `unknown-star`, plus `missing-data` and `duplicate-id` reused):

1. Call and checks: `src/api/planSkyFigures.ts` (`SkyFigurePlan`), `src/api/skyFigureInput.ts` (`SkyFigureInput`, `SkyFigureEnd`), `scene.addSkyFigures`. Shapes are checked at the call, one cause per code (`bad-sky-figure`, 17 table cases plus message and atomic-call cases); a repeated id, in the call, across calls or against a body, path, group or body set (either order), is `duplicate-id`. `unknown-star` is thrown when the scene is built (`prepare`), see Drift Notes. Codes are in the README error table (generated, `npm run api:errors`). Tests: `tests/skyFigures.test.ts`, `tests/verbGrammar.test.ts` (new add row), `tests/sceneInputCopies.test.ts` (new copy row).
2. Drawing at infinity above the glow: `src/app/SkyFiguresView.ts` puts the lines on `TRACK_LAYER`, the last render pass after every body's pass and its halo, depth tested and not written; the group stands on the camera and is scaled between the planes like the sky. Tested on the group (layer mask, depth flags, position, scale) in `tests/skyFigures.test.ts`; not looked at in a browser (no browser runs). Look-out view: the same group follows whatever camera is posed.
3. Ecliptic and equator, four switches: `src/app/skyFigures.ts` (`eclipticSegments` uses the engine's own `eclipticJ2000ToEqjMatrix`, so one obliquity, STYLE-07; `celestialEquatorSegments`), `src/app/displaySwitches.ts` (ids, labels, `skyLineStart`), `src/app/App.tsx` (state, bindings, host publish), `tests/displaySwitches.test.ts` (4 new tests), tests in `tests/skyFigures.test.ts`. Defaults: figures on, the rest off; a story's `on` wins.
4. Labels: `src/app/SceneLabels.ts` takes sky labels as extra entries of the one `SceneLabelLayer` (priority below every object, figure above boundary), projected at the camera's own place along their direction; the same collision and hysteresis code runs. No second layer. Tested (one layer, behind camera, switched-off kind, body name wins a collision) in `tests/skyFigures.test.ts`. Phone and desktop overlap is not checked in a browser (no browser runs); the rule is the existing layout.
5. Reads: `scene.skyFigures` and `handle.skyFigures` (`ViewerControl.skyFigures`, `ViewerLink`, `ViewerHandle`), tested through `mount` and `AstraeusScene` in `tests/viewerHostDom.test.ts`, and the member joins `tests/lifecycle.test.ts` READS (undefined before ready and after unmount).
6. Stage: `placeSkyFigures` (stage 4b) in `src/app/sceneFrame.ts`, node tests in `tests/sceneFrame.test.ts` (3). No real constellation name in `src/` or tests.
7. Lock, reachable-type check, public-type lint, README, CHANGELOG: `npm run api:lock`, `npm run api:errors`, README rows (scene call, `scene.skyFigures`, `handle.skyFigures`, switches, mount handle list, error table), CHANGELOG Unreleased. `tests/fixtures/scenePin.json` updated with `-u` (only the switch-name lists in two `bad-switch` messages changed). Colours are fixed defaults in one place, `SKY_LINE_COLOURS` in `src/app/skyFigures.ts`.

Commands (repo root, wall clock): `npm run lint` pass 4 s; `npm run typecheck` pass 10 s; `npm run build` pass 2 s; `npm run check:pack` pass 15 s; `npm run check:node-consumer` pass 4 s; `npm test` 41 s: 3472 passed, 1 failed (see below). Extra reads: `src/app/viewUp.ts`, `src/core/twoBodyAdapter.ts` (the engine's obliquity matrix, STYLE-07), `src/app/sceneContentsHooks.ts`, `src/app/LayeredRender.tsx`, `src/app/bodyDraw.ts` (glow draw order, render passes), `src/app/viewerPort.ts`, `src/api/viewerLooks.ts` (host reads), `tests/helpers/frameContext.ts`, `tests/apiImports.test.ts`, `packages/astraeus-site/tests/apiRules.test.ts`, `packages/astraeus-site/tests/migrationTable.test.ts`, `tools/api-rules.mjs`, `tools/api-surface.mjs` (gates that broke on the surface change).

Open gate failure, needs the owner: `packages/astraeus-site/tests/allowlistGrowth.test.ts` fails because the public-type lint (API-04, a number field names its unit) flags the Hipparcos number field `SkyFigureEnd.star`. I added `star` to the `unitless` list of `packages/astraeus-site/tests/apiTypeLint.allowlist.json` with a reason (an identifier, not a measured quantity), which the growth test refuses without an owner approval block (`approved: {by: "owner", at, reason}`); I did not write one. Without the entry the type-lint test fails instead. Either the owner approves the entry, or the end takes another shape.

Changed test machinery beyond new tests: `packages/astraeus-site/tests/migrationTable.test.ts` now compares union members in a fixed order (a new `"ecliptic"` literal made the compiler list `FollowView.up` as `"ecliptic" | "equatorial"`; same set, not a change); `tests/helpers/frameContext.ts` and `tests/sceneHooksDom.test.ts` carry the new runtime and control fields.

Not verified: any browser look (line colour and weight, the halo never covering lines, label collisions at 375x667 and 1280x720, figures from the look-out view), the Developer drawer (the four switches have no drawer buttons; a `developer` place shows them nowhere, as for a switch the scene has nothing for), real star ids against the shipped star file (tests use a made-up list; the real file is read only in a browser or node with fetch of its url), `npm run check:engine-alone`, `npm run test:full`.


## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.

- `unknown-star` is thrown when the scene is built, not at the `addSkyFigures` call. The star list loads asynchronously (`loadStarCatalogue` fetches a JSON url), so no synchronous table exists at the call. The call checks every shape synchronously (`bad-sky-figure`, `duplicate-id`); a figure with a star end is placed in the definition's `prepare` (`ready` rejects, as `out-of-span` does), through the one internal lookup `starIdsOf` (`assets/sky.ts`, T-294), and the star list is read only when some end names a star. An unreadable star list throws `missing-data` there. A host that wants the check earlier awaits `ready`. Design.md: Scene and host-link split, error codes.
- New scene-to-viewer contract: `ExperienceDefinition.skyFigures` (EQJ unit-direction segments per figure, filled in `prepare` when stars are needed), `SceneRuntime.skyFigures`, `SceneControls.skyLines` (four booleans, replaced on a switch), `ViewerControl.skyFigures` (read by the handle). `src/api/` now imports `app/skyFigures` (added to the `apiImports` allowlist with a reason).
- Drawing: `SkyFiguresView` is a sibling of `SkyView`, not part of it: it lives on the last render pass (`TRACK_LAYER`) with depth test on and depth write off, so bodies in front hide it and the Sun's halo (an earlier pass, no depth) never does. It is built for every scene (empty when nothing is added) so the two circles work without figures. The hidden-sky look (`skyVisible: false`) does not hide it.
- Labels: sky labels are extra entries of `SceneLabelLayer` (an optional third constructor argument and an optional `sky` argument of `update`), not a second layer. They are projected from the camera's position along their direction at the sky's distance, and rank below every object label. The `labels` display switch does not hide them; their own kind switch does.
- Display switches: `DISPLAY_SWITCH_IDS` gained `skyFigures`, `skyBoundaries`, `ecliptic`, `celestialEquator`; `SwitchBindings` gained `skyLines`. The figures and outlines switches apply only when the scene has that kind; the circles always apply. The Developer drawer has no button for them.
- The ecliptic is the engine's own `eclipticJ2000ToEqjMatrix` (no second obliquity constant). Colours: `SKY_LINE_COLOURS` in `src/app/skyFigures.ts`, for T-296 to replace.
- Gate machinery: the migration-table test compares unions in a fixed order (see Technical Evidence); a `unitless` allowlist entry for `star` awaits owner approval.

Coordinator, 2026-11-10: owner approved the `star` unitless entry ("Approve it", recorded as `approved` in `packages/astraeus-site/tests/apiTypeLint.allowlist.json`); `npm test` re-run from the repo root: 239 files, 3473 passed, 2 skipped. Gates now all pass.
