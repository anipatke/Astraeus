---
id: T-105
title: Point the astronomy validation notes at the moon orbit report
objective: O-019
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o018-o019-rescope-20261018}
---

# Point the astronomy validation notes at the moon orbit report

## Outcome

`docs/ASTRONOMY_VALIDATION.md` carries a short section on the moons and Pluto against Horizons, pointing at `docs/MOON_ORBITS.md`, and Io's section states the two Io figures, so O-019 Success Condition 4 is met.

## User Check

Open `docs/ASTRONOMY_VALIDATION.md`: a "Moons and Pluto against Horizons (O-019 / T-078)" section exists and links the report; Io's section names both Io figures.

## Done When

1. A section "Moons and Pluto against Horizons (O-019 / T-078)": what was measured, the classes, the Saturn finding (not usable as published; carried to O-033), and a pointer to `docs/MOON_ORBITS.md` and `tests/moonOrbits.test.ts`. Figures are copied from `docs/MOON_ORBITS.md`, never re-derived.
2. Io's section ("Io about Jupiter (O-014 / T-049)") adds that on T-078's six dates the generic mean-element path gives 4,196 km largest error against the shipped definition's 9,388 km, and that the duplication is carried to O-033.
3. Gates: `npx tsc --noEmit`, `npx vitest run`, `npm run build` (documentation only; record that no code changed).

## Context Files

`docs/ASTRONOMY_VALIDATION.md`, `docs/MOON_ORBITS.md`, `.savepoint/objectives/O-019-put-every-moon-on-its-real-orbit-around-its-planet/Objective.md`, `.savepoint/objectives/O-019-put-every-moon-on-its-real-orbit-around-its-planet/tasks/T-078-gather-each-moon-s-real-orbit-and-measure-it-against-jpl-horizons.md`.

## Design References

Design providers; Codebase Map row for `data/orbits/`.

## Guardrails

PROV-01.

## Implementation Plan

1. Add the section from T-078's drift note and the report.
2. Add the Io sentence.
3. Run the gates.

## Boundaries

Documentation only. No code, data, Design or other doc changes.

## Technical Verification

Configured gates; evaluated under `agent-skills/references/check-method.md` within the O-019 Full Objective Check.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
