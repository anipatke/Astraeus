---
id: T-425
title: Apollo data rebuilt only when its inputs change
objective: O-094
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-425, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on, merge when clear" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:12:54Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
---

# Apollo data rebuilt only when its inputs change

## Outcome

The owner's ticked cut P05 (docs/evidence/test-cost/proposals.json): the fast suite no longer spends ~41 s rebuilding the Apollo 11 data in `packages/astraeus-demo-apollo11/tests/apollo11Reconstruction.test.ts` when nothing it depends on changed, and the three API rule files (`packages/astraeus-site/tests/apiRules.test.ts`, `apiSurface.test.ts`, `apiReference.test.ts`) build the public API picture once instead of several times. Every existing assertion stays; only how the setup is obtained changes (the owner ticked this setup change; it is the Task's purpose).

## User Check

None.

## Done When

1. The Apollo test reuses a stored rebuild keyed by a hash covering every input of the rebuild (the build tools, the raw input data and the committed package output it compares against) and rebuilds whenever any of them change. Where the stored rebuild lives (a cache path git ignores, e.g. under `node_modules/.cache/`), how the key is computed, and a forced-rebuild switch (env var) are recorded. The file's existing second-rebuild logic is reused, not duplicated.
2. A named test proves the key changes when each input kind changes (one table test over tools, raw input, package output) and that a cold cache rebuilds.
3. The API picture is built once and shared by the three files (a shared helper module), with no assertion changed.
4. Measured: `npm test` wall time before and after (run each twice, warm cache for after; record both), the Apollo file's time warm and cold, and apiRules' time before and after.
5. Focused gates per builder rules on the changed files; `npx vitest run` on the four test files.

## Context Files

`docs/evidence/test-cost/proposals.json` (P05), `docs/evidence/test-cost/report.md` (Vitest section), `packages/astraeus-demo-apollo11/tests/apollo11Reconstruction.test.ts`, `packages/astraeus-site/tests/apiRules.test.ts`, `packages/astraeus-site/tests/apiSurface.test.ts`, `packages/astraeus-site/tests/apiReference.test.ts`, `tools/api-surface.mjs`.

## Design References

None.

## Guardrails

TEST-01, TEST-03; ARCH-03 (no new deep imports).

## Implementation Plan

1. Read the Apollo test's beforeAll and its existing rebuild-skip logic; list the rebuild inputs.
2. Add the keyed cache with forced-rebuild switch; add the key table test.
3. Share the API picture through one helper.
4. Measure before/after.

## Boundaries

Only the four test files, one new shared test helper, and a cache path that git ignores (add to .gitignore only if not already ignored). No assertion changes, no production code changes.

## Technical Verification

Focused gates; the coordinator's combined gate; the Full Check measures the suite time.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
