---
id: I-196
title: Orbit-set lines stop catching up while the clock is paused, so stale paths keep a straight chord at their head
type: defect
status: resolved
resolution:
  disposition: verified
  check: C-206
  actor: {role: checker, session: recheck-o087-20261122}
  at: '2026-11-22T02:19:15Z'
source:
  kind: check
  check: C-205
  actor: {role: checker, session: check-o087-orchestrator-20261122}
  at: '2026-11-22T02:03:31Z'
tasks: [T-398]
checks: [C-205, C-206]
guardrail_ids: [TEST-01]
severity: low
history:
  - at: '2026-11-22T02:03:31Z'
    actor: {role: checker, session: check-o087-orchestrator-20261122}
    kind: observed
    note: 'C-205 probe: 30-path made-up set, sync at T, then T + 12 h (18 paths left stale past the per-frame budget of 12), then 10 more syncs at the same time. main: 18 paths re-sampled during the paused frames, worst head chord 27,872 km -> 1,050 km. O-087: 0 re-sampled, chord stays 27,872 km.'
    check: C-205
  - at: '2026-11-22T02:14:12Z'
    actor: {role: executor, session: repair-o087-c205-20261122}
    kind: repair_attempted
    note: 'OrbitSetView.sync keeps a #backlog flag (set when the per-frame budget runs out with a path still a step or more behind, cleared on each full sync); the unchanged-input early-out (#nothingToDo, was #sameAsLast) skips only when no path is stale. New orbitSetSync.test.ts cases (30 paths, 12 h step, 10 paused syncs): red on the old code (18 stale, 0 re-sampled), green after (every head gap within one fine step; then 0 source reads in an unchanged frame). Gates green; check:pack 1,836,247 B raw.'
  - at: '2026-11-22T02:19:15Z'
    actor: {role: checker, session: recheck-o087-20261122}
    kind: rechecked
    note: 'C-206: repair proven. New orbitSetSync.test.ts backlog case fails on 994ce09e OrbitSetView.ts and passes on 89f0deaf; independent probe (3 play steps, hidden 5 frames, shown, paused) reaches 0 source reads within 4 frames with every head within one fine step; unchanged-frame early-out kept; orbitSetSync, plutoOrbitLines, bodySet and check:pack pass.'
    check: C-206
---

# I-196: Orbit-set lines stop catching up while the clock is paused

## Summary

`OrbitSetView.sync` re-samples stale paths a few per frame (`ORBITS_PER_FRAME` = 12, `packages/astraeus/src/app/OrbitSetView.ts:358-368`). O-087 T-398 added an unchanged-input early-out (`OrbitSetView.ts:345`, `#sameAsLast`), and it also skips that catch-up. If the clock stops while some paths are still waiting their turn, they stay stale for as long as the clock stays paused. The head's fine points cover only 4 steps (`HEAD_FINE_POINTS`), so a path that is more than 4 steps behind ends in a straight line from its last fine point to the body. On main the paused frames finished the catch-up within a few frames. This breaks Objective success condition "No visual change" (O-087). It is reachable on a planets page with more than 12 small-moon orbits after fast playback is paused, and it shows as soon as the camera moves while paused. It heals on the next change of time.

## Evidence

- Probe (C-205, a temporary test against O-087's and main's `OrbitSetView`): 30 made-up circular orbits (radii 50,000 to 195,000 km, GM 1e5), `sync(T)`, then `sync(T + 12 h)`, then 10 × `sync(T + 12 h)`.
  - main: 18 samples during the paused frames; worst gap between the last head point and the body 27,872 km after the step, 1,050 km after the paused frames.
  - O-087: 0 samples; the gap stays 27,872 km.
- `orbitSetSync.test.ts` "does not resample when nothing changed" uses 3 paths (under the budget), so it never has a stale path when the clock stops. No test covers this case.

## Proof Needed

- A test with more paths than `ORBITS_PER_FRAME` and a clock step that leaves paths stale. Repeated syncs at the same time must finish re-sampling them, so every head ends within its fine-point reach of the body, just as main did. Once nothing is stale, an unchanged frame must still do 0 source reads (keep T-398's early-out and its existing cases).
- `orbitSetSync.test.ts`, `plutoOrbitLines.test.ts` and `bodySet.test.ts` pass unchanged; the engine size check passes.
