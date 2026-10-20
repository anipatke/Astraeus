---
id: I-051
title: The planet switch keeps only the time written in the address, not the clock's current time
type: defect
status: open
source:
  kind: check
  check: C-091
  actor: {role: checker, session: o033-full-check-20261020}
  at: '2026-10-20T14:06:14Z'
tasks: [T-117, T-118]
checks: [C-091, C-092]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-10-20T14:06:14Z'
    actor: {role: checker, session: o033-full-check-20261020}
    kind: observed
    note: 'Found by the O-033 Full Objective Check C-091 at HEAD 9d1707bc by reading the switch path; the planets browser set''s clock scenario could not show it (it compares against the address time, and it failed earlier on timing, see I-052).'
    check: C-091
  - at: '2026-10-21T01:20:00Z'
    actor: {role: executor, session: o033-repair-builder-20261021}
    kind: repair_attempted
    note: 'Repaired: ExperienceSwitch gains optional currentTimeUtcMs; App.tsx passes the runtime clock''s time when it hands the switcher to the shell; SwitchControl passes it to switchAddress, which sets t (whole seconds, as the view link writes it) when the switch keeps t. Showers keep no t and are unchanged. Test: tests/planetSystems.test.ts ''the switch carries the clock''s time now'' (address with an old t, and with none, gets the later time; non-keeping switch drops t). Browser scenario in browser-outer-planets.mjs (see I-052), not run. Scene, camera and controls code unchanged; shell/App UI code touched.'
  - at: '2026-10-20T14:26:00Z'
    actor: {role: checker, session: o033-full-recheck-20261020}
    kind: rechecked
    note: 'Recheck C-092 at HEAD ff1d8d80: Proof Needed met. App.tsx passes runtime.clock time to the switch; switchAddress sets t from it when keep names t; unit test covers an old t, no t, and a non-keeping switch. Browser: outer-planets seeks Jupiter five days on, switches to Saturn and reads that later time back; passed at desktop and phone in the one planets-set run (docs/evidence/demo-planets-20261020T141653Z). Left open only because C-092 is NEEDS WORK; verified closure needs a CLEAR Check.'
    check: C-092
---

# I-051: The planet switch keeps only the address's time, not the clock's

## Summary

O-033 Success Condition 1: "switching keeps the clock date". T-117 carried to T-118: "switching must keep the clock time (Objective Success Condition 1)"; T-118's evidence says it was done by `PLANET_SWITCH_KEEPS = ["t"]`. But the switch builds the new address from `window.location.href` (`src/shell/SwitchControl.tsx` line 32, `switchAddress(..., choice.keep)`), and the app writes `t` into the address only when the viewer presses "copy view link" (`src/app/App.tsx` lines 257-262, `copyViewLink`; no other `history.replaceState` in `src/`). So the switch carries the time the page was opened with (or the last copied link's), not the time on the clock. The window is two weeks at 3600x (one simulated hour per second), so after about 24 seconds of play the date has changed and a switch opens the new planet back at the window start (no `t`) or at the old address time.

## Evidence

- `src/shell/SwitchControl.tsx` lines 12-18 and 32: `switchAddress(href, param, value, keep)` keeps `t` only if `href` already has it.
- `src/app/App.tsx` line 260-262: the only address write of `t`.
- `tests/planetSystems.test.ts` tests `switchAddress` on an address that already carries `t`; `tools/validate/browser-outer-planets.mjs` lines 58-70 open Jupiter with `&t=` and compare the clock after the switch with that same value, so neither can see the gap.

## Expected

Open the planets demo (no `t`), let the clock run or seek to another day, switch planet: the new planet opens at the time the clock showed.

## Actual

The new planet opens at the window start (or at the address's stale `t`).

## Proof Needed

1. The switch takes the clock's current time (for example from the runtime clock when the option is pressed) when the experience's switch keeps `t`; showers keep their own behaviour.
2. A test that fails when the switched address carries the opening time instead of a later clock time.
3. A browser scenario that seeks or plays to a time different from the opening one, switches, and reads the same time back.
