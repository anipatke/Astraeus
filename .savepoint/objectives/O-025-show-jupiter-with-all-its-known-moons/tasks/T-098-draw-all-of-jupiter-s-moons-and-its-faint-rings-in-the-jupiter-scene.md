---
id: T-098
title: Draw all of Jupiter's moons and its faint rings in the Jupiter scene
objective: O-025
status: planned
depends_on: [{task: T-096, requires: clear}, {task: T-097, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Draw all of Jupiter's moons and its faint rings in the Jupiter scene

## Outcome

The Jupiter demo shows every moon where NASA puts it: the big four as textured worlds with their tagged places, every other moon as a small grey dot that becomes a grey ball at its real size up close, names on hover, tap or zoom, and Planetary Explorer's four faint ring bands at the real rings' distances.

## User Check

Open the Jupiter demo, zoom out to see the swarm of dots far from Jupiter, zoom in on a small moon to see its grey ball, hover a dot for its name; look past the inner moons at the faint rings.

## Done When

1. O-025 Decisions 2, 7 and 9: dots for the small moons drawn as one batch (like the showers' points), a pixel floor so they never vanish, a grey ball at true size when close; names appear on hover, tap or near zoom only (no wall of labels).
2. The four mapped moons draw as today (textures, lighting, tagged places from their packages).
3. Rings: Planetary Explorer's bands lifted as-is in colour and opacity (halo #a0b0d0 0.105, main #d0a080 0.28, inner gossamer #b08060 0.065, outer gossamer #a07050 0.026; `/home/user/code/planetary-explorer/src/entities/jupiter.ts`, `PlanetRingSystem.tsx`), placed at the real rings' radii from a published source (the owner's chosen deviation), flat in Jupiter's equator; opacities and colours are live settings.
4. **Family-coloured orbits** (owner, 2026-10-18: "would be cool to have different coloured orbits for each family"): each moon's orbit line is drawn in its family's colour (families from T-097's `data/moons/jupiter.json`), in the faint I-035 orbit look and batched so 115 orbits stay cheap; one colour per family from a palette that reads on the dark sky and stays distinguishable for common colour-vision differences; the palette is live settings (owner rule); the dots stay grey (owner's choice, Decision 2); orbit labels stay off by default (owner, 2026-10-18); T-099's family highlight brightens that family's orbits.
5. Positions from the T-096 provider; generic engine and presentation code (no Jupiter names outside data, ARCH-01); an experience may choose which bodies to show (O-025 Decision 8: the rest stay "on the shelf").
6. Phone performance: frame time measured on a throttled phone-class run with all moons and rings shown, no worse than today's Jupiter–Io demo by more than a stated margin.
7. Browser checks through the shared driver (moon count drawn, a dot's name on hover, a small moon's ball up close, rings present, one orbit colour per family); full run passes; owner look.

## Context Files

`src/experiences/jupiter-io/jupiterIo.ts`, `src/app/PointsView.ts`, `src/app/bodyDraw.ts`, `src/app/AstraeusScene.tsx`, `src/assets/compositions.ts`, `src/assets/catalogue.ts`, `/home/user/code/planetary-explorer/src/entities/jupiter.ts`, `/home/user/code/planetary-explorer/src/features/moon/PlanetRingSystem.tsx`, `tools/validate/driver.mjs`, `tools/validate/browser-jupiter-io.mjs`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

O-025 Decisions; Design.md presentation engine (points, bodies, floating origin, scales).

## Guardrails

ARCH-01, ARCH-02, PROV-01, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. All moons from the provider: batched dots, balls up close, names on demand.
2. Rings; performance measure; checks; owner look.

## Boundaries

Drawing only; the families panel, the demo's date and stories are later Tasks.

## Technical Verification

Configured gates, Jupiter script, throttled frame-time probe, full run. Evaluated under `agent-skills/references/check-method.md`.
