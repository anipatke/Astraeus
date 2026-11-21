---
id: T-343
title: Say out-of-span when a planet or moon is asked outside its years
objective: O-083
status: done
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

Done When -> evidence:
- stateOf mapping (planet -> out-of-span via planetSeriesSpan; moon TrajectoryOutOfRange/TimeScaleOutOfRange -> out-of-span with the body's bounds (else the series span); EphemerisChunkMissingError -> bad-time naming the loaded window; NotLoaded -> missing-data; others rethrown): `Scene.#catalogueRefusal` in api/scene.ts; rows in tests/publicErrorContract.test.ts (7 planets x 2 dates, Io before data, Io outside loaded window). Before the change 16 of 17 rows failed with raw TimeScaleOutOfRangeError; after, 17/17 pass.
- Doc comment: stateOf comment rewritten (planets over series years, moons over data years, out-of-span and bad-time named).
- errors.ts out-of-span comment widened; README table regenerated with `npm run api:errors` (one row changed).
- Earth and the Sun at 1949-01-01: they ANSWER (no cut-off); recorded as a test row asserting no throw.
- Existing tests unchanged. scenePin.json regenerated (`npx vitest run packages/astraeus/tests/scenePin.test.ts -u`): the stateOf section pinned raw EphemerisChunkMissingError for moons at not-loaded chunks; diff (66+/44-) holds only those entries, now SceneError bad-time (checked: no other changed lines).
- apiRules API-05 scan: first run flagged `throw cond ? mapped : error`; restructured to a SceneError-returning helper plus a plain rethrow; green.
Note: the planet-series span for the eight planets is tested with seven non-Earth planets plus Earth separately (Earth is not a planet-series body); the task text said "eight non-Earth planets" but there are seven non-Earth planets in the catalogue's PLANETS set used (mercury, venus, mars, jupiter, saturn, uranus, neptune).
Gates (flock): lint clean, typecheck clean, build ok, full test run: 4939 pass / 7 fail; remaining after my fixes: apiSurface lock (needs `npm run api:lock` + CHANGELOG line for the widened out-of-span comment; lock file not in my planned writes, left for the coordinator) and astraeusSceneConsole.test.ts (4 tests, another Task's React default, not mine). Files changed: api/scene.ts, api/errors.ts, README.md, tests/publicErrorContract.test.ts (new). Extra reads: none beyond Context Files.

## Drift Notes

`stateOf` refusals by cause: out-of-span for data years (planet series; moon data), bad-time for a moon's moment outside the loaded window; Earth and Sun have no cut-off. Reflect in Design `Answers for sites`.

Coordinator (orchestrate-g024-20261121): with T-343, T-347, T-348, T-351 and T-352 all in the tree and no builder running, the coordinator ran `npm run api:lock` (one-line lock change: the widened `out-of-span` comment) and the hand-off gates: lint, typecheck, build ok; `npm test` 296 files, 4946 passed, 2 skipped, 0 failed. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
