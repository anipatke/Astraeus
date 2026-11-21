---
id: T-354
title: Pin the test that shows one scene moving another's Jupiter
objective: O-084
status: done
depends_on: []
check_waiver: {task: T-354, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:08:49Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: binding
planned_reads: [packages/astraeus/tests/cold/sceneLoad.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/core/bodies/planetTrajectory.ts, packages/astraeus/vitest.setup.ts, vitest.config.ts]
planned_writes: [packages/astraeus/tests/cold/sceneMoonIsolation.test.ts]
---

# Pin the test that shows one scene moving another's Jupiter

## Outcome

A public-API test, with no viewer, reproduces AH-03 (Codex F01): after scene B loads Jupiter's moon data, scene A's `stateOf("jupiter", t)` changes by about 143 km at the same instant. The failing rows are pinned as `it.fails`, each named for the Task that fixes it, so the gates stay green until the fix lands (G-024 decision 2: "after a reproduction test is pinned").

## User Check

None visual. `npx vitest run --project cold packages/astraeus/tests/cold/sceneMoonIsolation.test.ts` passes, and its report lists the `it.fails` rows naming the fix Task (draft 05).

## Done When

- New `packages/astraeus/tests/cold/sceneMoonIsolation.test.ts` in the cold Vitest project. It uses only `import("astraeus")` and a `DataSource` assembled the way `tests/cold/sceneLoad.test.ts` builds one. It stubs the network with a counting `fetch` (the `stubMoonData` pattern in `tests/twoViewers.test.ts`) that serves the installed `astraeus-data-jupiter` files under two made-up hosts (`https://a.test/`, `https://b.test/`), so two different sources can be told apart.
- "Its own answer" means the value the same scene gives when it is built and loaded alone in a fresh module graph (`vi.resetModules()`). Positions are compared exactly (`toEqual`). Rows:
  1. **A then B:** A = Sun + Jupiter, `load()` with no data; B = Jupiter + Io, `load({ data: [jupiterA] })`. A's Jupiter at 2016-06-01 matches its own answer before and after B loads. The test also records the size of the change today (expected about 143 km, as Codex measured).
  2. **B then A:** the same pair in the other order. Each scene matches its own answer.
  3. **Concurrent loads, different sources:** A (Sun + Jupiter + Io, source `a.test`, 2016 window) and B (Jupiter + Io, source `b.test`, 2020 window) load together. A's Jupiter at 2020-03-15 (outside A's own chunks) matches its own answer. Each source's chunk URLs are fetched once.
  4. **Same source, different windows:** A (Io, 2016) and B (Io, 2020) use the same source. `A.stateOf("io", "2020-03-15T00:00:00Z")` throws a `SceneError` with the same code before and after B loads. The code is `bad-time` once O-083's span mapping has landed; the test asserts `code`, never message text (API-05).
  5. **Missing package:** A loads with Jupiter data. B (Jupiter + Io) loading without data rejects with `missing-data`. C (Sun + Jupiter, no data) matches its own answer. A is unchanged.
  6. **Old scene read back:** A is read, then three more scenes load (different windows and sources). A's reads at three instants are identical to its first reads.
  7. **Shared bytes (guard, passes today):** two scenes, same source, same window. Each chunk URL is fetched at most once.
- Rows 1–6 that fail against today's code are marked `it.fails("... (fixed by: give each scene its own moon data)")`. A row that already passes stays a plain `it`, with a comment saying why. Record which rows fail today, and the size of the A then B change in km, in Technical Evidence.
- No source file changes. Existing tests unchanged and green.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/tests/cold/sceneLoad.test.ts` (the `dataSource`, `fresh`, `jupiterScene` helpers: copy the pattern)
- `packages/astraeus/tests/twoViewers.test.ts` (`stubMoonData`, lines ~209–233: the counting `fetch` stub)
- `packages/astraeus/src/api/data.ts` (`installData`: the shared install, line ~61)
- `packages/astraeus/src/core/bodies/planetTrajectory.ts` (`barycentreOffsetKm`, `planetBinding`)
- `packages/astraeus/vitest.setup.ts` and `vitest.config.ts` (projects `preloaded` and `cold`: why the test must be cold)
- `audits/2026-11-21_openai_model-unspecified_auditfindings.md` under F01 (line ~134: the probe being reproduced)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`: `Planet positions from Horizons`, `Answers for sites`, `Headless use and looks as settings`.

## Guardrails

API-03, API-05, ARCH-02, TEST-01, TEST-02, TEST-03, TEST-04.

## Implementation Plan

1. Build the source helper with a host parameter and the counting `fetch` stub.
2. Write a `baseline(build, data)` helper that loads one scene alone in a fresh graph and returns its reads.
3. Write rows 1–7. Run them against today's code and mark the failing ones `it.fails`, naming the fix.
4. Run the cold project, then the gates.

## Boundaries

Test only. No change to `src/`, `vitest.setup.ts` or any existing test. No renderer, no `mount`: viewer paths are covered in draft 05.

## Technical Verification

Focused: `npx vitest run --project cold packages/astraeus/tests/cold/sceneMoonIsolation.test.ts`. Handoff: `quality_gates` in `.savepoint/config.yml`. No browser run.

## Technical Evidence

Done When -> evidence (all in `packages/astraeus/tests/cold/sceneMoonIsolation.test.ts`, cold project; focused run: `npx vitest run --project cold <file>`):

| Done When | Evidence |
|---|---|
| New cold test, public API only, counting fetch over two hosts | file uses `import("astraeus")`, `source(host)` (a.test/b.test) and a counting `fetch` stub serving the installed astraeus-data-jupiter files |
| Row 1 A then B | `it.fails` (fails today): A's Jupiter at 2016-06-01 moved **143.2 km** after B loads (matches Codex ~143 km) |
| Row 2 B then A | `it.fails` (fails today): A differs from its own answer |
| Row 3 concurrent, different sources | `it.fails` (fails today): A's Jupiter at 2020-03-15 differs from its own answer (about 38 m in y) |
| Row 4 same source, different windows | `it.fails` (fails today): A.stateOf("io", 2020-03-15) throws before B loads, answers after (`no error`); asserts `code` `bad-time`, never message |
| Row 5 missing package | passes today, plain `it` with comment (guard for the fix) |
| Row 6 old scene read back | passes today, plain `it` with comment (guard) |
| Row 7 shared bytes | passes today, plain `it` (guard) |
| No src change, existing tests green | only the new test file changed; full gate below |

Failure output was shown with `it.fails` temporarily plain: rows 1-4 failed with the diffs above; rows 5-6 passed so they stay plain.
Gates (under flock): lint, typecheck (one TS2345 fixed in the test's `km` helper), build, test: 303 files passed, 5031 tests passed, 4 expected fail, 2 skipped.
Limitations: rows 5 and 6 do not reproduce a leak today (Jupiter reads in 2016 are unaffected by those later loads); they guard the fix only. No extra reads beyond the Context Files.

## Drift Notes

None.

Coordinator (orchestrate-g024-20261121): hand-off gates green (lint, typecheck, build; `npm test` 303 files, 5031 passed, 4 expected-fail, 2 skipped). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
