---
id: T-197
objective: O-047
title: Let the host page read and set the viewer's time and speed
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Let the host page read and set the viewer's time and speed

## Outcome

From the mount handle and from `AstraeusScene`, a host can read the current time and playback rate, set either (the viewer moves there), and receive a callback when playback or the visitor changes them (I-099); and the speed menu shows exactly the speeds a scene gives, or the README states which are added (I-106).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- Mount handle gains time and rate read/set and a change callback; `AstraeusScene` gains matching props; names and shapes stated in the README with an example.
- Setting a time outside the timeline fails with `bad-time`; setting a rate outside the offered list is either accepted as a custom rate or refused with a named error (state the choice).
- I-106: decide with evidence from the code whether the defaults stay; recommended: show only the given rates when `rates` is set. Test either way.
- Tests on a made-up scene: read, set, callback on playback and on a visitor seek; unmount stops callbacks.

## Context Files

`packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/core/clock.ts`, `packages/astraeus/src/app/openClock.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/shell/TimelineBar.tsx`, `packages/astraeus/src/shell/timelineModel.ts`, `packages/astraeus/README.md` (mount and `setTimeline` rows).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Read how the clock is owned between App and the shell; return REPLAN REQUIRED if the host control needs a second clock.
3. Expose read/set/subscribe on one clock through the mount handle and `AstraeusScene`.
4. Settle I-106.
5. Tests, README example, doc comments, CHANGELOG `Unreleased` line.

## Boundaries

No pacing yet (next step). No change to the timeline's look.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, lite at hand-off). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
