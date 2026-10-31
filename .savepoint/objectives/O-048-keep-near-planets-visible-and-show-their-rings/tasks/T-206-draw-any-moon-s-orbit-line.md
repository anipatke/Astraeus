---
id: T-206
objective: O-048
title: Draw any moon's orbit line
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-2-20261031}
---

# Draw any moon's orbit line

## Outcome

`addBody(moon, { orbit: true })` works for any catalogued moon by one rule, its period from the catalogue's own data and drawn about its planet, instead of a list naming the Moon and Io (I-119).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `ORBITS` (`src/api/scene.ts:85`) is replaced by a rule over the catalogue (ARCH-05: the period read once from the moon's catalogue record or mean elements); the Moon and Io draw exactly as before (test).
- Europa, Titan and a small moon draw their orbit line about their planet; a moon whose data has no period or position source is refused with `no-orbit` at `toDefinition` naming why.
- Where the demos' body-set orbit layer (`src/app/OrbitSetView.ts`) already does this, reuse its drawing rather than adding a second one, or state why the composition path is the right one.
- Tests on a made-up scene; README `addBody` row; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/app/OrbitSetView.ts`, `packages/astraeus/src/core/satelliteMeanElements.ts`, `packages/astraeus/src/core/bodies/moonSystem.ts`, `packages/astraeus/tests/moonOrbits.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Read how the Moon and Io lines are composed and how the body-set layer draws moon orbits.
3. Generalise to one rule; tests; docs.

## Boundaries

No new orbit looks.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
