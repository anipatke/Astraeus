---
id: T-438
objective: O-090
title: Design describes the present, history moves out
status: planned
depends_on: [{task: T-437, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-438, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, .savepoint/Design.md, docs/architecture/codebase-details.md, docs/architecture/reconciliation-history.md]
planned_writes: [.savepoint/Design.md, docs/architecture/codebase-details.md, docs/architecture/reconciliation-history.md, docs/README.md]
---

# Design describes the present, history moves out

## Outcome

Owner plan step 4, architecture. Design.md and the component map keep purpose, boundaries, lifecycle ownership and decision rationale; inventories, step sequences and dated gate results are replaced by links to the owning source; dated per-Objective history moves to `docs/architecture/reconciliation-history.md` under clearly marked headings, wording unchanged. Headings that Tasks, Checks, Guardrails, skills or AGENTS.md reference by name are kept or leave a one-line pointer.

## User Check

None visual. From Design's overview a reader reaches a subsystem's detailed contract in one link.

## Done When

| Item | Evidence |
|---|---|
| Inbound references to Design headings found (grep over .savepoint, agent-skills, docs, AGENTS.md, plus heading-name greps) and each referenced heading kept or pointed | table |
| Dated gate results, sizes and per-Objective narratives either moved under a history heading or replaced by a link; nothing deleted without a home | table |
| Overview → contract in one link for each subsystem in the map | evidence |
| The Savepoint index still loads (resume) | command |
| Before/after word count | wc -w |

## Context Files

T-434 Technical Evidence; `docs/README.md`; `.savepoint/Design.md` (whole: this Task trims it); `docs/architecture/codebase-details.md`; `docs/architecture/reconciliation-history.md` (top and headings).

## Design References

`agent-skills/savepoint-design/SKILL.md` under `Design Template`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap).

## Implementation Plan

1. Grep inbound heading references first.
2. Per section: keep current contract and rationale; move dated history; replace inventories with links.
3. Update `docs/README.md` owners if a fact's owner moved.

## Boundaries

No archived history rewritten; moved text keeps its wording. Guardrails.md and other Savepoint records untouched.

## Technical Verification

prettier on changed files; resume loads.

## Technical Evidence

Pending execution.

## Drift Notes

Pending.
