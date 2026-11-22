---
id: T-423
title: Measure where verification time goes
objective: O-094
status: done
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

Builder session orchestrate-g024-20261122 (T-423 builder), 2026-11-22, head `cb402861`, branch `o094-tests-earn-their-time`. Research Task: no source, test, rule or config file changed. Step check waived (frontmatter `check_waiver`).

Commands run (one at a time, no browser run; parsing scripts in the session scratchpad, not the repo):

| Command | UTC | Result | Time |
|---|---|---|---|
| `npm test` | 03:57:31 | exit 0; 328 files, 5,424 passed, 2 skipped | 34.3 s wall, vitest 30.26 s |
| `npm run test:full` | ~03:58 | exit 0; same counts; coverage 93.47% statements; `junit.xml` parsed | 54.5 s wall, vitest 45.51 s |
| `npm run check:gates` | 03:59:15-04:02:16 | exit 0; 10 gates passed, 0 over limit | 180 s (lint 7.3, typecheck 7.1, build 3.2, test 33.5, test:full 55.2, engine-alone 32.1, pack 20.6, public-build 7.8, node-consumer 7.0, react-consumer 6.5) |
| `npm run measure:example` | ~04:03 | exit 0; first-open 1,826,428 B raw / 523,400 B gzip | 3.7 s |

`measure:example` was not in the plan's three runs; it was timed once (a 4 s build, no tracked output) because it is on the Full Check list and the baseline needs it.

| Done When | Evidence |
|---|---|
| 1 Vitest (test:full per-file/per-test, 40 slowest each, wall and phase split; same for npm test) | `docs/evidence/test-cost/report.md` section 1 (plain-run per-file lines are not printed without a terminal; recorded under "Could not measure") |
| 1 Gates (each gate vs `tools/gate-limits.json`, repeated work) | report section 2 |
| 1 Browser (per-step times, full `browser-20261122T032627Z`, quick `browser-quick-20261122T023312Z`) | report section 3, plus run counts from every run folder 2026-11-21/22 |
| 1 Repeat map (per Objective and per Full Check, baseline) | report section 4: Full Check 454 s full tier / 268 s quick; ~1,180 s per Objective |
| 1 Catch evidence (NEEDS WORK Checks and Issues G-020+, protected list) | report section 5 (C-180..C-210, I-178..I-201; protected list includes look-out label overlap, I-193/I-194 tests, I-196 probe class and test, `check:three-newest`) |
| 1 Duplicate clusters | report section 6 (9 clusters with file and case names) |
| 2 `proposals.json` ranked, fields as specified; recommended set reaches half or says why not | `docs/evidence/test-cost/proposals.json`: 15 proposals, all `protected: false`; recommended P01-P06 = 228 s of 454 s (50%); report section 7 says plainly it falls to ~35% when synthetic-journey is also needed |
| 3 Only the two files changed | `git status`: the two deliverables, this Task file and the Objective status line; plus `docs/evidence/public-build-20261122T040154Z/` written by the required `check:gates` run (`check:public-build` always writes a run folder; cited in the report) and the ignored `junit.xml`/`coverage/` |

Extra reads (beyond Context Files), each for the catch evidence or repeat map the Task asks for: `.savepoint/checks/C-176..C-210` frontmatter and gate tables; `.savepoint/issues/I-176..I-201` summaries and history notes; `docs/evidence/*2026112[12]*/summary.txt`; `vitest.config.ts` (projects); headers of `tools/check-engine-alone.mjs`, `check-packs.mjs`, `measure-example.mjs`, `check-public-build.mjs`, `check-node-consumer.mjs`; `beforeAll` lines of `apollo11Reconstruction.test.ts`, `apiRules.test.ts`, `apiSurface.test.ts`, `apiReference.test.ts`, `demoAbout.test.ts`; `git log` since 2026-11-21 for Check wall-clock times; T-393, T-396, T-400, T-405 evidence lines naming non-Check browser runs.

Limitations: `savepoint health check` not timed (CLI rule); builder focused-gate times estimated; P05/P06 savings are estimates; agent time inferred from commit/Check timestamps.

Files changed: `docs/evidence/test-cost/report.md` (new), `docs/evidence/test-cost/proposals.json` (new), this Task file, `Objective.md` (status planned -> in_progress).

## Drift Notes

None (research only; no architecture change). For the trimming Tasks: `docs/agents/build.md` gate table and `tools/gate-limits.json` must move together if P03/P04 change the Full Check list.

## Coordinator (gates)

Research Task, no code: reviewed `report.md` and `proposals.json` (15 proposals; figures from the recorded runs: `npm test` 34.3 s, `test:full` 54.5 s, `check:gates` 180 s, browser full tier 310 s from docs/evidence/browser-20261122T032627Z); `git status` shows only the two deliverables beside the records. Set done by the orchestrating session (owner: "I mark them as they pass", O-038; G-024 decision 7; owner 2026-11-22 "carry on, merge when clear").
