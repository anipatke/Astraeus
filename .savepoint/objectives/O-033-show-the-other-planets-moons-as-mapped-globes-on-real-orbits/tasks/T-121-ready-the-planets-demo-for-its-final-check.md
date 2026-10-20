---
id: T-121
title: Ready the planets demo for its final check
objective: O-033
status: in_progress
stage: audit
depends_on: [{task: T-120, requires: clear}]
owner_validation: {required: true}
check_waiver:
  task: T-121
  reason: Owner waived the optional Task Checks for O-033 ('waive checks for tasks one big check at end'); the Full Objective Check covers it.
  actor: {role: owner, session: 827ddc8a-e534-43b0-98b9-9af4e2acda26}
  recorded_at: '2026-10-20T13:49:17Z'
planned_by: {role: planner, session: o033-planning-20261020}
---

# Ready the planets demo for its final check

## Outcome

The planets demo has one browser check set the Full Objective Check can run, every planet's download size is within a stated limit, and Design describes what was built.

## User Check

Read the size table per planet and the check map; then look at each planet on the preview (the owner's one look, recorded).

## Done When

1. `npm run check:demo -- planets` (renaming the `jupiter` set) runs the switch, place-tap and moons-panel scenarios from T-117 to T-119 at phone and desktop sizes; every prior Jupiter scenario mapped in `docs/BROWSER_CHECKS.md`; kept short (owner rule, O-034).
2. Load budget: a stated limit per planet view, checked by `tools/validate/load-budget.mjs`; public build passes the asset validator.
3. Design reconciled for every drift note from T-114 to T-120 (reflected or non-architectural with a reason); `README` demo line updated.
4. Configured gates pass fresh; browser sets are run once, by the Full Objective Check, not here.
5. Owner validation recorded after the owner's look on the preview.

## Context Files

`tools/validate/run-demo.mjs`, `tools/validate/load-budget.mjs`, `tools/validate/public-build-assets.mjs`, `docs/BROWSER_CHECKS.md`, `.savepoint/Design.md`, `README.md`.

## Design References

Design: whole document for reconciliation.

## Guardrails

PROV-02, TEST-01, TEST-03, TEST-04.

## Implementation Plan

1. Assemble the demo set; map scenarios.
2. Budgets; reconcile Design; fresh gates; owner look.

## Boundaries

No feature work; a failure found here goes back to its Task or becomes an Issue.

## Technical Verification

Configured gates fresh; browser sets at the Full Objective Check; evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Per criterion:
1. Planets set: `tools/validate/run-demo.mjs` `planets` (the `jupiter` name kept as an alias): smoke (planets view + catalogue page), `browser-jupiter-io`, `browser-moon-panel`, `browser-jupiter-tap`, `browser-story-panels` (Jupiter), then `browser-outer-planets` and `browser-planet-switch`, which run at desktop and phone size themselves. Every prior Jupiter scenario is mapped in `docs/BROWSER_CHECKS.md`. `browser-lite.mjs` could no longer find `jupiter-io` (not in `DEFINITIONS` since T-117), so it now lists the `planets` experience; the smoke step uses `LITE_ONLY=planets`. Not run (owner rule); time unmeasured, 248 s before the two new scripts.
2. Load budget: `tools/validate/load-budget.mjs` page lists repaired from a real public build; one page set per planet view (nine); Apollo and showers gained `compositions.js`; `node tools/validate/load-budget.mjs` passes on the public build (figures below). Outer planets' index/fit-chunk limits live once in `src/experiences/planets/viewLimits.json`; `tests/planetSystems.test.ts` reads it for chunks and index, the load budget holds each outer planet's moon-index chunk to the same raw limit. The fit-chunk limit is not repeated in the budget (the build inlines small chunks as text, so a built figure is about 8% above the served one: Saturn 3.58 MB built against 3.38 MB limit). `node tools/validate/public-build-assets.mjs dist` on `ASTRAEUS_PUBLIC_BUILD=1 npm run build`: ok true, 201 files checked, self-proofs true.
   Per view (raw / gzip, limit = measurement +5% rounded up to 10,000): jupiter 6,781,196 / 4,659,946 (7,130,000 / 4,900,000); saturn 23,317,280 / 20,240,166 (24,490,000 / 21,260,000); uranus 4,090,623 / 2,396,574; neptune 4,383,685 / 2,783,384; pluto 3,822,413 / 2,289,674; mercury 2,929,628 / 1,625,051; venus 2,944,392 / 1,638,186; earth 4,203,236 / 2,882,001; mars 2,787,041 / 1,446,944; whole build 52,007,323 / 42,021,287 (54,610,000 / 44,130,000).
3. Design reconciled (`.savepoint/Design.md`): new rows (planets builder, moon-system core files, rings and catalogues, site generator), changed rows (experiences, main.tsx, tools/validate), Planets, Jupiter and Io, Moon `validUtc`, Public site (budget) and an O-033 accounting paragraph that takes each T-114 to T-120 note as reflected or non-architectural. README demo, URL, size table and check lines updated; `AGENTS.md` project rule names `planets`.
4. Gates fresh: `npm run typecheck` clean; `npm run build` built; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` 86 files, 1234 passed, 1 skipped. No browser script or set was run.
5. Owner validation: pending (the owner's look on the preview); the Task stays at `audit`.

Tidy: Earth, Mars, Mercury and Venus now share `data/stories/no-panels/panels.json` like the outer planets; their four identical empty `data/stories/<planet>/panels.json` were removed.

Files changed: `tools/validate/run-demo.mjs`, `tools/validate/browser-lite.mjs`, `tools/validate/load-budget.mjs`, `docs/BROWSER_CHECKS.md`, `AGENTS.md`, `README.md`, `.savepoint/Design.md`, `src/experiences/planets/viewLimits.json` (new), `tests/planetSystems.test.ts`, `tests/publicBuild.test.ts`, `data/planets/{earth,mars,mercury,venus}.json`, four deleted `data/stories/<planet>/panels.json`, this Task.

Extra reads (outside Context Files): the Task and Drift Notes of T-114 to T-120, `tests/planetSystems.test.ts`, `tests/publicBuild.test.ts`, `src/main.tsx`, `src/experiences/planets/systems/{saturn,pluto}.ts`, `data/planets/*.json`, `data/stories/*/panels.json`, `tools/validate/browser-lite.mjs`, `tools/validate/runner.mjs`, the two new browser scripts' headers, `data/moons/*.json` (counts), `src/core/bodies/{moonSystem,outerPlanets}.ts` heads (Design wording).

Limitations: browser sets unrun, so the planets set's run time and the two new scripts are untested; the load budget is a public-build check (a plain `npm run build` splits shared chunks differently and `load-budget` then lists them as unlisted imports, as before); Saturn is 23.3 MB raw because of seven 4k moon maps (pictures kept at original quality, owner decision 2026-10-17), flagged for the owner. Notes: the Design wording on Io's facing is from the T-116 owner note.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
