---
id: T-320
objective: O-076
title: Find the constellation for a direction and name outlines apart
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-320, reason: 'Owner said "orchestrate o76" (orchestrate O-076) under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: plan-o076-20261116}, recorded_at: '2026-11-16T09:29:54Z'}
planned_by: {role: planner, session: plan-o076-20261116}
planned_reads: [packages/astraeus-data-constellations/src/index.ts, packages/astraeus-data-constellations/tests/constellations.test.ts, packages/astraeus-data-constellations/tests/data.test.ts, packages/astraeus-data-constellations/data/provenance.json, packages/astraeus-data-constellations/README.md, packages/astraeus-data-constellations/CHANGELOG.md]
planned_writes: [packages/astraeus-data-constellations/src/index.ts, packages/astraeus-data-constellations/src/finder.ts, packages/astraeus-data-constellations/tests/finder.test.ts, packages/astraeus-data-constellations/tests/constellations.test.ts, packages/astraeus-data-constellations/README.md, packages/astraeus-data-constellations/CHANGELOG.md]
---

# Find the constellation for a direction and name outlines apart

## Outcome

`astraeus-data-constellations` answers which of the 88 constellations holds any J2000 direction (`constellationFinder()`), and `constellations(..., { outlines: true, outlineLabel })` lets an app name outlines apart from figures (Zodiac review F-10, F-15).

## User Check

None required; proven by Node tests.

## Done When

- `constellationFinder(): Promise<(direction: { readonly raDeg: number; readonly decDeg: number }) => string>` loads `boundaries.json` once (cached across calls) and returns a synchronous function giving the IAU abbreviation; both Serpens loops answer `"Ser"`. RA is taken modulo 360; `decDeg` outside -90..90 or a non-finite number throws `RangeError` naming the field.
- Containment is a spherical point-in-polygon over the J2000 outlines (edges as great-circle arcs between the listed points, which are dense), correct across the 0/360 seam and for the loops around both celestial poles (Oct, UMi). Every direction gets exactly one answer: a direction on a shared edge resolves deterministically (document the rule); if a direction lands in no loop or in more than one because of rounding, the rule picks one and a test pins it.
- Tests: one table over named directions with known answers (for example Betelgeuse 88.79/7.41 -> Ori, Polaris 37.95/89.26 -> UMi, Sirius 101.29/-16.72 -> CMa, Spica -> Vir, Antares -> Sco, both poles, RA 0 and 359.99 at a few declinations, a point in each Serpens part); the Sun's J2000 direction at a date in each zodiac stretch including Ophiuchus (from the engine's public `stateOf`/look-out direction or a cited table, whichever is public and simple); a sweep over a coarse whole-sky grid proving every direction gets exactly one answer; for each of the 88 at least one grid direction answers it. Bad inputs throw.
- `ConstellationsOptions.outlineLabel?: (name: string) => string`, applied to each outline's label (`name` is the label it would have had, e.g. `"Aries"`, `"Serpens Cauda"`); a non-function or a function returning a non-string or empty text throws `RangeError`. Without it labels are byte-identical to 0.9.1 (existing tests unchanged).
- README section for the finder and the option (under `Add constellations to a scene` or a new sibling heading); CHANGELOG `Unreleased` entry; configured gates pass. No engine change; peer stays `>=0.9.0 <0.10.0`.

## Context Files

- `packages/astraeus-data-constellations/src/index.ts`
- `packages/astraeus-data-constellations/tests/constellations.test.ts`
- `packages/astraeus-data-constellations/tests/data.test.ts`
- `packages/astraeus-data-constellations/data/provenance.json` (`crossCheck` and `precession` only)
- `packages/astraeus-data-constellations/README.md` under `Add constellations to a scene`
- `packages/astraeus-data-constellations/CHANGELOG.md` (top only)
- `.savepoint/objectives/O-076-constellation-data-and-0-9-2-notes/Objective.md`

## Design References

Design `Public API shape (G-016, owner 2026-11-01)`. Objective O-076 `Design Decisions` D1, D2.

## Guardrails

ARCH-01, PROV-01, API-04, API-07, TEST-01..03.

## Implementation Plan

1. Write the finder in its own file (`src/finder.ts`): unit vectors, a per-loop containment test, a seam- and pole-safe rule; cache the loaded outlines.
2. Export it from `src/index.ts`; add `outlineLabel` to `constellations`.
3. Tests as above (one table across kinds), README, CHANGELOG.

## Boundaries

No engine change, no events helpers for boundary crossings, no change to the data files or default labels, no precession beyond J2000.

## Technical Verification

Focused tests while iterating; configured gates at handoff (the package's tests run in `npm test`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record the finder's edge rule and file for Design reconciliation before the Full Objective Check.
