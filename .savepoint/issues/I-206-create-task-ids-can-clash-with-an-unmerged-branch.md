---
id: I-206
title: create-task IDs can clash with an unmerged branch
type: other
status: open
source:
  kind: report
  actor: {role: planner, session: orchestrate-g024-20261122}
  at: '2026-11-22T08:00:00Z'
tasks: []
checks: []
guardrail_ids: []
severity: low
history:
  - at: '2026-11-22T08:00:00Z'
    actor: {role: planner, session: orchestrate-g024-20261122}
    kind: observed
    note: 'G-024 Workflow Review finding 7. Suggestion for the packaged Savepoint tool; the project does not edit packaged skills or tools.'
---

# create-task IDs can clash with an unmerged branch

## Problem

`savepoint create-task` allocates the next Task ID from the checkout's own `.savepoint/task-ids.yml`. During G-024 a parked Objective's branch allocated T-354..T-360 while main's counter lagged, so the next Objective created on main got the same IDs and had to be renumbered by hand. The same can happen with Check and Issue numbers. Workaround today: before creating Tasks, raise the counter to the highest ID on any unmerged branch.

## Proof Needed

Upstream (packaged tool): creating a Task on one branch while another unmerged branch has already used higher IDs either gives a non-clashing ID or refuses with a message naming the branch and ID. In this project: the workaround is removed from the orchestration notes once the tool handles it.
