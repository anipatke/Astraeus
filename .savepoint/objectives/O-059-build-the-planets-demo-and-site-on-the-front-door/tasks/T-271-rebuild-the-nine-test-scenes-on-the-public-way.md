---
id: T-271
objective: O-059
title: Rebuild the nine test scenes on the public way
status: planned
depends_on: [{task: T-270, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
---

# Rebuild the nine test scenes on the public way

## Outcome

The made-up scenes on the local preview are built with `Scene`, so they prove the public features on scenes that are not our demos.

## User Check

`npm test` passes; each scene the note keeps opens from a public `Scene` builder.

## Done When

Each scene the note keeps builds through public calls; each dropped or moved one is recorded with where its proof now lives; browser scripts that open them are updated; no check loses its proof that the engine is not tied to our demos (ARCH-03). Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus/src/synthetic/syntheticDefinition.ts`, `packages/astraeus/src/synthetic/syntheticRingDefinition.ts`, `packages/astraeus/src/synthetic/syntheticListedDefinition.ts`, `packages/astraeus/src/synthetic/syntheticEccentricDefinition.ts`, `packages/astraeus/src/synthetic/syntheticProbeDefinition.ts`, `packages/astraeus/src/synthetic/syntheticViewsDefinition.ts`, `packages/astraeus/src/synthetic/syntheticJourneyScene.ts`, `docs/BROWSER_CHECKS.md`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, ARCH-03, TEST-01, TEST-03.

## Implementation Plan

1. Rebuild scene by scene. 2. Point tests and browser scripts at the new builders. 3. Record any drop or move.

## Boundaries

No new test scenes. The site's own wiring changes in the next step.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.
