---
id: I-151
title: 'A host setTime does not count as a seek for story panels'
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

# I-151: A host setTime does not count as a seek for story panels

## Summary

Story panels react to a visitor seeking the timeline, but a host `setTime` is not treated as a seek, so panels tied to the new time do not behave as they do after a visitor seek.

## Evidence

Voyagers project review (Astraeus 0.3.0 to 0.8.0), pasted by the owner on 2026-11-10. Review top ask 1: "let a host setTime count as a seek for story panels."

## Proof Needed

A test where a host `setTime` into a panel's time opens or closes panels exactly as the same visitor seek does.
