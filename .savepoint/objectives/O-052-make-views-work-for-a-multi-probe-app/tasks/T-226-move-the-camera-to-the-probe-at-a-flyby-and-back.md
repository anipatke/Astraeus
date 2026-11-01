---
id: T-226
title: Move the camera to the probe at a flyby and back
objective: O-052
status: planned
depends_on: [{task: T-225, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: voyagers-feedback-20261101}
---

# Move the camera to the probe at a flyby and back

## Outcome

A pacing event rule can ask the camera to follow the probe at a shown encounter and return to the visitor's pose afterwards (O-052 "Camera to the encounter").

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `EventInput.follow?: string`, a body or path id checked like `object` (`bad-event` when not in the scene). An event rule may add `camera: "follow"`; a follow rule matching an event with neither `follow` nor `object` throws `bad-timeline` naming the rule index and event.
- Entering a follow rule's zone for an event the showing view has, the camera follows `follow` (else `object`) through the camera request path; leaving it, the camera eases back to the pose it had before the move. A visitor camera move or pick during the move cancels the return. Overlapping follow zones: the first entered holds until it ends. Seeking into a zone starts the follow; seeking out ends it with the return. A switch that hides the followed object applies the view's camera rule (T-220) and drops the pending return. A chosen speed does not stop the follow (the zone is time-based).
- Tests through the camera request path with a made-up two-probe scene: enter, return, visitor cancel, overlap, seek in/out, view switch, refused rule.
- README "Paced playback" row for `camera: "follow"` and `EventInput.follow`; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/story.ts`, `packages/astraeus/src/core/pacing.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/sceneFrame.ts`, `packages/astraeus/src/app/sceneCamera.ts`, `packages/astraeus/src/shell/viewCamera.ts`, `packages/astraeus/tests/pacing.test.ts`, `packages/astraeus/tests/viewCameraDom.test.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-06, CODE-02, TEST-01, TEST-03, TEST-04, CODE-01; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Parse `follow` and the rule's `camera`; carry the follow target on the zone (from step 3's tagged zones).
3. A frame-stage watcher compares the active follow zone each frame and issues follow / return requests; record the pre-move pose; cancel on visitor input.
4. Tests, README, CHANGELOG.

## Boundaries

No follow on span rules; no State change (ARCH-02).

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, gates, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
