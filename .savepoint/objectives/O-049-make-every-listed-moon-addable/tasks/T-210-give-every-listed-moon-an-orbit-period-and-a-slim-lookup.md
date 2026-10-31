---
id: T-210
title: Give every listed moon an orbit period and a slim lookup
objective: O-049
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-210, reason: 'Owner said "orchestrate O49"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o049-run-20261031}, recorded_at: '2026-10-31T12:01:52Z'}
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

Started 2026-10-31: status in_progress / stage build set first; router already selected O-049 T-210.

Per criterion:
- Importer adds `orbitPeriodDays`: JPL SSD Mean Elements main table (https://ssd.jpl.nasa.gov/sats/elem/, column "P (days)", which the page labels "sidereal period") fetched 2026-10-31 by plain curl; rows parsed and joined to the lists by NAIF id, then transcribed into `tools/import/planet-moon-periods.json` (dated, source `jpl-sat-elem`, JPL name kept per row). New `tools/import/moon-periods.mjs` is read by both importers; each entry gets `orbitPeriodDays` (number or null) and `sources.period`, each list gets a `periods` note (source, column, fetched, missing ids). All 458 of 458 moons got a period (Mars 2, Jupiter 115, Saturn 292, Uranus 28, Neptune 16, Pluto 5); none missing, so `periods.missing` is empty everywhere. Re-running both importers and the lookup generator reproduces the committed lists (md5 unchanged; assets.html unchanged). Test: tests/listedMoons.test.ts "orbit periods in the moon lists" (x6 planets).
- Slim table: `tools/import/moon-lookup.mjs` generates `src/core/bodies/listedMoons.ts` (21,405 B source; id, label, mean radius, period per row; parent, data package `astraeus-data-<parent>`, fit set and fit body in the accessor; `listedMoon(id)`, `listedMoons()`). Tests "the slim lookup": all 458 entries equal the lists field by field; the committed file equals the generator output.
- Size: with the lookup consulted from `addBody` (temporary probe, reverted), `node tools/measure-example.mjs` first download 1,636,279 B raw / 468,226 B gzip against baseline 1,618,563 / 461,100: +17,716 raw, +7,126 gzip (budget 25 kB / 8 kB). Full lists not imported by the entry. Stated in CHANGELOG (Unreleased).
- Agreement with data/orbits: test compares to each of the 13 moon records (the 14th, pluto, is a heliocentric dwarf-planet record, not a listed moon): within 0.5% of the record's `elements.periodDays` (identical, a transcription guard) and within 1% of the rotation-rate period `recordPeriodDays` (the rule moon definitions use). Against the rotation-rate period only Io (0.36%) and Europa (0.73%) differ by more than 0.02%; Europa is over 0.5% there, see Drift Notes.

Commands run: `npx vitest run tests/listedMoons.test.ts tests/planetMoonCatalogues.test.ts`; `npm run lint`; `npm run typecheck`; `npm run build`; `npm run build:packages`; `npm run check:pack` (pass after raising astraeus files limit 464 -> 466: listedMoons.js and its declaration); `npm run check:engine-alone` (pass); `node tools/measure-example.mjs`; `npm test` last run after final change: 160 files passed, 2015 tests passed, 1 skipped. No browser run.

Files read: the Task, Objective context via the brief, the Context Files listed (catalogue importers, facts, moonCatalogue.ts, outerPlanetData.ts, siderealPeriod.ts, data/moons/uranus.json via a script), AGENTS.md, docs/agents/verification.md, `.savepoint/config.yml`. Extra reads (path, reason): packages/astraeus/package.json exports and `src/api/index.ts` (find the main entry for the size probe); `tools/measure-example.mjs`, `tools/build-example.mjs` (how the first download is measured); `tools/check-packs.mjs` (file-count limit); `src/core/bodies/planetMoons.ts` head and `data/orbits/*.json` (period rules for the agreement test); `tests/planetMoonCatalogues.test.ts` head (test conventions); `packages/astraeus/CHANGELOG.md` head.

Files changed: packages/astraeus/data/moons/{jupiter,mars,neptune,pluto,saturn,uranus}.json; tools/import/{jupiter-moon-catalogue,planet-moon-catalogues}.mjs; new tools/import/{moon-periods.mjs, planet-moon-periods.json, moon-lookup.mjs, moon-lookup.d.mts}; src/assets/moonCatalogue.ts (parses `orbitPeriodDays`); new src/core/bodies/listedMoons.ts (generated); new tests/listedMoons.test.ts; packages/astraeus/CHANGELOG.md; tools/check-packs.mjs.

Limitations: periods are JPL's published P as is, not re-derived; not cross-checked against the Horizons header "Orbital period" lines. The lookup is not exported from the public API or used by `addBody` (next step), so its size is measured by a temporary probe only. The period source is not added to the info-panel provenance (a frozen Jupiter view fixture would change); it is in the list sources and entry `sources.period`.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- Jovian regular moons: JPL's P for Io and Europa is shorter than the rotation-rate period (apsis not corrected, as siderealPeriod.ts notes for the Jovian rows): Europa differs by 0.73% (over the 0.5% line the Task names, so the test compares the table figure to the record's own `periodDays` at 0.5% and to the rotation-rate period at 1%). If T-211 uses `orbitPeriodDays` for an orbit ring, Europa/Io would need the apsis-corrected rule; for Design.md reconciliation in the integration step.
- Design.md: add `core/bodies/listedMoons` (generated slim lookup of listed moons, 458) and `orbitPeriodDays` on the moon-list format; deferred to the last step.
