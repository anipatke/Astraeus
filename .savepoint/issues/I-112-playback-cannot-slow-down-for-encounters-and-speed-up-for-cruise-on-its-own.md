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
  - at: '2026-10-31T15:00:00Z'
    actor: {role: executor, session: o047-repair-20261031}
    kind: repair_attempted
    note: 'Out-of-scope repair after C-126, not verified. pacedRate now lays zones fastest first (cached sort) so the slowest applicable piece wins wherever zones meet, ramps included, whatever the listing order. Proof Needed scenario (cruise, ramp, override, Auto) and neighbours re-run: pacing.test.ts and pacingDom.test.ts pass; new test covers slow span with faster event rule inside, fast span with slower rule inside, two event rules, both listing orders, plus ramp continuity. README, PacingInput doc and CHANGELOG state the rule. Gates lint, typecheck, build, test pass; no browser run.'
  - at: '2026-10-31T04:10:00Z'
    actor: {role: checker, session: o047-recheck-20261031}
    kind: rechecked
    note: 'C-127: repair proven. Slow span with a faster event rule inside it (both listing orders, and inside the rule''s ramp), faster span with a slower rule, and two rules of different types all give the slowest rate; cruise exact, seek deterministic, hourly sweep continuous and within bounds. Stays open only because C-127 is NEEDS WORK on I-110; close as verified at the next CLEAR Check.'
    check: C-127
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
