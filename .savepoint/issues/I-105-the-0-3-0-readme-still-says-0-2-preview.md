---
id: I-105
title: 'The 0.3.0 README still opens with "0.2 preview"'
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

# I-105: The 0.3.0 README still opens with "0.2 preview"

## Summary

The published 0.3.0 package README still opens with the "0.2 preview" notice.

## Evidence

- Confirmed: `packages/astraeus/README.md:5`.

## Proof Needed

- The README notice names the current version (or no version), and a release check catches a stale one next time.
