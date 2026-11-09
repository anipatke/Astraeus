---
id: T-289
title: Measure how far planets drift from NASA at flybys
objective: O-063
status: in_progress
stage: audit
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o061-run-20261110}
check_waiver: {task: T-289, reason: 'Owner said "orchestrate O-06" (O-063) under the standing run rules (no per-step checks, coordinator marks done once gates pass and the owner has read the note, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o063-run-20261110}, recorded_at: '2026-11-09T22:49:17Z'}
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

Executor session o063-run-20261110 (builder), 2026-11-10. Stage build -> test -> audit. Step check waived by the owner (frontmatter `check_waiver`); evidence routes to the Full Objective Check.

**Files read:** router; this Task; O-063 Objective.md; I-154; `agent-skills/savepoint-task/SKILL.md`; `docs/agents/verification.md`; Guardrails ARCH-05, PROV-01, DATA-01, TEST-01; Context Files `packages/astraeus/src/core/planetModels.ts`, `planetSeries.ts`, `astronomyAdapter.ts`, `tests/chebyshevEphemeris.test.ts` (head), `tools/import/planet-fits.mjs` (header, time and truth sections; the Task's path `tools/import/planet-fits.mjs` lives at `packages/astraeus/tools/import/`), `packages/astraeus/README.md` (planet years rows). Design.md `Interfaces and Data Flow` (journeys across years paragraph, via grep).

**Extra reads (logged):** `packages/astraeus/tools/import/horizons-client.mjs` (reuse the paced, cached Horizons client); `src/core/bodies/planetMoons.ts` lines 60-95 and `outerPlanets.ts`/`jupiter.ts`/`planetRecords.ts` provenance lines (how a planet is placed and what accuracy it states today); `tests/planetFits.test.ts` head (how the full VSOP87A series is evaluated in a test); `docs/ASTRONOMY_VALIDATION.md` grep (prior fit figures); the Voyagers app read-only, `/home/user/code/voyagers/data/horizons/*` headers, `src/data/enginePlanets.ts`, `src/data/probe.ts` grep and `docs/astraeus-feedback.md` (the "Engine planets differ from Horizons" entry), to answer how Voyagers centred its samples. Nothing written outside this repository.

**Files changed:** `docs/architecture/planet-accuracy-o063.md` (new note); `packages/astraeus/tests/planetAccuracyFlybys.test.ts` (new measurement test, 7 tests); `packages/astraeus/tests/fixtures/planet-accuracy-o063-horizons.json` (new fixture, 87 KB, Horizons DE441, retrieved 2026-11-10, settings inside); `packages/astraeus/tools/import/planet-accuracy-fetch.mjs` (new fetch tool, 15 Horizons requests, raw replies in the git-ignored cache); this Task and O-063 Objective.md (status). No engine source or data changed.

**Per criterion:**
- Engine heliocentric and Sun-centred-scene positions vs Horizons per planet and date, with settings, km, radii and angle from the probe: done, note summary and Method; test `measures today's error ... at each epoch` (bodyKm 629 to 13,338 km at flybys; scene figures within the 902 km Orb ecliptic-to-equator difference of them).
- Flyby dates from a cited source: Horizons' own Voyager trajectories (closest approach to the planet centre, 1-s search over the day the Horizons header timeline names), pinned in the test; header note on the pre-1989 patched-conic trajectory recorded.
- Cause per row shown by measurement: refit < 1 km, time scale < 5 km, barycentre offset < 800 km, Sun vs SSB > 200,000 km, frame rotation explains most of Jupiter/Saturn (rms halves) but not Uranus/Neptune: each asserted in the test.
- Voyagers' re-placing answered: the engine (its samples were `500@10` ecliptic J2000; its metric saw only the along-range part, Neptune 120 km at closest approach against a 13,338 km miss).
- One general fix with cost, and what provenance should say; the "state it and stop" alternative: note, Recommendation and Alternative sections.
- Fixture with source and retrieval date (PROV-01): yes; the fixture test checks source, settings and date.

**Commands (2026-11-10):** `node tools/import/planet-accuracy-fetch.mjs` (packages/astraeus) wrote the fixture; `npx vitest run packages/astraeus/tests/planetAccuracyFlybys.test.ts` 7 passed; `npm run lint` exit 0; `npm run typecheck` exit 0 (after a cast fix in the new test); `npm test` 236 files, 3368 passed, 2 skipped, exit 0. No browser check (Task says none). No build run (no source change).

**Limitations:** the download size of the recommended fix is an estimate (no Horizons refit was run); the Uranus centre-minus-barycentre figure of 712 km in 2020 is larger than its moons explain and is reported as measured, not explained; the frame offset size (about 0.22 arcsec) is measured but not traced to published frame-tie constants; Voyagers' own 428.6 km Jupiter figure was not reproduced exactly (its window maximum on an interpolated path differs from this closest-approach figure); Earth (EPV00) was not measured. The current provenance maxima (six dates 1969-2030, e.g. Neptune 36,192 km) understate the 1950-2044 maxima measured here; left for the owner's choice, not repaired.

## Drift Notes

None yet.
