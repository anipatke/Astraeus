---
id: T-268
objective: O-059
title: Let any app show a moon panel and surface places
status: planned
depends_on: [{task: T-267, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
---

# Let any app show a moon panel and surface places

## Outcome

An app can show a moon family panel and tagged surface places through public, general calls, with the place data arriving from the app, not from a private path.

## User Check

Read the README entries; a made-up body with made-up places and families appears in a test.

## Done When

Both features work on `mount` and React, are proven on a made-up system, carry provenance (PROV-01), and the place data has the home the note set; panel pictures come from the viewer's data; reads, typed errors, lock, README and CHANGELOG are updated. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus/src/shell/moonFamilies.ts`, `packages/astraeus/src/shell/bodyFeatures.ts`, `packages/astraeus/src/shell/experience.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/assembleScene.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-02, API-04, API-05, ARCH-01, ARCH-03, ARCH-06, PROV-01, PROV-02, TEST-01.

## Implementation Plan

1. Add the moon panel input. 2. Add the places input. 3. Move data if the note says so, updating `bodyPackages.test.ts`. 4. Prove on a made-up system. 5. Lock, README, CHANGELOG.

## Boundaries

No panel redesign; the look stays. No planets demo rebuild.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.
