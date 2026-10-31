---
id: I-126
title: "Stacked timeline markers take each other's clicks"
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: probe-switch-20261101}
  at: '2026-11-01T00:00:00Z'
severity: medium
resolution:
  disposition: escalated
  actor: {role: planner, session: probe-switch-20261101}
  at: '2026-11-01T01:00:00Z'
  reason: 'Repair promoted into O-050 (Follow a probe as one path), owner-confirmed design.'
escalated_to: O-050
history:
  - at: '2026-11-01T00:00:00Z'
    actor: {role: planner, session: probe-switch-20261101}
    kind: observed
    note: 'Listed as "still open, slows" in the Voyager probe app''s open-requests summary of 2026-11-01 (astraeus@0.6.0), pasted by the owner. Not logged here before. I-031 (story markers on one object, resolved) is the same kind of problem in the scene, not on the timeline.'
  - at: '2026-11-01T01:00:00Z'
    actor: {role: planner, session: probe-switch-20261101}
    kind: escalated
    note: 'Escalated to O-050 (Follow a probe as one path) under G-014; owner confirmed the design.'
---

# I-126: Stacked timeline markers take each other's clicks

## Summary

Event markers that fall close together on the timeline overlap, and the top one takes the clicks meant for the others. It is worst at Uranus in the Voyager 2 view: five moon events within about 5 hours sit on top of each other.

## Evidence

- Probe app report, astraeus@0.6.0, severity "slows".
- Code: each event, story-panel and window-peak marker is placed by time alone (`style={{ left: ... }}`) with no grouping or spreading of close markers (`packages/astraeus/src/shell/TimelineBar.tsx:113-151`).

## Proof Needed

On the packed package: a scene with five events within 5 hours on a multi-year timeline (the Voyager 2 Uranus case) lets a visitor reach and open each event from the timeline, on desktop (1280x720) and phone (375x667), without markers or labels overlapping.
