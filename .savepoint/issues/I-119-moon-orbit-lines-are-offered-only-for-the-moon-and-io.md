---
id: I-119
title: 'Moon orbit lines are offered only for the Moon and Io'
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: probe-feedback-2-20261031}
  at: '2026-10-31T19:00:00Z'
severity: low
history:
  - at: '2026-10-31T19:00:00Z'
    actor: {role: planner, session: probe-feedback-2-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.5.0 from npm, public API only), pasted by the owner.'
---

# I-119: Moon orbit lines are offered only for the Moon and Io

## Summary

`addBody(x, { orbit: true })` draws a moon's orbit only for the Moon and Io; other moons (Europa, Titan, ...) are refused, though the demos draw them through the internal body-set orbit layer.

## Evidence

- Reported against 0.5.0 ("moon orbit rings beyond Io").
- Confirmed in code: `ORBITS` in `packages/astraeus/src/api/scene.ts:85` lists only `moon` and `io`; the demos use `src/app/OrbitSetView.ts`.

## Proof Needed

- Any catalogued moon added with `{ orbit: true }` draws its orbit about its planet; a test covers a Jupiter and a Saturn moon.
