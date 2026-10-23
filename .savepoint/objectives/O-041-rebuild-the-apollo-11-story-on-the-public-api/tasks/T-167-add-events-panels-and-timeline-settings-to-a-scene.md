---
id: T-167
title: Add events, panels and timeline settings to a scene
objective: O-041
status: planned
depends_on: [{task: T-166, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o041-planning-20261024}
---

# Add events, panels and timeline settings to a scene

## Outcome

A developer can add timed events with their provenance and story panels to a scene, set the timeline's span, speeds and starting rate or switch the timeline off (time frozen at a moment, or running on its own), offer true scale only, and open on a camera view that does not follow; the camera menu lists Overview plus Focus and Follow for every body and path.

## User Check

None required; the owner's look comes with the Apollo rebuild.

## Done When

- `scene.addEvents(events, { provenance? })`, `scene.addStoryPanels(raw)` (checked at `toDefinition` against the scene's events, anchors and object ids; a mistake throws `SceneError` `bad-panels` naming the panel and field), `scene.setTimeline({ start, end, rates?, rate? })`, `setScale(scale, { only: true })`, `scene.camera.lookAt(id, view)`, and a small public read `scene.stateOf(id, time)` (for figures a story quotes, e.g. a peak speed).
- **No timeline** (O-041 Decision 6): the timeline call can say there is none; the shell then draws no timeline bar on desktop or phone (no drawer, no `--timeline-space` gap), and the time is either frozen at a chosen moment or runs on its own at a chosen rate. Existing experiences, which all have timelines, are unchanged.
- Camera menu automatic (Decision 3): Overview plus Focus/Follow for every body and path; the change in hello-scene's preset count is recorded.
- Made-up story tests (ARCH-03): panels resolving by utc, event and anchor; `bad-panels`; window and rates from `setTimeline`; true-scale-only; opening view not following; presets per body and path; no-timeline frozen and running (shell renders no bar; clock behaviour), each error code.
- Doc comments and a "Story" section on `/api`; existing api, hello-scene and shell tests still pass.
- Hand-off gates green, plus `npm run check:engine-alone`.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/shell/storyPanels.ts`, `packages/astraeus/src/shell/experience.ts`, `packages/astraeus/src/shell/AstraeusShell.tsx`, `packages/astraeus/src/shell/TimelineBar.tsx`, `packages/astraeus/src/shell/useDrawers.ts`, `packages/astraeus/src/core/events.ts`, `packages/astraeus/src/core/clock.ts`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/tests/publicApi.test.ts`, `packages/astraeus-site/tools/site/api-reference.mjs`.

## Design References

Design Interfaces and Data Flow (experience definition, shell), Current Technical State O-040.

## Guardrails

ARCH-02, ARCH-03, PROV-01, STYLE-06, STYLE-07, TEST-01, TEST-03.

## Implementation Plan

1. Events, panels, timeline span/rates, true-scale-only, `lookAt`, automatic presets, `stateOf` on Scene over the existing definition fields.
2. A definition-level "no timeline" setting the shell honours (no bar, no phone drawer), with frozen and running clock modes; keep the default exactly as today.
3. Tests on a made-up story; doc comments and reference section.

## Boundaries

No event or pick listeners (Decision 1); no chapters or narration; no change to existing demos' timelines.

## Technical Verification

Focused tests while iterating; hand-off gates plus `check:engine-alone`. No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record the no-timeline shell change and new Scene calls for Design reconciliation in the Apollo rebuild Task.
