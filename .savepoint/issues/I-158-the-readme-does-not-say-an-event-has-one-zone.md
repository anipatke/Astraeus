---
id: I-158
title: 'The README does not say an event has one zone, as wide as its widest pacing rule'
type: drift
status: resolved
source:
  kind: report
  actor: {role: executor, session: voyagers-review-20261110}
  at: '2026-11-10T00:00:00Z'
severity: low
resolution:
  disposition: escalated
  actor: {role: planner, session: voyagers-review-20261110}
  at: '2026-11-10T00:30:00Z'
  reason: 'Repair promoted into O-061 (G-017, owner "Three pieces, this order").'
escalated_to: O-061
history:
  - at: '2026-11-10T00:00:00Z'
    actor: {role: executor, session: voyagers-review-20261110}
    kind: observed
    note: 'From the Voyagers project review (0.3.0 to 0.8.0), pasted by the owner. Recorded for the owner to place; not yet confirmed in the engine unless the Evidence says so.'
  - at: '2026-11-10T00:30:00Z'
    actor: {role: planner, session: voyagers-review-20261110}
    kind: escalated
    note: 'Promoted into O-061 under G-017 (0.8.1).'
---

# I-158: The README does not say an event has one zone, as wide as its widest pacing rule

## Summary

An event has a single zone whose width is its widest pacing rule; the README does not say so, and Voyagers had to find it out.

## Evidence

Voyagers project review (Astraeus 0.3.0 to 0.8.0), pasted by the owner on 2026-11-10. Review point 5: "one README line saying an event has one zone, as wide as its widest pacing rule."

## Proof Needed

One README line stating it, checked against the code.
