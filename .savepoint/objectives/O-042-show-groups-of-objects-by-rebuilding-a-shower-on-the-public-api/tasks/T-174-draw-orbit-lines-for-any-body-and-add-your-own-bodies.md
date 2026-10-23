---
id: T-174
title: Draw orbit lines for any body and add your own bodies
objective: O-042
status: planned
depends_on: [{task: T-173, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o042-planning-20261024}
---

# Draw orbit lines for any body and add your own bodies

## Outcome

A scene can be Sun-centred; `addBody(x, { orbit: true })` draws one full turn for any body that circles the Sun (Earth's year from the same geometry, eccentric orbits sampled smoothly); a body can be added from published orbit elements with provenance (Decision 2); planets can be enlarged in the readable scale (`enlarge`); a body's label can start off.

## User Check

None required; proven on a made-up configuration.

## Done When

- Each new option and call has doc comments, a place on `/api`, and made-up Sun-centred tests (a made-up comet from elements, its smooth whole orbit, planet turns, enlargement, a hidden label).
- Error messages name the field; `no-orbit` widened; a tracked path in a Sun-centred scene refused with a named error.
- Label priority and label reach for Sun-centred scenes work at solar-system distances (or a flagged option), so labels do not fade early when zoomed out — say which.
- Apollo and hello-scene definitions unchanged (their comparison tests still pass).
- Hand-off gates plus `check:engine-alone`, `check:pack` green.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/bodies.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/core/sunCentredSources.ts`, `packages/astraeus/src/core/elementsBody.ts`, `packages/astraeus/src/assets/catalogue.ts`, `packages/astraeus/src/assets/compositions.ts`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/app/catalogueItem.ts`, `packages/astraeus/tests/publicApiPaths.test.ts`, `packages/astraeus/tests/publicApi.test.ts`, `packages/astraeus-site/tools/site/api-reference.mjs`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`.

## Design References

Design Interfaces and Data Flow (sun-centred layer, catalogue), Current Technical State O-041.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, ARCH-05, PROV-01, TEST-01, TEST-03, STYLE-05.

## Implementation Plan

1. Sun-centred scenes and any-body orbit lines. 2. Own body from elements. 3. Enlarge, label-off, label reach. 4. Tests and docs.

## Boundaries

No own pictures; no moon orbit lines beyond the existing two.

## Technical Verification

Hand-off gates from AGENTS.md (`npm run lint`, `npm run typecheck`, `npm run build`, `npm test`) plus the extra gates named in Done When. No `npm run check:browser` per Task (one run at the Full Objective Check); a changed browser step may be run alone once. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for Design reconciliation in the showers rebuild Task.
