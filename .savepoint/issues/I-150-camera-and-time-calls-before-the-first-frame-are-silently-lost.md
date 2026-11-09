---
id: I-150
title: 'Camera and time calls made before the first frame or during a view switch are silently lost'
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
  - at: '2026-11-10T00:10:00Z'
    actor: {role: owner, session: voyagers-review-20261110}
    kind: owner_decision
    note: 'Owner: "Merge I-153 into I-150". I-153 (a view''s follow rule does not apply on a shared planet) is now part of this Issue; Summary, Evidence and Proof Needed extended.'
  - at: '2026-11-10T00:30:00Z'
    actor: {role: planner, session: voyagers-review-20261110}
    kind: escalated
    note: 'Promoted into O-061 under G-017 (0.8.1).'
---

# I-150: Camera and time calls made before the first frame or during a view switch are silently lost

## Summary

A host's `setCamera` / `setTime` made after `ready` but before the first frame, or while a view switch is being reported to `onChange`, is silently dropped. Voyagers says camera and selection timing cost the most time, and four of its five remaining workarounds are about timing or the camera.

Merged from I-153 (owner, 2026-11-10): a view's camera follow rule does not take effect when the planet it follows is also shown by other views.

## Evidence

Voyagers project review (Astraeus 0.3.0 to 0.8.0), pasted by the owner on 2026-11-10. Review point 3 and top ask 1: "Queue or apply camera and time calls in a defined order around ready, the first frame and onChange."
Review point 3: "A view's follow rule doesn't apply on a shared planet."

## Proof Needed

A documented order for host calls around `ready`, the first frame and `onChange`; a test where `setCamera` and `setTime` called right after `await ready`, and from inside an `onChange` view-switch callback, all take effect (or throw), never vanish. A test with two views sharing a planet where switching to the view whose rule follows that planet makes the camera follow it.
