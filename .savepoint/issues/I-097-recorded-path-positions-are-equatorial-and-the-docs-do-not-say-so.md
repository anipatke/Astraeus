---
id: I-097
title: 'Recorded path positions are read as equatorial J2000 and the docs do not say so'
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
severity: high
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

# I-097: Recorded path positions are read as equatorial J2000 and the docs do not say so

## Summary

Ecliptic J2000 vectors given to `addTrajectory` are drawn tilted 23.4 degrees away from the planets' plane with no error. `stateOf` returns equatorial J2000, and `addBodyFromElements` and `addGroup` state their frame, but `TrajectorySampleInput` and the README do not.

## Evidence

- Reported: JPL Horizons ecliptic J2000 vectors drawn 23.4 degrees off the planets' plane, silently.
- Reported: `stateOf("jupiter")` returns equatorial J2000.
- Reporter's fix: document the frame, and add `frame: "ecliptic-j2000" | "equatorial-j2000"` to `addTrajectory`, like `addGroup`'s `plane`.
- Downstream workaround in place: ecliptic-to-equatorial rotation of every sample.

## Proof Needed

- The README and `TrajectorySampleInput` doc state the frame of `positionKm`/`velocityKmS`.
- If a frame option is added: the same path given in ecliptic with `frame: "ecliptic-j2000"` and pre-rotated in equatorial draws identically (test at a few sample times).
- `stateOf`'s documented frame matches what it returns.
