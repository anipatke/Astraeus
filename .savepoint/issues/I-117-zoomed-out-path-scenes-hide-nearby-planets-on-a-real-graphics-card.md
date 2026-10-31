---
id: I-117
title: 'Zoomed-out path scenes hide nearby planets and moons on a real graphics card'
type: defect
status: resolved
source:
  kind: report
  actor: {role: owner, session: probe-feedback-2-20261031}
  at: '2026-10-31T19:00:00Z'
severity: high
checks: [C-129]
resolution:
  disposition: verified
  check: C-129
  actor: {role: checker, session: o048-check-20261031}
  at: '2026-10-31T09:13:00Z'
  reason: 'C-129 CLEAR: logarithmic depth buffer engine-wide, every custom shader carries the chunks (guard test); near-Saturn browser case with the whole-path reach draws Saturn and rings (docs/evidence/browser-20261031T090631Z); owner GPU look passed.'
history:
  - at: '2026-10-31T19:00:00Z'
    actor: {role: planner, session: probe-feedback-2-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.5.0 from npm, public API only), pasted by the owner.'
  - at: '2026-10-31T09:13:00Z'
    actor: {role: checker, session: o048-check-20261031}
    kind: rechecked
    check: C-129
    note: 'Verified by C-129 CLEAR (Full Objective Check of O-048 at 2813d8ca).'
---

# I-117: Zoomed-out path scenes hide nearby planets and moons on a real graphics card

## Summary

The 0.5.0 whole-path zoom-out (I-114) widens the far plane to hundreds of AU while the near plane follows the camera, so the depth range is too wide for a GPU depth buffer and nearby planets and moons disappear. With `camera.fitOrbit("saturn")` (a smaller far plane) Saturn shows again.

## Evidence

- Reported on a real GPU against 0.5.0. Headless SwiftShader in `check:browser` did not show it (C-127, C-128 evidence).
- Confirmed in code: `packages/astraeus/src/app/CameraController.tsx:223` sets `near = max(1e-3, 0.1 * (distance - focusRadius))` and `far` from the reach (2.5x the T-203 `cover`, about 850 AU for a 170 AU path); the ratio far/near can reach about 1e9.
- Reporter's fix: a far plane in proportion to the camera distance, or a logarithmic depth buffer.

## Proof Needed

- In a Sun-centred scene with a 170 AU path, planets and moons near the camera draw correctly at every zoom, on a GPU browser (owner look) and in a test of the near/far ratio (or depth mode).
- The whole path still frames when zoomed out (I-114 unchanged).
