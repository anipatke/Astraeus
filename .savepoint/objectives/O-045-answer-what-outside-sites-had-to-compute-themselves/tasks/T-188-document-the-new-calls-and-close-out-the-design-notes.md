---
id: T-188
title: Document the new calls and close out the design notes
objective: O-045
status: planned
depends_on: [{task: T-185, requires: clear}, {task: T-186, requires: clear}, {task: T-187, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o045-planning-20261028}
---

# Document the new calls and close out the design notes

## Outcome

The README, API reference doc comments and CHANGELOG describe every O-045 addition as shipped, and Design is reconciled for all of O-045. This is the O-045 integration step for deferred Design notes.

## User Check

None required; the owner may read the README diff.

## Done When

- README (`packages/astraeus/README.md`) shows, with short examples: asking where any body is (`stateOf`), reading accuracy (`provenanceOf`, the limits and `classifyPositionError`), validating a record (`parseElementsBodyRecord`), fitting an orbit (`camera.fitOrbit`), and labelling events (`"modelled"`, per-event provenance).
- CHANGELOG `Unreleased` lists each O-045 addition and behaviour change.
- `.savepoint/Design.md` reconciled: every Drift Note from the other O-045 Tasks accounted for as reflected or non-architectural, with a reason.
- Every README claim matches the code at this commit (no claims for features not shipped).
- Hand-off gates green, including the API reference doc-comment test.

## Context Files

`packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md` under `Unreleased`, `packages/astraeus/src/api/index.ts`, `.savepoint/Design.md`, the other three O-045 Task files.

## Design References

Design Interfaces and Data Flow (public API layer); Current Technical State.

## Guardrails

TEST-01, STYLE-07, STYLE-08.

## Implementation Plan

1. Read what the other three O-045 Tasks shipped (their evidence and Drift Notes).
2. Write README examples, CHANGELOG entries and any missing doc comments.
3. Reconcile Design.

## Boundaries

No code behaviour change; no docs for features outside O-045.

## Technical Verification

Hand-off gates (the doc-comment test covers the API reference). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

This Task is the O-045 integration step for deferred Design notes.
