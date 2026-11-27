---
id: I-211
title: A scene holding Ceres silently drops its auto line stretches once the planet series are loaded
type: defect
status: open
source:
  kind: check
  check: C-226
  actor: {role: checker, session: check-o102-20261127}
  at: '2026-11-27T00:50:00Z'
tasks: [T-467]
checks: [C-226]
guardrail_ids: [TEST-01, API-03]
severity: medium
history:
  - at: '2026-11-27T00:50:00Z'
    actor: {role: checker, session: check-o102-20261127}
    kind: observed
    note: 'C-226 probe (throwaway vitest file in packages/astraeus/tests/cold, no setup preload, deleted after): scene = sun, earth, ceres, timeline 2026-01-01..2026-02-20, `addTrajectory({ id: "probe", center: "sun", samples (50 daily), lineFixedTo: "auto" })`; `definitionOf(scene, [dataSource])` then `await prepare()`, read `trackedBodiesOf(def)[0].lineFixedTo`. First scene in the process: `[{"body":"sun",...}]`. The same scene built again after that (planet series now loaded): `undefined`, no error. The same second build without Ceres: `[{"body":"sun",...}]`. The same in the `preloaded` project (planet series loaded by setup) on the first build: `undefined`.'
    check: C-226
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
