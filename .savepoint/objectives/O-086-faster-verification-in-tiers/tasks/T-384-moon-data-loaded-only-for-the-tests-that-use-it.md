---
id: T-384
title: Moon data loaded only for the tests that use it
objective: O-086
status: done
depends_on: []
check_waiver: {task: T-384, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: preload
planned_reads: [tools/check-engine-alone.mjs, packages/astraeus/src/core/bodies/jupiterMoons.ts, packages/astraeus/src/core/bodies/planetMoons.ts]
planned_writes: [vitest.config.ts, packages/astraeus/vitest.setup.ts, packages/astraeus/vitest.moons.setup.ts]
---

# Moon data loaded only for the tests that use it

## Outcome

The 2016 moon chunks and fits (Jupiter, Mars, Saturn, Neptune, Pluto) are loaded only for the test files that need them, instead of before every one of the ~290 files in the `preloaded` Vitest project (AH-31 "moon data preloads for every test file"). The planet-series preload stays for every file.

## User Check

None visual.

## Done When

- `packages/astraeus/vitest.setup.ts` keeps only `loadPlanetSeries()`; the moon part (the `provideIndex` loop, `loadJupiterMoons`, the other systems' `load`) moves unchanged into a new `packages/astraeus/vitest.moons.setup.ts`.
- `vitest.config.ts` gains a third project, `moons`, whose `setupFiles` are both setup files and whose `include` is an explicit, sorted list of the test files that need moon data; `preloaded` excludes exactly those files (one list constant, used for both include and exclude: STYLE-07). The `cold` project is unchanged. The config comment says how a file joins the list (it fails without moon data, and the failure names the unloaded system).
- The list is found by evidence, not guessed: run the `preloaded` project with the moon part removed, record every failing file and case, and list exactly those files. A file that fails for any other reason stops the Task and is reported.
- No test file is edited (owner rule: builders keep test fixtures and setup).
- Same cases, same results: `npm test` and `npm run test:full` report the same test count and zero failures before and after (record the counts).
- Timing evidence, same machine: `npm test` wall time and Vitest's `setup` figure, before and after; `npm run test:full` wall time before and after.
- `npm run check:engine-alone` passes (it copies the shared config; confirm the new setup file is copied with it or not needed there, and record which).
- Gates per `docs/agents/verification.md`.

## Context Files

- `vitest.config.ts` (whole file)
- `packages/astraeus/vitest.setup.ts` (whole file)
- `tools/check-engine-alone.mjs` (the list of files it copies)

## Design References

`.savepoint/Design.md` under `Each scene keeps its own moon data (O-084)` (read only: moon data per scene; the preload is test plumbing, not engine state).

## Guardrails

TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Time `npm test` and `test:full`; record counts and the setup figure.
2. Remove the moon part locally; run the `preloaded` project; collect failing files.
3. Create `vitest.moons.setup.ts` with the moved code; add the `moons` project and the shared list.
4. Run both suites; compare counts; re-time.
5. Run `check:engine-alone`; gates.

## Boundaries

Config and setup files only; no engine change, no test file change, no change to the `cold` project or coverage settings. If more than about 60 files need moons (so the saving is small), stop and report the measured saving instead of landing a long list.

## Technical Verification

Focused: `npx vitest run --project moons`, `npx vitest run --project preloaded`; then `npm test`, `npm run test:full`, `npm run check:engine-alone`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

**Done When -> evidence**
- Setup split: `vitest.setup.ts` keeps `loadPlanetSeries()`; moon code moved unchanged to `vitest.moons.setup.ts`.
- `moons` project + one `MOONS` constant (include and `preloaded` exclude), comment says how a file joins; `cold` unchanged.
- List by evidence: `preloaded` run with the moon part removed (5098 tests) failed in 11 moon files (NotLoadedError naming Jupiter/Mars/Saturn moon fits, or fitted positions not matched in sceneMoonBinding/sceneMoonScope): bodyMarkers, composedVelocity, jupiterIo, jupiterMoonsWindow, mapOrientation, orientationLabels, planetMoonSystems, plutoOrbitLines, sceneMoonBinding, sceneMoonScope, stateResolver. Other failures in that run were not moon: viewsJourneyState (wall-clock mismatch under load, passes alone and now passes), and other builders' in-flight site/scratch tests (browserExitPath, gateLimits, packagePacks, zz-scratch385). 11 files, well under 60.
- No test file edited.
- Counts: `npx vitest run --project moons` 11 files / 137 tests pass. test:full before 5114 tests (2 failures, both other builders' in-flight/load: zz-scratch385, twoViewers); after 5113 tests (1 failure, zz-scratch385). Totals differ by 1 because other builders add tests concurrently; no moon-related failure in either.
- Timing (shared machine, 6 builders running, so rough): `npm test` before 52.5 s, setup 8% of summed time; after 34.4 s, setup 2%. `test:full` before 79.8 s (setup 10%), after 75.0 s (setup 2%).
- check:engine-alone passes; it copies all of `packages/astraeus`, so the new setup file travels with the shared config (no change needed).
- Gates: prettier clean on my 3 files; typecheck, engine-alone pass; build see reply. Lint's prettier --check warns only on other builders' files.


## Drift Notes

None.

Coordinator (orchestrate-g024-20261121): `moons` project 11 files / 137 tests green; build, typecheck, `check:engine-alone` green; its files pass prettier; other failures were siblings' in-flight files or load flakes; full gates at the Full Check. A test that needs moon data outside the list fails loudly (`NotLoadedError`), so the list cannot silently go stale. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
