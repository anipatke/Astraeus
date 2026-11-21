---
id: T-363
title: One test timeout locally and on CI
objective: O-085
status: done
depends_on: [{task: T-361, requires: clear}, {task: T-362, requires: clear}]
check_waiver: {task: T-363, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:50:31Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: timeout
planned_reads: [.github/workflows/publish.yml, tools/gate-limits.json, docs/agents/build.md]
planned_writes: [vitest.config.ts]
---

# One test timeout locally and on CI

## Outcome

Heavy data tests get the same 30 s timeout on a desk machine as on CI, so a loaded machine no longer turns them red at 5 s, and `npm run test:full` is green on Node 22 and Node 24 (AH-35: Claude F-22, Gemini F-07).

## User Check

None visual. `npm run test:full` passes under Node 22 and under Node 24.

## Done When

- `vitest.config.ts` `common.test.testTimeout` is one constant, 30 000 ms, whatever `process.env.CI` says (PLAN.md decision 2); the comment above it says why (heavy data cases time out at 5 s under load locally as on CI's slower runners) and that per-test timeouts above it stay as they are.
- The `process.env.CI` branch is removed from the timeout (and the `process` declaration only if nothing else uses it: `__PUBLIC_BUILD__` still does).
- Per-test explicit timeouts in test files are unchanged.
- `npm run test:full` passes on Node 22 (`source ~/.nvm/nvm.sh; nvm use 22`) and on Node 24, run after drafts 01 and 02 have landed; record each `node --version`, the pass counts, and the wall time against the `test:full` limit in `tools/gate-limits.json` (105 s). A timing over the limit is reported, not fixed here (a limit warning never fails the gate).
- If a test still fails on either version for an environment reason (timing, float, timeout), record it and capture it as a finding for the coordinator rather than widening this Task.
- Gates per `docs/agents/verification.md`.

## Context Files

- `vitest.config.ts` (the `common` object, lines ~24–31)
- `tools/gate-limits.json` (the `test:full` limit; read only)
- `.github/workflows/publish.yml` (the only workflow today; confirm it runs Vitest with GitHub's `CI` set; read only. CI on every push is O-091)

## Design References

`.savepoint/Design.md` under `Current Technical State` (gate times and limits paragraph).

## Guardrails

TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Make the timeout one constant.
2. Run `npm run test:full` on Node 24, then on Node 22; record both.

## Boundaries

Only the timeout. No change to projects, setup files, coverage settings or gate limits. Removing duplicated gate work is O-086.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/pointsLookAhead.test.ts packages/astraeus-demo-showers/tests/pointsLookAheadShowers.test.ts` (heavy data cases). Handoff: `quality_gates`, plus `npm run test:full` on Node 22 and Node 24 (Objective Success Condition). No browser run.

## Technical Evidence

| Done When | Evidence |
|---|---|
| One constant 30 000 ms, comment says why | `vitest.config.ts` `common.test.testTimeout: 30_000` with new comment (per-test timeouts stay as they are) |
| `process.env.CI` branch removed; `process` declaration kept | `process` still used by `__PUBLIC_BUILD__` (ASTRAEUS_PUBLIC_BUILD) |
| Per-test timeouts unchanged | No test file touched |
| test:full on Node 22 and 24 | Node v24.16.0: 303 files passed, 5037 passed / 2 skipped, vitest Duration 72.15 s. Node v22.23.5: 303 passed, 5037 passed / 2 skipped, Duration 74.25 s. Both under the 105 s limit (wall times include flock waits, so Duration is the figure). |
| Environment failures | None on either version. |
| Gates | lint, typecheck, build clean; `npm test` 303 files, 5037 passed / 2 skipped (Node 24), run under flock. |

publish.yml runs `npm test` (line 34); no explicit CI var, GitHub sets it, now irrelevant. Files changed: vitest.config.ts. No extra reads.

## Drift Notes

Record for Design reconciliation (`Current Technical State`): Vitest's default timeout is 30 s locally and on CI. (Unchanged plan note; nothing else.)

Coordinator (orchestrate-g024-20261121): gates green (lint, typecheck, build; `npm test` 303 files, 5037 passed); `test:full` green on Node 24 (72 s) and Node 22 (74 s). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
