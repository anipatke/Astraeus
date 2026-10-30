---
id: I-099
title: 'The mounted viewer''s time cannot be read or set from the host page'
type: other
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

# I-099: The mounted viewer's time cannot be read or set from the host page

## Summary

`mount` returns only `{ ready, unmount() }` and `AstraeusScene` has no time props, so a host page cannot read the current time, jump to a moment (for example a flyby) or react to time changes.

## Evidence

- Reported against 0.3.0.
- Reporter's fix: add `time`, `setTime(t)` and `onTimeChange` to the mount handle and to `AstraeusScene` props.

## Proof Needed

- From the mount handle and from `AstraeusScene`, a host can read the time, set it (the viewer moves there), and receive a callback when playback or the user changes it.
- Documented in the README with an example.
