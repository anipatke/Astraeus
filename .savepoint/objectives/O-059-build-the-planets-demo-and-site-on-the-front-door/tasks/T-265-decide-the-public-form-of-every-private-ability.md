---
id: T-265
objective: O-059
title: Decide the public form of every private ability
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
---

# Decide the public form of every private ability

## Outcome

One note lists every engine internal the planets demo and the site use, in source and tests, and gives each its destination: public feature (with its proposed name and shape), moved into the site or demo, moved into the engine's tests, or deleted. Later steps build from this note instead of guessing.

## User Check

Open `docs/architecture/o059-public-forms.md`: every row names one internal ability and where it goes, in plain words, with no row left open.

## Done When

Every deep import counted for `astraeus-demo-planets` and `astraeus-site` maps to a row. The note settles: the public shape of moon dots, the moon family panel, tagged places and the picker; where the places data lives and how the demo reaches it without `astraeus/data/*`; how fit errors, moon list facts and `moonSourceTitles` reach the demo; scene centre, desktop pictures, info card facts, items left out of the menu; page heading, loading cover and in-page address changes; which of the nine made-up scenes rebuild, which drop or move; which tests move into the engine. Each proposed name passes API-04 and ARCH-06 by reading.

## Context Files

`.savepoint/objectives/O-059-build-the-planets-demo-and-site-on-the-front-door/Objective.md`, `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-demo-planets/src/experiences/planets/planetDefinition.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`, `Experience plug-in boundary`.

## Guardrails

API-01, API-04, API-06, ARCH-01, ARCH-03, ARCH-06.

## Implementation Plan

1. List deep imports per package, split by source, tests and tools.
2. Group them by ability and give each a destination.
3. Write proposed public signatures for the four new features, following the verb grammar.
4. Record any ability with no clean public form as an open gap and return REPLAN REQUIRED; do not invent one.

## Boundaries

Research only: no code changes. No renames of existing names (O-057).

## Technical Verification

Compare the note's rows against a fresh deep-import listing; no gates needed for a docs-only step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective.
