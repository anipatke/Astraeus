---
id: I-116
title: 'The "planet series not loaded" test step runs with the series already loaded'
type: verification
status: open
source:
  kind: check
  check: C-128
  actor: {role: checker, session: o047-recheck-20261031}
  at: '2026-10-31T18:00:00Z'
checks: [C-128]
severity: low
history:
  - at: '2026-10-31T18:00:00Z'
    actor: {role: planner, session: o047-run-20261031}
    kind: observed
    note: 'Minor non-blocking finding in C-128, captured by the coordinator.'
---

# I-116: The "planet series not loaded" test step runs with the series already loaded

## Summary

The "series not loaded" step in `packages/astraeus/tests/dataSpans.test.ts` always runs with the planet series loaded, because `vitest.setup.ts` loads them first, so that step proves nothing. The not-loaded case is covered only by the checker's deleted probe in C-128 and by `check:node-consumer`.

## Evidence

- C-128 (O-047 targeted re-check), minor finding.

## Proof Needed

- The step resets modules (or otherwise starts with the series unloaded) and fails if the out-of-span error is thrown from `toDefinition` in that state.
