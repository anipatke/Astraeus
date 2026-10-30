---
id: I-101
title: 'How a recorded path is drawn between samples is not documented'
type: verification
status: open
source:
  kind: report
  actor: {role: owner, session: voyager-feedback-20261030}
  at: '2026-10-30T20:08:15Z'
severity: medium
history:
  - at: '2026-10-30T20:08:15Z'
    actor: {role: planner, session: voyager-feedback-20261030}
    kind: observed
    note: 'Reported from the Voyager downstream app (astraeus@0.3.0 from npm, public API only, JPL Horizons data), pasted by the owner.'
---

# I-101: How a recorded path is drawn between samples is not documented

## Summary

With daily samples through a Jupiter flyby the drawn path put the probe 180,300 km from Jupiter instead of 348,436 km; hourly samples fixed it. Users cannot tell how dense samples must be, or whether velocities are used between samples.

## Evidence

- Reported figures: daily samples gave 180,300 km closest approach, true 348,436 km; hourly samples matched.
- Reporter's fix: document the interpolation and whether velocities are used; optionally warn in the Developer drawer when a path bends sharply between two samples.

## Proof Needed

- The README says how positions between samples are found (method, and whether `velocityKmS` is used) and gives sampling guidance for close flybys.
- If a warning is added: a test path with a sharp bend between two samples triggers it; a smooth one does not.
