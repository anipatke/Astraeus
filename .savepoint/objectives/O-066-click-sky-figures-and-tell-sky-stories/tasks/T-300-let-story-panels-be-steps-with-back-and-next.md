---
id: T-300
title: Let story panels be steps with Back and Next
objective: O-066
status: done
depends_on: [{task: T-299, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-300, reason: 'Owner said "orchestrate O66" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o066-run-20261110}, recorded_at: '2026-11-10T06:15:12Z'}
planned_by: {role: planner, session: o066-planning-20261110}
---

# Let story panels be steps with Back and Next

## Outcome

A story panel can be a step with no moment: steps show in the order added, with Back and Next on the panel, with or without a timeline; the app can open or close a panel, read which is open and hear changes, on both embedding paths.

## User Check

None for the owner at this step; the owner looks in the last step.

## Done When

- `StoryPanelInput.at` becomes optional; a panel without `at` is a step; steps keep the order they were added (across `addStoryPanels` calls); panels with `at` behave exactly as today (existing story tests unchanged, `tests/domStory.test.ts`, `tests/publicApiStory.test.ts`).
- The open step shows Back and Next (Back hidden or disabled on the first, Next on the last), which open the neighbouring step; steps never open by themselves from playback; a scene with steps and no timeline (`setTimeline({ none: true })`) works. Decide and document how the visitor opens the first step (planner suggests: the first step opens when the viewer is ready if the scene has steps and no moment panels, else from a story entry the shell already has); record the choice in Drift Notes.
- Host calls on the handle, both paths (API-02): open a panel by id, close the open panel, read the open panel id, and hear changes with a cause (`visitor`, `host`, `playback`) like `onSelect`; unknown id throws the panel error code; calls land in order (O-061 rule). Names follow the verb grammar table (`tests/verbGrammar.test.ts`) and API-04 with no allowlist entry.
- `scene.panels` reads steps (with their order, no time).
- Phone first: Back, Next, Close and Continue fit at 375x667 and 1280x720 with 44 px targets and no collisions (DOM test of the layout rules).
- API lock, README, CHANGELOG updated (API-01, API-07).

## Context Files

`packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/planStory.ts`, `packages/astraeus/src/core/storyPanels.ts`, `packages/astraeus/src/shell/storyPanels.ts`, `packages/astraeus/src/shell/useStoryPanels.ts`, `packages/astraeus/src/shell/StoryPanelView.tsx`, `packages/astraeus/src/shell/AstraeusShell.tsx`, `packages/astraeus/src/shell/style.css`, `packages/astraeus/src/shell/phone.css`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/tests/domStory.test.ts`, `packages/astraeus/tests/publicApiStory.test.ts`, `packages/astraeus/tests/storyPanelSettings.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/objectives/O-066-click-sky-figures-and-tell-sky-stories/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Scene and host-link split, O-058; Host calls land in order, O-061; One handle, one lifecycle, O-054) and `docs/architecture/demo-contracts.md` where it describes story panels.

## Guardrails

API-01, API-02, API-04, API-05, API-07, ARCH-01, ARCH-03, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Confirm the previous step landed; return REPLAN REQUIRED if not.
2. Make `at` optional in the input, checks and resolution; keep moment panels unchanged.
3. Add step order and Back/Next to the panel state and view.
4. Add the host panel calls and their change signal through the one handle builder.
5. Tests (made-up stories, with and without a timeline, both paths); lock, README, CHANGELOG.

## Boundaries

No step actions (camera, select, trace: next step); no change to moment panels' opening rule.

## Technical Verification

Focused Vitest runs while building; hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack` and `npm run check:node-consumer`; no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads (not in Context Files), with reasons: `src/api/viewerSelection.ts` (pattern for the new `viewerPanels.ts`); `src/app/StoryMarkers.ts`, `src/app/viewHiding.ts`, `src/shell/TimelineBar.tsx` (consumers of `StoryPanel.timeUtcMs`); `src/api/sceneReads.ts`, `src/api/scene.ts` (`ScenePanelRead`, doc text); `src/app/App.tsx` (host control wiring); tests `twoViewers`, `lifecycle`, `viewerLinkPin`, `viewerHost*`, `helpers/viewerPresentation.ts`, `domSetup.ts` (fake controls and tables a new handle member must join); `packages/astraeus-site/tests/apiRules`, `apiTypeLint.allowlist.json`, `tools/validate/load-budget.mjs` (API-04 unitless list and API page budget, to stay inside them).

Per criterion:
- `at` optional; steps keep the order added across calls; moment panels unchanged: `core/storyPanels.ts` (`resolveStoryPanels` returns moment `panels` sorted by time and a separate `steps`, so no existing consumer of `StoryPanel.timeUtcMs` changed); `tests/publicApiStorySteps.test.ts`; `domStory.test.ts` and the rest of `publicApiStory.test.ts` pass unchanged except that the row "no at throws bad-panels" was removed (it is now valid, by design) and two site tests got a type-only `?? 0` in a sort (`ScenePanelRead.timeUtcMs` is now optional).
- Back and Next on the open step, Back disabled on the first, Next on the last, steps never open from playback, no-timeline scene works: `tests/domStorySteps.test.ts` (shell DOM, with and without `hideTimeline`).
- First step opens at the start when the scene has steps and no moment panel (initial hook state, so it is read from `handle.panel` and never reported); beside moment panels nothing opens at the start (a step opens from its object marker, `setPanel`, or the host). Recorded in Drift Notes.
- Host calls both paths: `handle.panel`, `handle.setPanel(id | undefined)` (open by id, or close), `handle.onPanel(fn)` with cause `visitor` / `host` / `playback`; unknown id or non-string throws `bad-panels`; `not-mounted` before ready. Built once in `viewerHandleOf`, so `mount` and `AstraeusScene` share it. `tests/publicApiStorySteps.test.ts` (checks, causes, call order, no report when unchanged), `tests/twoViewers.test.ts` (all three pairings: A changes, B untouched, listener heard), `tests/lifecycle.test.ts` (member table, `not-mounted` after unmount).
- `scene.panels` reads moment panels by time then steps in the order added, no time on a step (no numeric `step` in the public read: it would have needed an API-04 unitless allowlist entry, so the list order is the order).
- Phone first: `.story-panel-close/back/next/continue` have `min-width/min-height: 44px` on every screen; the step row is a flex row where the count shrinks and wraps and the two buttons never shrink, sticky at the foot of the sheet. `tests/domStorySteps.test.ts` reads these rules from `style.css` (happy-dom has no layout) and renders the same markup with `phone: true`. No browser run, per the run rules: 375x667 and 1280x720 are unverified by eye.
- API lock (`npm run api:lock`), README (addStoryPanels, scene.panels, mount members, new handle row), CHANGELOG (Unreleased, second step).

Gates, all run after the last code change (repo root): `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` pass (244 files, 3616 passed, 2 skipped); `npm run check:pack` pass; `npm run check:node-consumer` pass. No allowlist or budget changed: the API page (`load-budget.mjs` raw 200,000 B) went over by 640 B at first and was brought back by trimming my own doc comments; gzip 44,000 B and the engine first-download limits untouched.

## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.

- `StoryPanelSet` gains optional `steps: StoryStep[]` (a `StoryPanel` without `timeUtcMs`, with `step` counted from 1) beside `panels` (moment panels only, sorted by time, unchanged shape); `CheckedPanel.at` is optional; `neighbourStep` in `core/storyPanels.ts`. Views name and hide steps through the same `panels` ids (`planViews` and `experienceInView` take both lists; `tests/publicApiStorySteps.test.ts`).
- Opening rule for the first step (owner decision for this step was Back/Next; the opening rule is mine, per the planner's suggestion): the first step is open from the start only when the scene has steps and no moment panel. Beside moment panels no step opens at the start and the visitor has no entry to a step unless it names an `object` (marker) or the host calls `setPanel`; if the owner wants a visitor entry for that mixed case (for example a Story button), it is new work.
- Handle: `panel`, `setPanel(id | undefined)` (one call for open and close, as `setSelected` does, so no new verb), `onPanel`; new `ViewerState.panel`, `ViewerControl.panels()` / `setPanel`, `ViewerPort.publishPanel(state, cause | "move")` and `api/viewerPanels.ts` (`ViewerPanels`, `PanelChange`), mirroring `ViewerSelection`. The shell reports `onOpenPanelChange(id, cause)` with cause `visitor` / `host` / `playback` / `move` (a view switch dropped it; the link names whatever last moved the view). The host call shows at once in `read()` and is the last word (one request per tick, as `setSelected`).
- `StoryMarkerSpec.timeUtcMs` is optional (a step's marker sorts after the moment panels and is never "reached" by the clock).
- Shell: `useStoryPanels(panels, steps, ...)`, `StoryPanelView` takes a `step` nav (`StepNav`); `AstraeusShell` complexity held at 20 by moving the step nav and the request handling into two small functions.
- Deferred to the Design reconciliation step: a sentence in Design.md "Interfaces and Data Flow" for steps, `setPanel`/`onPanel` and the opening rule; `docs/architecture/demo-contracts.md` panel paragraph.
