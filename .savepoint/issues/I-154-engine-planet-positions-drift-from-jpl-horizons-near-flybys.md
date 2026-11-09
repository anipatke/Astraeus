---
id: I-154
title: 'Engine planet positions drift from JPL Horizons near flybys'
type: defect
status: resolved
source:
  kind: report
  actor: {role: executor, session: voyagers-review-20261110}
  at: '2026-11-10T00:00:00Z'
severity: medium
resolution:
  disposition: escalated
  actor: {role: planner, session: voyagers-review-20261110}
  at: '2026-11-10T00:30:00Z'
  reason: 'Repair promoted into O-063 (G-017, owner "Three pieces, this order").'
escalated_to: O-063
history:
  - at: '2026-11-10T00:00:00Z'
    actor: {role: executor, session: voyagers-review-20261110}
    kind: observed
    note: 'From the Voyagers project review (0.3.0 to 0.8.0), pasted by the owner. Recorded for the owner to place; not yet confirmed in the engine unless the Evidence says so.'
  - at: '2026-11-10T00:30:00Z'
    actor: {role: planner, session: voyagers-review-20261110}
    kind: escalated
    note: 'Promoted into O-063 under G-017 (0.8.1).'
---

# I-154: Engine planet positions drift from JPL Horizons near flybys

## Summary

Near flybys the engine's planet positions differ enough from JPL Horizons that Voyagers re-places its probe samples so the probe meets the planet.

## Evidence

Voyagers project review (Astraeus 0.3.0 to 0.8.0), pasted by the owner on 2026-11-10. Review top ask 3: "Engine planet positions that match JPL Horizons near flybys, so apps need not re-place probe samples."

## Proof Needed

A comparison of engine positions against Horizons for the Voyager flyby dates of Jupiter, Saturn, Uranus and Neptune, with a stated tolerance the engine meets, so Horizons probe samples line up without adjustment.
