---
id: T-116
title: Add the outer planets and the mapped moons as real bodies
objective: O-033
status: in_progress
stage: build
depends_on: [{task: T-114, requires: clear}, {task: T-115, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
lane: data
planned_writes: [src/core/bodies/jupiterMoons.ts, src/core/bodies/io.ts, src/core/satelliteMeanElements.ts, src/core/bodies/index.ts, src/assets/catalogue.ts]
---

# Add the outer planets and the mapped moons as real bodies

## Outcome

Saturn, Uranus, Neptune and Pluto, the newly mapped moons (Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton, Charon) and Mars's Phobos and Deimos are catalogued bodies placed from the curve fits, each turned the right way, with its map and licence, ready for any experience to show.

## User Check

Read the Task evidence: per body its source, measured error, map licence and size, and the facing test result.

## Done When

1. The Jupiter-only moon loader (`src/core/bodies/jupiterMoons.ts`) becomes a generic per-system loader over any `data/ephemerides/<planet>-moons/` (fit-backed bindings, chunk fetch for a window, `chunksNeeded` refusal), Jupiter unchanged by test.
2. Planet definitions for Saturn, Uranus, Neptune (planet series) and Pluto (its fit), with radii, GM and IAU rotation cited; mapped moons and Phobos and Deimos defined once (ARCH-05), with `accuracy.validUtc` 2010-2030.
3. One generic tidal-lock wrapper reads the IAU rotation records in `data/orbits/` for synchronous moons; a test proves for one moon per system that the sub-planet point sits at the record's prime-meridian longitude within a stated tolerance. Io and the Galilean moons move onto it without visible change.
4. Io's duplicated constants resolved: `data/orbits/io.json` is the one record; `trueAnomalyFromMean` lives in a generic module (T-078 ARCH-05 note).
5. Visual records with maps copied from the donor (byte-identical where shippable, SHA-256 equal to `map.json`) or resized within the load budget (Triton 14,138 px and Pluto 5,926 px resized; resize recorded), each with a recorded licence (PROV-02, read from the donor README entries); Saturn, Uranus and Neptune maps Solar System Scope CC BY 4.0; Phobos and Deimos as grey balls at true size (no map). Name check passes.

## Context Files

`src/core/bodies/jupiterMoons.ts`, `src/core/bodies/io.ts`, `src/core/bodies/jupiter.ts`, `src/core/bodies/planetRecords.ts`, `src/core/bodies/planetTrajectory.ts`, `src/core/bodies/index.ts`, `src/core/satelliteMeanElements.ts`, `src/core/iauRotation.ts`, `src/core/body.ts`, `src/assets/catalogue.ts`, `src/assets/bodies/galileanMoons.ts`, `src/assets/licence.ts`, `src/assets/visual.ts`, `data/orbits/io.json`, `data/orbits/titan.json`, `data/bodies/README.md`, `docs/DONOR_PROVENANCE.md`, `docs/MOON_ORBITS.md`, `tests/jupiterMoonsScene.test.ts`, `tests/moonOrbits.test.ts`, `tests/nameCheck.test.ts`.

## Design References

Design: core and assets rows, Jupiter and Io, Texture rights, Name rule, Moon `validUtc`.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, ARCH-05, PROV-01, PROV-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Generalise the loader; prove Jupiter unchanged.
2. Planet and moon definitions; tidal-lock wrapper and facing tests; Io cleanup.
3. Maps, visual records and licences; name check.

## Boundaries

Core and asset layers only; no experience, panel or shelf changes. Additional extra reads of donor texture READMEs are allowed when logged.

## Technical Verification

Configured gates; facing and loader tests; evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
