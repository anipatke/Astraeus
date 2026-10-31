---
id: T-198
objective: O-047
title: Give a path different provenance labels along its length
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-198, reason: 'Owner said "orchestrate O-47"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o047-run-20261031}, recorded_at: '2026-10-31T03:05:25Z'}
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

- Input: new `provenanceSpans?: { start, end, provenance }[]` on `addTrajectory` (the activity span shape, reusing `ActivitySourceInput`), separate from the single `provenance`, which stays the fallback; a separate key keeps the existing `provenance` type and `provenanceOf` unchanged. Validation in new `src/api/pathProvenance.ts` (`bad-trajectory` naming path and index: not a list, bad time, bad provenance, end not after start, outside the path, overlap or out of order).
- Display: `ExperienceObject.provenanceSpans`; `objectInfo` now takes the clock and shows the span covering it, else the object's `provenance`. Shared lookup `spanProvenanceAt` extracted in `core/timeWindow.ts` (`provenanceAt` delegates).
- Criteria: input shape and `bad-trajectory` with index, gap fallback to single provenance or illustrative default (tests "falls back..." and the 7 refusal cases); viewer follows time (test "shows each stretch's own label as time moves", via `infoView` on the object at three times); three-span made-up path; existing path tests unchanged (25 pass in `tests/publicApiPaths.test.ts`); README row, doc comment, CHANGELOG line done.
- Command run: `npx vitest run tests/publicApiPaths.test.ts` (25 passed). Configured lint/typecheck/build/test gates run once after T-199 (see T-199 evidence).
- Files read: scene.ts, activity.ts, timeWindow.ts, infoModel.ts, experience.ts, AstraeusShell.tsx (infoContent call, extra read: confirms the clock reaches objectInfo), publicApiPaths.test.ts, README row. No extra reads beyond these.
- Files changed: src/api/scene.ts, src/api/pathProvenance.ts (new), src/core/timeWindow.ts, src/shell/experience.ts, src/shell/infoModel.ts, tests/publicApiPaths.test.ts, README.md, CHANGELOG.md (all under packages/astraeus).
- Limitations: no browser run (by rule); the info card is proved through `infoView`, not the rendered badge.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- Interfaces and Data Flow: `addTrajectory` gains `provenanceSpans`; `ExperienceObject.provenanceSpans` is resolved against the clock in `infoView` (objects now time-dependent like windows). `spanProvenanceAt` is the one span lookup for windows and paths.
