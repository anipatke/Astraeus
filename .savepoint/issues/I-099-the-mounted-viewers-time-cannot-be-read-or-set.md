---
id: I-099
title: 'The mounted viewer''s time cannot be read or set from the host page'
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: voyager-feedback-20261030}
  at: '2026-10-30T20:08:15Z'
severity: medium
checks: [C-128]
resolution:
  disposition: verified
  check: C-128
  actor: {role: checker, session: o047-recheck2-20261031}
  at: '2026-10-31T04:25:00Z'
  reason: 'C-128 CLEAR: host time/rate read, set and change callbacks on the mount handle and AstraeusScene proven (C-126 row 8), unchanged by later repairs; full gate passes.'
history:
  - at: '2026-10-30T20:08:15Z'
    actor: {role: planner, session: voyager-feedback-20261030}
    kind: observed
    note: 'Reported from the Voyager downstream app (astraeus@0.3.0 from npm, public API only, JPL Horizons data), pasted by the owner.'
  - at: '2026-10-31T12:00:00Z'
    actor: {role: planner, session: probe-feedback-20261031}
    kind: observed
    note: 'Reported again from the probe app on 0.4.0: still blocks a host from steering time or rate; timeline pacing filed as I-112.'
  - at: '2026-10-31T04:25:00Z'
    actor: {role: checker, session: o047-recheck2-20261031}
    kind: rechecked
    check: C-128
    note: 'Verified by C-128 CLEAR (targeted re-check of O-047 after the I-110 surface repair, 6878f277).'
---

# I-099: The mounted viewer's time cannot be read or set from the host page

## Summary

`mount` returns only `{ ready, unmount() }` and `AstraeusScene` has no time props, so a host page cannot read the current time, jump to a moment (for example a flyby) or react to time changes.

## Evidence

- Reported against 0.3.0.
- Reporter's fix: add `time`, `setTime(t)` and `onTimeChange` to the mount handle and to `AstraeusScene` props.
- 2026-10-31: still open on 0.4.0 per the probe app; a host also cannot read or set the playback rate. Pacing request filed as I-112.

## Proof Needed

- From the mount handle and from `AstraeusScene`, a host can read the time, set it (the viewer moves there), and receive a callback when playback or the user changes it.
- Documented in the README with an example.
