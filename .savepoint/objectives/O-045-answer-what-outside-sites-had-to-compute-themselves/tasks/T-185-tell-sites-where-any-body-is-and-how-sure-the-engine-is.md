---
id: T-185
title: Tell sites where any body is and how sure the engine is
objective: O-045
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o045-planning-20261028}
check_waiver:
  task: T-185
  reason: 'Owner said "orchestrate O45"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o045-run-20261028}
  recorded_at: '2026-10-28T11:26:01Z'
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

Built 2026-10-28 on branch o045-answers. Extra reads: none beyond Context Files (also `src/core/body.ts`, `src/core/stateResolver.ts`, `tests/publicApiStory.test.ts`, `packages/astraeus-demo-showers/tests/rebuildComparison.test.ts` and `packages/astraeus-site/tests/apiReference.test.ts`, read only to fix tests broken by the change).

Changed: `src/api/scene.ts` (`stateOf` widened, `provenanceOf`, private catalogue-source cache), `src/api/index.ts` (root exports), `src/core/provenance.ts` (optional `accuracyClass`, `maxErrorFraction`), `src/core/bodies/swiftTuttle.ts`, `src/core/elementsBody.ts` (fields filled; doc comments), `tools/check-node-consumer.mjs`, new `tests/stateOfBodies.test.ts`; tests updated: `publicApiStory.test.ts` (a moon is no longer refused; the unknown-body case now uses `sun`), `rebuildComparison.test.ts` (compares provenance without the two new fields).

- Criterion 1 (stateOf): `stateOfBodies.test.ts` "gives the State the catalogue source draws" (moon and elements body, 1e-9 relative, centre equal), "answers for the Earth, and for built-in Swift-Tuttle", "refuses an id the scene lacks and a moment outside the data" (unknown-body; bad-time on a path). Existing addTrajectory tests in `publicApiStory.test.ts` pass with messages unchanged except the unknown-body text now reads "no body or trajectory with that id" (see drift).
- Criterion 2 (provenanceOf): "carries the class and fraction for Swift-Tuttle and an elements body, and leaves them out for others" (swift-tuttle approximate 0.00857; elements indicative 0.05; earth none; unknown id throws).
- Criterion 3 (root exports): "classify a comparison and parse a record" imports all from `astraeus` on a made-up record.
- Criterion 4: `npm run check:node-consumer` pass (2 tests incl. `stateOf("earth")`, `provenanceOf`, `classifyPositionError` on the packed package).
- Criterion 5: `apiReference.test.ts` green (the second limit const and the type got doc comments).
- Criterion 6 gates: lint clean; typecheck clean; build ok; npm test 143 files, 1876 passed, 1 skipped; check:node-consumer pass; check:pack pass (astraeus 444/450 files, 7.04/8.0 MB; unchanged).

## Drift Notes

Defer Design notes to T-188 (the O-045 integration step), named in the note.
- `stateOf` bad-time: built-in catalogue sources and elements bodies have no data bounds (the viewer draws them at any date; `accuracy.validUtc` is a comparison window, not a range), so `bad-time` applies to `addTrajectory` paths only. A moment outside an elements body's compared window is answered.
- Elements bodies have no error figure in the record, so their `maxErrorFraction` is the limit of their class (0.01 approximate, 0.05 indicative); documented on the field. Owner may prefer an optional record field instead.
- The unknown-body message for `stateOf` changed from "no trajectory with that id" to "no body or trajectory with that id".
- `rebuildComparison.test.ts` (demo-showers) compared provenance by equality with the old definition; it now ignores the two new fields.
- Design notes (Provenance gains accuracy fields; stateOf covers catalogue bodies) deferred to T-188.
