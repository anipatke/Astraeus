---
id: T-210
title: Give every listed moon an orbit period and a slim lookup
objective: O-049
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-3-20261031}
---

# Give every listed moon an orbit period and a slim lookup

## Outcome

Each moon in the engine's moon lists (`data/moons/<planet>.json`) carries a sidereal orbit period from JPL Planetary Satellite Mean Elements with its source recorded, and a generated slim table holds what `addBody` needs for every listed moon (id, label, mean radius, parent, period, data package) without loading the full lists (I-122).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- The moon-list importer (`tools/import/planet-moon-catalogues.mjs`, `tools/import/jupiter-moon-catalogue.mjs`) adds `orbitPeriodDays` per moon from JPL SSD mean elements (transcribed into the facts file like size and family, dated, source `jpl-sat-elem`); a moon without a published period has none and the list says so. Re-running the importer reproduces the committed lists.
- A generated slim table (one small module, built by a script or the importer) lists every moon with an `ephemeris` pointer: id, label, mean radius, parent, period, data package and fit-set body. A test fails if it disagrees with the lists.
- Importing the slim table from the engine's main entry adds about 25 kB raw (~8 kB gzip) or less to the first download (`npm run build`, `node tools/measure-example.mjs`); stated in the CHANGELOG line. The full lists stay out of the first download.
- Periods agree with the 14 existing `data/orbits/` records within 0.5% (test).

## Context Files

`packages/astraeus/tools/import/planet-moon-catalogues.mjs`, `packages/astraeus/tools/import/jupiter-moon-catalogue.mjs`, `packages/astraeus/tools/import/planet-moon-facts.json`, `packages/astraeus/src/assets/moonCatalogue.ts`, `packages/astraeus/src/core/bodies/outerPlanetData.ts`, `packages/astraeus/src/core/siderealPeriod.ts`, `packages/astraeus/data/moons/uranus.json`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` and the O-048 paragraph "Near planets and rings (O-048)".

## Guardrails

ARCH-01, ARCH-03, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Transcribe periods from JPL SSD mean elements into the facts; extend the importer; regenerate the lists.
3. Generate the slim table; add the agreement and period tests.
4. Measure first download; CHANGELOG.

## Boundaries

No change to `addBody` yet (next step), to positions, fits, pictures or looks.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
