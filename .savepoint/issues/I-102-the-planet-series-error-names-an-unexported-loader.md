---
id: I-102
title: 'The planet-series error names a loader that is not exported'
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: voyager-feedback-20261030}
  at: '2026-10-30T20:08:15Z'
severity: medium
history:
  - at: '2026-10-30T20:08:15Z'
    actor: {role: planner, session: voyager-feedback-20261030}
    kind: observed
    note: 'Reported from the Voyager downstream app (astraeus@0.3.0 from npm, public API only, JPL Horizons data), pasted by the owner.'
---

# I-102: The planet-series error names a loader that is not exported

## Summary

`stateOf("jupiter")` before mount throws `...await loadPlanetSeries() before mounting...`, but `loadPlanetSeries` is not exported from `astraeus`. `await scene.toDefinition().prepare?.()` works but is undocumented.

## Evidence

- Confirmed in code: the message is at `packages/astraeus/src/core/planetSeries.ts:44`; `loadPlanetSeries` is not in the public exports.
- Reporter's fix: export a public loader (or `scene.prepare()`) and name it in the message and the README.

## Proof Needed

- The error names a function a package user can call, that function is exported and documented, and calling it lets `stateOf` answer for a planet before mount (test from the packed package).
