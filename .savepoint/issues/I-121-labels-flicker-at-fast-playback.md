---
id: I-121
title: 'Labels flicker at fast playback'
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: probe-feedback-2-20261031}
  at: '2026-10-31T19:00:00Z'
severity: low
checks: [C-129]
resolution:
  disposition: verified
  check: C-129
  actor: {role: checker, session: o048-check-20261031}
  at: '2026-10-31T09:13:00Z'
  reason: 'C-129 CLEAR: a label hidden by overlap needs a 14 px margin over the 6 px padding to reappear; crossing test and selected-label rule pass.'
history:
  - at: '2026-10-31T19:00:00Z'
    actor: {role: planner, session: probe-feedback-2-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.5.0 from npm, public API only), pasted by the owner.'
  - at: '2026-10-31T09:13:00Z'
    actor: {role: checker, session: o048-check-20261031}
    kind: rechecked
    check: C-129
    note: 'Verified by C-129 CLEAR (Full Objective Check of O-048 at 2813d8ca).'
---

# I-121: Labels flicker at fast playback

## Summary

At fast playback, labels that overlap swap visibility from frame to frame; the reporter asks for hysteresis so a shown label stays shown until it is clearly beaten.

## Evidence

- Reported against 0.5.0; not reproduced here.
- `packages/astraeus/src/app/SceneLabels.ts` decides overlaps per frame by priority with no memory.

## Proof Needed

- A label that wins an overlap keeps it for a stated margin or time; a test drives two labels crossing.
