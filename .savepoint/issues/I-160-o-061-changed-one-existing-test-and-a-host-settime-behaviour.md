---
id: I-160
title: O-061 changed one existing test line, so "existing tests pass unchanged" is not met as written
type: drift
status: resolved
source:
  kind: check
  check: C-157
  actor: {role: checker, session: o061-check-20261110}
  at: '2026-11-09T22:39:31Z'
tasks: [T-286]
checks: [C-157]
guardrail_ids: []
severity: low
resolution:
  disposition: accepted
  actor: {role: owner, session: o061-run-20261110}
  at: '2026-11-09T22:40:20Z'
  reason: 'Owner chose "Accept it (Recommended)" after C-157: the one added line is the I-151 fix working as intended; the test''s assertions are unchanged.'
history:
  - at: '2026-11-09T22:39:31Z'
    actor: {role: checker, session: o061-check-20261110}
    kind: observed
    note: 'Found by the O-061 Full Objective Check. T-286 flagged it in its Drift Notes for the owner; no owner decision is recorded on the Task, Objective or an Issue.'
    check: C-157
  - at: '2026-11-09T22:40:20Z'
    actor: {role: owner, session: o061-run-20261110}
    kind: owner_decision
    note: 'Owner, asked how to settle the one-line test change against "existing tests unchanged": "Accept it (Recommended)". Recorded by the coordinator on the owner''s direct instruction.'
---

# I-160: O-061 changed one existing test line, so "existing tests pass unchanged" is not met as written

## Summary

O-061's last Success Condition says "Nothing existing changes shape: every addition is new; existing tests pass unchanged." T-286 added one line to an existing test because the I-151 fix changes what an existing host sees: a host `setTime` across a story panel while playing used to pause the clock (read as playback crossing the panel) and no longer does. The two Success Conditions conflict on this point; the code follows "Host seek", which is the intended fix. Only the owner can accept the conflict.

## Evidence

- `packages/astraeus/tests/viewerHostDom.test.ts` lines 130 to 131 (`git diff bb7a9c8c..HEAD -- packages/astraeus/tests/viewerHostDom.test.ts`): `act(() => handle.setPlaying(false));` added before pressing play; its assertions are unchanged.
- Smallest scenario: the synthetic scene with a story panel, playing; host `handle.setTime(MID)` across the panel. Before (bb7a9c8c): the panel opens and the clock pauses. After (HEAD): nothing opens, the clock keeps playing (`tests/hostCallOrder.test.ts` "a host setTime across a panel while playing opens nothing, as a visitor seek does (I-151)").
- The CHANGELOG "Unreleased (0.8.1)" heading says "Additions only." while its I-151 bullet describes this behaviour change; the bullet itself is accurate.
- Other edits to existing test files are additive rows the tables require for a new member (`lifecycle.test.ts`, `twoViewers.test.ts`, `helpers/viewerPresentation.ts`, `migrationTable.test.ts` WIDENED) and are not part of this Issue.

Expected (as written): no existing test edited. Actual: one line added to one existing test.

## Proof Needed

Either the owner accepts the change (the host-seek fix necessarily changes this host-visible behaviour) and resolves this Issue as `accepted`, or the Success Condition wording is corrected by the planner to exempt behaviour changed by the named fixes. Optionally the CHANGELOG heading says "Additions and the fixes below" instead of "Additions only".
