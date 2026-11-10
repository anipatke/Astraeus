---
id: T-301
title: Let story steps and events turn to, select and trace a figure
objective: O-066
status: planned
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

Pending execution.

## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.
