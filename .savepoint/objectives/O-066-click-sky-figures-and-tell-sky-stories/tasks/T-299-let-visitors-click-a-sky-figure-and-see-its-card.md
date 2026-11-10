---
id: T-299
title: Let visitors click a sky figure and see its card
objective: O-066
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-299, reason: 'Owner said "orchestrate O66" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o066-run-20261110}, recorded_at: '2026-11-10T06:15:12Z'}
planned_by: {role: planner, session: o066-planning-20261110}
---

# Let visitors click a sky figure and see its card

## Outcome

A visitor taps a sky figure's name or near one of its lines and the figure is selected, emphasised and shown in the same info card bodies use, with its description, facts, sources and provenance; the app selects figures and hears selection changes as it does for bodies.

## User Check

None for the owner at this step; the owner looks in the last step.

## Done When

- `SkyFigureInput` gains the card fields bodies have (`description`, `facts` as `CardFactInput[]`, `sources`, and a `provenance`, reusing the existing public shapes), checked at the call (`bad-sky-figure`); `scene.skyFigures` reads them as body reads do.
- A tap on a shown sky label (`SceneLabelLayer.shownRects`) or within a finger-sized margin of a drawn figure line (a pure hit test on the projected segments with a node test; margin one named constant) selects the figure; a tap inside a boundary outline selects nothing (owner decision 2); a hidden `whenTraced` figure or a switched-off kind is not tappable; bodies keep winning where they are hit (stated rule, tested).
- `setSelected(figureId)`, `selected` and `onSelect` take sky figure ids on both paths (`tests/lifecycle.test.ts`, API-02); selection reaches the one selection path (no second state, STYLE-07).
- The selected figure's lines and label are emphasised; the emphasis is one look with a default (API-06; e.g. `skyLines.selected` colour), changeable live and in the Developer drawer.
- The object menu lists figures under the same listing rule bodies follow (`listed`), and picking one there selects it; phone first, no collisions at 375x667 and 1280x720.
- The card shows in the existing `InfoPanel` through `infoModel` (no second card component).
- Made-up figures only (ARCH-03); API lock, README, CHANGELOG updated (API-01, API-07).

## Context Files

`packages/astraeus/src/api/skyFigureInput.ts`, `packages/astraeus/src/api/planSkyFigures.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/viewerSelection.ts`, `packages/astraeus/src/app/scenePicking.ts`, `packages/astraeus/src/app/scenePointer.ts`, `packages/astraeus/src/app/SceneLabels.ts`, `packages/astraeus/src/app/SkyFiguresView.ts`, `packages/astraeus/src/app/skyFigures.ts`, `packages/astraeus/src/app/look.ts`, `packages/astraeus/src/shell/InfoPanel.tsx`, `packages/astraeus/src/shell/infoModel.ts`, `packages/astraeus/src/shell/ObjectControls.tsx`, `packages/astraeus/src/shell/objectModel.ts`, `packages/astraeus/tests/scenePicking.test.ts`, `packages/astraeus/tests/setSelected.test.ts`, `packages/astraeus/tests/infoCards.test.ts`, `packages/astraeus/tests/skyFigures.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/objectives/O-066-click-sky-figures-and-tell-sky-stories/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Sky figures, O-065; the sky view, O-064; One handle, one lifecycle, O-054; The planets demo and the site on the public way, O-059, for `listed`, `facts` and the picker).

## Guardrails

API-01, API-02, API-03, API-04, API-05, API-06, API-07, ARCH-01, ARCH-02, ARCH-03, ARCH-06, CODE-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Confirm O-065's sky figures, labels and `SkyFiguresView` exist as Design says; return REPLAN REQUIRED if not.
2. Add the card fields and their checks; carry them into the definition and reads.
3. Add the line hit test (pure, node test) and route label and line taps into the existing picking path, after bodies.
4. Accept figure ids in selection; add the emphasis look; list figures in the object menu by the listing rule.
5. Card through `infoModel`; tests on both paths; lock, README, CHANGELOG.

## Boundaries

No story steps (next step); no tapping inside outlines; no constellation data.

## Technical Verification

Focused Vitest runs while building; hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack` and `npm run check:node-consumer`; no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built by the builder session (2026-11-10). Gates at hand-off, all from the repo root and passing: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (242 files, 3592 passed, 2 skipped), `npm run check:pack` (pass; engine packed 7.26 MB, unpacked 9.30 MB, files unchanged in limits), `npm run check:node-consumer` (pass). No browser run (as briefed). Regenerated, not raised: `npm run api:lock`, `npm run api:errors` (README error table), `npm run look:lock` (computed-look baseline: the Developer drawer gained one colour row, "Selected figure"; the diff is that row only). No allowlist (API-04, apiImports), page or download budget was changed or needed.

Per criterion:
- Card fields: `SkyFigureInput` gains `description`, `facts` (`CardFactInput[]`), `sources`, `provenance`, plus `listed`; checked in `checkCard` (`bad-sky-figure`); `scene.skyFigures` (and `handle.skyFigures`) read `listed`, `provenance` (own or the illustrative "Supplied by the caller" default, `sources` appended), `description`, `facts`. Tests: `tests/skyFigureSelect.test.ts` (call, refusals, reads, cards), `tests/skyFigures.test.ts`.
- Tap: `pickSkyFigure` and `distanceToSegment` (pure, node-safe, `src/app/scenePicking.ts`), margin constant `SKY_LINE_MARGIN_PX = 16` (mouse and touch alike); a shown name (the `SceneLabelLayer.shownRects` rectangle) or a drawn line within the margin selects; the inside of an outline selects nothing; hidden `whenTraced` figures and switched-off kinds are left out by `SkyFiguresView.screenFigures`; bodies first (`attachScenePointer`: `pickTarget(...) ?? pickSkyFigure(...)`). Tests: `tests/scenePicking.test.ts`, `tests/pointerAndFeatureLayerDom.test.ts` (body wins), `tests/skyFigureSelect.test.ts` (projection, switches, traced).
- Selection ids: `ViewerSelection.setSelected` accepts `cameraTargets()` plus the figure ids from `control.skyFigures`; one selection path (the shell's `selectedObjectId`, `controls.selectedObjectId`, `onSelect`); `tests/lifecycle.test.ts` new case runs on `mount` and `AstraeusScene` (menu pick, onSelect once, `setSelected`, `bad-selection`, card).
- Emphasis: look `skyLines.selected` (default `#ffffff`) in `SkyColours`, `LookInput`/`LookRead`, `app/look.ts`, the Developer drawer; `SkyFiguresView` draws a `sky-selected:<id>` line set over the figure, the name takes the colour in `SceneLabelLayer` (selected priority already won collisions). Tests: `tests/skyFigureSelect.test.ts`, `tests/look.test.ts`, `tests/skyLooks.test.ts`, `tests/developerSettingsDom.test.ts`.
- Menu: `listedFigures` (`shell/objectModel.ts`) under the same `listed` rule (default true; the selected one shows even when unlisted); `ObjectControls` adds the options after the objects. Phone and 1280x720 layout is unchanged markup (options in the existing select; no new element), not looked at in a browser.
- Card: `infoView` falls back to `skyFigureInfo` (same `InfoPanel`, no second card). A figure has no metrics.
- Docs: README (addSkyFigures row, setLook row, reads, selection paragraph, error table), CHANGELOG (Unreleased), `api-surface.lock.json` regenerated.

Tap rule on a phone: a tap selects; the card opens on a wide screen and not on a phone, exactly as a body tap does (`pickOpensInfo`); the menu always opens it. The camera is left alone when a figure is selected (no focus).

Files changed: packages/astraeus/src/api/{skyFigureInput,planSkyFigures,sceneReads,assembleScene,viewerSelection,viewerHandle,look,errors}.ts, src/app/{skyFigures,SkyFiguresView,SceneLabels,scenePicking,scenePointer,sceneFrame,App,viewerPort,look,DeveloperSettings}.ts(x), src/shell/{experience,objectModel,infoModel,ObjectControls,AstraeusShell}.ts(x); tests: skyFigureSelect (new), skyFigures, scenePicking, pointerAndFeatureLayerDom, lifecycle, look, skyLooks, developerSettingsDom, viewerHostDom, helpers/viewerPresentation, fixtures/computed-look.baseline.json; README.md, CHANGELOG.md, api-surface.lock.json.

Files read beyond the Context Files (logged after the fact, all to find where selection, looks and the host link are wired): src/app/App.tsx (selection and host attach), src/app/sceneFrame.ts and sceneContentsHooks.ts (frame stages, pointer wiring), src/app/viewerPort.ts and src/api/viewerLink.ts (control shape), src/api/assembleScene.ts and sceneReads.ts (definition and reads), src/api/look.ts, src/app/DeveloperSettings.tsx, src/shell/experience.ts, src/shell/AstraeusShell.tsx (selection state), src/api/errors.ts, tools/api-rules (generated error table), tests/domSetup.ts, tests/apiImports.test.ts, plus Design.md "Sky figures (O-065...)" as briefed.

Coordinator fix (same session): the tap test no longer skips segments with an end off screen. `projectSegmentClipped` (`src/app/scenePicking.ts`, pure) takes camera-space ends, drops a segment wholly behind the camera, cuts one with an end behind at the camera plane, and returns the 2D screen segment with ends allowed outside the canvas; `SkyFiguresView.screenFigures` uses it (same 16 px margin, same rule order). Node tests in `tests/scenePicking.test.ts` (long line with both ends off screen, line wholly behind, one end behind) and `tests/skyFigureSelect.test.ts`. Re-run: `npm run lint`, `npm run typecheck` pass; `npm test` 242 files, 3595 passed, 2 skipped. Build, check:pack and check:node-consumer were not re-run after this change (no packaged-file or size-relevant change beyond a small function).

Limitations: no browser run, so the real tap on the canvas, the emphasis look and the menu on a phone are unseen (owner look is in the last step). Figures have no mouse hover highlight. The Design.md paragraph is not updated here (reconciled in the last step of O-066).


## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.

- New `ExperienceConfig.skyFigures` (`SkyFigureCard`: id, label, description, facts, provenance, listed) carries the card and menu words; the drawn layers (`ExperienceDefinition.skyFigures`) stay as they were. Figure ids and object ids share the shell's one `selectedObjectId` string; `selectionLost` never loses a figure; the shell's `selectFigure` leaves the camera alone.
- `ViewerControl.skyFigures` widened with `listed`, `provenance`, `description?`, `facts?` (`SceneSkyFigureRead` has the same); `ViewerSelection.setSelected` validates against `cameraTargets()` plus these ids; camera calls still accept bodies only.
- Tap path: `PointerState.skyFigures` is a closure set each frame in `updateOverlays` (stage 6) that projects lines only when a tap calls it (`SkyFiguresView.screenFigures`), so there is no per-frame projection; bodies are tried first. Margin constant `SKY_LINE_MARGIN_PX = 16`.
- `SkyFiguresView.place` takes the selected id and keeps one `sky-selected:<id>` overlay (renderOrder 3); `SceneLabelLayer` colours the selected name from `SkyLabelFrame.selectedColor` (replaced the single cached label colour with a per-label cache). New look `skyLines.selected`.
- Deferred to the Design reconciliation task: the Design.md "Sky figures (O-065...)" paragraph needs a selection sentence (tap rule, card, `listed`, `skyLines.selected`).

Coordinator, 2026-11-10: after the off-screen line fix, `npm run build` re-run from the repo root: pass. Coordinator marks T-299 done under the standing run rules.
