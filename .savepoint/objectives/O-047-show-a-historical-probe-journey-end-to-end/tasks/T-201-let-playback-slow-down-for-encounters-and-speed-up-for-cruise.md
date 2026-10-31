---
id: T-201
objective: O-047
title: Let playback slow down for encounters and speed up for cruise
status: planned
depends_on: [{task: T-197, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Let playback slow down for encounters and speed up for cruise

## Outcome

`setTimeline` takes `pacing`: spans `{ from, to, rate }` and an event rule `{ near: { type, within }, rate }` that uses the scene's timed events; playback ramps smoothly between rates; a speed the visitor (or the host, through the previous step's control) picks wins until released, then pacing resumes (I-112).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- Pacing is checked in `setTimeline` with `bad-timeline` naming the field (overlapping spans: state the rule; an event type with no events: state whether it warns or refuses).
- The paced rate is a pure function of time (ARCH-02: no change to State), ramped over a stated duration or fraction so a jump from cruise to encounter rate is smooth both ways.
- Visitor override: picking a speed takes over; a clear way to release it (for example choosing 'Auto' in the speed menu, or the host passing `undefined`) returns to pacing; the menu shows when pacing is active.
- Tests on a made-up journey with made-up events: rate at cruise, near an event, during a ramp; override and release; pacing with loop.
- README row and example; doc comments; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/story.ts`, `packages/astraeus/src/core/clock.ts`, `packages/astraeus/src/app/openClock.ts`, `packages/astraeus/src/shell/TimelineBar.tsx`, `packages/astraeus/src/shell/timelineModel.ts`, `packages/astraeus/README.md` (`setTimeline` row).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Design the paced-rate function and the override state on the one clock from the previous step.
3. Validate input; wire the menu's Auto choice.
4. Tests, docs, CHANGELOG.

## Boundaries

No per-event camera moves; no change to event panels.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, lite at hand-off). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
