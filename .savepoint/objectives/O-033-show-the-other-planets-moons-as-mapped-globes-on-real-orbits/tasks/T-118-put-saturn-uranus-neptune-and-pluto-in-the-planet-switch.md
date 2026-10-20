---
id: T-118
title: Put Saturn, Uranus, Neptune and Pluto in the planet switch
objective: O-033
status: in_progress
stage: build
depends_on: [{task: T-116, requires: clear}, {task: T-117, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
---

# Put Saturn, Uranus, Neptune and Pluto in the planet switch

## Outcome

Picking Saturn, Uranus, Neptune or Pluto in the switch opens that planet with its tagged places, its mapped moons as globes with their places, every other moon as a family-coloured dot, its moons panel, and rings on Saturn, Uranus and Neptune.

## User Check

On the preview, switch to each of the four; open the moons panel; tap a place on Titan and on Pluto; look at Saturn's rings.

## Done When

1. One settings file per planet (no code per planet); bodies, families, feature packages and rings named only there.
2. Rings for Saturn, Uranus and Neptune from the NASA NSSDC ring fact sheets as core ring data (`data/rings/<planet>.json`), drawn by `RingView`; looks from the donor's Saturn ring where it has one, live settings, provenance labelled.
3. Each view's chunks are only that planet's (window year plus orbit history), shipped through the builder's glob; unit test that a view's needed chunks equal its shipped set.
4. Opening framing and camera reach per planet (Pluto-Charon close pair; Saturn's far moons), stated in settings.
5. Browser check scenarios written (not run) for one outer planet's switch, a place tap and the moons panel, through the shared driver.

## Context Files

`src/experiences/jupiter-io/jupiterIo.ts`, `data/stories/jupiter-io/panels.json`, `src/app/RingView.ts`, `src/assets/bodies/jupiterRings.ts`, `data/rings/jupiter.json`, `src/app/FeatureMarkers.ts`, `src/shell/bodyFeatures.ts`, `src/shell/moonFamilies.ts`, `tools/validate/driver.mjs`, `tools/validate/browser-jupiter-io.mjs`, `/home/user/code/planetary-explorer/src/entities/saturn.ts`.

## Design References

Design: body-set row, feature-marker row, moons panel row, Jupiter and Io.

## Guardrails

ARCH-01, ARCH-02, PROV-01, PROV-02, TEST-01, STYLE-09.

## Implementation Plan

1. Ring data and settings files for the four planets.
2. Chunk shipping and framing; tests.
3. Browser scenarios through the driver.

## Boundaries

No builder or core changes beyond data; a builder gap returns REPLAN REQUIRED. File paths of the new settings follow T-117.

## Technical Verification

Configured gates; no browser runs (owner rule); evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
