---
id: T-115
title: List every planet's moons in families with their sources
objective: O-033
status: in_progress
stage: build
depends_on: [{task: T-114, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
lane: data
planned_writes: []
---

# List every planet's moons in families with their sources

## Outcome

The core data lists every moon of Mars, Saturn, Uranus, Neptune and Pluto with its name, size, discovery year, family and sources, in the same form as Jupiter's list, so the moons panel can group them.

## User Check

Read the Task evidence: each planet's families with their moon counts and the source each family comes from.

## Done When

1. `data/moons/<planet>.json` for mars, saturn, uranus, neptune and pluto in `data/moons/jupiter.json`'s format, parsed by `src/assets/moonCatalogue.ts` unchanged (or extended generically with tests); moon ids match the fit indexes from the previous Task.
2. Families cited (for example Saturn's Inuit, Gallic and Norse groups and its regular moons; Uranus's and Neptune's regular and irregular moons); where membership comes from a compilation, the compilation and its primary citation are recorded, as O-025 Decision 2026-10-18 did for Jupiter. Moons with a Planetary Explorer map are marked mapped.
3. Sizes marked estimate where brightness-based; tests load each list and check counts against the fit index.

## Context Files

`data/moons/jupiter.json`, `src/assets/moonCatalogue.ts`, `src/assets/bodies/jupiterMoonCatalogue.ts`, `tests/jupiterMoonCatalogue.test.ts`, `data/bodies/catalogue.json`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/tasks/T-097-add-jupiter-s-moon-list-and-families-to-the-core-data-with-the-four-mapped-moons.md`.

## Design References

Design: `data/moons` row, moons panel row.

## Guardrails

ARCH-01, PROV-01, TEST-01, STYLE-07, STYLE-09.

## Implementation Plan

1. Read each system's Horizons list (cached by the previous Task).
2. Source families and sizes; write the lists; extend the parser only if needed.
3. Tests.

## Boundaries

Data only; no panel or scene changes.

## Technical Verification

Configured gates; evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
