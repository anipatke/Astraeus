---
id: T-409
title: Retire the scene pin
objective: O-088
status: planned
depends_on: [{task: T-406, requires: clear}, {task: T-407, requires: clear}, {task: T-408, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-409, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: scene-pin
planned_reads: [packages/astraeus/tests/sceneFaultOrder.test.ts, packages/astraeus/tests/sceneBuildContract.test.ts, packages/astraeus/tests/sceneLoadOrder.test.ts]
planned_writes: [packages/astraeus/tests/scenePin.test.ts, packages/astraeus/tests/fixtures/scenePin.json]
---

# Retire the scene pin

## Outcome

The 837 KB self-generated scene pin (`scenePin.test.ts` and `fixtures/scenePin.json`, O-058 T-231) is deleted after drafts 05, 06 and 07 replaced its error, output and load-order halves with focused cases (AH-33; G-024 decision 4).

## User Check

None visual. `npm test` no longer runs `scenePin.test.ts`; the three replacement files pass.

## Done When

- Before deleting, the three replacements are run green, and the planted breaks of drafts 05, 06 and 07 are each re-confirmed once against the current tree (one per file), recorded as the proof.
- One extra cross-check, recorded: a planted break that today's pin catches (for example change a group's default `dotSizePx`, or a timeline default rate) also fails one of the three files; if none fails, stop and report the gap to the coordinator instead of deleting.
- Deleted: `packages/astraeus/tests/scenePin.test.ts`, `packages/astraeus/tests/fixtures/scenePin.json`. A search for `scenePin` outside `docs/evidence`, `audits`, `.savepoint/checks|issues|objectives` and `docs/architecture/reconciliation-history.md` lists only `.savepoint/Design.md` lines, which go to Drift Notes.
- Gates per `docs/agents/verification.md`; record the `npm test` time before and after.

## Context Files

- The three replacement test files (case names; open a case only to plant its break)

## Design References

`.savepoint/Design.md` under `Scene and host-link split` (it names the pin).

## Guardrails

TEST-01, TEST-03, STYLE-10.

## Implementation Plan

1. Run the replacements; re-confirm one planted break each plus the cross-check; record.
2. Delete the two files; search; gates.

## Boundaries

Deletions only. No edit to the replacement files (a gap goes back to the coordinator). `.savepoint/Design.md` is the planner's, through Drift Notes.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/sceneFaultOrder.test.ts packages/astraeus/tests/sceneBuildContract.test.ts packages/astraeus/tests/sceneLoadOrder.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Expected: `.savepoint/Design.md` under `Scene and host-link split` says "`tests/scenePin.test.ts` pins the scene output"; the planner rewrites it to name the three replacement files.
