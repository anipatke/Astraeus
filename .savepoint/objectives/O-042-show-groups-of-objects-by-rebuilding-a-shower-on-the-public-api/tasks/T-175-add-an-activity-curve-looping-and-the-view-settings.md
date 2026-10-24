---
id: T-175
title: Add an activity curve, looping and the view settings
objective: O-042
status: done
depends_on: [{task: T-174, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o042-planning-20261024}
check_waiver:
  task: T-175
  reason: 'Owner said "orchestrate O42"; under the standing O-042 run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o042-run-20261024}
  recorded_at: '2026-10-24T00:00:53Z'
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

Built 2026-10-24 (builder session). Added `src/api/activity.ts` (`addActivity`: validated TimelineWindow with peak and provenance spans, `bad-activity`; rate bar fed from it), group `readouts: [{ kind: "rate", activity? }]` (`bad-readout`), `setTimeline({ loop })`, `up: "ecliptic"` on `camera.follow`/`lookAt`, `camera.setReach(distance)` (max focus distance, far = 2.5x, `bad-camera`). Label reach reconciled: in a non-Sun-centred scene a body label reach is max(500, reach); Sun-centred scenes were already unlimited. Without `setTimeline`, the timeline spans trajectories and activities. Docs: doc comments, README rows, CHANGELOG entry, `/api` section list (api-reference.mjs). New test `packages/astraeus/tests/publicApiActivity.test.ts` (rate at, before, after peak and outside the window; error codes; loop; up; reach; label reach).

Gates: `npm run lint` pass (after splitting planActivity and toDefinition for CODE-01), `npm run typecheck` pass, `npm run build` pass, `npm test` pass (127 files, 1704 passed, 1 skipped), `npm run check:engine-alone` pass, `npm run check:pack` pass. No browser run, no screenshots; showers demo, Apollo and hello-scene untouched (hello-scene not changed, so `build:example` not run). The `/api` page was not regenerated or viewed (no site build of it run beyond `npm run build`).

## Drift Notes

Record architecture deltas for Design reconciliation in the showers rebuild Task.
