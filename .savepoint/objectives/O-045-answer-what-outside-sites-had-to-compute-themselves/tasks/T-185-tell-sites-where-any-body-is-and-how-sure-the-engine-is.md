---
id: T-185
title: Tell sites where any body is and how sure the engine is
objective: O-045
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o045-planning-20261028}
---

# Tell sites where any body is and how sure the engine is

## Outcome

`Scene.stateOf(id, time)` answers for every body in a scene, not only `addTrajectory` paths, and a new `Scene.provenanceOf(id)` returns the body's `Provenance` with machine-readable `accuracyClass` and `maxErrorFraction`. The accuracy limits, `classifyPositionError` and `parseElementsBodyRecord` are root exports, so a site can class its own comparison and validate an elements record without building a scene (showers findings E1, E2, E3, G3).

## User Check

None required; behaviour is proven by tests.

## Done When

- `stateOf` returns the same State the viewer draws (the catalogue source's `stateAt`) for a built-in planet, a moon, built-in Swift-Tuttle and a body from `addBodyFromElements`, matching `toDefinition().catalogue.get(id).source.create().stateAt(t)` within 1e-9 relative; existing `addTrajectory` behaviour and error messages unchanged (existing tests named in evidence, TEST-03). Outside a body's data range it throws `bad-time`; an id not in the scene throws `unknown-body` (TEST-02).
- `provenanceOf(id)` returns the body's Provenance for the same four kinds and paths; `Provenance` gains optional `accuracyClass` (`"approximate" | "indicative"`) and `maxErrorFraction`, filled for Swift-Tuttle (approximate, 0.00857) and for elements bodies from their record; other bodies leave them out. Unknown id throws `unknown-body`.
- Root exports `APPROXIMATE_LIMIT_FRACTION`, `INDICATIVE_LIMIT_FRACTION`, `classifyPositionError`, `parseElementsBodyRecord` and the classification type; a made-up record proves each (ARCH-03).
- `tools/check-node-consumer.mjs` also calls `stateOf("earth", …)` and `provenanceOf` on the packed package.
- Doc comments on every new or widened member (API reference test green).
- Hand-off gates green plus `npm run check:node-consumer` and `npm run check:pack`.

## Context Files

`packages/astraeus/src/api/scene.ts` under `stateOf` and `toDefinition`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/core/provenance.ts`, `packages/astraeus/src/core/elementsBody.ts`, `packages/astraeus/src/core/bodies/swiftTuttle.ts`, `packages/astraeus/src/assets/catalogue.ts`, `packages/astraeus/src/app/experienceDefinition.ts` under `catalogue`, `packages/astraeus/tests/publicApiPaths.test.ts`, `packages/astraeus/tests/publicApi.test.ts`, `tools/check-node-consumer.mjs`.

## Design References

Design Interfaces and Data Flow (public API layer); Components/Codebase Map (`src/api/`, `src/core/`).

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-02, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Widen `stateOf` to resolve catalogue bodies through the same source the viewer uses; keep the trajectory path; tests.
2. Add the two optional Provenance fields, fill them, add `provenanceOf`; tests.
3. Root-export the accuracy helpers; extend the Node consumer check.

## Boundaries

No `positionOf`, no solar-longitude helper, no export of built-in bodies' raw elements (owner, 2026-10-28); no change to drawn positions; no browser runs (browser policy: one run at the Full Objective Check).

## Technical Verification

Focused tests while iterating; hand-off gates, `npm run check:node-consumer`, `npm run check:pack`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Defer Design notes to T-188 (the O-045 integration step), named in the note.
