---
id: I-211
title: A scene holding Ceres silently drops its auto line stretches once the planet series are loaded
type: defect
status: resolved
source:
  kind: check
  check: C-226
  actor: {role: checker, session: check-o102-20261127}
  at: '2026-11-27T00:50:00Z'
tasks: [T-467]
checks: [C-226, C-227]
guardrail_ids: [TEST-01, API-03]
severity: medium
resolution:
  disposition: verified
  check: C-227
  actor: {role: checker, session: recheck-o102-20261127}
  at: '2026-11-27T01:14:00Z'
  reason: 'C-227 CLEAR: Proof Needed met independently. Own throwaway probe (cold and preloaded projects, deleted after): Ceres scene with an auto path near Ceres (days 20-29) and Earth (days 40-49), orbit lines, a clump group and fitOrbit(ceres), built twice plus interleaved builds: stretches sun/ceres/sun/earth/sun on every build, equal to each other; no-Ceres reference sun/earth/sun; farthestKm 446,702,085 km vs independent sampled max 446,702,109 km; paths ceres/earth/jupiter-orbit with no duplicates. The same probe fails on edd5411e (preloaded build 1, cold build 2). planPaths.ts/planCamera.ts changes judged in scope (the two reads the Issue names).'
history:
  - at: '2026-11-27T00:50:00Z'
    actor: {role: checker, session: check-o102-20261127}
    kind: observed
    note: 'C-226 probe (throwaway vitest file in packages/astraeus/tests/cold, no setup preload, deleted after): scene = sun, earth, ceres, timeline 2026-01-01..2026-02-20, `addTrajectory({ id: "probe", center: "sun", samples (50 daily), lineFixedTo: "auto" })`; `definitionOf(scene, [dataSource])` then `await prepare()`, read `trackedBodiesOf(def)[0].lineFixedTo`. First scene in the process: `[{"body":"sun",...}]`. The same scene built again after that (planet series now loaded): `undefined`, no error. The same second build without Ceres: `[{"body":"sun",...}]`. The same in the `preloaded` project (planet series loaded by setup) on the first build: `undefined`.'
    check: C-226
  - at: '2026-11-27T00:59:00Z'
    actor: {role: executor, session: repair-o102-c226-20261127}
    kind: repair_attempted
    note: 'Root cause repaired (T-467 scope, evidence in T-467 "Repair after C-226"): setup reads decided "read now" by the process-wide `planetSeriesLoaded()`, but a package body''s series is per scene and arrives in `prepare`''s `installData`. `assembleScene` now computes one `statesIn = planetSeriesLoaded() && !awaitsBodyPositions(data, ids, catalogue)` and hands it to `autoPaths`, `fitFarthestKm`, `earlySunPaths` and `lateGroups`; when false every such read is made in `prepare` after `installData`. The `NotLoadedError` swallow in `deferredRead` is removed (a not-loaded error at build time is a real fault again, which also settles C-226''s moon-fit note) and its comment corrected. Proof: `tests/ceresDeferredReads.test.ts` (preloaded) and `tests/cold/ceresDeferredReads.test.ts` (cold, fresh graph per row), one shared table, each row built twice in one process via `definitionOf` + `prepare`: Ceres holding no sample gives `[{sun, whole span}]`, equal to the same scene without Ceres; samples 20,000 km from Ceres on days 20-29 give `[sun, ceres, sun]` with the Ceres stretch opening at day 20; `camera.fitOrbit(ceres)` gives `farthestKm` between 2.5 and 3.1 au. 8 passed; at HEAD''s engine the 6 Ceres rows fail (preloaded on build 1, cold on build 2). Neighbours re-run: publicApiAutoStretches, publicApiSunPaths, publicApiLineStretches, sceneLoadOrder, sceneFaultOrder, lifecycle, ceresBody, tests/cold: pass. Gates: `npm test` 363 files 5787 passed 2 skipped, build, `check:pack`, `check:node-consumer` pass. Not run: a mounted viewer for the fit (no browser runs).'
  - at: '2026-11-27T01:14:00Z'
    actor: {role: checker, session: recheck-o102-20261127}
    kind: rechecked
    note: 'C-227: Proof Needed met independently. Own throwaway probe (cold and preloaded projects, deleted after): Ceres scene with an auto path near Ceres (days 20-29) and Earth (days 40-49), orbit lines, a clump group and fitOrbit(ceres), built twice plus interleaved builds: stretches sun/ceres/sun/earth/sun on every build, equal to each other; no-Ceres reference sun/earth/sun; farthestKm 446,702,085 km vs independent sampled max 446,702,109 km; paths ceres/earth/jupiter-orbit with no duplicates. The same probe fails on edd5411e (preloaded build 1, cold build 2). planPaths.ts/planCamera.ts changes judged in scope (the two reads the Issue names). Closed as verified.'
    check: C-227
---

# I-211: A scene holding Ceres silently drops its auto line stretches once the planet series are loaded

## Summary

T-467 made `deferredRead` (`packages/astraeus/src/api/assembleScene.ts:135-136`) return its fallback on `NotLoadedError`, with the comment that such a read is "read again in `prepare`, once `installData` has loaded them". That holds for the Sun-orbit lines (`prepare` re-reads them when `sunPaths` is short) but not for the two other deferred reads:

- `auto.now` (`lineFixedTo: "auto"` paths, line 186): when the planet series are already loaded at build time, `autoPaths` sets `later = false`, so `auto.settle` in `prepare` does nothing. Ceres's `NotLoadedError` (its series arrives only in `prepare`'s `installData`) is swallowed and the path's `lineFixedTo` is left `undefined`: the line is no longer fixed by sphere of influence, with no error.
- `fit` (line 187, `fitFarthestKm` for a camera fitted to a body): the same swallow gives `fit = undefined`, so `prepare`'s `fit.settle()` never runs (by reading the code; not separately probed).

The planet series are process-wide, so this happens on every mount after the first scene on a page, after `scene.load`, and when one viewer is rebuilt with a new scene: the same scene behaves differently depending on what loaded before (API-03: "one viewer rebuilt with a new scene behave as if alone"). Ceres is the first catalogue body whose positions are not in hand at build time, so the Objective introduced the case.

## Evidence

- `assembleScene.ts:135-136` (new swallow), `:185-188` (the two reads), `:340` (`auto.settle` runs only when `later`), `:349` (`if (fit !== undefined)`).
- `packages/astraeus/src/api/planPaths.ts:369-381` (`later = pending && !planetSeriesLoaded()`).
- Reproduction in the history entry.
- Missing test evidence: `tests/ceresBody.test.ts` covers `orbit: true` and the out-of-span window, but no Ceres scene with a `lineFixedTo: "auto"` path or a camera fit, and none with the planet series already loaded.

## Proof Needed

A table test, run with the planet series already loaded and also cold: a scene holding Ceres (with `astraeus-data`) and a `lineFixedTo: "auto"` path gives the same stretches as the scene without Ceres where Ceres holds no sample, and a stretch fixed to Ceres where a sample lies inside Ceres's sphere of influence; a camera fitted to Ceres gets its distance. Both through `mount` (or `definitionOf` + `prepare`) built twice in one process. Configured gates pass.
