---
id: T-205
objective: O-048
title: Show each ringed planet's rings by default
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-2-20261031}
---

# Show each ringed planet's rings by default

## Outcome

Jupiter, Saturn, Uranus and Neptune carry their rings in their one catalogue definition (ARCH-05), so any scene that adds the planet through the public API draws them, with their recorded source (I-118); the demos stop attaching rings themselves and draw as before.

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- The ring systems (`SATURN_RINGS`, `URANUS_RINGS`, `NEPTUNE_RINGS` in `src/assets/bodies/outerPlanetCatalogues.ts`, `JUPITER_RINGS` in `src/assets/bodies/jupiterRings.ts`) are part of each planet's catalogue visual where the engine defines the planet; the demo system overrides no longer set `rings` (one source).
- `addBody(saturn)` in a made-up public-API scene has rings in its drawn definition (test); same for the other three; a planet with none (Mars) has none.
- The ring look settings (`RingLook`, developer sliders) still apply; demo tests and comparisons unchanged (name them) or updated with a stated reason.
- Ring data source/licence recorded where the info card shows provenance (PROV-02), or a stated reason it already is.
- README note (which planets have rings); CHANGELOG `Unreleased` line; first-download size change stated (`npm run measure:example`).

## Context Files

`packages/astraeus/src/assets/bodies/outerPlanetCatalogues.ts`, `packages/astraeus/src/assets/bodies/jupiterRings.ts`, `packages/astraeus/src/assets/bodies/jupiter.ts`, `packages/astraeus/src/core/bodies/outerPlanets.ts`, `packages/astraeus/src/app/BodyView.tsx`, `packages/astraeus/src/app/RingView.ts`, `packages/astraeus-demo-planets/src/experiences/planets/systems/uranus.ts`, `packages/astraeus-demo-planets/src/experiences/planets/systems/neptune.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`; `docs/architecture/state-and-assets.md` asset architecture.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Find where each planet's visual is defined for the public catalogue; return REPLAN REQUIRED if rings cannot live there without a layer-rule break (ARCH-04).
3. Attach rings there; remove the demo duplicates.
4. Tests, docs, size.

## Boundaries

No new ring data or looks.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
