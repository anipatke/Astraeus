---
id: T-300
title: Let story panels be steps with Back and Next
objective: O-066
status: planned
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

Pending execution.

## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.
