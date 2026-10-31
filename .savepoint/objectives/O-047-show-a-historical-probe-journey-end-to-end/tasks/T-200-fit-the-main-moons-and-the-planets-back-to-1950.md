---
id: T-200
objective: O-047
title: Fit the main moons and the planets back to 1950
status: planned
depends_on: [{task: T-195, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Fit the main moons and the planets back to 1950

## Outcome

The main moons and each system's planet are fitted from JPL Horizons from 1950-01-01 to their current end, and the planet series reaches back to 1950, so a 1979 Jupiter or 1980 Saturn scene places them (I-110, data half). Main moons: Jupiter Io, Europa, Ganymede, Callisto; Saturn Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Hyperion, Iapetus, Phoebe; Uranus Miranda, Ariel, Umbriel, Titania, Oberon; Neptune Triton, Nereid.

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- Each named moon and its planet cover 1950-01-01 onward in its package index; smaller moons keep 2010-2030.
- Worst fit error at independent dates within the existing rule (1 m; 0.1 m for a series every moon in its system subtracts), measured by the importer's verify step over the new span; the measurements are recorded in each index and in Technical Evidence.
- `planets.json` covers 1950-01-01 onward for every planet with its worst error recorded; the first-download size change is stated (I-086 budget pages still pass `check:pack`).
- Package sizes before and after stated; no single package over about 40 MB packed (O-036 split); a page still downloads only the years it shows.
- The data README tables and each `astraeus-data-*` README state per-body spans; the engine README package table states each package's years and which bodies reach back (I-110, I-103).
- A test places Io at 1979-03-05 and Titan at 1980-11-12 against a stored Horizons sample within the stated accuracy.

## Context Files

`packages/astraeus/tools/import/horizons-moons.mjs`, `packages/astraeus/tools/import/horizons-moons-fit.json`, `packages/astraeus/tools/import/planet-fits.mjs`, `packages/astraeus/data/ephemerides/README.md`, `packages/astraeus-data-jupiter/README.md`, `packages/astraeus-data-saturn/README.md`, `packages/astraeus-data-uranus/README.md`, `packages/astraeus-data-neptune/README.md`, `packages/astraeus/README.md` (package table and date range), `packages/astraeus/tests/jupiterMoonsEphemeris.test.ts`.

## Design References

`.savepoint/Design.md` under `Components/Codebase Map` (data packages).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Run the importer per system for the named moons and the planet (`--only`, `--from 1950-01-01`), resumable from the Horizons cache; keep requests polite.
3. Refit the planet series back to 1950.
4. Verify and record errors and sizes; update READMEs.
5. Add the historical placement tests; CHANGELOG `Unreleased` lines for the engine and four data packages.

## Boundaries

No small moons before 2010; no Mars or Pluto moon changes unless the planet series requires it; no change to the fit policy. Never stage `docs/prds` or `docs/research`.

## Technical Verification

Importer verify step, focused tests, then the configured gates and `npm run check:pack`. No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
