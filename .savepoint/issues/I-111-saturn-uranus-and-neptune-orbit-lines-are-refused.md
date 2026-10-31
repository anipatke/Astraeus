---
id: I-111
title: 'Saturn, Uranus and Neptune orbit lines are refused'
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: probe-feedback-20261031}
  at: '2026-10-31T12:00:00Z'
severity: high
history:
  - at: '2026-10-31T12:00:00Z'
    actor: {role: planner, session: probe-feedback-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.4.0 from npm, public API only), pasted by the owner.'
---

# I-111: Saturn, Uranus and Neptune orbit lines are refused

## Summary

`addBody(saturn, { orbit: true })` passes `toDefinition()` and then fails at load with `no-orbit`, because the line is found by searching a dozen years for one full turn and Saturn (29.5 y), Uranus (84 y) and Neptune (165 y) take longer. `camera.fitOrbit("saturn")` fails the same way as a page error repeated every frame, which also stops labels being placed.

## Evidence

- Confirmed in code: `packages/astraeus/src/api/scene.ts:591` (`#sunPath`) and `packages/astraeus/src/api/sunOrbit.ts:84` (`farthestSunDistanceKm`) throw `no-orbit` when `turnSpan` finds no turn; `BUILT_IN_SAMPLING` (`src/core/bodies/index.ts:53`) holds only Swift-Tuttle, so no planet has a known period.
- `farthestSunDistanceKm` is called lazily from the viewer's framing (`src/app/sceneFraming.ts:77`), which is why the fitOrbit error repeats per frame instead of failing setup once.
- Reporter's fix: store the outer planets' periods in the catalogue, or draw their orbits from their elements; catch this at `toDefinition`; report setup errors once, through `onError` / `ready`.

## Proof Needed

- `addBody(x, { orbit: true })` and `camera.fitOrbit(x)` work for Saturn, Uranus and Neptune (and every catalogued planet), with the line's stated accuracy.
- Any remaining setup error is raised once (at `toDefinition`, or through `ready`/`onError`), never per frame, and labels keep working.
