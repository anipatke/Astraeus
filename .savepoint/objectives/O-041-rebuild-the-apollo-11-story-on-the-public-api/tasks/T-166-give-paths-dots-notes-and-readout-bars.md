---
id: T-166
title: Give paths dots, notes and readout bars
objective: O-041
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o041-planning-20261024}
check_waiver:
  task: T-166
  reason: 'Owner said "go ahead" on the O-041 plan, with the standing rule of no per-step checks and one Full Objective Check at the end.'
  actor: {role: owner, session: o041-run-20261024}
  recorded_at: '2026-10-23T20:58:48Z'
---

# Give paths dots, notes and readout bars

## Outcome

A developer can give a path (`addTrajectory`) source-anchor dots, a description, known limits and readouts that show as bars on its info card, and `addBody` objects carry their catalogue provenance and known limits plus an optional description; the `Provenance` type is exported; the engine's Apollo-named metrics file is gone, replaced by a generic one.

## User Check

None required (owner_validation false); the owner's look comes with the Apollo rebuild.

## Done When

- `addTrajectory` takes `anchors` (`[{ id, time }]`), `description`, `knownLimitations` and `readouts` (range from the scene centre, speed with its bar scaled to the peak anchor speed, distance to a named body, altitude above a named body, and any other bar Apollo's telemetry cards show today that a generic readout can carry); readouts appear as `MetricVisual` bars in the info card for that path (O-041 Decision 2).
- `addBody(ref, { description? })`; `addBody` objects get catalogue provenance and known limits (as `catalogueItem` gives them).
- `type Provenance` (and its source-type union) exported from the `.` entry.
- `packages/astraeus/src/experiences/apollo11/spacecraftMetrics.ts` moved to a generic name and place (e.g. `packages/astraeus/src/app/trackedMetrics.ts`), Apollo-free names; the folder `src/experiences/apollo11/` no longer exists; current users (the Apollo demo, tests) repointed so everything stays green.
- New `SceneError` codes for bad anchors and bad readouts, each tested.
- Made-up configuration tests (a made-up path about a made-up centre, not Apollo) cover anchors drawn and labelled, readouts in the info-card rows, catalogue provenance on `addBody` objects and each error code (ARCH-03).
- Every new export has a doc comment (`packages/astraeus-site/tests/apiReference.test.ts`) and sits in a named section of `SECTIONS` in `packages/astraeus-site/tools/site/api-reference.mjs`.
- Hand-off gates green, plus `npm run check:engine-alone` and `npm run check:pack` (the engine boundary moved).

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/api/bodies.ts`, `packages/astraeus/src/app/mission.ts`, `packages/astraeus/src/app/catalogueItem.ts`, `packages/astraeus/src/app/metricReadouts.ts`, `packages/astraeus/src/experiences/apollo11/spacecraftMetrics.ts`, `packages/astraeus/src/shell/MetricVisual.tsx`, `packages/astraeus/src/shell/experience.ts`, `packages/astraeus/src/synthetic/syntheticDefinition.ts`, `packages/astraeus/tests/publicApi.test.ts`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/MissionPanel.tsx`, `packages/astraeus-site/tools/site/api-reference.mjs`, `packages/astraeus-site/tests/apiReference.test.ts`.

## Design References

Design Components/Codebase Map (engine `src/api/`, `src/app/`), Current Technical State O-036 and O-040 (public API, reference page).

## Guardrails

ARCH-01, ARCH-03, ARCH-05, PROV-01, TEST-01, TEST-03, STYLE-05, STYLE-07.

## Implementation Plan

1. Move the metrics file to its generic home and repoint users; gates green before adding API.
2. Add the `addTrajectory` options over `TrackedBody` anchors and `ExperienceObject` description/knownLimitations; wire readouts into Scene's `createMetrics` for tracked bodies.
3. Build `addBody` objects from the catalogue; add `description`.
4. Export `Provenance`; doc comments; reference sections.
5. Made-up configuration tests per option and error code.

## Boundaries

No custom Developer-panel hook; no pictures, any-body orbit lines or listeners (O-041 Decision 1); no change to Apollo's look yet (that is the rebuild Task).

## Technical Verification

Focused tests while iterating; hand-off gates from AGENTS.md plus `check:engine-alone` and `check:pack`. No browser run (once, at the Full Objective Check). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Per criterion (executor claims, to verify at the Full Objective Check):

1. `addTrajectory` options: `anchors` (`[{id,time}]`, sorted, labelled by id into `TrackedBody.anchorTimesUtcMs`/`anchorLabels`), `description`, `knownLimitations`, `readouts` (`range` with optional `marker` body, `speed` scaled to peak anchor speed, `distance` to a named body, `altitude` above a named body) wired into Scene's `createMetrics` through `createReadoutMetrics` (`src/app/trackedMetrics.ts`). Proved in `packages/astraeus/tests/publicApiPaths.test.ts` (15 tests).
2. `addBody(ref, { description })`; body objects built with `catalogueItem` (catalogue provenance, known limits). Proved in the same file.
3. `Provenance` and `ProvenanceSourceType` exported from `api/index.ts` (doc comments added in `core/provenance.ts`).
4. `src/experiences/apollo11/` is gone (`spacecraftMetrics.ts` -> `src/app/trackedMetrics.ts`, git mv). Users repointed: demo `MissionPanel.tsx`, `apolloMetrics.ts`, `tests/metricVisuals.test.ts`, engine `synthetic/syntheticDefinition.ts`, `load-budget.mjs` chunk names. The name check (`tests/nameCheck.test.ts`) forbids body names in `src/app`, so the Earth/Moon-only helpers (`spacecraftMoonMetric`, `spacecraftAltitudeMetric`, `spacecraftPositionMetric`, `createTrackedMetrics`) moved to the Apollo demo as `packages/astraeus-demo-apollo11/src/experiences/apollo11/earthMoonMetrics.ts`; the synthetic experience now uses the generic `createReadoutMetrics` with the same three rows.
5. New `SceneError` codes `bad-anchor` (no id, duplicate id, bad time, outside path, not a list) and `bad-readout` (unknown kind, missing target, uncatalogued body, body not in scene, not a list); each tested.
6. Made-up path about Earth ("probe") covers anchors drawn and labelled, readouts as info-card rows (ids, kinds, values against the resolver), body provenance, each error code (ARCH-03).
7. Reference: `AnchorInput`, `ReadoutInput` in the "Build a scene" section; `Provenance`, `ProvenanceSourceType` in a new "Provenance" section of `SECTIONS`; `apiReference.test.ts` expectation extended; all exports have doc comments (test green).
8. Gates (all run once green after the last change): `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` 121 files, 1592 passed, 1 skipped; `npm run check:engine-alone` pass (16.3 s); `npm run check:pack` pass (astraeus 6.99 MB packed, limit 8.0). An earlier test run failed `nameCheck` (body names in `src/app`) and was repaired as in item 4.

Extra reads (outside Context Files): `packages/astraeus-site/tools/validate/load-budget.mjs` (chunk name `spacecraftMetrics.js` renamed to `trackedMetrics.js`); `packages/astraeus/tests/nameCheck.test.ts` (to learn the failure); `packages/astraeus/src/core/provenance.ts` (export and doc comments); `packages/astraeus/src/core/stateResolver.ts`, `body.ts`, `state.ts` and `src/shell/metrics.ts` (types for the readouts).

Files changed: see the changed-path list in the hand-off; no browser run, no screenshots.

Limitations: the Apollo-only bars (position discrepancy, position coordinates, the "nearest of Earth or Moon" altitude) have no generic readout; the rebuild Task must either accept two named altitude bars or add them. `range` is measured from the path's centre body (the `center` option), which equals the scene centre for Earth-centred paths. Not browser-checked; the load-budget measurement is the rebuild Task's.

## Drift Notes

Record architecture deltas (new public options, moved metrics file) for Design reconciliation in the Apollo rebuild Task.

- New public options: `anchors`, `description`, `knownLimitations`, `readouts` on `addTrajectory`; `description` on `addBody`; `Provenance`/`ProvenanceSourceType` exported; error codes `bad-anchor`, `bad-readout`. Design 0.1 public API list needs them.
- Moved: engine `src/experiences/apollo11/spacecraftMetrics.ts` is now `src/app/trackedMetrics.ts` (generic: range, speed, distance, altitude, discrepancy, `createReadoutMetrics`); Earth/Moon helpers live in the Apollo demo `earthMoonMetrics.ts` until the rebuild Task removes them.
- `addBody` objects now carry catalogue provenance and known limits (info cards of hello-scene bodies change; recorded change from 0.1).
