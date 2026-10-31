---
id: T-199
objective: O-047
title: Select the path or body a scene opens on
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Select the path or body a scene opens on

## Outcome

A scene that opens with `camera.lookAt` or `camera.follow` on a path or body shows that object as selected, not the Sun (I-115).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- Reproduce first with a made-up Sun-centred scene; record what selects the Sun.
- The opening selection is derived from the opening camera target (ARCH-06: from the scene, never a hard-coded body); with no target, today's behaviour holds.
- Tests: `lookAt` and `follow` on a path and on a body; no target. CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/shell/objectModel.ts`, `packages/astraeus/src/app/App.tsx`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Reproduce; if it does not reproduce, record how it was tried and stop with evidence.
3. Fix at the rule that picks the opening selection; tests.

## Boundaries

No change to how selection works after opening.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, lite at hand-off). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
