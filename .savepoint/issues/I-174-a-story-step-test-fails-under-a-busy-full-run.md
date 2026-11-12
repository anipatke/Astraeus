---
id: I-174
title: A story-step test fails when the full test run is busy
type: verification
status: resolved
source:
  kind: report
  actor: {role: executor, session: o070-run-20261112}
  at: '2026-11-12T08:23:44Z'
checks: [C-177]
guardrail_ids: [TEST-01]
severity: low
resolution:
  disposition: verified
  check: C-177
  actor: {role: checker, session: o071-recheck-20261112}
  at: '2026-11-12T11:28:00Z'
  reason: Repair proven by C-177 (CLEAR).
history:
  - at: '2026-11-12T08:23:44Z'
    actor: {role: executor, session: o070-run-20261112}
    kind: observed
    note: Seen while closing O-070; unrelated to its change (O-070 touched provider path sampling only).
  - at: '2026-11-12T11:15:12Z'
    actor: {role: executor, session: o071-repair-20261112}
    kind: repair_attempted
    note: 'Direct repair, unverified by a checker. lifecycle.test.ts story step actions: the five fixed 20 ms tick() waits are replaced by vi.waitFor on the asserted effect; no scene, input, step or expected value changed. Three npm run test:full runs under a parallel full vitest run: the story test passed in all three, but each run failed other unrelated tests (timeouts: packagePacks, loadingCoverChain, computedLook, showersMeasured, apiReference, apiRules; 8, 5, 3 failures), so a green loaded full run was not shown.'
  - at: '2026-11-12T11:28:00Z'
    actor: {role: checker, session: o071-recheck-20261112}
    kind: rechecked
    note: 'Proof Needed met, by C-177 (CLEAR): waits on the asserted effect, no assertion loosened; test:full passed alone and alongside 8 CPU-burning loops (load 13.4), story test 5/5 under 12 loops; it passed in each of the repair builder''s three loaded runs too (their failures were unrelated timeouts from two full suites at once).'
    check: C-177
---

# I-174: A story-step test fails when the full test run is busy

## Summary

`packages/astraeus/tests/lifecycle.test.ts` "story step actions (O-066 T-301) ..." waits for each step's effects with a 20 ms wall-clock `tick()` (line 43). Under a loaded machine during `npm run test:full` the final assertion (closing the step clears its trace, about line 554) sees `skyTraces` empty. A red full gate that is not a real fault weakens every Full Check.

## Evidence

- 2026-11-12, branch `o070-adaptive-provider-lines`, load average 6 to 8: `npm run test:full` failed only this test three times in a row (C-175 checker twice, coordinator once); the same full run then passed (253 files, 3,768 tests); `main` passed once under the same load.
- Alone, with and without coverage, it passes every time (57/57, four runs).
- O-070's diff touches no story, panel or sky-trace code.

## Proof Needed

The test waits on the effect it asserts (or on the viewer's own settled signal) instead of a fixed 20 ms, and `npm run test:full` passes it repeatedly under load (e.g. three full runs while another full run is going); no assertion in the test is loosened.
