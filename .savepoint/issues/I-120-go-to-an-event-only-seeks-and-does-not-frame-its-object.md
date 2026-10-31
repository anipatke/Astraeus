---
id: I-120
title: 'Go to an event only seeks and does not frame its object'
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
  reason: 'C-129 CLEAR: event object checked (bad-event) and Go to, Previous and Next frame it with the Focus preset; events without one only seek.'
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

# I-120: Go to an event only seeks and does not frame its object

## Summary

The timeline's "Go to <event>" moves the time only; it cannot also frame the object the event is about (for example a moon at a flyby).

## Evidence

- Reported against 0.5.0.
- Confirmed in code: `goToStop` in `packages/astraeus/src/shell/TimelineBar.tsx:80` calls `onEventSeek` only; events carry no object.

## Proof Needed

- An event can name an object; Go to seeks and frames it; an event without one seeks as before.
