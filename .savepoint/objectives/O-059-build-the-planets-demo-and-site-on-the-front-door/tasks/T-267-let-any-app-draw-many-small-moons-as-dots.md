---
id: T-267
objective: O-059
title: Let any app draw many small moons as dots
status: planned
depends_on: [{task: T-266, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
---

# Let any app draw many small moons as dots

## Outcome

An app can add a planet's small moons as one batch of dots with families, orbit lines and names on demand, through a public call, with no planet named in engine rules.

## User Check

Read the README entry; a made-up system in a test draws a batch of made-up moons.

## Done When

The public call builds the same internal body set the demo uses today, including orbit lines for bodies with no path of their own and the balance point; it loads positions through `data`, works in `scene.check` and `scene.load`, has reads, typed errors, a made-up proof, lock, README and CHANGELOG. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus/src/app/bodySet.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/planGroups.ts`, `packages/astraeus/src/api/group.ts`, `packages/astraeus/src/api/sceneReads.ts`, `packages/astraeus/src/api/bodies.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-02, API-03, API-04, API-05, ARCH-01, ARCH-03, ARCH-05, ARCH-06, PROV-01, TEST-01.

## Implementation Plan

1. Add a planner for the batch beside the existing planners. 2. Join it in `assembleScene`. 3. Add reads and `bad-*` errors. 4. Prove on a made-up system. 5. Lock, README, CHANGELOG.

## Boundaries

No change to how dots draw. No planets demo rebuild.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.
