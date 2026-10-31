---
id: I-120
title: 'Go to an event only seeks and does not frame its object'
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: probe-feedback-2-20261031}
  at: '2026-10-31T19:00:00Z'
severity: low
history:
  - at: '2026-10-31T19:00:00Z'
    actor: {role: planner, session: probe-feedback-2-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.5.0 from npm, public API only), pasted by the owner.'
---

# I-120: Go to an event only seeks and does not frame its object

## Summary

The timeline's "Go to <event>" moves the time only; it cannot also frame the object the event is about (for example a moon at a flyby).

## Evidence

- Reported against 0.5.0.
- Confirmed in code: `goToStop` in `packages/astraeus/src/shell/TimelineBar.tsx:80` calls `onEventSeek` only; events carry no object.

## Proof Needed

- An event can name an object; Go to seeks and frames it; an event without one seeks as before.
