---
id: I-072
title: The new arc-head orbit-look test times out under the full gate
type: defect
status: resolved
source:
  kind: check
  check: C-098
  actor: {role: checker, session: o038-full-check-20261022}
  at: '2026-10-22T20:46:00Z'
tasks: [T-144]
checks: [C-098, C-099]
severity: medium
resolution:
  disposition: verified
  check: C-099
  actor: {role: checker, session: o038-full-recheck-20261022}
  at: '2026-10-22T21:02:00Z'
  reason: 'The arc-head case now runs 60 frames at 12 h (same 30 days, same per-frame bounds): 1.58 s in this recheck''s npm run test:full junit.xml (T-148: 1.68 s, two consecutive passes), against the 5000 ms limit; full gate 1502 passed, 1 skipped.'
history:
  - at: '2026-10-22T20:46:00Z'
    actor: {role: checker, session: o038-full-check-20261022}
    kind: observed
    check: C-098
    note: First fresh npm run test:full of the O-038 Full Objective Check failed on this one case; the second passed with it at 4665 ms of its 5000 ms limit.
  - at: '2026-10-22T21:02:00Z'
    actor: {role: checker, session: o038-full-recheck-20261022}
    kind: rechecked
    check: C-099
    note: 'The arc-head case now runs 60 frames at 12 h (same 30 days, same per-frame bounds): 1.58 s in this recheck''s npm run test:full junit.xml (T-148: 1.68 s, two consecutive passes), against the 5000 ms limit; full gate 1502 passed, 1 skipped.'
---

# I-072: The new arc-head orbit-look test times out under the full gate

## Summary

T-144 added `tests/orbitLook.test.ts` "keeps the arc head on its body and the arc free of chords through load, seeks and fast playback (head gap under 0.002, longest segment under 0.1 of the orbit)" (line 292). It runs 240+ frames of the real path view and has no timeout of its own, so it runs under Vitest's default 5000 ms. Under the full gate (coverage instrumentation, all files in parallel) it sits at or over that limit:

| Run (C-098, 2026-10-22 UTC) | Command | Case time | Result |
|---|---|---|---|
| 20:39:45 to 20:40:45 | `npm run test:full` | over 5000 ms | **FAIL**: "Test timed out in 5000ms"; 1 failed, 1499 passed, 1 skipped |
| 20:41:36 to 20:42:32 | `npm run test:full` | 4665 ms | pass |
| 20:42:50 | `npm test` (junit) | 2408 ms | pass |
| alone | `npx vitest run tests/orbitLook.test.ts` | 1271 ms (2638 ms with coverage) | pass |

One failure in two fresh full-gate runs. This is the timing-under-load failure O-038 set out to remove (Objective, Why), moved from the browser into the full gate, and it makes Success Condition 6 ("typecheck, build, lint and test pass") hold only by chance at each Full Objective Check.

## Evidence

`tests/orbitLook.test.ts:292` (no timeout argument); `vite.config.ts` sets no `testTimeout`. C-098 gate logs (checker scratch): the first `test:full` output, "FAIL tests/orbitLook.test.ts > a composition path's orbit look > keeps the arc head ... Error: Test timed out in 5000ms".

## Proof Needed

The case runs with a clear margin under the full gate: either fewer frames for the same claim, or an explicit, justified timeout on that case. Then `npm run test:full` passes, with that case's time recorded from `junit.xml`, and a recheck of O-038.
