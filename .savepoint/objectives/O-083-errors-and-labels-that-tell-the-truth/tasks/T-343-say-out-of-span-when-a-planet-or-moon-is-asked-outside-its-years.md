---
id: T-343
title: Say out-of-span when a planet or moon is asked outside its years
objective: O-083
status: planned
depends_on: []
check_waiver: {task: T-343, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:22:41Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: contract
planned_reads: [packages/astraeus/src/core/timeScale.ts, packages/astraeus/src/core/planetSeries.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/src/core/chebyshevEphemeris.ts, packages/astraeus/src/core/sampledTrajectory.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/planBodySets.ts, packages/astraeus/src/api/errors.ts]
planned_writes: [packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/README.md, packages/astraeus/tests/publicErrorContract.test.ts, packages/astraeus/tests/fixtures/scenePin.json]
---

# Say out-of-span when a planet or moon is asked outside its years

## Outcome

`scene.stateOf` for a planet outside the years the planet series covers, or a moon outside the years its data covers, throws a `SceneError` with code `out-of-span` naming the body and the covered span, never a raw `TimeScaleOutOfRangeError`, `PlanetFitsUncoveredError` or `TrajectoryOutOfRangeError` (AH-04 part a: Claude CQ-5(a), Gemini SCI-04).

## User Check

None visual. `scene.stateOf("jupiter", "1949-01-01T00:00:00Z")` after `await scene.load()` throws a `SceneError` whose `code` is `out-of-span` and whose message names Jupiter and the series span.

## Done When

- In `Scene.stateOf` (`api/scene.ts`), the catalogue-source read maps: `TimeScaleOutOfRangeError` and `PlanetFitsUncoveredError` for a planet → `out-of-span` naming the planet and `planetSeriesSpan()`; `TrajectoryOutOfRangeError` from a moon's ephemeris → `out-of-span` naming the moon and the bounds the error carries; `EphemerisChunkMissingError` (inside the package's years but outside the window the scene loaded) → `bad-time` naming the loaded window, matching the body-set read at `api/planBodySets.ts:265`. `NotLoadedError` stays `missing-data`. Any other error is rethrown unchanged.
- `stateOf`'s doc comment no longer says ready-made bodies "answer at any date": it says planets answer over the planet series' years and moons over their data's years, and names `out-of-span` and `bad-time` for the two refusals.
- The `out-of-span` doc comment in `api/errors.ts` covers both the timeline and a moment asked of `stateOf`; the README error table is regenerated with `npm run api:errors` (no hand edit).
- New `tests/publicErrorContract.test.ts`: one table of public calls that must throw a `SceneError` with a stated code. This Task's rows: each of the eight non-Earth planets at 1949-01-01 and at 2046-06-01 (`out-of-span`); a fitted moon (Io) before its data span (`out-of-span`); a moon inside its package years but outside the scene's loaded window (`bad-time`); Earth and the Sun at 1949-01-01 (answers, or a coded refusal; record which). Each row asserts `instanceof SceneError` and the code, never message text (API-05). Show the planet rows failing against the current `scene.ts` first.
- Existing tests unchanged and green, including `tests/publicApi.test.ts` and the headless `load` tests. If the `stateOf` section of `tests/fixtures/scenePin.json` pins a raw error this Task replaces, regenerate it (`npx vitest run packages/astraeus/tests/scenePin.test.ts -u`) and show the diff holds only those entries; otherwise leave it untouched.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/api/scene.ts` (around `stateOf`, `#catalogueSource`, `#sunState`)
- `packages/astraeus/src/api/assembleScene.ts` (around `planetSpanError`, `planetRead`: the mount-time mapping to copy the wording from)
- `packages/astraeus/src/api/planBodySets.ts` (around `stateOf`, line ~262)
- `packages/astraeus/src/core/timeScale.ts` (`TimeScaleOutOfRangeError`)
- `packages/astraeus/src/core/planetSeries.ts` (`isPlanetId`, `planetSeriesSpan`, `PlanetFitsUncoveredError`)
- `packages/astraeus/src/core/chebyshevEphemeris.ts` (around `#checkSpan`, `EphemerisChunkMissingError`)
- `packages/astraeus/src/core/sampledTrajectory.ts` (`TrajectoryOutOfRangeError`)
- `packages/astraeus/src/api/errors.ts`
- `packages/astraeus/README.md` under `Errors` (generated table only)
- `.savepoint/objectives/O-083-errors-and-labels-that-tell-the-truth/Objective.md`

## Design References

`.savepoint/Design.md` under `Answers for sites`; under `Decisions` the `Public API shape (G-016, owner 2026-11-01)` lifecycle bullet and `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-04, API-05, API-07, ARCH-02, PROV-01, STYLE-06, STYLE-07, TEST-01..04.

## Implementation Plan

1. Write the planet and moon rows of `publicErrorContract.test.ts`; show them failing (raw errors).
2. Add one small mapping function in `api/scene.ts` (or beside `planetSpanError` in `assembleScene.ts`, exported, if that keeps one wording source) used by `stateOf`'s catalogue read.
3. Correct `stateOf`'s doc comment and the `out-of-span` code comment; run `npm run api:errors`.
4. Run the focused tests, then the gates.

## Boundaries

No change to what spans the planet series or moon packages cover, to mount-time `out-of-span` behaviour, to body-set reads, or to `addTrajectory` paths' existing `bad-time`. No new error code. Core error classes stay internal.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/publicErrorContract.test.ts packages/astraeus/tests/publicApi.test.ts packages/astraeus-site/tests/apiRules.test.ts`. Handoff: `quality_gates` in `.savepoint/config.yml`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Record for Design reconciliation (`Answers for sites`): `stateOf` refusals by cause (out-of-span for data years, bad-time for the loaded window).
