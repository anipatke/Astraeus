---
id: I-212
title: Package body positions carry a test-only page-wide store and a repeated frame turn
type: drift
status: open
source:
  kind: check
  check: C-226
  actor: {role: planner, session: orchestrate-o102-20261127}
  at: '2026-11-27T00:51:27Z'
tasks: [T-465, T-467]
checks: [C-226]
guardrail_ids: [STYLE-07, API-03]
severity: low
history:
  - at: '2026-11-27T00:51:27Z'
    actor: {role: planner, session: orchestrate-o102-20261127}
    kind: observed
    note: 'Captured from C-226 Observation 2 and T-465 Drift Notes during orchestration of O-102.'
---

# I-212: Package body positions carry a test-only page-wide store and a repeated frame turn

## Summary

Two small cleanups left by O-102, neither a user-visible fault:

1. `processMoonData` (`packages/astraeus/src/core/moonData.ts`, T-467) is a process-wide series store that `packageSeriesBinding` reads only when no scene data is passed. C-226 found no host path that reaches it; it exists so `packages/astraeus/tests/bodyMarkers.test.ts` (a scene-less resolver over every built-in body) can resolve Ceres, filled by `vitest.moons.setup.ts`. Shipped code that only a test needs, and a page-wide store beside the per-scene rule (API-03).
2. `packageSeriesBinding` (`packages/astraeus/src/core/bodies/planetTrajectory.ts`, T-465) repeats the astronomy adapter's ecliptic-to-equatorial turn (about 3 lines) instead of sharing it (STYLE-07).

## Evidence

C-226 Observation 2; T-465 Technical Evidence open point 1 and Drift Notes.

## Proof Needed

`processMoonData` is gone from `src` and `bodyMarkers.test.ts` still passes with its assertions unchanged (resolving through a scene-bound catalogue or an equivalent the owner approves, since that test's setup would change); the ecliptic-to-equatorial turn exists once and both the adapter and the package binding use it, with planet and Ceres positions unchanged (existing fit tests pass unedited). Configured gates pass.
