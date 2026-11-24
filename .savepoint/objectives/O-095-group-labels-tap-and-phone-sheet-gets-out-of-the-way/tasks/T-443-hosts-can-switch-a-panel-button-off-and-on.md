---
id: T-443
title: Hosts can switch a panel button off and on
objective: O-095
status: planned
depends_on: []
check_waiver: {task: T-443, reason: 'Owner said "Orchestrate O-95" (2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o095-20261124}, recorded_at: '2026-11-24T05:54:06Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g025-20261122}
planned_reads: [packages/astraeus/src/shelf/actions/factory.ts, packages/astraeus/src/shelf/actions/View.tsx, packages/astraeus/src/shelf/explainer/factory.ts, packages/astraeus/src/shelf/useCell.ts, packages/astraeus/tests/shelfParts.test.ts]
planned_writes: [packages/astraeus/src/shelf/actions/factory.ts, packages/astraeus/src/shelf/actions/View.tsx, packages/astraeus/tests/shelfParts.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
---

# Hosts can switch a panel button off and on

## Outcome

`ActionsControl.setEnabled(actionId, enabled)` lets a host disable one actions button (for example when its camera target is missing) and enable it again, instead of choosing between leaving the block out and a throw (belt #27, owner decision 3: no note under the button).

## User Check

On the shelf catalogue page's actions example (or the belt app on a local build), a host call `setEnabled("ceres", false)` greys the button and pressing it does nothing; `setEnabled("ceres", true)` restores it.

## Done When

- `setEnabled` follows the explainer's control pattern (a cell the view reads); a disabled button carries `disabled` and neither turns the camera nor reports `onAction`.
- An unknown action id or a non-boolean `enabled` throws `SceneError` `bad-part` naming the field (API-04, API-05).
- A component test that fails before the change covers disable, re-enable and the two refusals.
- README `ActionsControl` table, the API lock (`tools/api-surface.mjs`) and a CHANGELOG `Added` entry in the open 0.11.0 section; the shelf catalogue page's actions entry mentions it if that page documents controls.
- Configured gates pass; evidence per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/shelf/actions/factory.ts`
- `packages/astraeus/src/shelf/actions/View.tsx`
- `packages/astraeus/src/shelf/explainer/factory.ts` (the `control` pattern only)
- `packages/astraeus/src/shelf/useCell.ts`
- `packages/astraeus/tests/shelfParts.test.ts`
- `packages/astraeus/README.md` (the actions part's heading only)
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

`.savepoint/Design.md` under `Viewer interface` and `Decisions` → `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-04, API-05, API-07, TEST-01, TEST-03.

## Implementation Plan

1. Add the enabled state to the actions block (initial: all enabled) and the control method with its checks.
2. Read it in the view; disabled presses do nothing.
3. Tests, lock, README, CHANGELOG.

## Boundaries

No note under the button, no new look options beyond the existing disabled pill style.

## Technical Verification

Focused shelf tests while iterating; configured build and test gates at handoff, plus the API lock check. No browser step needed (component test covers it). Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for reconciliation before the Full Check.
