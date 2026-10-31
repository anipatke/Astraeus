---
id: T-215
title: Say which moons have pictures
objective: O-050
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-switch-20261101}
---

# Say which moons have pictures

## Outcome

The docs say which moons the picture pack has pictures for, and that every other listed moon (Uranus's five named) draws flat-coloured with the pack loaded; a test keeps the list true (I-127).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `packages/astraeus-data/README.md` and the engine README (where `addBody` / `listedMoons` are described) carry the list and the sentence about the others, Miranda, Ariel, Umbriel, Titania and Oberon named.
- A test reads the picture pack's registered names and fails if either README's list differs.

## Context Files

`packages/astraeus-data/README.md`, `packages/astraeus-data/src/index.ts`, `packages/astraeus-data/src/pictures.ts`, `packages/astraeus/README.md`.

## Design References

None.

## Guardrails

PROV-02, TEST-01, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Read the registered picture names; write both README passages; add the test.

## Boundaries

Docs and one test only; no new pictures.

## Technical Verification

Focused test; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
