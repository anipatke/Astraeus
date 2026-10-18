---
id: T-103
title: Draw the tagged places on the four mapped moons
objective: O-025
status: planned
depends_on: [{task: T-098, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Draw the tagged places on the four mapped moons

## Outcome

Io, Europa, Ganymede and Callisto show the tagged places the owner verified in Planetary Explorer: markers at their exact latitude and longitude, named on hover or tap, with each place's description and details on tap.

## User Check

Fly to Io: its volcanoes and other tagged places sit where they did in Planetary Explorer; tap one to read it. Same on Europa, Ganymede and Callisto.

## Done When

1. O-025 Decision 1 (owner: the verified coordinates and tagged places are carried bit for bit, never "corrected"); T-098 Drift Note 2 (Astraeus draws no body-package features yet).
2. A generic feature-marker layer draws a body package's `features.json` on its body, placed with the package's recorded coordinate convention (`map.json` `coordinates`, the donor's `latLonToXYZ`), lifted from Planetary Explorer's marker look as-is (owner rule: name any deviation); markers hide on the far side and when too small to read.
3. Tap or hover shows the place's name; a tap opens its description, details and sources in the information panel.
4. Positions proven: a test places every feature of the four packages and compares with the donor's own formula on the same inputs (bit-for-bit inputs, `tests/bodyPackages.test.ts` stays green); the owner looks at known places (for example Io's Loki Patera, Ganymede's Galileo Regio), including Ganymede's 180° texture turn from T-098.
5. Generic (no moon names in engine or shell, ARCH-01), so the post-launch planets reuse it; performance on a phone measured.
6. Browser checks through the shared driver (scene readouts, no screenshots); lite and the Jupiter script pass.

## Context Files

`data/bodies/README.md`, `data/bodies/io/features.json`, `data/bodies/io/map.json`, `tools/import/planetary-explorer-conventions.json`, `src/app/bodyDraw.ts`, `src/app/StoryMarkers.ts`, `/home/user/code/planetary-explorer/src/features/hotspots/usePlanetContent.ts`, `tests/bodyPackages.test.ts`, `tools/validate/driver.mjs`, `tools/validate/browser-jupiter-io.mjs`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

O-025 Decisions 1 and 8; O-018 T-077 body packages.

## Guardrails

ARCH-01, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Feature-marker layer from the package convention; positions test.
2. Names, info panel, checks, owner look.
- Owner, 2026-10-18: Ganymede's texture stays turned 180 degrees (T-098, `GANYMEDE_VISUAL` yaw pi, from the I-032 trace); the tagged locations will be redone here, so place Ganymede's features against the turned picture and confirm Tros (about 11 N, 27 W) and Osiris (about 38 S, 166.5 W) land on their craters.

## Boundaries

The four mapped moons' features; other bodies' features are post-launch (O-018).

## Technical Verification

Configured gates, positions test, lite, Jupiter script. Evaluated under `agent-skills/references/check-method.md`.
