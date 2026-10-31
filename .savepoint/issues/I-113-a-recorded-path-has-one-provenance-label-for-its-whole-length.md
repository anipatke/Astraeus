---
id: I-113
title: 'A recorded path has one provenance label for its whole length'
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: probe-feedback-20261031}
  at: '2026-10-31T12:00:00Z'
severity: low
checks: [C-128]
resolution:
  disposition: verified
  check: C-128
  actor: {role: checker, session: o047-recheck2-20261031}
  at: '2026-10-31T04:25:00Z'
  reason: 'C-128 CLEAR: per-span path provenance proven (C-126 row 14), unchanged by later repairs; full gate passes.'
history:
  - at: '2026-10-31T12:00:00Z'
    actor: {role: planner, session: probe-feedback-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.4.0 from npm, public API only), pasted by the owner.'
  - at: '2026-10-31T04:25:00Z'
    actor: {role: checker, session: o047-recheck2-20261031}
    kind: rechecked
    check: C-128
    note: 'Verified by C-128 CLEAR (targeted re-check of O-047 after the I-110 surface repair, 6878f277).'
---

# I-113: A recorded path has one provenance label for its whole length

## Summary

A path whose data changes method part-way (modelled, then fitted to tracking, then predicted) needs provenance by time span, so each stretch shows its own Observed or Modelled label.

## Evidence

- Confirmed in code: `addTrajectory` takes one `provenance` (`packages/astraeus/src/api/scene.ts:322`).
- An existing pattern to reuse: activities already accept provenance by time span (`src/api/activity.ts:83`).

## Proof Needed

- `addTrajectory` accepts provenance by time span; the shown label follows the current time; a single provenance still works.
