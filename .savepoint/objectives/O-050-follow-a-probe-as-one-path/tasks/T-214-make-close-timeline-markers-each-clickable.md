---
id: T-214
title: Make close timeline markers each clickable
objective: O-050
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-switch-20261101}
---

# Make close timeline markers each clickable

## Outcome

Event, story-panel and window-peak markers that would overlap on the timeline can each be reached and opened, on desktop and phone, with no overlapping markers or labels (I-126).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- A pure layout function in `timelineModel.ts` takes marker times and the track width and returns positions and a grouping, so markers closer than a minimum spacing are spread or gathered into one group that lists its members. The executor picks the presentation and records why. Every member stays reachable by pointer and keyboard, and Previous/Next keeps stepping through every event.
- Five events within 5 hours on a multi-year timeline: each opens its own event at 1280x720 and 375x667. Node tests on the layout function, plus a component or DOM test for reachability.
- Isolated markers look and behave exactly as today.

## Context Files

`packages/astraeus/src/shell/TimelineBar.tsx`, `packages/astraeus/src/shell/TimelineBar.css`, `packages/astraeus/src/shell/timelineModel.ts`, `packages/astraeus/src/shell/phoneLayout.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Layout function with tests; wire it into the marker rendering.
3. Reachability test; phone and desktop sizes.

## Boundaries

No change to event data or the Go to / Previous / Next behaviour beyond reaching every event; no scene-marker (I-031) changes.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
