---
id: I-172
title: Two slow spans whose ramps meet play slower than either
type: defect
status: open
source:
  kind: check
  check: C-172
  actor: {role: checker, session: o069-recheck-20261112}
  at: '2026-11-12T06:00:00Z'
tasks: [T-307]
checks: [C-172]
severity: low
history:
  - at: '2026-11-12T06:00:00Z'
    actor: {role: checker, session: o069-recheck-20261112}
    kind: observed
    note: Found by the O-069 Full Objective recheck; regression from the I-170 repair (38c05537).
    check: C-172
---

# I-172: Two slow spans whose ramps meet play slower than either

## Summary

The I-170 repair lays spans over the base as one cruise (slowest last) instead of taking the minimum of each span alone. Where two spans slower than the base touch, or sit close enough that their ramps meet, the paced speed is again the product-like blend that is slower than both, which is what O-069 Success Condition 3 forbids ("where pieces overlap or their ramps meet, the paced speed is the minimum of the speeds each piece alone would give, at every time") and what C-171 had proven for pieces slower than the base. T-307's own "nested, touching and unordered zones" test covered this with spans; the repair turned its three zones into event rules, so no test covers it now. The README was narrowed to "two rules' ramps" at the same time.

## Evidence

- `packages/astraeus/src/core/pacing.ts` `pacedRate`: spans are blended in turn into `logCruise` (layered), rules alone take the minimum.
- T-307 fixture as spans (base 30 d/s; span 5,000x over 0-10 h and a touching span 800x over 10-12 h, ramps 3 h): at +9 h each alone gives 5,000x and about 6,500x, so the minimum is 5,000x; HEAD gives 1,287x (log ratio up to 1.41). Commit cc260617 (T-307) gave the minimum exactly.
- Two spans with a 2-day gap (cruise/10 and cruise/100, 2-day ramps), mid-gap: HEAD 0.056 x cruise (same as the pre-O-069 layering), minimum of each alone 0.100 x cruise.
- `packages/astraeus/tests/pacing.test.ts` "nested, touching and unordered zones": zones given event ids in 38c05537.

## Proof Needed

A node test with spans slower than the base that touch, and two whose ramps meet across a gap: the paced rate is the minimum of each span alone at every time (or what an owner decision on Success Condition 3 says instead), still continuous across every ramp edge, with the I-170 cases (a slow rule inside or touching a faster span) and the existing pacing tests unchanged.
