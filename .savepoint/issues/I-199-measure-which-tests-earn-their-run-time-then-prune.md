---
id: I-199
title: Measure which tests earn their run time, then prune
type: verification
status: resolved
source:
  kind: report
  actor: {role: owner, session: orchestrate-g024-20261122}
  at: '2026-11-22T03:00:05Z'
tasks: []
checks: []
guardrail_ids: []
severity: low
resolution:
  disposition: escalated
  actor: {role: planner, session: orchestrate-g024-20261122}
  at: '2026-11-22T03:56:59Z'
  reason: 'Owner chose "Do it next" and confirmed the design ("Go ahead"); promoted into G-024 as Objective O-094.'
escalated_to: O-094
history:
  - at: '2026-11-22T03:00:05Z'
    actor: {role: owner, session: orchestrate-g024-20261122}
    kind: observed
    note: 'Owner, 2026-11-22: "too many tests and its really unclear if they are adding value for how long they take"; then "yes add the test-measuring work to the backlog" (after G-024). In G-024 O-087..O-091 the real catches came from the full browser tier (look-out label overlap), a checker probe (I-196), new outcome/order tests (I-193, I-194) and check:three-newest (I-195); repeated full Vitest runs (~5,300 tests, ~40-55 s) caught nothing new.'
  - at: '2026-11-22T03:51:36Z'
    actor: {role: owner, session: orchestrate-g024-20261122}
    kind: owner_decision
    note: 'Owner, 2026-11-22, after "i seem to be spending 90% of my time waiting for tests", chose "Do it next": this work moves into G-024 ahead of O-092 and O-090 (savepoint-design promotes it to an Objective; measure first, prune on the owner''s choice).'
  - at: '2026-11-22T03:56:59Z'
    actor: {role: planner, session: orchestrate-g024-20261122}
    kind: escalated
    note: 'Promoted into O-094 "Tests that earn their time" (owner design interview: All three, Halve it, Report page I tick cuts; Go ahead).'
---

# Measure which tests earn their run time, then prune

## Problem

About 5,300 Vitest tests and a 5-minute full browser tier run repeatedly (builders, coordinator, every Check), and nobody can say which tests catch defects for their cost.

## Proof Needed

A report built from recorded runs (per-test time from the junit output, and failure history across runs and Checks) lists the slowest tests that have never failed and clusters that assert the same thing; the owner chooses cuts or tier moves from it, and the chosen changes land with gate times recorded before and after.

## Repair Routing

Next in G-024, before O-092 and O-090 (owner 2026-11-22 "Do it next"); earlier: backlog after G-024. A future Objective planned by savepoint-design; measure first, prune only on the owner's choice.
