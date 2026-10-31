---
id: I-118
title: 'Planet rings are never attached through the public API'
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: probe-feedback-2-20261031}
  at: '2026-10-31T19:00:00Z'
severity: high
history:
  - at: '2026-10-31T19:00:00Z'
    actor: {role: planner, session: probe-feedback-2-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.5.0 from npm, public API only), pasted by the owner.'
---

# I-118: Planet rings are never attached through the public API

## Summary

Saturn, Jupiter, Uranus and Neptune never show rings in an app on the public API. The ring data ships in the engine, but only the demos' internal system overrides attach it.

## Evidence

- Reported against 0.5.0.
- Confirmed in code: `SATURN_RINGS`, `URANUS_RINGS`, `NEPTUNE_RINGS` (`src/assets/bodies/outerPlanetCatalogues.ts`) and `JUPITER_RINGS` (`src/assets/bodies/jupiterRings.ts`) are attached only in `packages/astraeus-demo-planets/src/experiences/planets/systems/*.ts`.
- Reporter's fix: attach each planet's rings by default.

## Proof Needed

- `addBody(saturn)` (and Jupiter, Uranus, Neptune) draws its rings with the catalogue look and provenance; the demos draw as before.
