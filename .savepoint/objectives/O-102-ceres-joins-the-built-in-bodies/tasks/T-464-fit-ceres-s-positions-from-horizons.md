---
id: T-464
title: Fit Ceres's positions from Horizons
objective: O-102
status: planned
check_waiver: {task: T-464, reason: 'Owner said "orchestrate O-102" (G-028, 2026-11-27): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o102-20261127}, recorded_at: '2026-11-27T00:00:58Z'}
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g028-20261127}
lane: fit
planned_reads: [packages/astraeus/tools/import/planet-fits.mjs, packages/astraeus/tools/import/horizons-client.mjs, packages/astraeus/data/ephemerides/planets/planets.json, packages/astraeus/src/core/planetModels.ts, packages/astraeus/tests/planetFits.test.ts, packages/astraeus/tests/planetFitErrors.test.ts]
planned_writes: [packages/astraeus/tools/import/planet-fits.mjs, packages/astraeus-data/data/positions/ceres.json, packages/astraeus/tests/ceresFit.test.ts]
---

# Fit Ceres's positions from Horizons

## Outcome

`packages/astraeus-data/data/positions/ceres.json` holds a Chebyshev fit of Ceres's Sun-centred position 1950 to 2045 from JPL Horizons, in exactly the format of one planet entry in `packages/astraeus/data/ephemerides/planets/planets.json` (same frame, unit, argument and time scale), within 1 km of Horizons at independent dates. It is not added to `planets.json` (G-028 Decision 3: not in the first download).

## User Check

None (data step; the owner sees Ceres move in T-468).

## Done When

- `planet-fits.mjs` can fit a Sun-circling small body: a `ceres` source using Horizons command `1;` (small-body record 1 Ceres; confirm the exact COMMAND string that returns Ceres and not another body, and record it), centre `500@10`, written to its own output file, not into `planets.json`. The planets' output is byte-identical after the change (run the tool's existing check or diff `planets.json`).
- The fit meets the tool's `TARGET_KM` (1 km) at independent dates 1950 to 2045; the measured maximum error is recorded in the file's header fields as the planets record theirs, and in Technical Evidence.
- File size recorded (raw and gzip). If it exceeds 60 KB raw, stop and report with the size before going further.
- New `packages/astraeus/tests/ceresFit.test.ts` (TEST-01): the file loads in the planet-series reader's format, covers 1950-01-01 to 2045-01-01, and matches three archived Horizons positions (kept as a small fixture, not fetched) within 1 km.
- Existing tests unchanged and passing.

## Context Files

`packages/astraeus/tools/import/planet-fits.mjs`, `packages/astraeus/tools/import/horizons-client.mjs`, `packages/astraeus/src/core/planetModels.ts`, `packages/astraeus/tests/planetFits.test.ts`. Read `planets.json` only by its top-level keys and one planet's entry shape.

## Design References

`.savepoint/Design.md` under `Planet positions from Horizons`.

## Guardrails

PROV-01, PROV-02, DATA-01, TEST-01..04, STYLE-07.

## Implementation Plan

1. Read how `planet-fits.mjs` fetches, fits, measures and writes one planet.
2. Add a small-body source path and an output option; keep the planet path unchanged.
3. Fetch (the tool caches in `.horizons-cache`), fit, measure, write `ceres.json` with source, solution and access date.
4. Add the test with an archived fixture.

## Boundaries

No engine runtime code; no change to `planets.json`; no other asteroid.

## Technical Verification

Focused: the new test and `planetFits`/`planetFitErrors`. Handoff gates per `docs/agents/verification.md` and `docs/agents/build.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record the Horizons command used and the solution name (e.g. JPL#) for T-467's provenance text.
