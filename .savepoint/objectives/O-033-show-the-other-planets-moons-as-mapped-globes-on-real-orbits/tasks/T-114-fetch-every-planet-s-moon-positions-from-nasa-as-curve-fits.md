---
id: T-114
title: Fetch every planet's moon positions from NASA as curve fits
objective: O-033
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
lane: data
planned_writes: [tools/import/horizons-moons.mjs, tools/import/horizons-moons-fit.json, data/ephemerides/README.md, data/ephemerides/planets/planets.json]
---

# Fetch every planet's moon positions from NASA as curve fits

## Outcome

The core data holds NASA-checked positions for every moon Horizons lists around Mars, Saturn, Uranus, Neptune and Pluto, and positions for Saturn, Uranus, Neptune and Pluto themselves, in the same compact curve-fit form as Jupiter's, so any experience can place them.

## User Check

Read the Task evidence: one table per system with moon count, worst and typical error against Horizons, and bytes per year; Jupiter's files unchanged.

## Done When

1. `tools/import/horizons-moons.mjs` takes a system (barycentre NAIF id, centre body, GM, fastest period, output folder) instead of Jupiter constants; Jupiter is one entry; rerunning Jupiter from the cache writes byte-identical `data/ephemerides/jupiter-moons/` (proof: checksum list before and after).
2. `data/ephemerides/<planet>-moons/` for Mars, Saturn, Uranus, Neptune and Pluto (Pluto system barycentre, NAIF 9), 2010-2030, metre-level fits with measured errors in each `index.json`, as O-025 T-096 did.
3. Saturn, Uranus and Neptune added to `data/ephemerides/planets/planets.json` from VSOP87A by the existing planet-fit path, each checked against Horizons at the six dates; Pluto's heliocentric series as a Horizons fit, with its error; the planet-series loader accepts them (`isPlanetId`) with tests.
4. Data README updated (systems, rebuild command, sizes); Node version used recorded (needs 22.18+).

## Context Files

`tools/import/horizons-moons.mjs`, `tools/import/horizons-moons-policy.mjs`, `tools/import/horizons-moons-measure.mjs`, `tools/import/horizons-client.mjs`, `tools/import/horizons-moons-fit.json`, `data/ephemerides/README.md`, `data/ephemerides/jupiter-moons/index.json`, `data/ephemerides/planets/planets.json`, `src/core/planetSeries.ts`, `src/core/planetModels.ts`, `src/core/chebyshevEphemeris.ts`, `tests/jupiterMoonsEphemeris.test.ts`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/tasks/T-096-store-jupiter-s-moon-positions-as-nasa-checked-curve-fits-in-the-core-data.md`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/tasks/T-101-show-off-the-curve-fits-on-the-home-page-and-move-planet-positions-to-curve-fits-if-smaller.md`.

## Design References

Design: core row (curve-fit provider), `data/ephemerides/` row, Planets.

## Guardrails

ARCH-01, ARCH-04, PROV-01, DATA-01, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Lift the Jupiter constants into a system table; prove Jupiter byte-identical.
2. Fetch, calibrate, build and verify each new system (resumable cache).
3. Add the three planets' VSOP87A fits and Pluto's Horizons fit; extend the planet ids and tests.
4. Record sizes and errors.

## Boundaries

Data and tools only: no bodies, visuals or experience wiring (later Tasks). Never overwrite Jupiter's data unless byte-identical.

## Technical Verification

Configured gates; offline rerun reproduces every index; evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
