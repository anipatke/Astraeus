---
id: I-114
title: 'Camera and labels are unconfirmed when zoomed out to about 170 AU'
type: verification
status: open
source:
  kind: report
  actor: {role: owner, session: probe-feedback-20261031}
  at: '2026-10-31T12:00:00Z'
severity: low
history:
  - at: '2026-10-31T12:00:00Z'
    actor: {role: planner, session: probe-feedback-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.4.0 from npm, public API only), pasted by the owner.'
---

# I-114: Camera and labels are unconfirmed when zoomed out to about 170 AU

## Summary

The probe app needs to zoom out to about 170 AU from the Sun (Voyager 1's current distance). Nobody has confirmed the camera reach, far plane and labels behave there.

## Evidence

- Reported as a request to confirm, not an observed failure.
- Reach comes from `fitOrbit`'s farthest distance (`packages/astraeus/src/app/sceneFraming.ts:77`) or the default `max(30, span * 3.5)` (line 83); far plane is reach x 2.5. Not yet tried at 170 AU.

## Proof Needed

- A Sun-centred scene with a path reaching 170 AU can be zoomed out to frame it whole; bodies, path and labels draw without clipping or jitter.
