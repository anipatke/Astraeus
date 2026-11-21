---
id: O-090
title: Docs that match the code
status: planned
depends_on: [O-086, O-088]
release: G-024
priority: medium
rank: 9
---

# O-090: Docs that match the code

## Outcome

The root README, the API reference intro, the engine README and the guides state current facts, and counts that drift (workspaces, browser steps, timings, sizes) come from source-owned definitions or tests rather than prose.

## Why

AH-38 (all three): the README says five workspaces (13), VSOP87A planets (DE441 fits), a browser check "under a minute" with two journeys and "Later: package the engine"; the API reference opens "0.2 preview" on 0.9.5; several docs repeat 230 s. Design.md mixes history with current state.

## Success Conditions

- Every contradiction listed in the review fixed; history moved under clearly marked history headings or linked notes.
- Counts and scenario lists linked to source definitions, or checked by a test.
- A read-through against the code by a fresh session finds no false statement in the top-level docs.

## Architectural Considerations

Read-by-section rule for Design.md and the engine README.

## Boundaries

**In scope:**
- README, API reference generator intro, engine README, guides under docs/, Design.md current-state sections.

**Out of scope:**
- Rewriting archived history or Savepoint records.
