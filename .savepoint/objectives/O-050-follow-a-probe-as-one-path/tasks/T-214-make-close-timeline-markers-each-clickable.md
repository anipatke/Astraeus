---
id: T-214
title: Make close timeline markers each clickable
objective: O-050
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-214, reason: 'Owner said "orchestrate O50"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o050-run-20261101}, recorded_at: '2026-10-31T21:14:25Z'}
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

Presentation chosen: gathered group (not spread). Five events within 5 hours on a multi-year track sit under one pixel; spreading them would need about 90 px of sideways offset on a ~300 px phone track and would show times that are not true. A single numbered mark (at the members' mean position) keeps true positions; pressing it opens a list above the track of full-size (36 px min) buttons, each with the same aria-label and action as the ordinary marker (event: seek + info; panel: open; peak: window seek + info). Escape closes; the list aligns to the screen side near the mark (data-align start/middle/end, max-width min(300px, 100vw-32px)) so it stays on screen at 375x667 and 1280x720. Events, panels and peaks all group together. Isolated markers render the same buttons as before. An unmeasured track (width 0: DOM tests, first paint) gathers nothing, so existing DOM tests are unchanged.

Changes: `groupMarkers` + `MARKER_MIN_SPACING_PX` (22 px) + `MarkerGroup` in timelineModel.ts; TimelineBar.tsx builds one marker list, measures the track (ResizeObserver) and renders singles or groups; TimelineBar.css group styles; new tests/timelineMarkerGroups.test.ts (8 tests: layout at 300/1200 px, spacing boundary, unmeasured, empty, five-event reachability each opened, Escape, isolated unchanged).

Gates (2026-11-01): `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm test` 164 files passed, 2045 passed / 1 skipped, 0 failed (first run caught two issues, both fixed: unused import; a 320 px fallback width grouped markers in existing DOM tests, now 0 = ungrouped). Previous/Next (navigationStops) untouched, still step every event. Not run: any browser check (rules); visual layout at 375x667 / 1280x720 is unverified beyond CSS reasoning.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- Timeline markers (events, story panels, window peaks) are now laid out by `groupMarkers` in timelineModel.ts: markers closer than 22 px on the measured track gather into one numbered group mark with a list; unmeasured track gathers nothing. Reconcile into Design.md Interfaces and Data Flow (timeline) in the last step.
