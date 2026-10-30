---
id: I-098
title: 'A scene cannot open on the enlarged "Solar system" scale'
type: other
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
severity: medium
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

# I-098: A scene cannot open on the enlarged "Solar system" scale

## Summary

`setScale` takes only `trueScale` or `readableScale`; giving `readableScale` to a Sun-first scene with enlarged bodies removes the "Solar system" choice. There is no way to open on the enlarged scale.

## Evidence

- Reported against 0.3.0.
- Confirmed in code: `packages/astraeus/src/api/scene.ts:335` refuses anything outside `SCALES` with `use trueScale or readableScale`.
- Reporter's fix: export `solarSystemScale`, or accept `setScale("solar-system")`.

## Proof Needed

- A Sun-first scene with enlarged bodies can open on the "Solar system" scale and the viewer can still switch to true scale.
- The README lists the accepted scales.
