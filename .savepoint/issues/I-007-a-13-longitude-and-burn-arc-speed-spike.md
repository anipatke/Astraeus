---
id: I-007
title: A-13 longitude disagrees with A-14 and short burn arcs show impossible speeds
type: defect
status: resolved
source:
  kind: report
  actor: {role: executor, session: o002-recheck-2026-10-06}
  at: '2026-10-06T05:20:00Z'
tasks: [T-005, T-007, T-009, T-014, T-015]
resolution:
  disposition: escalated
  actor: {role: planner, session: g002-plan-2026-10-06}
  at: '2026-10-06T12:00:00Z'
  reason: Owner chose to repair this inside G-002 as Objective O-004.
escalated_to: O-004
history:
  - at: '2026-10-06T05:20:00Z'
    actor: {role: executor, session: o002-recheck-2026-10-06}
    kind: observed
    note: Found during T-009 by scanning the generated paths for one-second jumps after T-013 removed the coast steps. Pre-existing; unchanged by T-013. Not repaired.
  - at: '2026-10-06T12:00:00Z'
    actor: {role: planner, session: g002-plan-2026-10-06}
    kind: escalated
    note: Repair promoted into O-004 (Tasks T-014 source readings, T-015 physical burns) by owner decision in G-002 planning.
  - at: '2026-10-06T07:51:24Z'
    actor: {role: executor, session: t014-source-settlement-2026-10-06}
    kind: repair_attempted
    note: 'T-014 read NASA SP-238 Table 7-II p. 7-9 via NTRS document 19710015566: A-13 ignition is 170.09 E, A-14 cutoff is 169.16 E. Corrected A-13 raw longitude from 170.09W to 170.09E and added correction_note. Propagation from A-12 predicts A-13 at 170.75 E; backward from A-14 predicts 170.01 E. Regenerated A-13>A-14 anchor separation is 29.986 km; the old west-longitude hypothesis is 667.101 km. The physical burn-arc treatment remains for T-015.'
  - at: '2026-10-06T08:11:50Z'
    actor: {role: executor, session: t015-physical-burns-2026-10-06}
    kind: repair_attempted
    note: 'T-015 integrated all 12 poweredPairs from ignition with Earth J2, Moon and Sun gravity plus constant EQJ acceleration fitted to cutoff velocity. A-13>A-14 runtime peak is 1.669481 km/s Moon-relative and A-09>A-10 is 1.531620 km/s Earth-centred; Columbia/Eagle one-second scans checked 701486/100260 intervals with 0 violations. All 12 cutoff residuals are published and non-cutoff anchors remain within 1e-6 km. Special descent, surface-hold and ascent methods/samples match their pre-task hashes. Two reconstruction runs produced matching SHA-256 values for all six outputs; focused reconstruction tests passed 30/30 and the full test gate passed 127/127. Browser validation had 0 console errors. The TLI A-01>A-02 position residual is 454.706052 km and the following A-02>A-03 coast reports a 69263.426 m/s maximum smoothing velocity correction; this limitation is recorded for planner review. Executor evidence only; no Check clearance claimed.'
---

# I-007: A-13 longitude disagrees with A-14 and short burn arcs show impossible speeds

## Summary

T-014 corrected A-13's longitude from 170.09°W to the source reading 170.09°E. T-015 replaced all 12 ordinary powered-pair Hermite arcs with gravity-integrated constant-acceleration burns. A-13>A-14 now peaks at 1.669 km/s relative to the Moon; A-09>A-10 peaks at 1.532 km/s Earth-centred. The Issue remains escalated to O-004 and awaits that Objective's independent Full Check.

## Evidence

- T-014 read NASA SP-238 Table 7-II p. 7-9 via NTRS document 19710015566: A-13 ignition is 170.09 E and A-14 cutoff is 169.16 E. The raw A-13 cell was corrected with a `correction_note`; propagation from A-12 and backward from A-14 agree with the corrected reading. Their regenerated anchor separation is 29.986 km.
- T-015 integrated each ordinary burn from its ignition state with Earth J2, Moon and Sun gravity plus constant EQJ acceleration fitted to cutoff velocity. Position and velocity residuals and reference-body peak speeds are published per burn in `docs/APOLLO11_RECONSTRUCTION.md` and `data/apollo11/generated/validation.json`.
- The 100 ms runtime scan gives A-13>A-14 1.669 km/s relative to the Moon and A-09>A-10 1.532 km/s Earth-centred. One-second `SampledTrajectory` scans cover 701,486 Columbia intervals and 100,260 Eagle intervals with zero moves beyond the maximum local Earth-centred speed sampled at interval start, midpoint and end.
- Special descent, surface-hold and ascent segment methods and emitted samples match their pre-T-015 SHA-256 baselines. Reconstruction output is deterministic; T-015 records the full generated-output hash comparison.
- The TLI A-01>A-02 cutoff retains a 454.706 km position residual; the following 10-second A-02>A-03 coast reports a 69,263.426 m/s maximum smoothing velocity correction. It is disclosed in the generated report and T-015 drift notes for planner review.

## Proof Needed

O-004's mandatory Full Objective Check must independently verify the A-13 source correction, every physical-burn cutoff residual and peak, the runtime speed scan, special-segment preservation, and the documented post-TLI correction. This Issue is not independently verified or accepted by the executor.
