---
id: I-155
title: 'mount has no loading cover'
type: other
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

# I-155: mount has no loading cover

## Summary

A viewer opened with `mount` shows no loading cover while the scene loads.

## Evidence

Voyagers project review (Astraeus 0.3.0 to 0.8.0), pasted by the owner on 2026-11-10. Review point 5: "a mount loading cover." (A loading cover exists in the React viewer code; check whether `mount` offers the same.)

## Proof Needed

`mount` shows the same loading cover as the React viewer, or a documented reason it cannot, with a test.
