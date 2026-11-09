---
id: I-153
title: 'A view''s follow rule does not apply on a shared planet'
type: defect
status: resolved
source:
  kind: report
  actor: {role: executor, session: voyagers-review-20261110}
  at: '2026-11-10T00:00:00Z'
severity: low
resolution:
  disposition: duplicate
  actor: {role: owner, session: voyagers-review-20261110}
  at: '2026-11-10T00:10:00Z'
  reason: 'Owner: "Merge I-153 into I-150".'
duplicate_of: I-150
history:
  - at: '2026-11-10T00:00:00Z'
    actor: {role: executor, session: voyagers-review-20261110}
    kind: observed
    note: 'From the Voyagers project review (0.3.0 to 0.8.0), pasted by the owner. Recorded for the owner to place; not yet confirmed in the engine unless the Evidence says so.'
  - at: '2026-11-10T00:10:00Z'
    actor: {role: owner, session: voyagers-review-20261110}
    kind: owner_decision
    note: 'Owner: "Merge I-153 into I-150". Folded into I-150, which now carries this Proof Needed.'
---

# I-153: A view's follow rule does not apply on a shared planet

## Summary

When a view's camera follow rule targets a planet that other views also show, the rule does not take effect.

## Evidence

Voyagers project review (Astraeus 0.3.0 to 0.8.0), pasted by the owner on 2026-11-10. Review point 3: "A view's follow rule doesn't apply on a shared planet."

## Proof Needed

A test with two views sharing a planet where switching to the view whose rule follows that planet makes the camera follow it.
