---
id: I-106
title: 'The timeline offers playback speeds that were not asked for'
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: voyager-feedback-20261030}
  at: '2026-10-30T20:08:15Z'
severity: low
checks: [C-128]
resolution:
  disposition: verified
  check: C-128
  actor: {role: checker, session: o047-recheck2-20261031}
  at: '2026-10-31T04:25:00Z'
  reason: 'C-128 CLEAR: the speed menu offers exactly the rates given (C-126 row 9), unchanged by later repairs; full gate passes.'
history:
  - at: '2026-10-30T20:08:15Z'
    actor: {role: planner, session: voyager-feedback-20261030}
    kind: observed
    note: 'Reported from the Voyager downstream app (astraeus@0.3.0 from npm, public API only, JPL Horizons data), pasted by the owner.'
  - at: '2026-10-31T04:25:00Z'
    actor: {role: checker, session: o047-recheck2-20261031}
    kind: rechecked
    check: C-128
    note: 'Verified by C-128 CLEAR (targeted re-check of O-047 after the I-110 surface repair, 6878f277).'
---

# I-106: The timeline offers playback speeds that were not asked for

## Summary

`setTimeline({ rates: [86400, 604800, 2592000] })` also offers 1x and 3,600x. Either only the given rates should be offered or the additions should be documented.

## Evidence

- Confirmed in code: `packages/astraeus/src/shell/TimelineBar.tsx:66` merges `DEFAULT_PLAYBACK_SPEEDS` with the experience rates (`mergeSpeeds`, `src/shell/timelineModel.ts:57`).

## Proof Needed

- Either the speed menu shows only the given rates (test), or the README documents that the default speeds are always added.
