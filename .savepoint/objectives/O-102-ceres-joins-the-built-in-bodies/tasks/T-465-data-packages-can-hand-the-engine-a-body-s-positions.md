---
id: T-465
title: Data packages can hand the engine a body's positions
objective: O-102
status: done
check_waiver: {task: T-465, reason: 'Owner said "orchestrate O-102" (G-028, 2026-11-27): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o102-20261127}, recorded_at: '2026-11-27T00:00:58Z'}
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g028-20261127}
lane: engine
planned_reads: [packages/astraeus/src/api/data.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/src/core/planetSeries.ts, packages/astraeus/src/core/chebyshevEphemeris.ts, packages/astraeus/src/core/bodies/outerPlanets.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/api/data.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/src/core/moonData.ts, packages/astraeus/src/core/bodies/planetTrajectory.ts, packages/astraeus/tests/bodyPositionsData.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/CHANGELOG.md]
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

### History
- First stop (build, before any code change): a planned write was missing. The loaded series has to reach the body's binding separately for each scene (API-03), and that store has to sit in core in the first download. `src/api/data.ts` is api, which core cannot import (ARCH-04), and `src/core/planetModels.ts` is the lazily loaded chunk. The coordinator added `src/core/moonData.ts` and `src/core/bodies/planetTrajectory.ts` to planned_writes (note below).
- Second stop (build): the first download went over the engine raw cap by 414 B. The owner raised the cap by 1,500 B (note below).

### Extra reads (path, section, reason)
- `src/core/astronomyAdapter.ts` (whole) and `src/core/bodies/planetTrajectory.ts` (whole): how planets read their series and become a trajectory.
- `src/core/moonData.ts` (whole): the per-scene channel a binding receives.
- `src/api/bodies.ts` lines 1-40 and `src/api/planBodies.ts` lines 160-200, 300-370: the existing `requires` -> `missing-data` path.
- `src/api/assembleScene.ts` lines 300-345: where installData runs.
- `src/core/chebyshevSeries.ts` lines 40-160 and `tools/import/chebyshevFit.ts` lines 120-160: the chunk format and its encoder, used for the test series.
- `src/core/stateResolver.ts` lines 80-110: how the revision count clears the state cache.
- `src/core/twoBodyAdapter.ts` lines 1-80: looking for an existing ecliptic-to-EQJ helper.
- `.savepoint/Guardrails.md` ARCH/API/STYLE rows.
- `packages/astraeus-data/data/positions/ceres.json` (keys only): to confirm T-464's file shape matches the member. Not used by the test.
- `packages/astraeus-site/tests/releaseBreaks.test.ts` lines 89-125: the open-section heading rule.
- `packages/astraeus/CHANGELOG.md` top section, and the git history of its open-section heading.

### Done When -> evidence
| Done When | Evidence |
|---|---|
| New optional member checked by `checkDataSources` (malformed -> `bad-data` naming the field); read by `installData` only for bodies in the scene; body from a package with the package absent -> `missing-data` naming it at `mount`, no new code | `tests/bodyPositionsData.test.ts` rows "malformed member" (`bad-data`, message has `bodyPositions.tarn`), "malformed series" (`bad-data`), "body not in scene" (loader called 0 times), "body in scene without its package" (`missing-data`, "tarn needs the astraeus-data-tarn package", through the existing `BodyRef.requires` / `BodyPlan.checkData` that `assembleScene` runs at mount). `SceneErrorCode` unchanged (`src/api/errors.ts` untouched). |
| The loaded series feeds the same Chebyshev evaluator the planets use; nothing duplicated | `createSeriesModel` in `planetModels.ts` is the one decode: `createPlanetModels` now calls it for every planet (`planetFits.test.ts`, `outerPlanetFits.test.ts`, `planetFitErrors.test.ts`, `planetAccuracyFlybys.test.ts` pass unchanged), and `installData` calls it for package bodies (row "valid": 1 au, then 2 au, across two segments). One known duplication: the ecliptic-to-EQJ turn (Drift Notes). |
| New `bodyPositionsData.test.ts`, one table: absent member, valid, malformed, body not in scene, body in scene without package | 6 rows (malformed split into member and series), 6 passed. |
| `measure:example` first download unchanged; API lock regenerated last; one CHANGELOG bullet under the open version | Superseded by the owner decision (coordinator note below): first download 1,845,723 / 529,235 before, 1,846,414 / 529,484 after (+691 raw, +249 gzip), within the raised `ENGINE_LIMIT` 1,847,500 / 530,000 (`checkEngineBudget()` ok:true). `npm run api:lock` run last: +1 member `bodyPositions` in the lock. CHANGELOG: open section `## 0.13.0 (unreleased)` with one Added bullet and `### Breaking changes in 0.13.0`: None. |
| Engine/demo test hits for the changed modules, `apiImports.test.ts` and `packageBoundaries.test.ts` pass; existing tests unchanged | See the vitest runs below. No existing test file was changed. |

### Commands and results (final)
- `npm run typecheck`: 0 errors.
- `eslint` (use-typescript6) on `src/api/data.ts`, `src/core/planetModels.ts`, `src/core/moonData.ts`, `src/core/bodies/planetTrajectory.ts`, `tests/bodyPositionsData.test.ts`: exit 0. `prettier --check` on those files plus CHANGELOG and the lock: clean.
- `npx vitest run` on every test file under `packages/*/tests` that imports `api/data`, `planetModels`, `moonData`, `planetTrajectory` or `planetSeries` (31 existing files plus the new one), plus `packages/astraeus/tests/apiImports.test.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts` and `packages/astraeus/tests/layerRule.test.ts`: 35 files, 667 passed.
- After `api:lock`, `packages/astraeus-site/tests/{apiRules,apiSurface,releaseBreaks,publicBuild}.test.ts`: 4 files, 57 passed.
- `npm run measure:example`: first-open total 1,846,414 raw / 529,484 gzip.

### Files changed
`packages/astraeus/src/api/data.ts`, `packages/astraeus/src/core/planetModels.ts`, `packages/astraeus/src/core/moonData.ts`, `packages/astraeus/src/core/bodies/planetTrajectory.ts`, `packages/astraeus/tests/bodyPositionsData.test.ts` (new), `packages/astraeus/api-surface.lock.json`, `packages/astraeus/CHANGELOG.md`.

### Limitations
- The series type is inlined as `Promise<object>`, not a named exported `BodySeries`. A named type has to be exported from `src/api/index.ts` (the API-01 reachable-type check), and that file is outside planned_writes. The member's doc text describes the format instead.
- `packageSeriesBinding` is not in the first download until T-467 uses it, so T-467 adds its bytes.
- Outside the fitted years, a package body throws `PlanetFitsUncoveredError`. `scene.stateOf` then reports `out-of-span` with the built-in planets' years (`planetSeriesSpan()`), not the body's own. T-467 should check this for Ceres.
- The changelog version `0.13.0` (minor, because a public member was added) is my choice; the coordinator or release decides it.

## Drift Notes

Name the chosen member and its doc text; T-468 reconciles Design.md from it.

- **Member:** `DataSource.bodyPositions?: Readonly<Record<BodyId, () => Promise<object>>>`. Doc text: "Positions of Sun-circling bodies by body id, each read (once per scene) only when the scene holds that body. A loader resolves to the JSON file in the planet-fit format of the engine's own planets: `format`, `timeScale` and the body's fit under `planets.<id>`; the engine checks all of it (`bad-data` if it does not fit)." Why this shape: a per-id map of loaders, in the same style as `moonPositions.loadIndex`/`chunkUrls`, checkable without calling anything; `installData` calls only scene bodies' loaders; it does not overlap `provides`. The planned `BodySeries` named type was dropped (see Limitations).
- **Hook for T-467:** the body's one binding is `packageSeriesBinding(id, rotation)` (`src/core/bodies/planetTrajectory.ts`). It places the body Sun-centred from the scene's `moonData.series(id)` and throws `NotLoadedError` (public `missing-data`) until loaded. Its `BodyRef` names the package (`ref("ceres", "Ceres", "astraeus-data")`), so `mount` without the package gives `missing-data` naming it. The data package sets `bodyPositions: { ceres: () => import(".../positions/ceres.json") }` (T-464's file already has the right shape).
- **Per-scene store:** `MoonDataSelection.series(body)` / `provideSeries(body, model)` in `src/core/moonData.ts`. Providing a series bumps `revision()`, so the resolver cache clears. `installData` loads `planetModels` lazily and decodes with `createSeriesModel`, the planets' own reader.
- **Design.md (T-468):** under "Planet positions from Horizons", note that Sun-circling bodies outside the built-in eight arrive as planet-fit files through `DataSource.bodyPositions` and are read lazily per scene.
- **Follow-up (coordinator will capture it):** `packageSeriesBinding` repeats the astronomy adapter's ecliptic-J2000 -> EQJ turn (orb `makeState`/`transform`, about 3 lines), because `astronomyAdapter.ts` was not a planned write. The general fix is an adapter method that takes a `PlanetModel`.
- **Engine cap:** raised by the owner to 1,847,500 raw (coordinator note below).

Coordinator replan note (orchestrate-o102-20261127, 2026-11-27): builder's REPLAN finding accepted as a file-scope gap, not a design change. Added `packages/astraeus/src/core/moonData.ts` (per-scene series store, API-03) and `packages/astraeus/src/core/bodies/planetTrajectory.ts` (one general Sun-centred package-series binding T-467 uses) to planned_writes. Member shape `bodyPositions?: Readonly<Record<BodyId, () => Promise<BodySeries>>>` and `createSeriesModel` factoring approved as proposed.

Coordinator (orchestrate-o102-20261127, 2026-11-27): owner chose "Raise by 1,500 bytes" for the engine first-download raw cap. `ENGINE_LIMIT` raised to 1,847,500 raw / 530,000 gzip in `packages/astraeus-site/tools/validate/engine-budget.mjs` (dated comment) and `packages/astraeus-site/tests/publicBuild.test.ts`. Success condition "first download unchanged" is superseded by this owner decision for the check/install code; Ceres's series itself stays out of the first download.

Marked done by the coordinator under the owner's "orchestrate O-102" (2026-11-27) after the wave gate passed at 2026-11-27T00:18Z: `npm run typecheck`, `npm run lint`, `npm test` 360 files 5754 passed 2 skipped, `npm run build`, `npm run check:pack` (engine 1,846,414 raw / 529,484 gzip within 1,847,500 / 530,000).
