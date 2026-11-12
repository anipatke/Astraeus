---
id: I-176
title: A fractional time throws a plain error, not a scene error
type: guardrail
status: open
source:
  kind: report
  actor: {role: planner, session: plan-o072-20261112}
  at: '2026-11-12T11:40:00Z'
guardrail_ids: [API-05]
severity: low
history:
  - at: '2026-11-12T11:40:00Z'
    actor: {role: planner, session: plan-o072-20261112}
    kind: observed
    note: Closest Calls review F-03, confirmed in source while planning O-072; O-072 documents the behaviour and does not change it (owner, 2026-11-12).
---

# I-176: A fractional time throws a plain error, not a scene error

## Summary

Asking the scene for a time that is not a whole number of Unix milliseconds (for example `scene.stateOf(id, 1.5)`) throws a plain `RangeError` from `assertUtcUnixMs` in `packages/astraeus/src/core/state.ts` ("timeUtcMs must be an integer JavaScript UTC Unix-millisecond value"), raised through the public API. API-05 says every throw from `src/api/` is a `SceneError` with one code per cause.

## Evidence

Closest Calls review F-03 (`~/code/neo/docs/astraeus-findings.md`): a time converted from a JPL Julian date reached `stateOf` as a fractional value and threw the plain `RangeError`. Source read 2026-11-12: `assertUtcUnixMs` throws `RangeError`. O-072 documents the whole-millisecond rule and the current error in the README; changing the error type is a minor or breaking change and stays out of the additions-only 0.9.1 release.

## Proof Needed

A table test of every public call that takes a time (`stateOf` and the other `src/api/` time inputs) with a fractional and an out-of-range value, each throwing a `SceneError` with one named code; README Errors table updated.
