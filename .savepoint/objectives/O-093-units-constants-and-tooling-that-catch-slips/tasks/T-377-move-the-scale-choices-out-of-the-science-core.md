---
id: T-377
title: Move the scale choices out of the science core
objective: O-093
status: planned
depends_on: [{task: T-376, requires: clear}, {task: T-373, requires: clear}, {task: T-374, requires: clear}]
check_waiver: {task: T-377, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: layout
planned_reads: [packages/astraeus/tests/presentationLayer.test.ts, packages/astraeus/src/api/index.ts]
planned_writes: [packages/astraeus/src/core/scalePolicy.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/planBodies.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/viewerLooks.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/BodySetView.ts, packages/astraeus/src/app/BodyView.tsx, packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/src/app/PathView.ts, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/TrackedBodyView.ts, packages/astraeus/src/app/bodyDraw.ts, packages/astraeus/src/app/debugReadout.ts, packages/astraeus/src/app/liveLook.ts, packages/astraeus/src/app/pathRules.ts, packages/astraeus/src/app/sceneBodies.ts, packages/astraeus/src/app/sceneDebug.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/sceneFraming.ts, packages/astraeus/src/app/sceneLayout.ts, packages/astraeus/src/app/sceneTargets.ts, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/shell/scaleModel.ts, packages/astraeus/tests/assets.test.ts, packages/astraeus/tests/bodyMarkers.test.ts, packages/astraeus/tests/bodySet.test.ts, packages/astraeus/tests/bodyViewDom.test.ts, packages/astraeus/tests/compositionsContract.test.ts, packages/astraeus/tests/core.test.ts, packages/astraeus/tests/experienceDefinitionContract.test.ts, packages/astraeus/tests/fitOrbit.test.ts, packages/astraeus/tests/groupLookRender.test.ts, packages/astraeus/tests/helpers/frameContext.ts, packages/astraeus/tests/hostCallOrder.test.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/logDepth.test.ts, packages/astraeus/tests/longOrbitPaths.test.ts, packages/astraeus/tests/lookOut.test.ts, packages/astraeus/tests/lookOutGlide.test.ts, packages/astraeus/tests/markerRuleEveryBody.test.ts, packages/astraeus/tests/orbitLook.test.ts, packages/astraeus/tests/planets.test.ts, packages/astraeus/tests/plutoOrbitLines.test.ts, packages/astraeus/tests/pointsGpuBlend.test.ts, packages/astraeus/tests/pointsKepler.test.ts, packages/astraeus/tests/pointsLookAhead.test.ts, packages/astraeus/tests/publicApiLineStretches.test.ts, packages/astraeus/tests/publicApiProviderLines.test.ts, packages/astraeus/tests/publicApiSunPaths.test.ts, packages/astraeus/tests/sampledTrajectory.test.ts, packages/astraeus/tests/scalePolicies.ts, packages/astraeus/tests/sceneBodies.test.ts, packages/astraeus/tests/sceneCamera.test.ts, packages/astraeus/tests/sceneFrame.test.ts, packages/astraeus/tests/sceneHooksDom.test.ts, packages/astraeus/tests/scenePlacement.ts, packages/astraeus/tests/sceneTargets.test.ts, packages/astraeus/tests/sceneTransforms.test.ts, packages/astraeus/tests/startCamera.test.ts, packages/astraeus/tests/sunLook.test.ts, packages/astraeus/tests/syntheticJourney.test.ts, packages/astraeus/tests/syntheticRing.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus/tests/viewerPictures.test.ts, packages/astraeus-demo-apollo11/tests/controls.test.ts, packages/astraeus-demo-apollo11/tests/missionScene.test.ts, packages/astraeus-demo-apollo11/tests/paths.test.ts, packages/astraeus-demo-apollo11/tests/pointsLayer.test.ts, packages/astraeus-demo-apollo11/tests/sunCentred.test.ts, packages/astraeus-demo-showers/tests/keplerShader.test.ts, packages/astraeus-demo-showers/tests/pointsBlendCorner.test.ts, packages/astraeus-demo-showers/tests/pointsLookAheadShowers.test.ts, packages/astraeus-demo-showers/tests/venusMap.test.ts, packages/astraeus/tests/synthetic/syntheticJourneyScene.ts, packages/astraeus/tests/synthetic/syntheticProbeDefinition.ts, packages/astraeus/tests/synthetic/syntheticViewsDefinition.ts, packages/astraeus/src/presentation/scalePolicy.ts, packages/astraeus/tests/nameCheck.test.ts, packages/astraeus-site/tests/packageBoundaries.test.ts, packages/astraeus/api-surface.lock.json]
---

# Move the scale choices out of the science core

## Outcome

`core/scalePolicy.ts` (105 lines: how EQJ kilometres become drawing units; ARCH-02 names scale policy as presentation) moves to `src/presentation/scalePolicy.ts`. With drafts 06 and 07 this takes the 882 lines the audit counted out of `core/` (AH-22 part a, Claude section C: "about 880 lines"; 535 + 242 + 105 = 882).

## User Check

None visual.

## Done When

- `git mv src/core/scalePolicy.ts src/presentation/scalePolicy.ts`; its import of `./body` becomes `../core/body`. Engine importers change only their import lines; the list is re-grepped first.
- The nine demo tests that deep-import `astraeus/core/scalePolicy` import from the public `"astraeus"` entry when every name they take is public (`trueScale`, `readableScale`, `solarSystemScale`, `ScalePolicy`, `ScaleId`: `api/index.ts:31`), else from `astraeus/presentation/scalePolicy` (for example `createSolarSystemScale` in `apollo11/tests/controls.test.ts`). `DEEP_IMPORT_COUNTS` in `packages/astraeus-site/tests/packageBoundaries.test.ts` is lowered to the measured counts (its own test demands an exact match; counts may only go down).
- `tests/nameCheck.test.ts`: the allowlist key `src/core/scalePolicy.ts` is re-keyed to `src/presentation/scalePolicy.ts` with its reason unchanged (a re-key, not a new entry; `allowlistGrowth.test.ts` treats `.allowlist.json` files only, record that it stays green).
- `tests/presentationLayer.test.ts` passes unedited. `npm run api:lock` diff holds only module-path text, or nothing.
- `tests/fixtures/scenePin.json` byte-identical; `npm run check:engine-alone` passes.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/scalePolicy.ts` (import block)
- `packages/astraeus/src/api/index.ts` (line ~31, the scale re-export)
- `packages/astraeus-site/tests/packageBoundaries.test.ts` (`DEEP_IMPORT_COUNTS`, `deepImportOffences`)
- `packages/astraeus/tests/nameCheck.test.ts` (`BODY_NAME_ALLOWLIST`)

## Design References

`.savepoint/Design.md` under `Components/Codebase Map` and `Core layers and demos`.

## Guardrails

ARCH-02, ARCH-04, API-01, STYLE-10, TEST-03.

## Implementation Plan

1. Re-grep importers; `git mv`; fix the module's import; scripted path replace across engine src and tests.
2. Demo tests to the public entry where possible; lower `DEEP_IMPORT_COUNTS`; re-key the name-check allowlist entry.
3. `npm run api:lock`; focused tests; `check:engine-alone`; gates.

## Boundaries

No behaviour change and no public signature change. This is the widest diff of the Objective (about 80 files, import lines only); if any file needs more than its import line, stop and report. `core.test.ts` and `logDepth.test.ts` are written elsewhere too (draft 05; O-085 draft 07): only their import line changes here.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/presentationLayer.test.ts packages/astraeus/tests/nameCheck.test.ts packages/astraeus/tests/scaleChoice.test.ts packages/astraeus/tests/core.test.ts packages/astraeus/tests/scenePin.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-demo-apollo11/tests/controls.test.ts`, then `npm run check:engine-alone`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

For Design reconciliation (`Core layers and demos`): scale policies are presentation (`src/presentation/scalePolicy.ts`); `src/core/` holds science only.
