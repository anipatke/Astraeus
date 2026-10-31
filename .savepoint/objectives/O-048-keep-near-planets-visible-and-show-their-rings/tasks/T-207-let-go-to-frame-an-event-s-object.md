---
id: T-207
objective: O-048
title: Let Go to frame an event's object
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-2-20261031}
---

# Let Go to frame an event's object

## Outcome

An event added with `addEvents` may name an `object` already in the scene; the timeline's Go to (and previous/next) seeks to it and frames that object as `camera.lookAt` would; an event without one seeks as before (I-120).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `EventInput.object` (name it in the README) is checked at `toDefinition` with `bad-event` naming the event and the id when the scene does not hold it.
- Go to with an object seeks and frames it (selects it, Focus shown); without, today's behaviour (test).
- The framing comes only from the event's named object (ARCH-06); it never changes State (ARCH-02).
- README row; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/shell/TimelineBar.tsx`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/shell/objectModel.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Add the field and its check.
3. Wire Go to through the same framing `lookAt` uses.
4. Tests, docs.

## Boundaries

No camera animation changes beyond what lookAt already does.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
