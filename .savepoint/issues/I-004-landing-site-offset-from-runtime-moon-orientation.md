---
id: I-004
title: IAU-placed landing site is 254 km from the runtime Moon surface site
type: drift
status: resolved
source:
  kind: report
  actor: {role: executor, session: T-009}
  at: '2026-10-06T00:00:00Z'
tasks: [T-007, T-009]
resolution:
  disposition: escalated
  actor: {role: planner, session: g002-plan-2026-10-06}
  at: '2026-10-06T12:30:00Z'
  reason: Owner decided every G-002 Issue is repaired or decided before the Goal closes.
escalated_to: O-005
history:
  - at: '2026-10-06T00:00:00Z'
    actor: {role: executor, session: T-009}
    kind: observed
    note: Found during T-009 validation; recorded as durable follow-up, not repaired.
  - at: '2026-10-06T12:00:00Z'
    actor: {role: planner, session: g002-plan-2026-10-06}
    kind: deferred
    note: Owner chose data fixes only (O-004) for G-002 in planning; this Issue waits for Spike 03 planning.
  - at: '2026-10-06T12:30:00Z'
    actor: {role: planner, session: g002-plan-2026-10-06}
    kind: escalated
    note: Owner reversed the Spike 03 deferral; repair or decision promoted into O-006 within G-002.
  - at: '2026-10-06T20:00:00Z'
    actor: {role: planner, session: g002-replan-2026-10-06}
    kind: escalated
    note: O-006 was folded into O-005 (G-003, reusable UI shell) and removed; the offset is shown as a stated liberty in Eagle's provenance/known limitations, with no libration or core change (owner confirmed 2026-10-06).
---

# I-004: IAU-placed landing site is 254 km from the runtime Moon surface site

## Summary

The runtime Moon uses Spike 01's tidal-lock approximation with no libration. A landing site placed correctly in inertial space is 254.18 km (8.386°) from the same selenographic coordinates at touchdown and 275.37 km (9.087°) at lift-off, so Eagle's surface position does not sit on the textured Tranquility Base.

## Evidence

`docs/APOLLO11_RECONSTRUCTION.md`, section Landing site versus the runtime Moon orientation; `data/apollo11/generated/validation.json` `landingSiteOffset`.

## Proof Needed

Either add lunar libration to the runtime Moon orientation (verified against a reference) or show the measured offset in the UI; re-run the reconstruction report to confirm the new offset.
