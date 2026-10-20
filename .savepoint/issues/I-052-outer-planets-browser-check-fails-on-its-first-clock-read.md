---
id: I-052
title: The outer-planets browser check fails on its first clock read, so none of its outer-planet scenarios has run
type: verification
status: open
source:
  kind: check
  check: C-091
  actor: {role: checker, session: o033-full-check-20261020}
  at: '2026-10-20T14:06:14Z'
tasks: [T-118, T-121]
checks: [C-091]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-10-20T14:06:14Z'
    actor: {role: checker, session: o033-full-check-20261020}
    kind: observed
    note: 'Found by the one planets demo run of the O-033 Full Objective Check C-091 (docs/evidence/demo-planets-20261020T140051Z). Not rerun, by the owner rule (one run per set per change).'
    check: C-091
  - at: '2026-10-21T01:20:00Z'
    actor: {role: executor, session: o033-repair-builder-20261021}
    kind: repair_attempted
    note: 'Repaired: tools/validate/browser-outer-planets.mjs no longer compares an exact value on a running clock: after pausing it seeks to the requested time through the driver and then reads it; a new scenario seeks Jupiter five days later, switches to Saturn, pauses and checks the clock is within a day of that later time and more than four days past the opening time (so it fails under I-051). Driver calls only. Syntax checked; not run (owner rule: the recheck runs the planets set once). Unverified until that run.'
---

# I-052: The outer-planets browser check fails on its first clock read

## Summary

O-033 Success Condition 9 asks the planets demo set (`check:demo`) to pass at phone and desktop sizes; T-121 Done When 1 puts `browser-outer-planets.mjs` in it, and T-118 Done When 5 wrote its scenarios. In the Full Objective Check's one run the script stopped at its first assertion on desktop, after 3 seconds, so its Saturn rings, Saturn moon families, Titan and Charon place presses, Pluto-and-Charon and Uranus scenarios, and the whole phone pass, never ran.

## Evidence

- Command: `npm run check:demo -- planets`, 2026-10-20 14:00:51Z to 14:05:11Z (260 s), evidence `docs/evidence/demo-planets-20261020T140051Z/`. `summary.txt`: smoke, jupiter-io, moon-panel, jupiter-tap, story-panels, planet-switch exit 0 with 0 error lines; `outer-planets | exit=1 | 14:04:55-14:04:57 | 3s | error-lines=0`; set result FAILED.
- `outer-planets.log`: `AssertionError [ERR_ASSERTION]: desktop: Jupiter opens at the requested time`, actual 1478782809720, expected 1478779200000, at `tools/validate/browser-outer-planets.mjs:67:12`.
- The difference is 3,609,720 ms: about one second of play at the planet's `clockRate` 3600 between the page opening at `t=2016-11-10T12:00:00Z` (as asked) and `ui.ensurePaused` (lines 59-67). The page honoured `t`; the script compares an exact value on a clock that was already running.
- The same exact-equality pattern is on line 70 (after the switch). Even when passing, line 70 cannot detect I-051, because it compares with the address time.

## Expected

The script opens the page paused at the requested time (or compares within the play allowance) and runs every outer-planet scenario at both sizes with zero console errors.

## Actual

Exit 1 on the first desktop assertion; every later scenario unverified.

## Proof Needed

1. `browser-outer-planets.mjs` reads the opening time without racing the running clock, and its switch-time scenario checks the clock's current time (I-051), through `tools/validate/driver.mjs` only.
2. One run of the planets set (owner rule: once for the repair) with every step exit 0 and 0 error lines, evidence directory recorded.
