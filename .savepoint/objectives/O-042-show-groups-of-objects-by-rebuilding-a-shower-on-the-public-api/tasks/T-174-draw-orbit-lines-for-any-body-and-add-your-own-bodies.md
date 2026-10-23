---
id: T-174
title: Draw orbit lines for any body and add your own bodies
objective: O-042
status: done
depends_on: [{task: T-173, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o042-planning-20261024}
check_waiver:
  task: T-174
  reason: 'Owner said "orchestrate O42"; under the standing O-042 run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o042-run-20261024}
  recorded_at: '2026-10-23T23:55:47Z'
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

Built 2026-10-24 (builder session, step Check waived under O-042 run rules).

- Changed: `packages/astraeus/src/api/scene.ts` (`addBody` options `enlarge`, `showLabel`; `orbit: true` widened to any Sun-circling body; new `addBodyFromElements`; Sun-centred layer, paths, label reach; tracked path refused; `toDefinition` split into helpers for CODE-01 complexity), new `src/api/sunOrbit.ts` (orbit line from the body's own source via `fullTurnSpanMs`, Earth from `createEarthSunTrajectory`, own bodies from periapsis with eccentric-anomaly sampling), `src/api/index.ts` (type `ElementsBodyRecord`), `tests/publicApiSunOrbits.test.ts` (new, 15 made-up tests), `tests/publicApi.test.ts` (no-orbit line 247 updated for the widened rule), `astraeus-site/tools/site/api-reference.mjs` (`ElementsBodyRecord` in the Scene section), `astraeus/README.md`, `astraeus/CHANGELOG.md`.
- Criteria: new options/calls have doc comments, README rows, `/api` entries (generated; doc-comment test green) and made-up Sun-centred tests (comet from elements, smooth whole orbit with periapsis start, Earth year/Mars turn lengths, turn closes, enlarge, hidden label); errors name the field (`bad-element` e.g. `elements.eccentricity`, `bad-body` for enlarge/showLabel); `no-orbit` widened; tracked path in a Sun-centred scene throws `bad-trajectory` naming the path; Apollo and hello-scene definitions untouched (comparison tests green).
- Label reach: handled automatically, no flag. In a Sun-centred scene (first body is the Sun) body items carry no `labelMaxDistance` (the label code treats absent as unlimited), so labels do not fade when zoomed out; label priority stays by order added (`100 - index`). Earth-centred scenes keep 500.
- Gates: `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` pass (126 files, 1670 passed, 1 skipped); `npm run check:engine-alone` pass; `npm run check:pack` pass (astraeus 7.01 MB packed, limit 8.0). No browser run.

## Drift Notes

Record architecture deltas for Design reconciliation in the showers rebuild Task.

- Public `addBodyFromElements` registers the body in a per-scene extended catalogue (`ExperienceDefinition.catalogue`); the built-in catalogue is unchanged. Built-in bodies whose period and periapsis the catalogue knows (Swift-Tuttle, via `BUILT_IN_SAMPLING` in `core/bodies/index.ts`, so the engine names no comet outside its allowed folders) get a whole-orbit line from `orbit: true`, like an own body; a built-in with no known period and no turn within a dozen years still gets `no-orbit`. The coordinator-requested gap is closed; a test (`a built-in comet`) shows its orbit is about 130 years and closes. The earlier duplicate-id concern is dropped: the showers rebuild can use `addBody("swift-tuttle", { orbit: true })`. Reflect in Design in the showers rebuild Task.
