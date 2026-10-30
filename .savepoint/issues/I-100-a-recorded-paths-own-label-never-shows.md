---
id: I-100
title: 'A recorded path''s own label never shows'
type: defect
status: resolved
source:
  kind: report
  actor: {role: owner, session: voyager-feedback-20261030}
  at: '2026-10-30T20:08:15Z'
escalated_to: O-046
resolution:
  disposition: escalated
  actor: {role: planner, session: o046-planning-20261030}
  at: '2026-10-30T20:40:00Z'
  reason: Repair promoted into O-046 (owner-confirmed plan, 2026-10-30).
severity: medium
history:
  - at: '2026-10-30T20:08:15Z'
    actor: {role: planner, session: voyager-feedback-20261030}
    kind: observed
    note: 'Reported from the Voyager downstream app (astraeus@0.3.0 from npm, public API only, JPL Horizons data), pasted by the owner.'
  - at: '2026-10-30T20:40:00Z'
    actor: {role: planner, session: o046-planning-20261030}
    kind: escalated
    note: 'Promoted into O-046 (Draw a spacecraft path across the solar system), G-013.'
---

# I-100: A recorded path's own label never shows

## Summary

The label for a path added with `addTrajectory` (`span.astraeus-label` "Voyager 1") stayed `display: none` at every moment tried, with `lookAt` or `follow`, while body labels and anchor labels showed.

## Evidence

- Reported: checked from 1977-10 to 1979-03 in an Earth-first scene (the I-096 workaround).
- Seen only in headless Chromium with software WebGL; the reporter asks for confirmation on a GPU browser. It may be specific to the Earth-first workaround or to label reach.
- Reporter's fix: show the path's label at its marker by default, governed by `setSwitches({ labels })`.

## Proof Needed

- In a scene with a recorded path, the path's label shows at its marker when labels are on and hides when `setSwitches({ labels: false })`.
- Checked in an Earth-centred path (Apollo-like) and, once I-096 lands, a Sun-centred one.
