---
id: I-103
title: 'The README understates the planets'' date range'
type: drift
status: open
source:
  kind: report
  actor: {role: owner, session: voyager-feedback-20261030}
  at: '2026-10-30T20:08:15Z'
severity: low
history:
  - at: '2026-10-30T20:08:15Z'
    actor: {role: planner, session: voyager-feedback-20261030}
    kind: observed
    note: 'Reported from the Voyager downstream app (astraeus@0.3.0 from npm, public API only, JPL Horizons data), pasted by the owner.'
---

# I-103: The README understates the planets' date range

## Summary

The README says the engine draws the planets for 2010 to 2030; the bundled planets.json covers 1969-01-01 to about 2045 with worst fit error under 1 km. Users of historical missions (Voyager, 1977) are told it will not work.

## Evidence

- Confirmed: `packages/astraeus/README.md:125` says "2010 to 2030".
- Reported: bundled planets.json covers 1969-01-01 to about 2045, worst fit error under 1 km (to be confirmed from the data file and its fit record).

## Proof Needed

- The README range matches the bundled data's actual coverage and stated accuracy.
