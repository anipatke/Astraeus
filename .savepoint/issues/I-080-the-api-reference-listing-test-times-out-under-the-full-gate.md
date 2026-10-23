---
id: I-080
title: The API reference listing test times out under the full gate
type: defect
status: open
source:
  kind: check
  check: C-110
  actor: {role: checker, session: o040-full-check-20261023}
  at: '2026-10-23T11:32:30Z'
tasks: [T-165]
checks: [C-110]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-10-23T11:32:30Z'
    actor: {role: checker, session: o040-full-check-20261023}
    kind: observed
    note: 'Found by the O-040 Full Objective Check (C-110). npm run test:full failed twice in a row (11:25:12Z and 11:26:29Z) on the same test; npm test and the file alone pass. The full gate (AGENTS.md Build) is red, and savepoint health check O-040 reports "blocks clearance" (1 failing) with no coverage report written.'
    check: C-110
  - at: '2026-10-23T12:10:00Z'
    actor: {role: executor, session: o040-repair-builder-20261023}
    kind: repair_attempted
    note: 'Repair: packages/astraeus-site/tests/apiReference.test.ts now builds the public-entry TypeScript program once in a beforeAll (60 s hook limit) and shares the items across the three cases (renderApiPage(items), items filtered for missing docs); the made-up-entry case is unchanged. Two consecutive npm run test:full runs passed (120 files, 1577 passed, 1 skipped; 62 s and 58 s); the file took 5.9 s and 5.6 s in total, mostly the one hook; coverage/coverage-final.json written. npm test, lint, typecheck, build pass. Not closed: awaiting a Check (fresh savepoint health check O-040 not run by the repairer).'
---

# I-080: The API reference listing test times out under the full gate

## Summary

`packages/astraeus-site/tests/apiReference.test.ts`, case "lists the public calls, the React component and the ready-made bodies, with examples for Scene, mount and AstraeusScene", runs past Vitest's 5000 ms default under `npm run test:full` (coverage on). It is reproducible, not a one-off flake: it failed in both full runs of this Check. The full gate is therefore red, Vitest writes no `coverage/coverage-final.json`, and the official health snapshot blocks clearance. The case builds a full TypeScript 6 program of the public entry twice (`collectExports()` and then `buildApiPage()`, which calls `collectExports()` again, `tools/site/api-reference.mjs:50` and `:193`), and the first case in the file builds it a third time.

## Evidence

- `npm run test:full`, 2026-10-23 11:25:12Z: `Test Files 1 failed | 119 passed (120)`, `Tests 1 failed | 1576 passed | 1 skipped`; the case took 6548 ms, `Error: Test timed out in 5000ms` at `apiReference.test.ts:24`. The sibling case "has a doc comment on every export" took 4689 ms, also close to the limit.
- `npm run test:full`, 11:26:29Z: same failure, 6496 ms (sibling 4406 ms).
- `npm test` (no coverage), 11:27:30Z: 120 files pass; the file took 3530 ms in total. `npx vitest run packages/astraeus-site/tests/apiReference.test.ts` alone: pass.
- `savepoint health check O-040`: snapshot `sha256:7c1ae0f9425c3d727374421dd7b3db7456b88293496764917a55de6e8f153133`, "Code Health blocks clearance", tests "1 failing"; coverage "collection failure: no report was found".
- T-165's evidence ran only `npm test`, never `npm run test:full`.

Violated: the Full Objective Check's full-gate requirement (AGENTS.md Verification Policy and Build: `npm run test:full`), and T-165's Done When ("a fast test fails when an export ... has no doc comment") in so far as the fast check must pass on the full gate to be the guard it promises. Same class as I-072.

## Proof Needed

`npm run test:full` passes twice in a row on the repaired tree with `apiReference.test.ts` well inside its timeout (for example by building the program once per file, or with an explicit, justified timeout), `coverage/coverage-final.json` is written, and a fresh `savepoint health check O-040` no longer blocks on tests. The test must still fail on a made-up undocumented export.
