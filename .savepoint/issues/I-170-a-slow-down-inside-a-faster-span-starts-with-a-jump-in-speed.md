---
id: I-170
title: A slow-down inside a faster span starts with a jump in speed
type: defect
status: open
source:
  kind: check
  check: C-171
  actor: {role: checker, session: o069-check-20261112}
  at: '2026-11-12T04:15:00Z'
tasks: [T-307]
checks: [C-171]
severity: medium
history:
  - at: '2026-11-12T04:15:00Z'
    actor: {role: checker, session: o069-check-20261112}
    kind: observed
    note: Found by the O-069 Full Objective Check; regression from T-307.
    check: C-171
---

# I-170: A slow-down inside a faster span starts with a jump in speed

## Summary

T-307's `pacedRate` takes the minimum over the pieces whose ramp touches the time, each blended from the base. When a slower piece's ramp starts inside a piece faster than the base (a cruise span, the README's "fast cruising and slow encounters"), the moment it touches it contributes about the base rate, so the paced speed drops at once from the fast piece's rate to the base, then eases. Before T-307 the layered blend was continuous there. Violates T-307 Done When "result continuous in time" and the README "a jump from cruise to encounter is smooth both ways"; the T-307 continuity test only uses pieces slower than the base.

## Evidence

- `packages/astraeus/src/core/pacing.ts` `pacedRate` (lines 76-85): a non-touching piece is skipped (`weight > 0` guard), a touching one starts at `logBase`.
- Synthetic probe: base 86,400x, span 0..100 d at 2,592,000x (ramp 10 d), event rule 1,200x within 1.5 h (ramp 4 h) at day 50. 1 ms before the rule's ramp: 2,592,000x; 1 ms after: 86,400x (old code: 2,592,000x both sides).
- The shipped site synthetic journey (`packages/astraeus-site/src/synthetic/syntheticJourneyScene.ts`: base 30 d/s, encounter rule 1 d/s within 30 d, year/s span from Uranus + 120 d): at 1985-11-25T00:00:00Z the speed goes 328.4 -> 30.0 d/s in 1 ms, and at 1986-03-25T00:00:00Z 30.0 -> 360.7 d/s.

## Proof Needed

A node test with a piece faster than the base containing (and one touching) a slower event rule: the paced rate is continuous across every ramp edge (log step per small time step bounded), order-independent, still the slower of the two where two slower pieces' ramps meet (F-15 case unchanged), exactly the base where nothing touches. Plus the existing pacing tests unchanged.
