---
id: T-301
title: Let story steps and events turn to, select and trace a figure
objective: O-066
status: done
depends_on: [{task: T-300, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-301, reason: 'Owner said "orchestrate O66" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o066-run-20261110}, recorded_at: '2026-11-10T06:15:12Z'}
planned_by: {role: planner, session: o066-planning-20261110}
---

# Let story steps and events turn to, select and trace a figure

## Outcome

Opening a story panel can turn the camera to any view the app can ask for (including looking out toward a sky figure), select the panel's object and trace its sky figure; leaving the step clears that trace; a timeline event can name a sky figure.

## User Check

None for the owner at this step; the owner looks in the last step.

## Done When

- A look-out `direction` (in `setCamera`, `scene.camera.lookOut` where an object is allowed, and step cameras) may name a sky figure id, meaning its label point; unknown ids keep today's `bad-camera`.
- `StoryPanelInput` gains optional `camera` (any `CameraTarget`, checked with `setCamera`'s checks, `bad-panels` naming the panel), `select` (boolean: select the panel's `object` on open) and `trace` (`true` or trace options: trace the panel's `object`, which must then be a sky figure). Panel `object` may name a sky figure. All three apply whenever the panel opens (by time, step, host or visitor), in a stated order (camera, select, trace), through the same host-call paths (`setCamera`, `setSelected`, `traceSkyFigure`), not a second mechanism (STYLE-07).
- Leaving a step (another panel opens or it closes) clears the trace it started with `clearSkyTrace`'s default fade; a host or visitor action in between is not undone.
- `EventInput.object` may be a sky figure: Go to seeks, selects it and turns toward it only while the camera looks out (no camera change otherwise; stated in the README).
- Panels without these fields behave as before (existing story tests unchanged).
- Tests (made-up figures and stories): each action alone and together, the order, leaving clears the trace, an event naming a figure, bad shapes, both paths (API-02).
- API lock, README, CHANGELOG updated (API-01, API-07); no body or constellation name in `src/api/` (ARCH-06).

## Context Files

`packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/planStory.ts`, `packages/astraeus/src/api/viewerCamera.ts`, `packages/astraeus/src/api/planCamera.ts`, `packages/astraeus/src/core/startView.ts`, `packages/astraeus/src/core/storyPanels.ts`, `packages/astraeus/src/shell/useStoryPanels.ts`, `packages/astraeus/src/shell/AstraeusShell.tsx`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/sceneCamera.ts`, `packages/astraeus/src/app/skyFigures.ts`, `packages/astraeus/src/api/skyTraceInput.ts`, `packages/astraeus/tests/publicApiStory.test.ts`, `packages/astraeus/tests/domStory.test.ts`, `packages/astraeus/tests/skyTrace.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/objectives/O-066-click-sky-figures-and-tell-sky-stories/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Sky figures, O-065; the sky view, O-064; Host calls land in order, O-061).

## Guardrails

API-01, API-02, API-04, API-05, API-07, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Confirm the previous steps (figure selection, story steps, host panel calls) landed; return REPLAN REQUIRED if not.
2. Let a look-out direction name a sky figure (one resolver from figure id to direction).
3. Add the panel fields and checks; apply them on open through the existing host-call paths; clear the step's trace on leave.
4. Let events name sky figures.
5. Tests; lock, README, CHANGELOG.

## Boundaries

No new story system; no timed traces; no constellation data.

## Technical Verification

Focused Vitest runs while building; hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack` and `npm run check:node-consumer`; no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads (reason: the Task's own code paths were not all in Context Files): `packages/astraeus/src/api/viewerLink.ts` (CameraTarget/LookOutTarget docs and LinkAccess), `packages/astraeus/src/app/CameraController.tsx` (CameraRequest type), `packages/astraeus/src/shell/objectModel.ts` via grep (skyFigureById), `packages/astraeus/src/shell/experience.ts` (ExperienceConfig/camera request), `packages/astraeus/src/api/scene.ts` and `assembleScene.ts` (where panel object ids and event object ids are collected), `packages/astraeus/tests/domSetup.ts` (shell harness), `packages/astraeus-site/tools/validate/load-budget.mjs` via the API page test (budget).

Per criterion:
- Look-out `direction` may name a sky figure: `setCamera` accepts a figure id the viewer draws (`ViewerCamera.setCamera` checks bodies against `cameraTargets()` and the turn-toward id against objects or figures); an unknown id is still `bad-camera`; a figure as the body or as `focus` is refused. One resolver, `aimAtFigure` (`src/app/skyFigures.ts`), turns the id into the figure's label point for both `setCamera` and the app's own camera requests. `scene.camera.lookOut` takes star-map positions only (no object ids), so there is nothing to extend there. Tests: `storyActions.test.ts` (cameraRequestOf, aimAtFigure, link).
- Panel `camera` / `select` / `trace` and `object` naming a figure: shape checked at `addStoryPanels` (`panelActionsOf` in `src/api/story.ts`, reusing `cameraRequestOf` (moved out of `viewerCamera.ts`) and `traceOptionsOf` (split out of `checkedTrace`)); names checked at build in `core/storyPanels.ts` (`checkLinks`; `PanelLookup.figureIds`). Applied in `App.markOpenPanel` whenever the shell's open panel changes, whoever opened it, in the order camera, select, trace, through the host-call paths `setCamera`, `hostSetSelected`, `hostTraceSkyFigure` (STYLE-07). Tests: `storyActions.test.ts` (carry, order, defaults, 9 bad shapes, 5 bad names) and `lifecycle.test.ts` "story step actions" on both embedding paths (first step at start, host `setPanel`, close).
- Leaving a step clears the trace it started (`hostClearSkyTrace` with `TRACE_FADE_SECONDS`); camera and selection are not undone. Test: lifecycle "story step actions".
- `EventInput.object` may name a figure: `checkEventObjects` accepts figure ids; the shell's Go to selects the figure and calls `onTurnToFigure`, which the app answers only while `viewReadout` has `lookOut`. Tests: `storyActions.test.ts` (accepted, bad name, orbiting camera left alone) and lifecycle "an event naming a sky figure ..." (turns while looking out; both paths).
- Panels without these fields unchanged: existing story tests pass untouched; the bad-event message text is unchanged (scenePin snapshot).
- API lock regenerated (`npm run api:lock`), README and CHANGELOG updated; no body or constellation name in `src/api/` (made-up ids only in tests).
- Budget: owner decision 2026-11-10 "Raise to 230 KB, restore": API page raw limit 200,000 -> 230,000 in `packages/astraeus-site/tools/validate/load-budget.mjs` (gzip 44,000 kept); the original wording of every doc comment I had shortened in `src/api/story.ts` was restored, and `EventInput.object` now states a sky figure is selected and turned toward only while looking out (not framed as `camera.focus`). Page measured at 200,586 B raw.

Gates (re-run after the owner-decision changes): `npm run lint` clean, `npm run typecheck` clean, `npm run build` ok, `npm test` 245 files / 3643 passed (2 skipped as before), `npm run check:pack` pass, `npm run check:node-consumer` pass. No browser run. Task Check waived by the owner.

## Drift Notes

- `CameraRequest` (and `PanelCameraRequest`) look-out `direction` is now optional: absent means the direction already looked along while looking out, else right ascension 0, declination 0 (`applyLookOut` in `sceneCamera.ts`). `setCamera` still fills the direction from the last reading; only a panel's camera leaves it out, so it is decided as the panel opens.
- Panel actions live on `StoryPanel`/`StoryStep` (`camera`, `select`, `trace` via `PanelActions` in `core/storyPanels.ts`) and are applied by the app (`App.markOpenPanel`), not by the host link, so a viewer with no host handle applies them too. `actedPanel` (not `openStoryPanelId`) tells whether a panel's actions ran, because a host `setPanel` shows its panel at once.
- Shell prop `onTurnToFigure` (app decides whether the camera looks out).
- New `src/api/cameraRequest.ts` (`cameraRequestOf`, the one shape check for `setCamera` and panel cameras); `traceOptionsOf` in `skyTraceInput.ts`.
- Clearing on leave cannot tell whether a host re-traced the same figure meanwhile; it clears that figure's trace on leaving.
- Design.md reconciliation is left to the last step of O-066 (sections "The sky view" and "Sky figures", "Host calls land in order").
