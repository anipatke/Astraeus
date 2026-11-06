---
id: T-266
objective: O-059
title: Add the small public settings and delete unused ones
status: planned
depends_on: [{task: T-265, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
---

# Add the small public settings and delete unused ones

## Outcome

The small abilities the note marks public (such as scene centre, desktop pictures, info card facts and items left out of the menu) are public settings with defaults, and `alternates` and `developerSections` are gone.

## User Check

Read the README API tables: each new setting is listed with its default. A short made-up scene in a test uses each one.

## Done When

Each setting is reachable from `astraeus`, tested on a made-up scene (ARCH-03), in the surface lock, README and CHANGELOG; the deleted fields have no reader left; the planets demo and site still build. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/assembleScene.ts`, `packages/astraeus/src/api/planBodies.ts`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/DeveloperSettings.tsx`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-02, API-04, API-06, ARCH-01, ARCH-03, ARCH-06, TEST-01, TEST-03.

## Implementation Plan

1. Add each setting from the note, one at a time, with a test. 2. Delete `alternates` and `developerSections` and their drawing code. 3. Run `npm run api:lock`; update README and CHANGELOG.

## Boundaries

Only the settings the note names. No moon, place or picker features (later steps). The demos are not rebuilt here.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.
