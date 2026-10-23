---
id: T-175
title: Add an activity curve, looping and the view settings
objective: O-042
status: planned
depends_on: [{task: T-174, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o042-planning-20261024}
---

# Add an activity curve, looping and the view settings

## Outcome

`scene.addActivity(...)` gives the timeline a rate curve with its peak (the glow) and provenance, and a group readout `{ kind: "rate" }` shows the live rate on the card (Decision 4); `setTimeline` takes `loop`; `camera.lookAt` takes `up: "ecliptic"`; `camera.setReach` sets how far the viewer can zoom out (labels reach as far).

## User Check

None required; proven on a made-up configuration.

## Done When

- Doc comments, `/api` places and made-up tests for each call, including the rate at, before and after the peak and outside the window.
- New `SceneError` codes (e.g. `bad-activity`) tested.
- Apollo and hello-scene unchanged.
- Hand-off gates plus `check:engine-alone`, `check:pack` green.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/core/timeWindow.ts`, `packages/astraeus/src/shell/metrics.ts`, `packages/astraeus/src/app/trackedMetrics.ts`, `packages/astraeus/src/app/viewUp.ts`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/tests/publicApiStory.test.ts`, `packages/astraeus/tests/timeWindow.test.ts`, `packages/astraeus-site/tools/site/api-reference.mjs`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`.

## Design References

Design Interfaces and Data Flow (timeline windows, metrics).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-05.

## Implementation Plan

1. Activity windows and the rate readout. 2. Loop, ecliptic up, reach. 3. Tests and docs.

## Boundaries

No coordinates readout kind (Decision 4); no other window types.

## Technical Verification

Hand-off gates from AGENTS.md (`npm run lint`, `npm run typecheck`, `npm run build`, `npm test`) plus the extra gates named in Done When. No `npm run check:browser` per Task (one run at the Full Objective Check); a changed browser step may be run alone once. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for Design reconciliation in the showers rebuild Task.
