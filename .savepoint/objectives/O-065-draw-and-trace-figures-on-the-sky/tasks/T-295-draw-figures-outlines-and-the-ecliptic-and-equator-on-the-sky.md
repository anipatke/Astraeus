---
id: T-295
title: Draw figures, outlines and the ecliptic and equator on the sky
objective: O-065
status: planned
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

Pending execution.

## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.
