---
id: T-007
title: Rebuild Columbia and Eagle paths from NASA anchors
objective: O-002
status: done
depends_on: [{task: T-005, requires: clear}, {task: T-006, requires: clear}]
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: astraeus-spike-02-planning-2026-10-06}
check_waiver:
    task: T-007
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-06T01:46:31Z"
---

# Rebuild Columbia and Eagle paths from NASA anchors

## Outcome

A deterministic offline tool turns the extracted Apollo 11 anchors into Earth-centred EQJ sampled trajectories for Columbia and Eagle, with events and provenance, and reports how closely the result honours every NASA anchor.

## User Check

Run the reconstruction command twice and confirm identical output. Open the residual report and see, per anchor and per segment, the start-state match, the propagated miss at the next anchor, join handling and interpolation error. Confirm the qualitative checks (departure side, Moon at arrival, orbit around the current Moon, return meets Earth) are recorded.

## Done When

1. A `tools/` reconstruction script with an npm script entry reads `data/apollo11/raw/` and writes `data/apollo11/normalised/anchors.json` (Cartesian EQJ states, Earth-centred and native-centred, with conversion inputs) and `data/apollo11/generated/columbia.json`, `data/apollo11/generated/eagle.json` (samples plus provenance, in the shape SampledTrajectory consumes) and `data/apollo11/generated/events.json`. Re-running produces byte-identical files.
2. Conversions implement exactly the conventions in `docs/APOLLO11_SOURCES.md`; Moon-relative states are normalised with Astraeus Moon state at the same timestamp; GET → UTC follows the documented rule.
3. Each phase in brief section 7 within the confirmed span (Earth orbit insertion → entry interface; Eagle separation → docking) has a named reconstruction method — default two-body Kepler propagation about the segment's center-of-attraction — and burns between anchors are treated as documented segment boundaries, not modelled guidance. Surface stay is a Moon-fixed point converted with the documented lunar rotation model. Powered descent follows the T-005 decision.
4. Segment starts match converted anchors within ≤1 km and ≤1 m/s. Propagated misses at following anchors are measured and reported without a pass/fail gate. Discontinuities at segment joins are reported (location, size, handling method); none are silently smoothed.
5. Sample interval per segment is chosen and documented; Hermite interpolation error against the propagator at held-out midpoints is measured per segment (target ≤1 km, reported as measured).
6. Qualitative brief section 20 checks are computed and recorded: departure side, Moon position at arrival, lunar orbit centred on the time-matched Moon, return trajectory reaching entry interface altitude. Also record the offset between the IAU-placed landing site and the runtime approximate Moon orientation's corresponding surface point.
7. Provenance labels the data "reconstructed", lists sources and accuracy statement; anchor points are distinguishable from reconstructed samples in the data.
8. Validation report `docs/APOLLO11_RECONSTRUCTION.md` (brief deliverable E) records source anchors, method by segment, residuals, known gaps and unsupported claims. Tests cover conversion functions against hand-computed fixtures, determinism and anchor residual limits. Configured gates pass.

## Context Files

`data/apollo11/raw/anchors.json`, `data/apollo11/raw/events.json`, `docs/APOLLO11_SOURCES.md`, `src/core/sampledTrajectory.ts`, `src/core/provenance.ts`, `src/core/events.ts`, `src/core/astronomyAdapter.ts`, `src/core/moonTrajectory.ts`, `src/core/referenceCenters.ts`, `src/core/bodyOrientation.ts`, `src/core/state.ts`, `package.json`, `docs/ASTRAEUS_SPIKE_02_BRIEF.md`, `.savepoint/objectives/O-002-apollo-11-sampled-trajectory/Objective.md`.

## Design References

Design: Interfaces and Data Flow, Current Technical State; O-002 Architectural Considerations (offline pipeline, conventions).

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-06, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm T-005 conventions and T-006 types exist; return REPLAN REQUIRED if not.
2. Implement pure conversion functions (spherical → Cartesian, body-fixed → EQJ) with fixtures.
3. Implement offline two-body propagation and segment runner; normalise centres via Astraeus core.
4. Generate samples per segment at a chosen interval; measure interpolation error.
5. Compute residuals, join misses and qualitative checks; write the report.
6. Make output deterministic (fixed ordering and number formatting); run twice and diff; run gates.

## Boundaries

All propagation stays in `tools/`; nothing added to `src/core/` except fixes required by consuming its public API (return REPLAN REQUIRED for anything more). No N-body, guidance, maneuver optimisation, SPICE or runtime network. Never call the output the exact Apollo 11 flight path.

## Technical Verification

Focused tests during iteration; configured gates at handoff per AGENTS.md. Later evaluation follows `agent-skills/references/check-method.md`.

## Technical Evidence

### Per-criterion outcomes

1. **Script, npm entry, files, byte-identical.** Met. `npm run apollo11:reconstruct` (`tools/apollo11/run.mjs`) reads `data/apollo11/raw/` and writes `data/apollo11/normalised/anchors.json`, `data/apollo11/generated/{columbia,eagle,events}.json` and `validation.json`. Two consecutive runs diffed identical (`diff -r`), and test "produces byte-identical output on a second run" repeats this.
2. **Conventions, Moon normalisation, GET to UTC.** Met. Conversions follow `docs/APOLLO11_SOURCES.md` section 4; Moon-relative states add the Astraeus Moon state at the same instant. Independent check: the LOI-1 cutoff anchor gives 169.8 x 60.0 n mi against the published 169.7 x 60.0. **Source defect found:** the section 4.1 range-zero millisecond constant is 8 hours early (Issue I-001); the tool uses the correct value and asserts it against `events.json`.
3. **Named method per phase.** Met. Parking orbit (backward two-body from A-01, since no NASA anchor exists earlier), two-body and patched-conic coasts, Hermite burns, Moon-fixed Hermite for powered descent (T-005 decision: two-anchor) and ascent, Moon-fixed surface hold with the IAU rotation. Listed in `docs/APOLLO11_RECONSTRUCTION.md`.
4. **Start match and reporting.** Met. All 40 anchor residuals are at most 1e-6 km and 1e-6 m/s (test "starts every segment on its converted anchor"). Propagated misses and discontinuities (location, size, handling) are in the report and in each file's `discontinuities`; nothing is smoothed. After the owner-confirmed raw corrections (Issue I-002), misses range from 4.5 km to 44,194 km; the largest come from Earth-only two-body over the long return coast and the TEI patch.
5. **Sample interval and interpolation error.** Met. Interval per segment chosen from a ladder for at most 0.25 km held-out midpoint error; measured maximum is 0.13 km (test asserts at most 1 km on every segment).
6. **Qualitative checks.** Met. Departure angle 155.9 degrees; SOI crossing and arrival geometry; lunar-orbit altitude 104 to 314 km against a time-matched Moon; entry altitude crossing 6 s from the EI anchor time; surface arcs never below the surface. Landing-site offset to the runtime Moon orientation measured at 254 km (8.4 degrees), larger than the 1 to 2 degrees anticipated because the runtime orientation has no libration.
7. **Provenance and anchors distinguishable.** Met. `provenance.sourceType` is `reconstructed`, with sources and accuracy; each file lists `anchors` by sample index.
8. **Report, tests, gates.** Met. `docs/APOLLO11_RECONSTRUCTION.md` is generated by the tool. `tests/apollo11Reconstruction.test.ts` covers hand-computed conversion fixtures, Kepler and Hermite behaviour, determinism, committed-data equality and residual limits.

### Commands run

- `npm run apollo11:reconstruct` (twice, outputs diffed identical)
- `npm run typecheck`: passed
- `npm test`: 6 files, 94 tests passed
- `npm run build`: passed (existing chunk-size warning only)

### Files changed

New: `tools/apollo11/{config.json,vec.ts,conventions.ts,frames.ts,kepler.ts,hermite.ts,ephemeris.ts,anchors.ts,segments.ts,sampling.ts,trajectory.ts,validation.ts,format.ts,reconstruct.ts,report.ts,run.mjs}`, `tests/apollo11Reconstruction.test.ts`, `data/apollo11/normalised/anchors.json`, `data/apollo11/generated/*.json`, `docs/APOLLO11_RECONSTRUCTION.md`, Issues I-001 and I-002. Edited: `package.json` (script), `tsconfig.json` (include `tools`), `data/apollo11/raw/anchors.json` (owner-confirmed corrections to A-06, A-07, A-08); override recorded in `tools/apollo11/config.json`. Nothing under `src/core/` changed.

### Files read

All Context Files except as noted; `src/core/bodyOrientation.ts`, `referenceCenters.ts`, `moonTrajectory.ts` were read in full and `docs/ASTRAEUS_SPIKE_02_BRIEF.md` in sections 3 to 8, 11, 20 and the deliverables.

### Extra reads (outside Context Files)

- `agent-skills/savepoint-task/SKILL.md`, `.savepoint/config.yml`, `.savepoint/Guardrails.md`: workflow, gates, rule IDs.
- `src/core/body.ts`, `src/core/trajectory.ts`: types the SampledTrajectory API depends on.
- `tests/sampledTrajectory.test.ts` (head), `tsconfig.json`, `vite.config.ts`, `node_modules/vite/dist/node/index.d.ts` (grep): to run TypeScript tooling against `src/core` (Vite `runnerImport`) and match test conventions.
- `agent-skills/references/issue-capture.md`, `.savepoint/task-ids.yml`: Issue format.
- One attempt to fetch the NTRS PDF to check Table 7-II failed (file over 10 MB).

### Limitations

- A-06, A-07 and A-08 were corrected in the raw file after the owner checked Table 7-II (Issue I-002). A-05's printed flight-path angle (44.94) is kept in the raw file; the reconstruction uses an owner-approved inferred override of 49.94 (probable source typo, not documentary-confirmed). With it, A-04>A-05 velocity miss fell from 604.2 to 1.8 m/s and A-05>A-06 from 1,831.0 km / 570.2 m/s to 61.9 km / 42.9 m/s. If the true value differs, the override is wrong.
- Two-body coasts ignore lunar, solar and non-spherical gravity: misses of up to about 44,000 km on the return coast and 25,000 km on the TEI patch are expected and reported without a threshold.
- The parking orbit has no anchor of its own. Burn, descent and ascent arcs are interpolations.
- Published orbit cross-checks differ by a few n mi except A-19 and A-26 (the recorded published values there look doubtful); not gated.
- Moon rotation uses a constant TT-UTC of 39.7 s and the IAU mean-Earth frame. Sample intervals for short burns collapse to a single sample.
- Not verified in a browser; rendering is T-008.


## Drift Notes

If Earth-centred runtime normalisation proves inaccurate or unsound, document why and return REPLAN REQUIRED before choosing another strategy.
