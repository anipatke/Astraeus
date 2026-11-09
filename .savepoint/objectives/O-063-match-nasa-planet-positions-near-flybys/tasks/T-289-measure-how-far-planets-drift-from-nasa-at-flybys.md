---
id: T-289
title: Measure how far planets drift from NASA at flybys
objective: O-063
status: planned
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o061-run-20261110}
---

# Measure how far planets drift from NASA at flybys

## Outcome

A short research note at `docs/architecture/planet-accuracy-o063.md` (not `docs/research/`, which is the owner's folder) that measures the engine's planet positions against JPL Horizons at the Voyager 1 and 2 flybys of Jupiter, Saturn, Uranus and Neptune (and at one made-up date per planet away from any flyby), names the cause of each difference, and recommends one general fix with its cost (accuracy gained, download size, years covered, effort), plus the honest alternative of stating the measured error in provenance and doing nothing else. The owner chooses from the note before any fix Task is planned.

## User Check

The owner reads the note's one-screen summary (a plain table: planet, date, how far off in km and in the planet's own radii, why) and picks the fix or "state it and stop".

## Done When

For each planet and date: engine position (heliocentric and as seen from the Sun-centred scene a probe app uses) vs Horizons (state the exact Horizons settings: centre, frame, ecliptic or equatorial J2000, TDB/UT, aberration off), difference in km, in planet radii, and as an angle seen from the probe at closest approach; flyby dates taken from a cited source, not memory. Cause named per row (for example: VSOP87A's own error, heliocentric vs barycentric centre, Sun vs solar-system barycentre, time scale, frame rotation, the Chebyshev refit), each shown by a measurement, not asserted. Whether Voyagers' re-placing came from the engine or from how the samples were centred is answered. The recommendation names the general fix (no special case for a probe or a planet, owner 2026-10-30 strategic fix first) and what the provenance should say. Horizons data used is saved as a small test fixture with source and retrieval date (PROV-01).

## Context Files

`packages/astraeus/src/core/planetModels.ts`, `packages/astraeus/src/core/planetSeries.ts`, `packages/astraeus/src/core/astronomyAdapter.ts`, `packages/astraeus/tests/chebyshevEphemeris.test.ts`, `tools/import/planet-fits.mjs`, `packages/astraeus/README.md` (planet years and accuracy rows), `.savepoint/issues/I-154-engine-planet-positions-drift-from-jpl-horizons-near-flybys.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (planet series, journeys across years O-047).

## Guardrails

ARCH-05, PROV-01, DATA-01, TEST-01.

## Implementation Plan

1. Read how the engine computes a planet's position and what it is fitted from.
2. Fetch the Horizons vectors needed (one request per planet, a few epochs each), save them as a fixture.
3. Write a measurement test or script that compares and prints the table; keep it as a test that asserts today's measured error, so a later fix shows its gain.
4. Separate each cause by measurement; write the note with the recommendation and its cost.

## Boundaries

No change to the engine's positions or data in this step. No probe or mission data in the engine (the flyby dates only pick epochs). Network use limited to JPL Horizons.

## Technical Verification

`npm run lint`, `npm run typecheck`, the new measurement test and `npm test`; no browser check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
