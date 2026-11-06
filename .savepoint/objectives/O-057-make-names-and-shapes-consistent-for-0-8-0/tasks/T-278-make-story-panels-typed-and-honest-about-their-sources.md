---
id: T-278
objective: O-057
title: Make story panels typed and honest about their sources
status: planned
depends_on: [{task: T-277, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
---

# Make story panels typed and honest about their sources

## Outcome

Story panels are typed, checked at the call, carry `provenance`, append, and take their playback settings from their own call.

## User Check

Open a panel in a test scene and see its badge, sources and accuracy; adding panels twice keeps both batches.

## Done When

`StoryPanelInput` replaces `unknown[]`; `addStoryPanels(list)` appends, a repeated id throws `duplicate-id` and a bad shape throws `bad-panels` at the call; event, anchor and object links are checked at `check` and `mount`; `at.time` takes `TimeInput`; `provenance` replaces `badge` and `sources`, and the panel shows the source type, sources, accuracy and notes; `setStoryPanelPlayback({ pauseSeconds, autoOpen })` replaces that setting; old inputs join the `renamed` table; the call-twice grammar test covers panels; `ScenePanelRead` matches; every Apollo, showers, planets and test-scene panel is moved, with accuracy and notes drawn from what its `details` and sources already state and never invented; the last `apiTypeLint` breaks go, so its `breaks` list is empty.

## Context Files

`.savepoint/objectives/O-057-make-names-and-shapes-consistent-for-0-8-0/Objective.md`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/planStory.ts`, `packages/astraeus/src/api/sceneReads.ts`, `packages/astraeus/src/core/storyPanels.ts`, `packages/astraeus/src/shell/storyPanels.ts`, `packages/astraeus/src/core/provenance.ts`, `packages/astraeus-demo-showers/data/stories/perseids/panels.json`, `packages/astraeus-demo-showers/data/stories/geminids/panels.json`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Scene.ts`, `packages/astraeus-site/src/synthetic/syntheticScene.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-02, API-04, API-05, PROV-01, ARCH-01, ARCH-03, TEST-01, TEST-02.

## Implementation Plan

1. Write the input type and split shape checks (at the call) from link checks (at build). 2. Make adding append and add the set call. 3. Move the panel to `provenance`, on screen included, phone first. 4. Convert panel data. 5. Regenerate the lock and clear the lint.

## Boundaries

No new panel features and no redesign beyond showing the provenance fields. Panels must not collide at 375x667 or 1280x720. A panel whose accuracy cannot be stated from its sources says so plainly.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the last step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read and changed, limitations.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.
