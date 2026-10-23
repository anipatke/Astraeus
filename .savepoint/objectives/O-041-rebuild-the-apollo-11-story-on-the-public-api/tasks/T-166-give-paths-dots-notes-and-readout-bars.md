---
id: T-166
title: Give paths dots, notes and readout bars
objective: O-041
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o041-planning-20261024}
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

Pending execution.

## Drift Notes

Record architecture deltas (new public options, moved metrics file) for Design reconciliation in the Apollo rebuild Task.
