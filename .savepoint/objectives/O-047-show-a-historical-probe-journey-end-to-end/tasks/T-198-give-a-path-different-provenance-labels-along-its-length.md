---
id: T-198
objective: O-047
title: Give a path different provenance labels along its length
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Give a path different provenance labels along its length

## Outcome

`addTrajectory` accepts provenance by time span (reusing the activity pattern in `src/api/activity.ts`), so each stretch of a path shows its own Observed or Modelled label as time moves; a single provenance works as before (I-113).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- Input shape matches activity's span provenance (`{ start, end, provenance }` list) or a stated reason it differs; checked with `bad-trajectory` naming the index; gaps fall back to the path's single provenance or the illustrative default.
- The selected path's provenance shown in the viewer follows the current time (test).
- Tests on a made-up path with three spans; existing path tests unchanged.
- README row, doc comment, CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/activity.ts`, `packages/astraeus/src/core/provenance.ts`, `packages/astraeus/src/shell/objectModel.ts`, `packages/astraeus/tests/publicApiPaths.test.ts`, `packages/astraeus/README.md` (`addTrajectory` row).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Read how activity span provenance reaches the viewer; reuse that path.
3. Add the option, validation and time-following display.
4. Tests, docs, CHANGELOG.

## Boundaries

No change to how a path is drawn.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, lite at hand-off). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
