---
id: I-059
title: Packaged-skill suggestions from the O-037 code health run
type: other
status: resolved
source:
  kind: report
  actor: {role: executor, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  at: '2026-10-21T10:45:32Z'
tasks: [T-122, T-128]
resolution:
  disposition: accepted
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:51:07Z'
  reason: 'Owner, 2026-10-24: "Yes, close all seven" after the triage. Suggestions for the Savepoint package, not a project repair; AGENTS.md already records the scanner scope and coverage refresh.'
history:
  - at: '2026-10-21T10:45:32Z'
    actor: {role: executor, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: Recorded by O-037 T-128 as suggestions for the packaged Savepoint skills and references, which this project does not edit (agent-skills/ unchanged). No repair is planned here.
  - at: '2026-10-24T02:51:07Z'
    actor: {role: owner, session: improvements-intake-20261024}
    kind: owner_decision
    note: 'Owner, 2026-10-24: "Yes, close all seven" after the triage. Suggestions for the Savepoint package, not a project repair; AGENTS.md already records the scanner scope and coverage refresh.'
---

# I-059: Packaged-skill suggestions from the O-037 code health run

## Summary

Three suggestions for the packaged skills and shared references, from the Code Health work in O-037 (Goal Workflow Review rule: suggestions for packaged skills become Issues).

1. **A stale coverage instance reads as unknown.** Coverage went stale (last written 2026-10-16) without any signal changing colour for the right reason. Suggest `savepoint-check` treat a coverage instance older than the code it measures as `unknown`, and that the Full Objective Check refresh it (the project's full gate) before it runs `savepoint health check`.
2. **Measurement scope observation.** When most of the files behind a signal sit outside the project's code (here `docs/evidence`, `tests/fixtures`, `data`, `tools/archive`: 46% duplication was almost all evidence scans, and a share of lizard rows came from `.claude` hooks), suggest the Code Health guidance have the agent report it to the owner as a measurement-scope observation, not chase it with code changes. Narrowing the scope stays the owner's decision, as `savepoint-task` already says.
3. **Trend across fresh instances only.** The report's trend should be computed only across fresh instances, so a stale coverage reading does not draw a trend line against a current complexity reading.

## Evidence

O-037 Objective and Tasks T-122 (scanner scope, coverage definition) and T-128. Health review of 2026-10-21 (read-only).

## Proof Needed

Not a project repair. Owner forwards the suggestions to the Savepoint package; the Issue is then closed by the owner as accepted or by a checker.
