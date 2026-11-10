---
id: T-305
title: Let apps add constellations by their short codes
objective: O-067
status: planned
depends_on: [{task: T-304, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-305, reason: 'Owner said "orchestrate O67" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o067-run-20261110}, recorded_at: '2026-11-10T08:40:31Z'}
planned_by: {role: planner, session: o067-planning-20261110}
---

# Let apps add constellations by their short codes

## Outcome

The constellations package exports a helper that turns one or many IAU abbreviations (or all 88) into ready sky figures and outlines, which an app passes to `scene.addSkyFigures`, with options for hidden-until-traced, colours and menu listing.

## User Check

None for the owner at this step; the owner looks in the last step.

## Done When

- A helper (planner suggests `constellations(abbreviations | "all", options?)` returning `readonly SkyFigureInput[]`; final name and shape follow the engine's public naming rules where they apply) builds figures with id, label (IAU name), segments, label point, and, when asked, boundary outlines (`kind: "boundary"`, Serpens as two); options: `outlines` (default off), `shown`, `color`, `labelColor`, `listed`, and an id prefix if needed to avoid clashes. It imports only public `astraeus` types from the front door (API-01). Unknown or repeated abbreviations throw a clear error naming them.
- Card fields: each figure carries `provenance` naming the data sources and licences; no facts or myths (story apps own them).
- The helper's output loads in a real scene: a package test builds a scene with the engine (`scene.check` or the headless path) adding all 88 with outlines, and it passes without `unknown-star` (every HIP end resolves).
- README documents the helper with a three-line example; the package's own types are checked; `npm run check:pack` passes with the package inside its limits; the engine's README points to the package as optional data.
- No engine change (ARCH-01).

## Context Files

`packages/astraeus-data-constellations/package.json`, `packages/astraeus-data-constellations/src/index.ts`, `packages/astraeus-data-constellations/README.md`, `packages/astraeus/src/api/skyFigureInput.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/README.md`, `docs/architecture/constellations-o067.md`, `.savepoint/objectives/O-067-ship-the-88-constellations-as-a-data-package/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Sky figures, O-065; Sky stories, O-066).

## Guardrails

API-01, API-07, ARCH-01, PROV-01, TEST-01, TEST-03, STYLE-05.

## Implementation Plan

1. Confirm the previous step's package and data exist; return REPLAN REQUIRED if not.
2. Write the helper and its option checks over the package data.
3. Tests: one, many, all, outlines, options, errors, and the all-88 scene check.
4. README; gates and pack check.

## Boundaries

No engine change; no example (next step); no facts or myths.

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack` and `npm run check:node-consumer`; no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.
