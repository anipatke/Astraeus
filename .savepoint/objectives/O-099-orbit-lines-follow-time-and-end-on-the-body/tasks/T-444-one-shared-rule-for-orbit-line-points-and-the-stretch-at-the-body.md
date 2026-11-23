---
id: T-444
title: One shared rule for orbit-line points and the stretch at the body
objective: O-099
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-444, reason: 'Owner said "orchestrate O99" (2026-11-23): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o099-20261123}, recorded_at: '2026-11-23T08:18:33Z'}
planned_by: {role: planner, session: plan-g026-20261123}
planned_reads: [packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/tests/orbitSetSync.test.ts, packages/astraeus/src/app/pathRules.ts]
planned_writes: [packages/astraeus/src/app/orbitLineRule.ts, packages/astraeus/tests/orbitLineRule.test.ts, packages/astraeus/src/app/OrbitSetView.ts]
---

# One shared rule for orbit-line points and the stretch at the body

## Outcome

The body-set rule now inside `OrbitSetView` (every sample at a whole multiple of a fixed step; a head of fine points at whole multiples of a fine step from the last sample to the body; a re-sample rule on a clock jump) is a pure, node-tested module that `OrbitSetView` calls, with its behaviour unchanged, so `PathView` orbit lines can use the same rule (G-026 owner decision 2).

## User Check

None visible: body-set orbit lines (the asteroid belt families) look and move exactly as before on `localhost:5490`.

## Done When

- A pure module (suggested `src/app/orbitLineRule.ts`) exports the grid sample times for a span around a display time, the fine head times from the last grid sample up to the display time, and the re-sample decision; no Three.js, no State writes.
- `tests/orbitLineRule.test.ts` covers: grid times are whole multiples of the step; a re-sample keeps every time still in the span; the head ends at the display time; a jump past the threshold re-samples; edge cases at span ends and negative times.
- `OrbitSetView` calls the module; `tests/orbitSetSync.test.ts` passes unchanged (builders keep fixtures).
- Configured gates pass; evidence per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/OrbitSetView.ts`
- `packages/astraeus/tests/orbitSetSync.test.ts`
- `packages/astraeus/src/app/pathRules.ts`

## Design References

`.savepoint/Design.md` under `A lighter frame loop (O-087)`.

## Guardrails

ARCH-02, STYLE-07, CODE-01, CODE-02, TEST-01, TEST-03.

## Implementation Plan

1. Identify the grid, head and re-sample maths in `OrbitSetView` and lift it into pure functions with the same constants.
2. Write the module tests first against today's behaviour.
3. Switch `OrbitSetView` to call them; run its tests unchanged.

## Boundaries

No behaviour or look change to body-set lines; no `PathView` change in this Task.

## Technical Verification

Focused tests while iterating; configured build and test gates at handoff. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for reconciliation before the Full Check.
