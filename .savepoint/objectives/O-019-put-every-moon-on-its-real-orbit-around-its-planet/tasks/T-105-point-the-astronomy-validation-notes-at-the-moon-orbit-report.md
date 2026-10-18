---
id: T-105
title: Point the astronomy validation notes at the moon orbit report
objective: O-019
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o018-o019-rescope-20261018}
check_waiver:
    task: T-105
    reason: "Owner waived the optional Task Check and closed this Task ('Waive close'); the Full Objective Check covers it."
    actor:
        role: owner
        session: 009b0116-b8b7-4912-9273-91d589baf044
    recorded_at: "2026-10-18T10:24:07Z"
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

Executor session 009b0116-b8b7-4912-9273-91d589baf044, main checkout `o018-o019`, 2026-10-18. Extra reads: `src/core/bodies/io.ts` (grep only), to confirm the mean-element Io definition still ships after T-098, because criterion 2 calls it "the shipped definition".

Per criterion:
1. **Met.** `docs/ASTRONOMY_VALIDATION.md` gains "Moons and Pluto against Horizons (O-019 / T-078)", placed after the Io section: what was measured, the class rule, a table of the three classes with each body's largest error copied from `docs/MOON_ORBITS.md` (not re-derived), the Saturn finding (phase off by 5.5 to 157 degrees, both ways; not usable as published; carried to O-033), and pointers to `docs/MOON_ORBITS.md`, `tests/moonOrbits.test.ts` and `data/orbits/`.
2. **Met.** Io's "Horizons comparison" paragraph adds 4,196 km (generic path) against 9,388 km (shipped definition) on T-078's six dates, and that the duplication (ARCH-05) is carried to O-033. Added for accuracy: since T-098 the Jupiter demo places Io from the core Horizons curve fits (T-096), while the mean-element definition (still in `src/core/bodies/io.ts`) and its figure stay as recorded.
3. **Met.** `npx tsc --noEmit` exit 0; `npx vitest run` 74 files, 1103 passed, 1 skipped; `npm run build` exit 0. Documentation only: no code changed.

Files changed: `docs/ASTRONOMY_VALIDATION.md`, this Task, router (O-019/T-105). Limitations: none known.

## Drift Notes

None expected.
