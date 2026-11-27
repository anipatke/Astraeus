---
id: T-465
title: Data packages can hand the engine a body's positions
objective: O-102
status: planned
check_waiver: {task: T-465, reason: 'Owner said "orchestrate O-102" (G-028, 2026-11-27): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o102-20261127}, recorded_at: '2026-11-27T00:00:58Z'}
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g028-20261127}
lane: engine
planned_reads: [packages/astraeus/src/api/data.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/src/core/planetSeries.ts, packages/astraeus/src/core/chebyshevEphemeris.ts, packages/astraeus/src/core/bodies/outerPlanets.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/api/data.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/tests/bodyPositionsData.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/CHANGELOG.md]
---

# Data packages can hand the engine a body's positions

## Outcome

A `DataSource` can carry positions for bodies that circle the Sun, as a lazily read series in the planet-fit format: a new optional member (working name `bodyPositions: { loadSeries(id): Promise<…> }` or a per-id map of loaders; pick the smallest shape that fits the existing `moonPositions` style and record why). `installData` reads a body's series only when the scene holds that body; the engine's first download does not grow. General for any Sun-circling body, never Ceres-named (Objective Architectural Considerations).

## User Check

None (engine step; seen through Ceres in T-468).

## Done When

- The new optional `DataSource` member is checked by `checkDataSources` (malformed → `bad-data` naming the field) and read by `installData` only for bodies in the scene; a body whose definition says its positions come from a data package and whose package is absent fails at `mount` with `missing-data` naming the package (the existing code, no new error code).
- The loaded series feeds the same Chebyshev evaluator the planets use (`planetModels.ts`/`chebyshevEphemeris.ts`); nothing is duplicated (STYLE-07).
- New `packages/astraeus/tests/bodyPositionsData.test.ts` (TEST-01, made-up body "tarn" with a small made-up series): one table across absent member, valid, malformed, body not in scene (loader never called), body in scene without package (`missing-data`).
- `npm run measure:example` first download unchanged; the API lock regenerated with `npm run api:lock` last; one CHANGELOG bullet under the open version.
- Engine/demo test hits for the changed modules (`grep -rl "data\|planetModels" packages/*/tests` scope), `apiImports.test.ts` and `packageBoundaries.test.ts` pass. Existing tests unchanged.

## Context Files

`packages/astraeus/src/api/data.ts`, `packages/astraeus/src/core/planetModels.ts`, `packages/astraeus/src/core/planetSeries.ts`, `packages/astraeus/src/core/chebyshevEphemeris.ts`, `packages/astraeus/src/api/errors.ts`. `packages/astraeus/README.md` under the heading that documents `DataSource` only.

## Design References

`.savepoint/Design.md` under `Planet positions from Horizons` and `Core layers and demos`; `Decisions` → `Public API shape`.

## Guardrails

API-01..07, ARCH-01..06, DATA-01, TEST-01..04, STYLE-07.

## Implementation Plan

1. Read how moon positions reach the engine through `DataSource` and how planet series are evaluated.
2. Choose the member shape; record it in Drift Notes.
3. Implement check, lazy install and the hook a body definition uses to say "positions come from a package".
4. Test, measure, lock, changelog.

## Boundaries

No Ceres definition (T-467), no data file (T-464), no picture.

## Technical Verification

Focused tests plus the listed boundary tests; handoff gates per `docs/agents/verification.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Name the chosen member and its doc text; T-468 reconciles Design.md from it.
