---
id: T-375
title: Move story-panel, start-view and look wording out of the science core
objective: O-093
status: done
depends_on: [{task: T-370, requires: clear}, {task: T-373, requires: clear}]
check_waiver: {task: T-375, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: layout
planned_reads: [packages/astraeus/tests/layerRule.test.ts, tools/api-rules.mjs, packages/astraeus/api-surface.lock.json]
planned_writes: [packages/astraeus/src/core/storyPanels.ts, packages/astraeus/src/core/startView.ts, packages/astraeus/src/core/skyTrace.ts, packages/astraeus/src/core/lookValues.ts, packages/astraeus/src/core/moonListText.ts, packages/astraeus/src/core/bodySetFamilies.ts, packages/astraeus/src/presentation/storyPanels.ts, packages/astraeus/src/presentation/startView.ts, packages/astraeus/src/presentation/skyTrace.ts, packages/astraeus/src/presentation/lookValues.ts, packages/astraeus/src/presentation/moonListText.ts, packages/astraeus/src/presentation/bodySetFamilies.ts, packages/astraeus/src/api/bodySetChecks.ts, packages/astraeus/src/api/cameraRequest.ts, packages/astraeus/src/api/lookInput.ts, packages/astraeus/src/api/planBodySets.ts, packages/astraeus/src/api/planCamera.ts, packages/astraeus/src/api/planMoonPanel.ts, packages/astraeus/src/api/planParts.ts, packages/astraeus/src/api/planSkyFigures.ts, packages/astraeus/src/api/planStory.ts, packages/astraeus/src/api/planViews.ts, packages/astraeus/src/api/skyTraceInput.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/DeveloperSettings.tsx, packages/astraeus/src/app/SkyFiguresView.ts, packages/astraeus/src/app/bodySet.ts, packages/astraeus/src/app/labelStyle.ts, packages/astraeus/src/app/look.ts, packages/astraeus/src/app/lookOut.ts, packages/astraeus/src/app/sceneCamera.ts, packages/astraeus/src/app/skyFigures.ts, packages/astraeus/src/app/viewLink.ts, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/shelf/part.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/StoryPanelView.tsx, packages/astraeus/src/shell/TimelineBar.tsx, packages/astraeus/src/shell/experience.ts, packages/astraeus/src/shell/moonFamilies.ts, packages/astraeus/src/shell/storyPanels.ts, packages/astraeus/src/shell/useStoryPanels.ts, packages/astraeus/tests/look.test.ts, packages/astraeus/tests/lookOut.test.ts, packages/astraeus/tests/lookOutMenuDom.test.ts, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/tests/sceneFrame.test.ts, packages/astraeus/tests/skyLooks.test.ts, packages/astraeus/tests/skyTrace.test.ts, packages/astraeus/tests/smallSettings.test.ts, packages/astraeus/tests/nameCheck.test.ts, packages/astraeus/tests/presentationLayer.test.ts, packages/astraeus/package.json, packages/astraeus/api-surface.lock.json, tools/api-rules.mjs]
---

# Move story-panel, start-view and look wording out of the science core

## Outcome

Six presentation modules leave `src/core/` for a new `src/presentation/` folder that imports only `src/core/` and itself: `storyPanels.ts`, `startView.ts`, `skyTrace.ts`, `lookValues.ts` (CSS colour checks), `moonListText.ts` (UI copy) and `bodySetFamilies.ts` (palette limits), 535 lines; a new test holds the folder's layer rule (AH-22 part a: Claude section C `audits/2026-11-21_anthropic_claude-fable-5-2_auditfindings.md:117`, "about 880 lines of presentation vocabulary").

## User Check

None visual. `ls packages/astraeus/src/core` no longer lists the six files; `npx vitest run packages/astraeus/tests/presentationLayer.test.ts` passes.

## Done When

- The six files are moved with `git mv`, content unchanged except relative import paths. Importers in `src/api`, `src/app`, `src/shell`, `src/shelf` and engine tests change only their import lines (listed in `planned_writes`; recorded with a grep that no other line changed).
- New `tests/presentationLayer.test.ts` (not an edit to `layerRule.test.ts`, which O-085 draft 09 rewrites): nothing under `src/core/` imports `src/presentation/`, and `src/presentation/` imports only `src/core/`, itself and no package. It reads real import declarations with `typescript6`'s `preProcessFile` (as `tools/api-rules.mjs:6` does), not a regex, and holds a planted-offence case for each direction.
- `packages/astraeus/package.json` `exports` gains `"./presentation/*": "./src/presentation/*.ts"` beside `"./core/*"`; `npm run api:lock` diff holds only that line and any module-path text for moved types.
- `tests/nameCheck.test.ts`'s source glob adds `../src/presentation/**/*.{ts,tsx}` (ARCH-01 covers generic presentation code); no allowlist entry is added. `tools/api-rules.mjs` `idLiteralBreaks` default `dirs` adds `"presentation"` if any moved file can render ids (record which); the allowlists stay empty or shrink.
- `tests/fixtures/scenePin.json` byte-identical; `npm run check:engine-alone` passes.
- Gates per `docs/agents/verification.md`.

## Context Files

- The six modules' import blocks (`packages/astraeus/src/core/storyPanels.ts`, `startView.ts`, `skyTrace.ts`, `lookValues.ts`, `moonListText.ts`, `bodySetFamilies.ts`)
- `packages/astraeus/tests/layerRule.test.ts` (read only: the shape to mirror)
- `tools/api-rules.mjs` (line ~6 `preProcessFile` use; `idLiteralBreaks` ~333)
- `packages/astraeus/tests/nameCheck.test.ts` (header comment, `sources` glob)
- `packages/astraeus/package.json` (`exports`)

## Design References

`.savepoint/Design.md` under `Components/Codebase Map` (the `packages/astraeus/` row: it names `storyPanels.ts` and `startView.ts` as core) and under `Core layers and demos`.

## Guardrails

ARCH-01, ARCH-02, ARCH-04, STYLE-01, STYLE-10, TEST-01, TEST-03.

## Implementation Plan

1. Write `presentationLayer.test.ts` with its planted cases (green trivially: the folder is empty).
2. `git mv` the six files; fix relative imports inside them; update importers with a scripted path replace; review the diff.
3. Exports entry, name-check glob, id-literal dirs; `npm run api:lock`.
4. Focused tests, `check:engine-alone`, gates.

## Boundaries

Only these six modules. `pacing.ts` and `scalePolicy.ts` move in drafts 07 and 08. No re-export shims left in `core/` (a shim would keep the core importing presentation). No behaviour change. No edit to `layerRule.test.ts` (O-085 draft 09 owns it).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/presentationLayer.test.ts packages/astraeus/tests/layerRule.test.ts packages/astraeus/tests/nameCheck.test.ts packages/astraeus/tests/skyTrace.test.ts packages/astraeus/tests/skyLooks.test.ts packages/astraeus/tests/publicApi.test.ts packages/astraeus/tests/scenePin.test.ts packages/astraeus-site/tests/apiRules.test.ts`, then `npm run check:engine-alone`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Done When -> evidence:
- Six files moved (plain mv, no shims) with only import paths changed: `git diff -U0` over src/tests/tools shows 535 changed lines, all `core/<name>` -> `presentation/<name>` paths (plus 4 relative imports inside storyPanels.ts to `../core/`). `ls src/core` no longer lists them.
- tests/presentationLayer.test.ts (preProcessFile): 3 tests pass; planted `../app/look` import in presentation/startView.ts failed it, planted `../presentation/skyTrace` import in core/state.ts failed it; both reverted (git diff empty on both).
- package.json exports gains `./presentation/*`; `npm run api:lock` diff is that one line only.
- nameCheck glob adds src/presentation; no allowlist entry. tools/api-rules.mjs idLiteralBreaks dirs gain "presentation" (none of the six render ids; a guard only) and now skip a dir that is absent (the existing apiRules test feeds a tree without it; its setup unchanged).
- scenePin.json md5 c6d2308f6c2e40459ffc4d3256a7fb81 before and after. check:engine-alone passes.
- Gates: lint clean, typecheck clean, build ok, test 311 files / 5071 passed, 2 skipped; check:engine-alone pass; measure:example first-open total 1834160 B (524787 gz), unchanged by a move.
Extra reads: none beyond Context Files (builder-rules; Objective Decisions).

## Drift Notes

For Design reconciliation (`Components/Codebase Map`, `Core layers and demos`): new `src/presentation/` layer (pure TypeScript, imports core only); story-panel and start-view parsers live there, not in core. Guardrails ARCH-04 wording should gain the presentation layer (planner to reconcile).

Coordinator (orchestrate-g024-20261121): gates green (lint, typecheck, build; `npm test` 311 files, 5071 passed; `check:engine-alone`); scene pin md5 unchanged. The `existsSync` filter in `tools/api-rules.mjs` is accepted (a guard that skips a folder a made-up test tree lacks; that test's setup unchanged). `measure:example` 1,834,160 B raw (+359 since O-084's 1,833,801, from T-371/T-373; 1,840 B under the cap). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
