---
id: T-431
title: A failed planet or star load can be tried again
objective: O-092
status: done
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

Done When -> evidence:

| Done When | Evidence |
|---|---|
| Planet series clears on rejection, rejects with the original error, awaiting callers see it, success loads once | `loadPlanetSeries` now keeps `request`, clears `loading` in a `.catch` side branch (only if still the same request); `planetSeriesRetry.test.ts` cases 1 and 3 |
| Star catalogue clears on `null`, good catalogue read once | `loadStarCatalogue` clears `starRequest` when the result is `null`; `starCatalogueRetry.test.ts` (failed read, invalid file, third call no re-read) |
| Internal importer argument, chunk split kept | optional default arg `() => import("./planetModels")`, not exported from `src/api/`; `npm run build` still emits `dist/assets/planetModels-6bChcUPK.js` (349.73 kB) |
| New planetSeriesRetry test | fail, then succeed and span readable; two calls share one pending load; no re-import after success (3 cases) |
| New starCatalogueRetry test | `core/readBytes` mocked: null, then catalogue, then no re-read; invalid file also retried (2 cases) |
| Browser note | Clearing the promise is what the engine controls. Per the HTML spec's module map, a failed fetch of a module script is cached as a null entry (whatwg/html#6768 discusses it); Chromium has historically kept a failed dynamic `import()` in the module map for the page's life, so a re-import of the same URL may fail again without a new URL or reload. Not checked in a browser (written from memory of the spec issue, unverified); code left as specified. |
| Size | check:pack before 1,826,428 B raw / 523,400 gzip; after 1,826,394 B raw / 523,419 gzip (-34 B raw; allowance +100) |
| Gates | below |

Red first: both new test files failed 5/5 on today's code (before the source edit).

Commands: `npx vitest run` on planetSeriesRetry, starCatalogueRetry, hygStars, firstDraw, sceneHooksDom, cold/sceneLoad plus the 12 files matching `rg -l 'planetSeries|loadPlanetSeries'` (18 files, 368 tests passed); eslint (TS6 wrapper) and prettier --check on the 4 changed files clean; `npm run check:pack` pass; `npm run build` ok. `npm run typecheck`: 5 errors, all in `packages/astraeus/tests/ownedPictures.test.ts` (another builder's file, rerun once, same); none in my files.

Files changed: src/core/planetSeries.ts, src/assets/sky.ts, tests/planetSeriesRetry.test.ts, tests/starCatalogueRetry.test.ts. Extra reads: none.

Limitations: browser re-fetch behaviour not run.

## Drift Notes

None.

## Coordinator (gates)

Combined wave-1 gate with T-427, T-428, T-431, T-432 together: typecheck clean; `npm run lint` (ESLint + Prettier) clean; `npm test` 332 files, 5443 passed, 2 skipped. Engine 1,826,394 B raw (cap 1,838,000). Set done by the orchestrating session (owner: "I mark them as they pass", O-038; G-024 decision 7; owner 2026-11-22 "Carry on").
