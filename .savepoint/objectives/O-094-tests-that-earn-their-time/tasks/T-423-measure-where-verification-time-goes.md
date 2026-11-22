---
id: T-423
title: Measure where verification time goes
objective: O-094
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-423, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on, merge when clear" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T03:56:59Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
planned_writes: [docs/evidence/test-cost/report.md, docs/evidence/test-cost/proposals.json]
---

# Measure where verification time goes

## Outcome

One measured baseline of where verification time goes, set against what each piece has caught, and a ranked list of proposed cuts that together reach about half a Full Objective Check's machine time while keeping every check that caught a G-024 defect. This is a research Task: its deliverable is the report and the proposal list; it changes no code, test or rule.

## User Check

None directly; the coordinator turns `proposals.json` into the owner's tick page.

## Done When

1. `docs/evidence/test-cost/report.md` holds, from runs made in this Task on the current head (each command, time and result recorded):
   - **Vitest:** one `npm run test:full` run; per-file and per-test durations from `junit.xml`; the 40 slowest files and 40 slowest tests; total wall time and vitest's own phase breakdown (transform, setup, collect, tests, environment) so fixed overhead is separated from test time; the same for one plain `npm test` run.
   - **Gates:** one `npm run check:gates` run (each gate's wall time against `tools/gate-limits.json`), noting gates that re-run another gate's work (for example `check:engine-alone` re-running typecheck, lint and tests for the engine).
   - **Browser:** per-step times from the recorded full-tier run `docs/evidence/browser-20261122T032627Z/` and the newest quick-tier run under `docs/evidence/` (no new browser run).
   - **Repeat map:** per Objective, which gate or suite runs where and how many times (builders' focused gates, the coordinator's per-wave full gate, the Full Check list, rechecks), from `docs/agents/verification.md`, `docs/agents/build.md`, `docs/agents/browser-policy.md`, `.savepoint/config.yml` `quality_gates`, `agent-skills/savepoint-check/SKILL.md` and `/home/user/savepoint-orchestrate/g024-drafts/builder-rules.md`; and the resulting machine minutes per Objective and per Full Check (baseline figure for the time target).
   - **Catch evidence:** for every NEEDS WORK Check and every Issue from G-020 onward (`.savepoint/checks/`, `.savepoint/issues/`), which test, gate, browser step or probe caught it; and the protected list (at least: the full browser tier's look-out label overlap, the I-193/I-194 outcome tests, the I-196 paused-orbit probe class, `check:three-newest` for I-195).
   - **Duplicate clusters:** groups of tests asserting the same behaviour (for example the same case on both mounts where one mount suffices, text pins next to outcome tests, parity tests that overlap), with file and case names.
2. `docs/evidence/test-cost/proposals.json`: an array of proposed cuts, each `{ id, title (plain words), kind: delete|merge|move-tier|run-once|rule, targets: [files/cases/gates], savedSecondsPerFullCheck, savedSecondsPerObjective, caught: [record ids or "none recorded"], risk (plain words), protected: false }`, ranked by saving; the sum of the recommended set reaches at least half the baseline Full Check time, or the report says plainly why it cannot without touching the protected list.
3. No source, test, rule or config file is changed; `git status` shows only the two files above plus `junit.xml`/coverage output already ignored.

## Context Files

`docs/agents/verification.md`, `docs/agents/build.md`, `docs/agents/browser-policy.md` (under "Browser tiers"), `.savepoint/config.yml`, `tools/gate-limits.json`, `tools/time-gates.mjs`, `package.json` (scripts), `agent-skills/savepoint-check/SKILL.md`, `/home/user/savepoint-orchestrate/g024-drafts/builder-rules.md`, `.savepoint/objectives/O-094-tests-that-earn-their-time/Objective.md`.

## Design References

Design "Current Technical State" only if a figure is needed.

## Guardrails

TEST-01..TEST-03 (each proposal says which remaining test keeps a removed behaviour named, or that it would be unguarded).

## Implementation Plan

1. Run `npm test`, `npm run test:full` and `npm run check:gates` once each, one at a time, on an otherwise idle machine; record times.
2. Parse `junit.xml` (a short script in the scratchpad, not the repo) for per-file and per-test times.
3. Read the browser evidence summaries.
4. Build the repeat map from the rule files and compute minutes per Objective and per Full Check.
5. Read Check and Issue records from G-020 onward for catch evidence; build the protected list.
6. Find duplicate clusters by reading the slowest files and their neighbours.
7. Write the report and proposals; rank by saving.

## Boundaries

Research only. No edits outside `docs/evidence/test-cost/`. No browser runs. No proposal that removes anything on the protected list.

## Technical Verification

The coordinator reviews the report for measured (not estimated) figures and that the recommended set's saving is computed from them. No gate changes in this Task.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
