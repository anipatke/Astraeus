---
id: I-112
title: 'Playback cannot slow down for encounters and speed up for cruise on its own'
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: probe-feedback-20261031}
  at: '2026-10-31T12:00:00Z'
severity: medium
history:
  - at: '2026-10-31T12:00:00Z'
    actor: {role: planner, session: probe-feedback-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.4.0 from npm, public API only), pasted by the owner.'
---

# I-112: Playback cannot slow down for encounters and speed up for cruise on its own

## Summary

`setTimeline` offers fixed speeds and one opening speed. A long journey needs fast cruising and slow encounters, and the host page cannot steer the rate itself (I-099).

## Evidence

- Reported against 0.4.0.
- Related: I-099 (host cannot read or set time or rate), I-106 (speed menu adds unrequested speeds).
- Reporter's fix: timeline pacing, for example `setTimeline({ ..., pacing: [{ from, to, rate }] })`, or "slow to rate R within D of each event of type T", with smooth ramps between speeds; a speed the visitor picks still wins until they release it.

## Proof Needed

- A scene with pacing plays at the cruise rate between events and ramps smoothly to the encounter rate near them.
- A visitor-picked speed overrides pacing until released; pacing resumes after. Documented with an example.
