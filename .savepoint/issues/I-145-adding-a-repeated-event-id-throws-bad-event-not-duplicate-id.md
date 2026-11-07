---
id: I-145
title: Adding a repeated event id throws bad-event, not duplicate-id
type: drift
status: resolved
source:
  kind: report
  actor: {role: executor, session: t278-build-20261107}
  at: '2026-11-07T10:30:00Z'
tasks: [T-278, T-280]
checks: [C-152, C-153]
guardrail_ids: [API-05]
severity: low
resolution:
  disposition: verified
  check: C-153
  actor: {role: checker, session: o057-recheck-20261107}
  at: '2026-11-07T06:42:00Z'
  reason: Repair proven by C-153 (CLEAR).
history:
  - at: '2026-11-07T10:30:00Z'
    actor: {role: executor, session: t278-build-20261107}
    kind: observed
    note: 'Found while writing the call-twice grammar test for story panels; left unchanged because T-278 owns panels only.'
  - at: '2026-11-07T11:58:00Z'
    actor: {role: executor, session: t280-build-20261107}
    kind: repair_attempted
    note: 'Repaired in T-280: eventsOf throws duplicate-id inside one call and across calls; addEvents joins tests/verbGrammar.test.ts; the CHANGELOG migration table has its row. Left open for savepoint-check.'
  - at: '2026-11-07T06:15:58Z'
    actor: {role: checker, session: o057-check-20261107}
    kind: rechecked
    note: 'Proof Needed met, by C-152: on the compiled engine a repeated id throws duplicate-id inside one call and across calls, a failed batch keeps what was there, bad-event still answers a malformed event; addEvents has its row in tests/verbGrammar.test.ts; the migration table has its behaviour row. Left open: issue-capture.md defines verified as proven by a CLEAR Check, and C-152 is NEEDS WORK on other Issues. Close at the CLEAR re-check.'
    check: C-152
  - at: '2026-11-07T06:42:00Z'
    actor: {role: checker, session: o057-recheck-20261107}
    kind: rechecked
    note: 'Proof Needed met, by C-153 (CLEAR): on the compiled engine a repeated id throws duplicate-id inside one call and across calls, a failed batch keeps what was there and bad-event still answers a malformed event; addEvents has its row in tests/verbGrammar.test.ts; the migration table has its behaviour row.'
    check: C-153
---

# I-145: Adding a repeated event id throws bad-event, not duplicate-id

## Summary

Design, "Public API shape", says `add*` appends and a repeated id throws `duplicate-id`. `addEvents` appends, but a repeated event id throws `bad-event`, so it breaks that verb grammar while `addStoryPanels`, `addTrajectory`, `addActivity` and `addBody` follow it.

## Evidence

`packages/astraeus/src/api/story.ts`, `eventsOf`: `throw new SceneError("bad-event", ... appears twice)`. `packages/astraeus/tests/verbGrammar.test.ts` has no `addEvents` row for this reason.

## Proof Needed

A repeated event id throws `duplicate-id`, inside one call and across calls, and `addEvents` gains a row in `tests/verbGrammar.test.ts`. If the change lands before 0.8.0 it belongs in the migration table.
