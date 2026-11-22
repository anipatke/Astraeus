---
id: T-431
title: A failed planet or star load can be tried again
objective: O-092
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-431, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "Carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:52:00Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: retry
planned_reads: [packages/astraeus/src/core/planetSeries.ts, packages/astraeus/src/assets/sky.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/app/sceneHooks.ts]
planned_writes: [packages/astraeus/src/core/planetSeries.ts, packages/astraeus/src/assets/sky.ts, packages/astraeus/tests/planetSeriesRetry.test.ts, packages/astraeus/tests/starCatalogueRetry.test.ts]
---

# A failed planet or star load can be tried again

## Outcome

A planet-series chunk or star file that fails to load (offline for a moment, a server error) is not remembered as failed for the rest of the page's life: the next scene load or mount asks again, and a success after a failure is used (AH-39; Gemini `core/planetSeries.ts:51-54`, Codex `core/planetSeries.ts:52`).

## User Check

None visual.

## Done When

- `loadPlanetSeries()` (`planetSeries.ts` ~59–67, the `loading ??=` line ~61) clears its remembered promise when the load rejects, and still rejects that call with the original error; a later call starts a new load. Callers that are already awaiting the failed promise still see the rejection. A successful load is still made once.
- `loadStarCatalogue()` (`sky.ts` ~186–189, `starRequest` ~175) clears its remembered request when the result is `null` (the file could not be read or was not a valid star file, `fetchStarFile` ~177–183), so the next call reads again; a good catalogue is still read once.
- To make the planet-series failure testable without a network, `loadPlanetSeries` may take an internal importer argument defaulting to today's `import("./planetModels")`; it is not exported from `src/api/` and the lazy chunk split stays (the chunk is still a separate file in the example build: check the build output names).
- New `tests/planetSeriesRetry.test.ts` (fresh module per case with `vi.resetModules()` and a dynamic import of `planetSeries`): first load fails, so the call rejects with that error and `planetSeriesLoaded()` is false; second load succeeds, so it resolves and the span is readable; two calls during one pending load share it; after success a third call does not import again.
- New `tests/starCatalogueRetry.test.ts` (fresh module per case; `fetchBytesOf` from `core/readBytes`, the reader `sky.ts` imports at ~4, mocked to fail once then return a valid tiny star file): first call gives `null`; second gives the catalogue; a third does not read again.
- A note in Technical Evidence on browsers: clearing the promise is what the engine controls; whether a browser re-fetches a dynamic `import()` chunk that failed to fetch is the browser's module-map rule. Record what current Chromium does (from its documentation or the HTML spec issue, no browser run needed) and leave the code as specified either way.
- Engine size from `npm run check:pack` recorded before and after; allowance +100 B (cap 1,838,000 B raw; about 11.5 KB headroom at C-211 before O-092).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/planetSeries.ts` (~50–80)
- `packages/astraeus/src/assets/sky.ts` (`fetchStarFile`, `loadStarCatalogue` ~175–189, and the `fetchBytesOf` import ~4)
- `packages/astraeus/src/api/assembleScene.ts` (the two callers ~305 and ~356; read only)

## Design References

`.savepoint/Design.md` under `Planet positions from Horizons` and `The sky view`.

## Guardrails

ARCH-04 (core imports only core), API-03, API-05, STYLE-06, TEST-01, TEST-02.

## Implementation Plan

1. Write the retry tests; see both fail on today's code (record it).
2. Clear on rejection (planet series) and on `null` (stars).
3. Confirm the planet chunk is still split (build output) and the existing planet and sky tests pass.
4. Focused tests, size, gates.

## Boundaries

Only these two caches. Moon data is O-084's and is not touched. Body pictures are draft 02's. No retry loop or back-off inside the engine: a retry happens when the host loads or mounts again. No change to error codes or messages.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/planetSeriesRetry.test.ts packages/astraeus/tests/starCatalogueRetry.test.ts` plus the existing planet-series and sky test files found by `rg -l 'loadPlanetSeries|loadStarCatalogue' packages/astraeus/tests` that test those two functions themselves (about 28 files only mock `loadStarCatalogue`; run `hygStars.test.ts`, `firstDraw.test.ts`, `sceneHooksDom.test.ts` and `cold/sceneLoad.test.ts` among them, not all 28). Plus `npm run typecheck`, eslint (`node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js <changed files>`) and `npx prettier --check <changed files>` (builder rule 7). Size: `npm run check:pack`. Check the planet chunk split with `npm run build` (this Task changes how a lazy chunk is imported). No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
