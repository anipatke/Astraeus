---
id: I-157
title: 'Labels cannot be tied to a stretch of time'
type: other
status: open
source:
  kind: report
  actor: {role: executor, session: voyagers-review-20261110}
  at: '2026-11-10T00:00:00Z'
severity: low
history:
  - at: '2026-11-10T00:00:00Z'
    actor: {role: executor, session: voyagers-review-20261110}
    kind: observed
    note: 'From the Voyagers project review (0.3.0 to 0.8.0), pasted by the owner. Recorded for the owner to place; not yet confirmed in the engine unless the Evidence says so.'
  - at: '2026-11-10T00:30:00Z'
    actor: {role: planner, session: voyagers-review-20261110}
    kind: escalated
    note: 'Promoted into O-062 under G-017 (0.8.1).'
  - at: '2026-11-09T22:47:53Z'
    actor: {role: owner, session: o061-run-20261110}
    kind: reopened
    note: 'Owner chose "Accuracy only, park zoom and labels (Recommended)" for 0.8.1: O-062 removed from G-017 before planning; this Issue is open again.'
  - at: '2026-11-09T22:47:53Z'
    actor: {role: owner, session: o061-run-20261110}
    kind: deferred
    note: 'Parked until a real app needs it (only Voyagers asked, and Voyagers stays on 0.8.0).'
---

# I-157: Labels cannot be tied to a stretch of time

## Summary

A label shows for the whole timeline; an app cannot show it only during a stretch of time (for example around a flyby).

## Evidence

Voyagers project review (Astraeus 0.3.0 to 0.8.0), pasted by the owner on 2026-11-10. Review point 5: "labels tied to a stretch of time."

## Proof Needed

A public way to give a label a time range, from the scene builder, with tests and a README entry.
