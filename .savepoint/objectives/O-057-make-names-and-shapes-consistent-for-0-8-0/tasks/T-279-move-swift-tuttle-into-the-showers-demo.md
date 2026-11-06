---
id: T-279
objective: O-057
title: Move Swift-Tuttle into the showers demo
status: planned
depends_on: [{task: T-278, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
---

# Move Swift-Tuttle into the showers demo

## Outcome

The engine catalogue holds only the Sun, planets, dwarf planets and moons, and the showers demo adds the comet itself.

## User Check

`addBody("swift-tuttle")` fails in a test, and the Perseids demo still shows the comet.

## Done When

The elements, provenance and Horizons fixtures leave the engine for the showers package; the demo adds the comet through `addBodyFromElements` with its marker look; a test proves positions match the old built-in ones across 1990 to 2030, and the Horizons comparison still passes; a catalogue kind test fails on any comet, probe or story body; engine tests that used the comet as a sample use a made-up one; panel and `parentBodyId` links still resolve; the lock is regenerated if it changes.

## Context Files

`.savepoint/objectives/O-057-make-names-and-shapes-consistent-for-0-8-0/Objective.md`, `packages/astraeus/src/core/bodies/swiftTuttle.ts`, `packages/astraeus/src/assets/bodies/swiftTuttle.ts`, `packages/astraeus/src/assets/catalogue.ts`, `packages/astraeus/src/core/bodies/index.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerScene.ts`, `packages/astraeus-demo-showers/tests/swiftTuttle.test.ts`, `packages/astraeus-demo-showers/data/showers/perseids.json`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, ARCH-05, PROV-01, TEST-01, TEST-02.

## Implementation Plan

1. Capture the old positions as a fixture. 2. Write the elements record and add it in the demo. 3. Remove the body from the catalogue and add the kind test. 4. Move the fixtures and engine tests.

## Boundaries

If `addBodyFromElements` cannot match the old positions or look, stop with REPLAN REQUIRED; do not add a special case to the engine. No deep-import count may rise.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the last step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read and changed, limitations.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.
