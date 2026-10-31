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
  - at: '2026-10-31T03:55:00Z'
    actor: {role: checker, session: o047-check-20261031}
    kind: rechecked
    note: 'C-126 NEEDS WORK. Pacing values, ramps, validation, override and Auto release are proven. Still failing: the documented rule "where an event rule meets a span or another rule, the slower speed wins" (README, PacingInput doc, CHANGELOG) is false when a slow span meets a faster event rule: span {from: day 40, to: day 60, rate: 10} with {near: {type: flyby, within: 86400}, rate: 1000} and a flyby at day 50 gives 1000 at day 50, expected 10. pacingFor (api/story.ts) lays spans first and event zones after, and pacedRate lets a later zone win. Repair: make the slower win wherever zones meet (or state the real rule); test both orders in pacing.test.ts.'
    check: C-126
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
