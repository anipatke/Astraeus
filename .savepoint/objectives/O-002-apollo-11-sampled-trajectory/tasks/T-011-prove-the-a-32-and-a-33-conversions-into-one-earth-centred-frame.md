---
id: T-011
title: Prove the A-32 and A-33 conversions into one Earth-centred frame
objective: O-002
status: done
depends_on: []
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: t009-rework-2026-10-06}
check_waiver:
    task: T-011
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-06T04:38:09Z"
---

# Prove the A-32 and A-33 conversions into one Earth-centred frame

## Outcome

A bounded research Task. Its deliverable is a written finding: either the A-32 (Moon-referenced) and A-33 (Earth-referenced) printed states each convert correctly into Earth-centred EQJ, or the conversion step is identified as the source of the A-32>A-33 miss. Each conversion is proven on its own before any propagation is run between them.

## Why

A-32>A-33 misses by 25,125 km, and more complete gravity does not close it. A-33 matches *Apollo by the Numbers* in every element except the corrected speed digit. A-32 is Moon-referenced, so the Moon-to-Earth conversion is the prime suspect (I-006).

## User Check

Read the decision note. For each anchor and each conversion step, it should show an independent check and its result, then one propagation run only after both conversions pass, and a plain conclusion: conversion defect found (and where), or conversion verified so the miss lies in the source data or dynamics.

## Done When

1. **A-33 standalone:** the geodetic position on the Fischer 1960 ellipsoid, the Earth-fixed to EQJ rotation at the epoch, and the space-fixed velocity built from speed, FPA and heading are each checked independently of the tool's code path. At minimum, a second implementation or hand-computed fixture is used, and the round trip back to the printed parameters is checked.
2. **A-32 standalone**, step by step:
   - (a) Moon body-fixed orientation at the epoch: which lunar frame Apollo used (mean Earth/polar axis, principal axes, or another), and the size of the IAU-versus-Apollo difference.
   - (b) Selenographic latitude and the radius convention ("referenced to Landing Site 2", Table 7-I).
   - (c) The local north/east/up basis used for FPA and heading, including whether the heading reference is lunar north or another axis.
   - (d) The Moon's EQJ position **and velocity** about Earth at the same epoch, cross-checked against a second ephemeris source.

   Each step's effect on A-32's Earth-centred r and v is quantified.
3. The same method is applied to A-11 and A-31 as controls, because they share the convention.
4. Only then, propagate A-32 to A-33 with the existing audit dynamics and report the miss under the proven conversions.
5. A decision note is added to `docs/ASTRAEUS_SPIKE_02.md` 7.1 and to I-006. Any conversion change is proposed, not applied, unless a defect is demonstrated by a primary-source convention. The conversion code changes only on owner approval. Configured gates pass.

## Context Files

`tools/apollo11/anchors.ts`, `tools/apollo11/frames.ts`, `tools/apollo11/ephemeris.ts`, `tools/apollo11/conventions.ts`, `tools/apollo11/config.json`, `src/core/astronomyAdapter.ts`, `tools/validate/anchor-consistency.mjs`, `docs/APOLLO11_SOURCES.md`, `docs/ASTRAEUS_SPIKE_02.md`, `data/apollo11/raw/anchors.json`, `data/apollo11/normalised/anchors.json`, `.savepoint/issues/I-006-return-coast-misses-not-explained-by-perturbations.md`.

## Design References

Design: Current Technical State (reconstruction conversions).

## Guardrails

TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Validate the A-33 conversion independently.
2. Validate the A-32 conversion in steps (a) to (d), with A-11 and A-31 as controls.
3. Propagate once, under the proven conversions.
4. Write the decision note.

## Boundaries

Research and diagnostics only. Do not change raw values, the dynamics, the runtime or the architecture. The conversion code changes only after an owner decision. Do not re-attempt A-34>A-35 or A-30>A-31 here, except as controls.

## Technical Verification

Configured gates, plus reproducible diagnostic scripts and their recorded outputs. A Check follows `agent-skills/references/check-method.md`.

## Evidence

Executor evidence for a Check to verify; not clearance.

### Per-criterion outcome

1. **A-33 standalone: met.** `tools/validate/conversion-proof.mjs` rebuilds the A-33 state with its own Fischer-ellipsoid position (meridian-ellipse form), its own Earth-fixed to EQJ rotation (IAU 1982 GMST, nutation, IAU 1976 precession), and a cross-product ENU velocity. It differs from the tool by 0.151 km and 0.0006 m/s (rotation 0.098 arcsec). The inverse (Bowring) recovers the used latitude, longitude, altitude, speed, FPA and heading within 2.4e-5 deg, 2.6e-6 km and 1e-6 ft/s. A-34 is the same.
2. **A-32 standalone, steps (a) to (d): met.** (a) The lunar orientation matches a basis-vector rebuild and Horizons' sub-Earth point to 0.002 deg; the libration series matters (10 km / 68 m/s) and principal axes would move the state 0.9 km / 0.7 m/s. (b) Radius 1737.4 or 1738.0 km moves position 0.69 or 0.09 km. (c) The heading reference is the defect: lunar north versus EQJ north differ by 21.9 deg and change A-32's velocity by 984 m/s. (d) Astraeus Moon against DE441: 9.0 km / 0.07 m/s. Each effect is in `docs/evidence/conversion-proof.json`.
3. **A-11 and A-31 controls: met.** Same method applied; A-11 and A-31 show the same Moon-ephemeris, frame and radius results. A-10>A-11 velocity miss goes 940.6 to 12.8 m/s under EQJ north. 14 lunar-orbit anchors (A-12 to A-14, A-16 to A-26 except A-15 and A-27, plus A-28) agree with one orbit plane to 0.6 deg of heading under EQJ north.
4. **Propagate A-32 to A-33 only after: met.** Under the proven conversions 25,031 km / 412 m/s (audit dynamics). Under EQJ north (proposed) 212.6 km / 3.5 m/s.
5. **Decision note and gates: met.** Note added as `docs/ASTRAEUS_SPIKE_02.md` 7.2 (7.1 finding 2 updated) and as an `I-006` history entry. No conversion code changed; the change is proposed. Gates below passed.

### Commands run

- `node tools/validate/conversion-proof.mjs` (writes `docs/evidence/conversion-proof.json`), run after each edit; final run clean.
- `npm run typecheck`, `npm run build`, `npm test`: all passed (7 files, 120 tests). `npm run apollo11:reconstruct` not run: no data, conversion code or dynamics changed.
- JPL Horizons API queries (network) for Moon vectors (equatorial) and sub-Earth points at A-11, A-30, A-31, A-32, A-33, A-34; saved as `docs/evidence/conversion-proof-horizons.json`.

### Files

- Read (Context Files): `tools/apollo11/anchors.ts`, `frames.ts`, `ephemeris.ts`, `conventions.ts`, `config.json`, `src/core/astronomyAdapter.ts`, `tools/validate/anchor-consistency.mjs`, `docs/APOLLO11_SOURCES.md`, `docs/ASTRAEUS_SPIKE_02.md`, the raw and normalised `anchors.json`, `I-006`.
- Extra reads, logged: `tools/apollo11/vec.ts` (own-vector conventions); `tests/fixtures/moon-horizons.json` and `-source.txt` (to see whether a 1969 second ephemeris existed; it covers 2022 only, so Horizons was queried); `tests/apollo11Reconstruction.test.ts` head (test conventions); `package.json` (scripts, `vite` for `runnerImport`).
- Changed: `tools/validate/conversion-proof.mjs` (new), `docs/evidence/conversion-proof.json` and `conversion-proof-horizons.json` (new), `docs/ASTRAEUS_SPIKE_02.md` (7.2 added, 7.1 sentence), `.savepoint/issues/I-006-*.md` (history entry), this Task, `.savepoint/router.md` (task selection).

### Guardrails

TEST-01: no product behaviour changed; the named scenario validation is the script and its recorded output. TEST-03: no existing test is claimed to cover this. STYLE-07: the script's propagation dynamics repeat `anchor-consistency.mjs` (duplicated by design for an independent proof; the constants come from `config.json`).

### Limitations

- The independence is a second implementation by the same author, plus Horizons for the Moon and libration. It is not a published worked example.
- The heading reading is shown by data consistency and propagation, not by a primary-source definition of lunar north. The three candidate poles (J2000, 1969 mean, B1950) are indistinguishable here (207 to 213 km).
- Not explained: the remaining 210 km / 3.5 m/s at A-33; entry-interface conditions from A-32 under the new reading (hypersensitive); A-15, A-27, A-29, A-30 headings (transcription leads, scan not re-read); A-11/A-31/A-32 sit 4 to 5 deg off the 60 nmi plane.
- Noted outside scope: `docs/APOLLO11_SOURCES.md` 4.1 states the range-zero constant as -14581680000 ms; the code's -14552880000 ms (13:32 UTC) is right.
- Owner approval is needed before any conversion change.
