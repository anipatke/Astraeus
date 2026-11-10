---
id: T-299
title: Let visitors click a sky figure and see its card
objective: O-066
status: planned
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

Pending execution.

## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.
