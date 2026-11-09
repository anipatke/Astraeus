---
id: I-152
title: 'A host cannot select an object'
type: drift
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

# I-152: A host cannot select an object

## Summary

`ViewerHandle.selected` is read only ("the host cannot select"), so an app cannot open an object's information from its own controls or story beats.

## Evidence

Voyagers project review (Astraeus 0.3.0 to 0.8.0), pasted by the owner on 2026-11-10. Review point 3 and top ask 2: "A host setSelected(id) or setCamera({ follow, select: true })." Confirmed in packages/astraeus/src/api/viewerHandle.ts: `selected` is documented as read only.

## Proof Needed

A public way for the host to select (and clear) an object, from `mount` and React alike (API rules), reported by `onSelect` with `cause: "host"`, with tests and a README entry.
