---
id: I-090
title: The first-download test would miss a bare import of a developer panel
type: verification
status: in_progress
source:
  kind: report
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:47:47Z'
severity: low
history:
  - at: '2026-10-24T02:47:47Z'
    actor: {role: planner, session: improvements-intake-20261024}
    kind: observed
    note: 'Owner, 2026-10-24: "can we add the fixes as issues, and iterate through and fix them with agents" (after "no more demos, here on in only improvements").'
  - at: '2026-10-24T13:55:00Z'
    actor: {role: executor, session: i090-repair}
    kind: repair_attempted
    note: 'packages/astraeus/tests/firstOpenGraph.test.ts walker now follows bare `import "./x"`, `import ... from`, `export ... from` and `export * from`; still ignores `import()` and type-only import/export. Walker takes an injectable Source (disk by default) and stays in the test. Four planted cases on an in-memory graph (bare import caught, export chain caught, dynamic not followed, type-only not followed); real graph tests still pass. lint, typecheck, npm test (135 files, 1790 passed) green. Unverified: the planted bare-import case was not run against the old walker; no full gate or Check run; bare imports with single quotes or no semicolon are matched by regex only.'
---

# I-090: The first-download test would miss a bare import of a developer panel

## Summary

C-116 observation O3: `packages/astraeus/tests/firstOpenGraph.test.ts` follows `import ... from` statements; a bare side-effect import such as `import "./DeveloperSettings"` would put a panel back on the first download without the test noticing.

## Evidence

C-116 non-blocking observations; firstOpenGraph.test.ts.

## Proof Needed

A planted case (made-up module graph) with a bare import fails the walker; the walker follows bare imports and `export ... from`; the real graph still passes.
