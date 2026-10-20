---
id: T-119
title: Put Mercury, Venus, Earth and Mars in the planet switch
objective: O-033
status: in_progress
stage: build
depends_on: [{task: T-116, requires: clear}, {task: T-117, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
---

# Put Mercury, Venus, Earth and Mars in the planet switch

## Outcome

Picking Mercury, Venus, Earth or Mars in the switch opens that planet with its tagged places; Earth with the Moon and its places, Mars with Phobos and Deimos on their real orbits.

## User Check

On the preview, switch to each of the four; tap a place on Mars and on the Moon; find Phobos close to Mars.

## Done When

1. One settings file per planet; the existing Earth, Moon, Mercury, Venus and Mars catalogue bodies and their feature packages (Earth 20, Moon 30, Mercury 16, Venus 19, Mars 32 places, carried bit for bit), no new body definitions except what T-116 added.
2. Earth's view uses the existing Earth-Moon state sources; Apollo unchanged (its tests pass untouched).
3. Each view downloads only its own data (no moon chunks for Mercury and Venus; the planet series only where needed); test per view.
4. Browser check scenario written (not run) for one inner planet's switch and a place tap.

## Context Files

`src/experiences/jupiter-io/jupiterIo.ts`, `src/assets/compositions.ts`, `src/core/bodies/earth.ts`, `src/core/bodies/moon.ts`, `src/core/bodies/mars.ts`, `src/app/planetNeeds.ts`, `src/app/FeatureMarkers.ts`, `tools/validate/driver.mjs`.

## Design References

Design: Compositions and scene centre, Planets, feature-marker row.

## Guardrails

ARCH-01, ARCH-05, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Settings files for the four planets.
2. Data-loading tests per view; Apollo regression.
3. Browser scenario through the driver.

## Boundaries

Data and settings only; a builder gap returns REPLAN REQUIRED.

## Technical Verification

Configured gates; no browser runs (owner rule); evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
