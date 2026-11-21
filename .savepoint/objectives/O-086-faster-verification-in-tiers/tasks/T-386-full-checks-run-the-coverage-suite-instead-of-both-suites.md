---
id: T-386
title: Full checks run the coverage suite instead of both suites
objective: O-086
status: planned
depends_on: []
check_waiver: {task: T-386, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: guidance
planned_reads: [.savepoint/config.yml, package.json, agent-skills/references/check-method.md, docs/RELEASING.md]
planned_writes: [docs/agents/build.md, docs/agents/verification.md]
---

# Full checks run the coverage suite instead of both suites

## Outcome

Where a gate pass schedules both `npm test` and `npm run test:full` (a Full Objective Check; a migration or platform-sensitive hand-off), the guidance says to run `test:full` alone: it runs the same cases plus coverage and `junit.xml`, so its result stands for the `quality_gates` test gate (AH-31: the same 4,629 cases run twice; Claude audit I.2 "Do not run both").

## User Check

None visual.

## Done When

- `docs/agents/build.md`, the "Hand-off gates" and "Full gate" bullets (lines 5–6 on the O-093 head): ordinary Task hand-off keeps `npm test`; the Full gate bullet says `test:full` replaces `npm test` in that pass (not as well as), and that its pass counts as the `quality_gates.test` result for that pass.
- `docs/agents/verification.md`, the "Focused test runs ..." bullet (line 6): one sentence with the same rule, pointing at build.md for the commands (no restated command list: STYLE-07).
- `.savepoint/config.yml` `quality_gates.test` is unchanged (Task hand-offs still run `npm test`); `tools/time-gates.mjs` is unchanged (it times every gate on purpose; planner decision 6).
- A repo search for `npm test` and `test:full` in `docs/agents/`, `docs/RELEASING.md` and `AGENTS.md` is recorded in Technical Evidence, each hit marked consistent or changed. `docs/RELEASING.md` step 4 is left as is (a release runs `npm test`, not both; O-091 owns the release workflow).
- `npx vitest run packages/astraeus-site/tests/gateLimits.test.ts` passes (it reads build.md's table; the table is not edited here).
- Gates per `docs/agents/verification.md`.

## Context Files

- `docs/agents/build.md` (bullets "Hand-off gates" and "Full gate", lines 5–6)
- `docs/agents/verification.md` (whole file, 13 lines)

## Design References

None.

## Guardrails

STYLE-07, STYLE-10.

## Implementation Plan

1. Search; record hits.
2. Edit the two bullets in build.md and one in verification.md.
3. Run `gateLimits.test.ts`; gates.

## Boundaries

Docs only. Do not edit `agent-skills/` (Savepoint-managed), the gate table or browser lines of build.md (drafts 08 and 12), or browser-policy.md (draft 12).

## Technical Verification

`npx vitest run packages/astraeus-site/tests/gateLimits.test.ts`; handoff `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
