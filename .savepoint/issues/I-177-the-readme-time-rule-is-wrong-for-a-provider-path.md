---
id: I-177
title: The README time rule is wrong for a provider path
type: defect
status: open
source:
  kind: check
  check: C-178
  actor: {role: checker, session: o072-check-20261112}
  at: '2026-11-12T12:22:30Z'
tasks: [T-312]
checks: [C-178]
guardrail_ids: [API-07]
severity: low
history:
  - at: '2026-11-12T12:22:30Z'
    actor: {role: checker, session: o072-check-20261112}
    kind: observed
    note: Found by the O-072 Full Objective Check probe of the README time and provider facts against the public API.
    check: C-178
---

# I-177: The README time rule is wrong for a provider path

## Summary

O-072 Success Condition 2 asks the README to state "that times are whole Unix milliseconds and what a fractional one throws" and "a provider's `stateAt(timeUtcMs, center?)` contract (when `center` is passed ...)". The README sentences T-312 added (`packages/astraeus/README.md` line 86, `scene.addTrajectory` row) say:

- "Times the engine is asked about (`stateOf`, a provider's `stateAt`) are whole Unix milliseconds: a fractional or out-of-range number throws a plain `RangeError`".
- "The engine calls `stateAt` with whole-millisecond times inside `bounds`, sometimes with `center` (the path's centre body id, when it plans the line and checks its reach) and sometimes without it".

For a `provider` path neither holds: `scene.stateOf(pathId, fractional)` does not throw, and it calls the host's `stateAt` with the fractional time, passing `center`. The README is accurate for bodies and `samples` paths only.

## Evidence

Probe through the public `Scene` (scratch vitest file, run 2026-11-12 on HEAD 8f9ec36c, then deleted):

| Call | Expected (README) | Actual |
|---|---|---|
| `stateOf("earth", T0 + 0.5)` | `RangeError` | `RangeError` (matches) |
| `stateOf("moon", T0 + 0.25)` | `RangeError` | `RangeError` (matches) |
| `stateOf(samplesPath, T0 + DAY + 0.5)` | `RangeError` | `RangeError` (matches) |
| `stateOf(providerPath, T0 + DAY + 0.5)` | `RangeError`; `stateAt` only sees whole ms | no throw; the provider's `stateAt` received `1767312000000.5` with `center: "earth"`, and the returned State carries `timeUtcMs: 1767312000000.5` |

Source: `packages/astraeus/src/api/scene.ts` 555-562 (`stateOf` converts with `toUtcMs`, which only rejects non-finite values, then calls `trajectory.stateAt(timeUtcMs, entry?.center ?? ...)`); `packages/astraeus/src/api/planPaths.ts` 101 (the provider wrapper forwards `timeUtcMs` and `center` to the host's `stateAt` without `assertUtcUnixMs`, and `rotatedState` returns an EQJ State as given). The `center` list is also incomplete: `stateOf` passes `center` too (scene.ts 562), not only line planning and the reach check.

Consequence: a host that writes its provider to the README contract (whole-millisecond times, for example a table indexed by millisecond) can be handed a fractional time by `stateOf`; and a host relying on the documented `RangeError` to catch an unrounded Julian-date conversion gets no error on a provider path. Low likelihood (needs a provider path plus an unrounded host time), low impact (documentation; no wrong State for a well-behaved provider).

Missing test evidence: T-312 verified the time rule at `assertUtcUnixMs` only; no test drives `stateOf` on a provider path with a fractional time.

## Proof Needed

Either the README `addTrajectory` row states the provider-path behaviour exactly (what `stateOf` does with a fractional time on a provider path, and every case in which the engine passes `center`), or the engine rejects a fractional time before it reaches a provider so the existing sentence holds. In both cases a table test drives `scene.stateOf` with a fractional time on a body, a `samples` path and a `provider` path and asserts each outcome the README states (thrown error type, or the time the provider receives). I-176 (the error type) stays separate.
