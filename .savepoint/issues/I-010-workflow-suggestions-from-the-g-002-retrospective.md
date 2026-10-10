---
id: I-010
title: Packaged-skill suggestions from the G-002 retrospective
type: other
status: open
source:
  kind: report
  actor: {role: planner, session: g002-retro-2026-10-06}
  at: '2026-10-06T09:40:00Z'
checks: [C-005, C-006]
history:
  - at: '2026-10-06T09:40:00Z'
    actor: {role: planner, session: g002-retro-2026-10-06}
    kind: observed
    note: Recorded by the G-002 retrospective (O-003) as suggestions for the packaged Savepoint skills; project rules were tuned separately in AGENTS.md and Guardrails.
  - at: '2026-10-09T22:51:41Z'
    actor: {role: executor, session: t023-codex-20261010}
    kind: observed
    note: O-007 reviewed these suggestions against the current workflow. Retrospective closure now follows a planned Task and mandatory Full Objective Check; the earlier no-Full-Check proposal remains historical, not project policy. No additional package suggestion was found.
---

# I-010: Packaged-skill suggestions from the G-002 retrospective

## Summary

These are suggestions for the packaged skills and shared references, which this project does not edit.

1. **Re-check after the owner revises criteria.** `check-method.md` freezes the scope lock for re-checks but says nothing about the owner rewording an Objective's success conditions after a NEEDS WORK Check, as happened between C-005 and C-006. Suggest stating that the frozen lock still governs blocking cells, that owner-accepted Issues close their cells by acceptance (not as verified), and that new wording is reported only as an observation.
2. **Concurrent sessions on one checkout.** During G-002, a planner session changed router state while an executor was mid-Task, and an interrupted re-check left an admission ledger behind with no Check record. Suggest the skills say what to do when `.savepoint/` records change under a session (stop and report), and how a later checker may adopt an orphaned admission ledger.
3. **Retrospective closure.** The Goal Workflow Retrospective Objective has no Tasks and no defined Check path. Suggest stating how the owner closes it (recorded conclusion plus owner acceptance, no Full Check) so `savepoint resume` and the board route it cleanly.

## Evidence

`.savepoint/checks/C-005-o-004-full-objective-check.md`, `.savepoint/checks/C-006-o-004-full-objective-recheck.md` (Independence section), `docs/evidence/o004-recheck-admission.md`, `.savepoint/objectives/O-003-spike-02-workflow-retrospective/Objective.md`.

## Proof Needed

A packaged-skill update that addresses each point, or an explicit "no change" decision by the package owner.

## G-003 retrospective update — 2026-10-10

T-023 searched the Issue index for retrospective, packaged, browser, historical-evidence and reconciliation concerns before deciding on capture. I-011 and I-012 already record the concrete integration failures, now verified by C-008. Their prevention belongs to Astraeus project guidance, not a new package Issue.

Suggestion 3 above records the G-002 proposal at that time. The current savepoint-task and savepoint-check skills require Task evidence and a mandatory Full Objective Check; O-007 has planned T-023 on that path. This removes the practical closure ambiguity for this retrospective and does not adopt the earlier proposed exemption. No package-owner disposition is inferred, and this Issue stays open. Suggestions 1 and 2 were not exercised by the selected G-003 records and remain historical follow-up; no duplicate or new package suggestion is warranted.
