---
id: T-013
title: Remove the visible jumps from the Apollo 11 path
objective: O-002
status: done
depends_on: []
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: o002-recheck-2026-10-06}
check_waiver:
    task: T-013
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-06T05:09:21Z"
---

# Remove the visible jumps from the Apollo 11 path

## Outcome

Columbia's and Eagle's reconstructed paths have no visible jumps at NASA anchors. Moon-referenced velocities use the EQJ-north heading reference, coasts use Earth+J2, Moon and Sun gravity offline, and whatever small miss remains is spread smoothly along each coast. Raw misses and all corrections stay published.

## Owner Decision

Confirmed 2026-10-06 in the O-002 recheck conversation; recorded in `Objective.md`, "Confirmed Decisions — 2026-10-06 (visible jumps)". The owner accepts minor inaccuracies that are not visually obvious.

## User Check

Play the mission through lunar orbit insertion (about GET 75:50), lunar orbit, TEI to MCC-5 (about GET 150:30) and the return. Columbia's and Eagle's paths show no visible step at any anchor. Open `docs/APOLLO11_RECONSTRUCTION.md` and see, per coast, the raw miss before smoothing and the largest correction applied.

## Done When

1. **Heading reference.** For Moon-referenced, non-surface anchors, `nativeState` builds velocity from a local basis with up = r̂, east = unit(ẑ_EQJ × r̂), north = r̂ × east. The position conversion, Earth-referenced anchors and surface-fixed anchors are unchanged. `docs/APOLLO11_SOURCES.md` states the convention, that it is adopted from data consistency (spike note 7.2), not a printed definition, and the owner decision. Tests use a hand-computed fixture for the new basis and check that the lunar-orbit anchors A-12 to A-14, A-16 to A-26 and A-28 give orbit normals within 1° of their mean.
2. **Coast dynamics.** Every coast segment (including the parking orbit backward from A-01) is integrated numerically with Earth point mass + J2, Moon and Sun third-body terms, Moon and Sun from the Astraeus adapter, at a fixed step chosen and documented so halving it changes no anchor miss by more than 1 km. Constants live in `tools/apollo11/config.json`. Patched-conic switching is removed. Burns, descent, ascent and surface stay keep their current methods. Re-running gives byte-identical output.
3. **Raw miss published.** Before smoothing, each coast's position and velocity miss at its next anchor is measured and kept in `validation.json` and the report Segments table (no threshold).
4. **Smoothing.** Each coast adds a correction that is zero in position and velocity at its start anchor and equals the measured miss in position and velocity at its end anchor (for example, a cubic Hermite blend over the coast). The path is then continuous in position and velocity at every coast join. `discontinuities` lists none at coast joins, or every remaining one with its reason. The method, raw miss and largest position and velocity correction per coast are documented in the report, the provenance `accuracy` text and the generated data. Coasts whose correction is large (say over 100 km or 50 m/s) are named in "Known gaps" with their likely cause (for example the A-15, A-27, A-29 and A-30 heading leads).
5. **Samples and interpolation.** The sample interval rule (Hermite error ≤ 0.25 km at held-out midpoints) is re-applied against the new generator, and the measured maximum is reported.
6. **Evidence.** `node tools/validate/anchor-consistency.mjs` and `node tools/validate/conversion-proof.mjs` still run. Tests cover the heading fixture, the orbit-plane check, start-anchor residuals ≤ 1 km / ≤ 1 m/s, position and velocity continuity at every coast join, and determinism. Configured gates pass. Before and after miss tables for every coast are recorded in the Task evidence.

## Context Files

`tools/apollo11/anchors.ts`, `tools/apollo11/frames.ts`, `tools/apollo11/segments.ts`, `tools/apollo11/kepler.ts`, `tools/apollo11/sampling.ts`, `tools/apollo11/trajectory.ts`, `tools/apollo11/reconstruct.ts`, `tools/apollo11/report.ts`, `tools/apollo11/validation.ts`, `tools/apollo11/ephemeris.ts`, `tools/apollo11/conventions.ts`, `tools/apollo11/config.json`, `tools/validate/anchor-consistency.mjs`, `tools/validate/conversion-proof.mjs`, `src/core/astronomyAdapter.ts`, `tests/apollo11Reconstruction.test.ts`, `docs/APOLLO11_SOURCES.md`, `docs/ASTRAEUS_SPIKE_02.md`, `.savepoint/objectives/O-002-apollo-11-sampled-trajectory/Objective.md`.

## Design References

Design: Current Technical State (reconstruction); Interfaces and Data Flow (`SampledTrajectory` input shape unchanged).

## Guardrails

TEST-01, TEST-02, TEST-03, TEST-04, STYLE-07, STYLE-09.

## Implementation Plan

1. Change the Moon-referenced velocity basis in `nativeState`; add the fixture and plane test; re-run the conversion proof.
2. Replace the two-body and patched coast generators with an offline Earth+J2/Moon/Sun integrator (reuse the audit dynamics rather than keeping a second copy where practical); choose and document the step.
3. Measure and record each coast's raw miss, then add the smoothing correction; keep anchors exact.
4. Re-apply the sampling rule; regenerate; confirm determinism.
5. Update the report, provenance text and `APOLLO11_SOURCES.md`; record before/after tables.

## Boundaries

Offline tool, generated data, tests and the sources doc only. No change to `src/core/`, `SampledTrajectory`, the runtime scene, raw anchor values or existing inferred overrides. No new overrides for the A-15/A-27/A-29/A-30 heading leads (report them only). Spike note, Design.md and browser evidence refresh belong to T-009.

## Technical Verification

Focused tests during iteration; configured `typecheck`, `build` and `test` gates at handoff, plus `npm run apollo11:reconstruct` twice with identical hashes. The Full Objective Check evaluates it under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor evidence (session o002-recheck-2026-10-06, 2026-10-06T05:04Z), for a Check to verify; not clearance. Same session also planned this Task and earlier did an unrecorded recheck pass on O-002, so it cannot run any Check on this work.

### Per-criterion outcome

1. **Heading reference: met.** `tools/apollo11/frames.ts` `inertialNorthAxes(position)` (up = r̂, east = unit(ẑ × r̂), north = r̂ × east). `nativeState` in `tools/apollo11/anchors.ts` uses it for Moon-referenced non-surface velocity; position, Earth anchors and surface anchors unchanged (every anchor `earthCentred.positionKm` identical to before within 1e-6 km; checked against the pre-change data copy). `docs/APOLLO11_SOURCES.md` 4.8 Moon step 3 and 6.4 state the convention, that it comes from data consistency, the owner decision, and the pole choice (J2000). Tests: "takes Moon-referenced heading against EQJ north (hand-computed basis)" and "puts the Moon-referenced lunar-orbit anchors in one orbit plane (heading convention)" (15 anchors within 1° of the mean normal).
2. **Coast dynamics: met.** New `tools/apollo11/dynamics.ts`: RK4 in Earth-centred EQJ, Earth μ + J2 (about the EQJ pole), Moon and Sun third bodies from the Astraeus adapter, 10 s fixed step; nodes read back by cubic Hermite. Constants in `config.json` (`earth.j2`, `earth.j2ReferenceRadiusKm`, `sun.muKm3S2`, `numerics.coastStepS` etc.). Patched conics and Kepler coasts removed from `segments.ts` (`kepler.ts` remains for the validation consistency table and apsides). Parking orbit integrated backward from A-01. Step check: a 5 s run changed no raw miss or correction at the published 0.001 km / 0.001 m/s precision (largest change 0.001 m/s). Re-run twice: identical combined SHA-256 `b5a198e7…`.
3. **Raw miss published: met.** `rawMissKm`/`rawMissMs` per coast in `validation.json`, in each vehicle file's `segments`, and in the report Segments table. No threshold.
4. **Smoothing: met.** `smoothedCoast` blends the forward propagation from the start anchor and the backward propagation from the end anchor with a smoothstep weight, interpolating radius linearly and direction along the great circle about the Moon (both anchors Moon-referenced) or Earth. Zero correction and slope at the start; equals the anchor (so the raw miss) in position and velocity at the end. `buildVehicle` throws if any segment ends more than 1e-6 km / 1e-6 m/s from its end anchor; `discontinuities` is `[]` in both files. Correction size published per coast (`maxCorrectionKm`/`maxCorrectionMs`); the provenance `accuracy` text and the report's Joins paragraph describe the method. "Known gaps" names every coast over 100 km or 50 m/s (threshold in `config.json`) with likely causes. Tests: "smooths every coast onto its end anchor…" and "has no position step at any segment join".
5. **Samples and interpolation: met.** Ladder rule re-applied; measured maximum Hermite error 0.157 km (A-30>A-31); Columbia 2,241 samples (was 2,655), Eagle 107 (was 108). Bundle 1,396.99 kB / 417.16 kB gzip (was 1,451.82 / 433.57).
6. **Evidence: met.** `anchor-consistency.mjs` and `conversion-proof.mjs` both run (in a scratch copy, so the committed T-010/T-011 evidence files were not overwritten). The audit's reconstructed-state misses equal the tool's raw misses (A-10>A-11 16.8 km / 12.8 m/s, A-32>A-33 212.6 / 3.5, A-34>A-35 38.4 / 55.6, A-35>A-36 32.2 / 74.4). Conversion round trip under 1e-6 km.

### Before and after, every coast (miss at the next anchor)

Before = shipped two-body/patched step. After = raw miss of the new integrated coast (before smoothing), then the largest smoothing correction.

| Vehicle | Coast | Before km / m/s | After raw km / m/s | Correction km / m/s |
|---|---|---|---|---|
| Columbia | A-02>A-03 (10 s) | 68.7 / 98.2 | 68.7 / 98.3 | 68.7 / 10,270 |
| Columbia | A-03>A-04 | 71.2 / 37.8 | 75.8 / 42.9 | 75.8 / 76.7 |
| Columbia | A-04>A-05 | 4.5 / 1.8 | 4.5 / 1.9 | 4.5 / 16.1 |
| Columbia | A-05>A-06 | 61.9 / 42.9 | 61.6 / 43.2 | 61.6 / 43.2 |
| Columbia | A-06>A-07 | 119.6 / 40.4 | 119.5 / 40.4 | 119.5 / 126.8 |
| Columbia | A-08>A-09 | 121.2 / 3.3 | 113.7 / 1.0 | 113.7 / 2.3 |
| Columbia | A-10>A-11 (LOI approach) | **6,274.1 / 1,574.9** | **16.8 / 12.8** | 39.8 / 12.8 |
| Columbia | A-12>A-13 | 635.1 / 499.1 | 616.4 / 555.7 | 624.4 / 555.7 |
| Columbia | A-14>A-15 | 705.2 / 744.7 | 608.3 / 673.2 | 781.9 / 685.5 |
| Columbia | A-15>A-16 | 11.2 / 451.4 | 468.7 / 38.4 | 468.7 / 486.2 |
| Columbia | A-17>A-27 | 1,353.1 / 1,128.2 | 1,272.9 / 1,141.1 | 1,287.4 / 1,141.1 |
| Columbia | A-27>A-28 | 113.6 / 45.8 | 142.8 / 264.0 | 263.9 / 285.9 |
| Columbia | A-28>A-29 | 240.8 / 1,166.7 | 38.8 / 1,633.3 | 489.6 / 1,633.8 |
| Columbia | A-30>A-31 | 200.1 / 1,736.9 | 290.2 / 1,745.0 | 1,958.8 / 1,745.0 |
| Columbia | A-32>A-33 (TEI to MCC-5) | **25,124.6 / 417.7** | **212.6 / 3.5** | 212.6 / 6.4 |
| Columbia | A-34>A-35 | **15,344.0 / 10,742.7** | **38.4 / 55.6** | 800.4 / 55.6 |
| Columbia | A-35>A-36 | 33.0 / 75.1 | 32.2 / 74.4 | 32.2 / 76.9 |
| Eagle | A-15>A-18 | 66.3 / 386.0 | 456.4 / 119.0 | 456.4 / 376.6 |
| Eagle | A-19>A-20 | 37.0 / 32.8 | 30.3 / 26.4 | 30.3 / 26.4 |
| Eagle | A-21>A-22 | 200.1 / 131.6 | 18.1 / 16.9 | 21.2 / 16.9 |
| Eagle | A-23>A-24 | 254.3 / 360.9 | 47.3 / 36.9 | 47.4 / 36.9 |
| Eagle | A-25>A-26 | 161.4 / 497.8 | 146.8 / 133.0 | 146.8 / 133.1 |
| Eagle | A-26>A-27 | 468.3 / 562.7 | 116.6 / 318.8 | 116.6 / 321.6 |

Reading: the large translunar and return steps collapse once the heading reference and the full gravity are used together. Lunar-orbit coasts keep 600–1,300 km raw misses. Earlier probing in this session showed these are mostly timing (the orbit passes within 10–20 km of the next anchor about 6–15 minutes early or late), consistent with the point-mass Moon omitting lunar gravity anomalies. Coasts touching A-15, A-27, A-29 or A-30 got worse or stay large, consistent with those printed headings not fitting the orbit plane. All of these are now smoothed and named in the report.

### Commands run

- `npm run apollo11:reconstruct` (about 10 s) twice: identical combined SHA-256 of `data/apollo11/**` and `docs/APOLLO11_RECONSTRUCTION.md` (`b5a198e7ed4c53fc…`).
- Step check: `coastStepS` set to 5, regenerated, compared `validation.json`, restored to 10, regenerated; restored outputs byte-identical to the 10 s run.
- `node tools/validate/anchor-consistency.mjs` and `node tools/validate/conversion-proof.mjs` in a scratch copy: both exit 0.
- `npm run typecheck` pass; `npm test` 7 files, 123 tests pass; `npm run build` pass (existing chunk-size warning only); `git diff --check` clean (vacuous: files are untracked). Lint: none configured.

### Files

- Read (Context Files): `tools/apollo11/anchors.ts`, `frames.ts`, `segments.ts`, `kepler.ts`, `sampling.ts`, `trajectory.ts`, `reconstruct.ts`, `report.ts`, `validation.ts`, `ephemeris.ts`, `conventions.ts`, `config.json`, `tools/validate/anchor-consistency.mjs`, `conversion-proof.mjs` (output paths only), `src/core/astronomyAdapter.ts`, `tests/apollo11Reconstruction.test.ts`, `docs/APOLLO11_SOURCES.md` (4.7, 4.8, 6), `docs/ASTRAEUS_SPIKE_02.md`, `Objective.md`.
- Extra reads, logged: `tools/apollo11/hermite.ts` and `vec.ts` (helpers reused by the integrator and blend); `src/` grep for `discontinuities`/`segments` (to confirm the app does not read them; it does not).
- Changed: `tools/apollo11/dynamics.ts` (new), `frames.ts`, `anchors.ts`, `segments.ts`, `sampling.ts`, `trajectory.ts`, `reconstruct.ts`, `report.ts`, `validation.ts`, `config.json`; `tests/apollo11Reconstruction.test.ts`; `docs/APOLLO11_SOURCES.md`; regenerated `data/apollo11/normalised/anchors.json`, `data/apollo11/generated/*.json`, `docs/APOLLO11_RECONSTRUCTION.md`; this Task.

### Guardrails

TEST-01: each changed behaviour has a named test (above) plus the before/after table. TEST-02: the bug (wrong heading reference) has the plane-consistency test, which fails under lunar north (16.5° scatter measured). TEST-03: no "existing tests cover it" claim. TEST-04: no Task Check requested yet and no owner waiver recorded. STYLE-07: the integrator duplicates the audit script's dynamics rather than sharing it, because the audit is an independent diagnostic; constants are shared through `config.json` only by the tool. STYLE-09: thresholds and step sizes live in `config.json`.

### Limitations

- The heading reference is adopted from data consistency, not a primary-source definition.
- The point-mass Moon leaves lunar-orbit timing drift; smoothing hides it on screen, and the published raw misses keep it visible in the report.
- Large corrections (A-30>A-31 1,959 km over 4.9 h; A-28>A-29 1.6 km/s over 20 min) make the spacecraft speed up or slow down along those arcs; this was not judged in a browser. Visual confirmation belongs to T-009's browser evidence and the owner.
- A-02>A-03 is a 10 s coast whose two anchors disagree by 69 km; the arc bends sharply there (C1, but 10 km/s correction). It is in "Known gaps".
- The diagnostic scripts' comments and labels still describe lunar north as "the tool's" convention in places; their numbers are right but their wording is stale (T-009 doc refresh, or follow-up).
- Spike note, Design.md and browser evidence are not updated here (T-009 scope).

## Drift Notes

Record any change to the generated data shape; `src/mission/apollo11.ts` must keep loading it unchanged.
