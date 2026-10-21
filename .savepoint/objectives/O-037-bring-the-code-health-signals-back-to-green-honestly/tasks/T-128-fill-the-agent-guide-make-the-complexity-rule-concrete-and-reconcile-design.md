---
id: T-128
title: Fill the agent guide, make the complexity rule concrete and reconcile Design
objective: O-037
status: in_progress
stage: audit
depends_on: [{task: T-122, requires: clear}, {task: T-123, requires: clear}, {task: T-124, requires: clear}, {task: T-125, requires: clear}, {task: T-126, requires: clear}, {task: T-127, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o037-planning-20261021}
planned_reads: [AGENTS.md, .savepoint/Guardrails.md, .savepoint/Design.md, .savepoint/health/config.json, agent-skills/references/check-method.md, agent-skills/references/issue-capture.md]
check_waiver:
  task: T-128
  reason: "Owner waived the optional Task Check for O-037 ('dont run full checks until the final objective check'); the Full Objective Check covers it."
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  recorded_at: '2026-10-21T10:46:01Z'
planned_writes: [AGENTS.md, .savepoint/Guardrails.md, .savepoint/Design.md, .savepoint/issues]
---

# Fill the agent guide, make the complexity rule concrete and reconcile Design

## Outcome

An agent starting a Task reads in AGENTS.md which gates run, what the health scanners measure, and how evidence is kept; Guardrails say what complexity a new function may have and that per-frame scene work is a stage; Design describes the frame pipeline, the harness and the scanner scope as they now are; the suggestions for the packaged skills are one Issue.

## User Check

Open AGENTS.md: the Build section lists the gates and the Codebase Map is a filled table. Open the Guardrails: `CODE-01` carries a number and a `CODE-02` names the frame-pipeline rule. The Issues panel lists one new Issue addressed to Savepoint.

## Done When

1. AGENTS.md Build section: typecheck, build, lint and test as the hand-off gates; `npm run test:full` as the full gate; `npm run check:engine` and `check:demo` per the existing browser rule; one line per health scanner on what it measures and excludes. Codebase Map: one row per top-level module, lifted from Design's Components/Codebase Map and kept short.
2. Guardrails: `CODE-01` reads "no function over cyclomatic complexity 20 as the lint gate measures it; a Task that must exceed it records why in its evidence"; a new `CODE-02` (Guideline) states that per-frame scene work is a named stage function in `src/app/sceneFrame.ts` with a node test, never inline in the React component. Severity and exception wording follow the existing table.
3. Design reconciled: the `src/app/scene*.ts` map row names `sceneFrame.ts` and `scenePointer.ts` and the stage order; the `tools/validate/` row names the harness and the runner's retention; a Current Technical State paragraph records this Objective's scanner scope, coverage definition, the health figures before and after, and the Drift Notes of every O-037 Task, each accounted for as reflected or non-architectural with a reason (AGENTS.md deferred-reconciliation rule).
4. One Issue (type per `issue-capture.md`, addressed to the Savepoint package, not repaired here) records the three skill suggestions: a stale coverage instance reads as unknown and the Full Objective Check refreshes it before the health check; a signal whose affected files sit mostly outside `src`, `tests` and `tools` is reported to the owner as a measurement-scope observation; the report's trend is computed only across fresh instances.
5. Gates: `npm run typecheck`, `npm run build`, `npm run lint`, `npm test`; `savepoint resume` loads every edited record.

## Context Files

`AGENTS.md`, `.savepoint/Guardrails.md`, `.savepoint/Design.md` (Components/Codebase Map and Current Technical State), `.savepoint/health/config.json`, `agent-skills/references/issue-capture.md`, the Drift Notes sections of the other O-037 Tasks.

## Design References

Design: Components/Codebase Map; Current Technical State. O-037 Success Conditions 7 and 8; the Goal Workflow Review rule in `agent-skills/savepoint-design/SKILL.md` (suggestions for packaged skills become Issues).

## Guardrails

CODE-01; STYLE-07, STYLE-08, STYLE-09.

## Implementation Plan

1. AGENTS.md Build and Codebase Map.
2. Guardrails `CODE-01` wording and `CODE-02`.
3. Design map rows and the reconciliation paragraph from the Tasks' Drift Notes.
4. The Issue; `savepoint resume`; gates.

## Boundaries

No edits under `agent-skills/`; no code changes; no change to the health config (the scope Task owns it); no retrospective section (owner rule: no retrospectives).

## Technical Verification

`savepoint resume` loads; the Full Objective Check reads Design against the landed code per `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-21 by the T-128 builder; Task Check waived by the owner (`check_waiver`); evidence routes to the Full Objective Check.

1. AGENTS.md Build: hand-off gates (lint, typecheck, build, test), `npm run test:full` as the full gate, the lint gate with the TypeScript 6 shim, the browser gates, and one line per scanner (jscpd, lizard, coverage). Codebase Map: ten rows (src/core, assets, app, shell, experiences, synthetic, data, tools, tests, docs). Decision recorded: the 11 lizard rows from `.claude` hooks are not excluded (boundary: no health config change here); the line says so and the owner may add the exclusion.
2. Guardrails: CODE-01 now reads no function over complexity 20 as `npm run lint` measures it, with the evidence-exception wording; CODE-02 (Guideline) added: per-frame scene work is a stage in `src/app/sceneFrame.ts` with a node test.
3. Design: `src/app/scene*.ts` row names `runFrame`, the stage order, `scenePointer.ts` and CODE-02; `tools/validate/` row names the harness, the guard and the runner's retention; a Current Technical State paragraph (O-037) records scanner scope, coverage definition, before/after figures, the lint gate and an account of every O-037 Drift Note as reflected or non-architectural with a reason. T-124's deferred note, T-126's notes and T-123's rule are reflected; T-125 and T-127 splits are non-architectural. Nothing about I-054 to I-058.
4. Issue I-059 (type other, open, addressed to the Savepoint package) holds the three skill suggestions: stale coverage reads unknown and the Full Objective Check refreshes it before the health check; mostly-outside-scope signals reported as a measurement-scope observation; trend only across fresh instances. `agent-skills/` untouched.
5. Gates 2026-10-21: `npm run lint` 0 errors; `npm run typecheck` clean; `npm run build` ok (chunk warning only, under the build lock); `npm test` with junit 92 files, 1282 passed, 1 skipped. `savepoint resume` loads.

Files read: Context Files plus the Technical Evidence of T-122 to T-127 and Issue I-010/I-058 as templates (extra reads for wording). Files changed: AGENTS.md, .savepoint/Guardrails.md, .savepoint/Design.md, .savepoint/issues/I-059-*.md, this Task. Not verified: no browser, test:full or health run (owed at the Full Objective Check); health figures are T-122's scratch figures, not a fresh snapshot.

## Drift Notes

None: this Task is the reconciliation.
