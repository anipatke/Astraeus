---
id: I-104
title: 'The ScalePolicy type promises custom scales that setScale refuses'
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

# I-104: The ScalePolicy type promises custom scales that setScale refuses

## Summary

The `ScalePolicy` type's docs say apps may supply their own scale policies, but `setScale` refuses anything other than the two built-in scales.

## Evidence

- Reported: `setScale` gives `setScale: "enlarged" is not a scale; use trueScale or readableScale`.
- Confirmed in code: `packages/astraeus/src/api/scene.ts:335`.
- Related: I-098 (opening on the Solar system scale).

## Proof Needed

- The `ScalePolicy` doc and `setScale`'s behaviour agree (either custom policies work, or the doc stops promising them).
