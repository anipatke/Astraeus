---
id: T-370
title: Move the made-up test scenes out of the engine's source
objective: O-093
status: planned
depends_on: []
check_waiver: {task: T-370, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: layout
planned_reads: [packages/astraeus/package.json, packages/astraeus/api-surface.lock.json, tools/check-packs.mjs, tools/api-surface.mjs, vitest.config.ts, packages/astraeus/tests/layerRule.test.ts, docs/NPM_PACKAGING.md]
planned_writes: [packages/astraeus/src/synthetic/syntheticDefinition.ts, packages/astraeus/src/synthetic/syntheticEccentricDefinition.ts, packages/astraeus/src/synthetic/syntheticJourneyScene.ts, packages/astraeus/src/synthetic/syntheticListedDefinition.ts, packages/astraeus/src/synthetic/syntheticProbeDefinition.ts, packages/astraeus/src/synthetic/syntheticRingDefinition.ts, packages/astraeus/src/synthetic/syntheticViewsDefinition.ts, packages/astraeus/tests/synthetic/syntheticDefinition.ts, packages/astraeus/tests/synthetic/syntheticEccentricDefinition.ts, packages/astraeus/tests/synthetic/syntheticJourneyScene.ts, packages/astraeus/tests/synthetic/syntheticListedDefinition.ts, packages/astraeus/tests/synthetic/syntheticProbeDefinition.ts, packages/astraeus/tests/synthetic/syntheticRingDefinition.ts, packages/astraeus/tests/synthetic/syntheticViewsDefinition.ts, packages/astraeus/src/experiences/settingsFields.ts, packages/astraeus/package.json, packages/astraeus/api-surface.lock.json, packages/astraeus-demo-apollo11/tests/sunCentred.test.ts, packages/astraeus-demo-apollo11/tests/pointsLayer.test.ts, packages/astraeus/tests/domMoonPanel.test.ts, packages/astraeus/tests/syntheticViews.test.ts, packages/astraeus/tests/developerToolsOption.test.ts, packages/astraeus/tests/viewerHostDom.test.ts, packages/astraeus/tests/scenePin.test.ts, packages/astraeus/tests/compositionsContract.test.ts, packages/astraeus/tests/syntheticRing.test.ts, packages/astraeus/tests/appScreenDom.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/publicApiSunPaths.test.ts, packages/astraeus/tests/longOrbitPaths.test.ts, packages/astraeus/tests/timelineRateWarning.test.ts, packages/astraeus/tests/astraeusSceneConsole.test.ts, packages/astraeus/tests/experienceDefinitionContract.test.ts, packages/astraeus/tests/hostPageDom.test.ts, packages/astraeus/tests/pacingDom.test.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/viewerStyles.test.ts, packages/astraeus/tests/firstDraw.test.ts, packages/astraeus/tests/domStorySteps.test.ts, packages/astraeus/tests/escapeScope.test.ts, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/tests/shownDuringMenu.test.ts, packages/astraeus/tests/bodyMarkers.test.ts, packages/astraeus/tests/storyPanelClose.test.ts, packages/astraeus/tests/panelPlacementDom.test.ts, packages/astraeus/tests/syntheticJourney.test.ts, packages/astraeus/tests/viewerHostReady.test.ts, packages/astraeus/tests/domSetup.ts, packages/astraeus/tests/viewerIds.test.ts, packages/astraeus/tests/syntheticStoryAnchors.test.ts, packages/astraeus/tests/domStory.test.ts, packages/astraeus/tests/computedLook.test.ts, packages/astraeus/tests/experiencesContract.test.ts, packages/astraeus/tests/experiencePlugInContract.test.ts]
---

# Move the made-up test scenes out of the engine's source

## Outcome

The seven made-up scene definitions in `packages/astraeus/src/synthetic/` (849 lines, imported by no engine source) live under `packages/astraeus/tests/synthetic/`, the orphan `src/experiences/settingsFields.ts` (no importer) is deleted, and the engine's packed size before and after is measured and recorded (AH-22 part b: Claude S10 and F-13 section, `audits/2026-11-21_anthropic_claude-fable-5-2_auditfindings.md:118,206`; Codex section C).

## User Check

None visual. `ls packages/astraeus/src` shows no `synthetic` or `experiences` folder; `npm run check:pack` passes and the Technical Evidence names the engine's packed and unpacked bytes before and after.

## Done When

- `git mv` each file in `src/synthetic/` to `tests/synthetic/` with its content unchanged except relative import paths (`../core/...` becomes `../../src/core/...`, and so on).
- `src/experiences/settingsFields.ts` is deleted after a repo-wide grep (recorded) shows no importer; the `src/experiences/` folder is gone.
- `packages/astraeus/package.json` `exports` drops `"./synthetic/*"` and `"./experiences/*"`. The two Apollo tests that import `astraeus/synthetic/...` (`sunCentred.test.ts`, `pointsLayer.test.ts`) import `astraeus/tests/synthetic/...` through the existing `"./tests/*"` export. `npm run api:lock` is rerun and its diff holds only those two export lines.
- Every engine test that imports `../src/synthetic/...` imports `./synthetic/...` instead. Only import lines change in those files (recorded with `git diff --stat` and a grep that no other line changed); no test setup changes.
- `npm run check:pack` passes; the engine's packed and unpacked bytes and file count from the pack JSON before (on the base commit) and after are recorded. If `docs/NPM_PACKAGING.md` states an engine file count or size that this changes, note it as a Drift Note; do not lower limits in `tools/check-packs.mjs`.
- `npm run check:engine-alone` passes (the copy holds `tests/synthetic/`).
- `tests/fixtures/scenePin.json` is byte-identical (`git diff --exit-code`), proving the scenes are unchanged.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/package.json` (`exports`, `x-publish.files`)
- `packages/astraeus/src/synthetic/syntheticDefinition.ts` (import block only; the other six files' import blocks likewise)
- `packages/astraeus/src/experiences/settingsFields.ts`
- `tools/check-packs.mjs` (top comment, `LIMITS`, `strayFiles`)
- `tools/check-engine-alone.mjs` (the `copy` calls)
- `vitest.config.ts` (`coverage.include`: `src/**` stops counting the moved files; record the coverage number change if any)

## Design References

`.savepoint/Design.md` under `Components/Codebase Map` (the `packages/astraeus/` row) and under `Core layers and demos`.

## Guardrails

ARCH-03, ARCH-04, API-01, STYLE-01, STYLE-05, STYLE-10, TEST-01, TEST-03.

## Implementation Plan

1. Record `npm run check:pack` engine numbers on the base commit.
2. `git mv` the seven files; fix their relative imports; update the test import lines with a scripted replace and review the diff.
3. Delete `settingsFields.ts`; drop the two `exports` entries; repoint the two Apollo test imports; `npm run api:lock`.
4. Run focused tests, `check:pack`, `check:engine-alone`, then gates.

## Boundaries

No change to what any made-up scene contains. The site's own `packages/astraeus-site/src/synthetic/` stays where it is (it imports nothing from the engine's folder). The near-duplicate journey scene (engine tests vs site) stays two files: merging them would make the engine's tests import the site. No pack limit change.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/syntheticJourney.test.ts packages/astraeus/tests/syntheticRing.test.ts packages/astraeus/tests/scenePin.test.ts packages/astraeus/tests/publicApi.test.ts packages/astraeus-demo-apollo11/tests/sunCentred.test.ts packages/astraeus-demo-apollo11/tests/pointsLayer.test.ts`. Then `npm run check:pack`, `npm run check:engine-alone`. Handoff: `quality_gates` in `.savepoint/config.yml`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

For Design reconciliation (`Components/Codebase Map`, `packages/astraeus/` row): made-up scene definitions are test fixtures under `tests/synthetic/`; engine `src/` has no `synthetic` or `experiences` folder; measured pack numbers.
