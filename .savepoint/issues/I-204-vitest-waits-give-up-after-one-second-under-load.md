---
id: I-204
title: Vitest waits give up after one second under load
type: verification
status: open
source:
  kind: report
  actor: {role: executor, session: orchestrate-g024-20261122}
  at: '2026-11-22T05:10:09Z'
tasks: []
checks: []
guardrail_ids: []
severity: medium
history:
  - at: '2026-11-22T05:10:09Z'
    actor: {role: executor, session: orchestrate-g024-20261122}
    kind: observed
    note: 'O-092 wave-2 gate: twoViewers.test.ts "API-03: one shelf panel descriptor shared by two viewers ..." failed once in a full npm test and passed alone and on a full rerun. Same class as I-203: 55 vi.waitFor calls rely on Vitest''s 1 s default, which a loaded 16-worker run can exceed.'
  - at: '2026-11-22T05:10:09Z'
    actor: {role: executor, session: orchestrate-g024-20261122}
    kind: repair_attempted
    note: 'Direct repair on branch o092-gpu-cleanup: packages/astraeus/vitest.waits.setup.ts (first setup file of all three Vitest projects in vitest.config.ts) gives vi.waitFor and vi.waitUntil a 10 s default timeout when a call names none; a named timeout is kept. tests/waitDefaults.test.ts: an unnamed wait outlasts 1 s (fails without the setup file: 1 failed, 1 passed; passes with it), a named 100 ms timeout still rejects. Full npm test 337 files, 5481 passed, 2 skipped. twoViewers + viewerIds + developerDrawerFolds 3/3 green with 14 busy-loop processes loading the machine. Typecheck, ESLint, Prettier clean.'
---

# Vitest waits give up after one second under load

## Problem

Vitest's `vi.waitFor` and `vi.waitUntil` time out after 1 s unless a call names a timeout. 55 calls in the suite name none. Under a loaded parallel run a DOM change can take longer, so `npm test` failed with no product defect (I-203 viewerIds; twoViewers' shared shelf panel during O-092).

## Proof Needed

One project-wide default longer than 1 s applies to every unnamed wait in every Vitest project; a named timeout is kept; a test proves both; the formerly flaky files pass under a loaded machine and two full runs are green.

## Repair Routing

Direct repair on the O-092 branch; the O-092 Full Check verifies it.
