---
id: T-320
objective: O-076
title: Find the constellation for a direction and name outlines apart
status: done
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

Per criterion:
- Finder: `constellationFinder()` (src/index.ts, cached promise, cleared on a failed load) over `buildFinder`/`buildMatcher` in `src/finder.ts`; synchronous result, Serpens loops answer "Ser", RA modulo 360, `RangeError` naming `raDeg`/`decDeg`/`direction` for bad input. Test: bad-input table (9 cases).
- Containment: great-circle edges, ray cast along the direction's meridian to the north pole with half-open crossings; a loop whose RA winds 360 degrees is a polar loop (north when mean dec > 0, so UMi; south, so Oct). Test table `known` (24 directions: 8 named stars, both poles at two RAs, the seam at RA 0 and 359.99 for dec +60, +40, 0, -30, RA +/-360, both Serpens parts) plus 13 Sun dates through Sgr, Cap, Aqr, Psc, Ari, Tau, Gem, Cnc, Leo, Vir, Lib, Oph, Sgr.
- Sun source: engine public `scene.stateOf("earth", date).positionKm` (Earth about the Sun, negated gives the geocentric J2000 direction); expected constellations from the IAU boundary date ranges, stated in the test. Not invented.
- Edge rule: see Drift Notes. Test pins 12 corners shared by 3+ constellations (exact vertex and RA+360) to the alphabetically first owner.
- Grid sweep: 1.5-degree dec rows, RA step scaled by 1/cos(dec), over 15000 points; each is enclosed by exactly one loop by the containment test alone (`enclosing`), `find` agrees, and the answers cover exactly the 88 abbreviations.
- `outlineLabel`: applied to each outline label (Serpens Caput/Cauda included), figures untouched, other fields identical; non-function, empty result, non-string result throw `RangeError`; labels without it equal the 0.9.1 ones (existing tests untouched, still pass).
- README: new "Which constellation holds a direction" section and `outlineLabel` in the options list. CHANGELOG `Unreleased` entry added.

Gates (once, at handoff): `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm test` 264 files passed, 4043 tests passed, 2 skipped (4045), incl. the publishable-packages pack check (src/finder.ts ships through the `src` entry in `x-publish.files`; no build tool change needed).

Files changed: packages/astraeus-data-constellations/src/finder.ts (new), src/index.ts, tests/finder.test.ts (new), README.md, packages/astraeus/CHANGELOG.md (the planned `packages/astraeus-data-constellations/CHANGELOG.md` does not exist; the shared changelog of the monorepo holds package notes, so the entry went there at its top). No existing test changed. No limit, lint rule or allowlist touched.

Extra reads: packages/astraeus/CHANGELOG.md (top only, to place the entry); packages/astraeus-data-constellations/package.json (exports, files, peer, to see whether the new file needs listing; it does not).

## Drift Notes

Finder file: `packages/astraeus-data-constellations/src/finder.ts`. Edge rule: a direction within 1e-9 radian of any outline edge answers the alphabetically first abbreviation among the constellations whose edge it is on; else the (alphabetically first) loop that encloses it; else, if rounding leaves it in none, the constellation of the nearest edge (first on a tie). Design `Public API shape` should list `constellationFinder` and `ConstellationsOptions.outlineLabel`. J2000 only.

- Coordinator (2026-11-16T09:35:00Z): accepted the deviations (the constellations package has no CHANGELOG of its own, so the entry is in the shared `packages/astraeus/CHANGELOG.md`; extra read of its package.json logged). Gates pass (lint, typecheck, build, test 264 files / 4043 passed / 2 skipped); marked done per the owner's "orchestrate o76".
