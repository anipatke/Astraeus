---
id: T-370
title: Move the made-up test scenes out of the engine's source
objective: O-093
status: done
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

Files moved with plain `mv` (no git staging; the coordinator stages): the seven `src/synthetic/*.ts` to `packages/astraeus/tests/synthetic/` (only `"../` became `"../../src/` in their imports; `src/synthetic/` gone). `src/experiences/settingsFields.ts` deleted, `src/experiences/` gone. Repo grep for `settingsFields` (excluding .savepoint, docs): only the file itself and a chunk-name string in `packages/astraeus-site/tools/validate/load-budget.mjs`; no importer.

| Done When | Evidence |
|---|---|
| Seven files moved, imports only | `ls packages/astraeus/tests/synthetic`; grep of `../` in them shows only `../../src/` |
| settingsFields deleted, folder gone | grep above; `ls packages/astraeus/src` has no `experiences` or `synthetic` |
| exports dropped, Apollo tests repointed, api:lock | two export lines removed from package.json; two Apollo tests import `astraeus/tests/synthetic/...`; `npm run api:lock` diff holds the two export lines plus two `EqjVectorInput` signature lines that belong to the concurrent T-373 source change (not this Task) |
| Engine tests import `./synthetic/...` | scripted replace over 35 files; scoped `git diff -U0` of those files shows only lines containing `synthetic` changed |
| check:pack passes, numbers | before (base, check:pack output): packed 7.25 MB, unpacked 9.33 MB, 679 files. After: packed 7,241,433 B, unpacked 9,285,630 B, 663 files (0 synthetic/experiences files packed). Exact base bytes were not captured (the pack folder is rebuilt by each run). Limits untouched |
| check:engine-alone passes | `engine alone: pass in 30.7 s` |
| scenePin.json byte-identical | NOT shown by `git diff --exit-code`: the file differs, but only by the Moon accuracy/limitation text from concurrent T-374 (no scene content moved by this Task); the scene tests pass |
| Gates | lint clean, typecheck clean, build ok; `npm test`: 5056 passed, 2 skipped, 1 failed (see limitations) |

Limitations: the one failing test is `packageBoundaries.test.ts` "counts deep imports": apollo11 measures 130 deep imports against a recorded 129. It fails the same with the two Apollo files restored to HEAD, so it is not caused by the repoint (the count is unchanged by it); source not found. Not fixed here (outside Boundaries). Coverage number change not measured. `packages/astraeus/README.md` lines 532 and 546 still mention `src/synthetic/`.

## Drift Notes

For Design reconciliation (`Components/Codebase Map`, `packages/astraeus/` row): made-up scene definitions are test fixtures under `tests/synthetic/`; engine `src/` has no `synthetic` or `experiences` folder; measured pack numbers.

Also: `packages/astraeus/README.md` (lines 532, 546) names `src/synthetic/`; update to `tests/synthetic/`. `docs/NPM_PACKAGING.md` states no engine file count that changed (not re-read in full). Measured: engine pack 7.25 to 7.24 MB packed, 9.33 to 9.29 MB unpacked, 679 to 663 files.

Coordinator (orchestrate-g024-20261121): the `packageBoundaries` apollo11 deep-import count (130 vs 129) came from the coordinator's own T-374 decision (an `astraeus/core/body` import in the apollo comparison test), not from this Task; the coordinator removed that import (the test now reads the Moon's accuracy from the rebuilt definition and asserts it differs from the recorded sentence); `packageBoundaries` and the apollo comparison pass (20/20). Lint, typecheck, build, `check:engine-alone`, `check:pack` green. README lines naming `src/synthetic/` go to T-380 (docs). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
