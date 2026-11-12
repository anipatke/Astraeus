---
id: T-310
title: Let a host give a body or path a time it is shown
objective: O-071
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o071-20261112}
check_waiver: {task: T-310, reason: 'Owner said "go" to orchestrate O-071 under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o071-run-20261112}, recorded_at: '2026-11-12T10:41:40Z'}
---

# Let a host give a body or path a time it is shown

## Outcome

`addBody`, `addBodyFromElements` and `addTrajectory` take `shownDuring: { start?, end? }`, and outside that span the scene does not draw the object (marker, line, orbit ring, label) or let it be picked, by adding it to the same hidden set a view uses.

## User Check

None for the owner at this step.

## Done When

- Public input: `shownDuring?: { start?: TimeInput; end?: TimeInput }` on the three calls' option/input types; checked at the call (API-04): not an object, neither end given, an end that is not a moment, or `end` not after `start` throws the call's own code (`bad-body` for `addBody` and the `addBodyFromElements` options; `bad-trajectory`) naming `shownDuring`. Whole-millisecond rule as for other moments.
- Resolved once into the object list the viewer reads (`ExperienceObject` in `src/shell/experience.ts` gains a shown span in ms, distinct from `availability`), with one pure rule `shownAt(object, timeUtcMs)`: shown when `start <= t < end` (an open end is unbounded). An orbit line (`partOf`) follows its body.
- The frame's hidden set is the view's hidden set plus every object not shown at the frame's clock time, built in one place next to `hiddenByView`/`hiddenWithLookOut` (`src/app/viewHiding.ts`) and applied by the existing `applyViewVisibility` stage, so drawing, labels and picks follow with no per-drawer change. A frame with no spans allocates nothing new (same object, as `hiddenWithLookOut` does).
- `stateOf`, readouts, State unchanged (ARCH-02): a test reads `stateOf` inside and outside the span and gets the same values as without `shownDuring`.
- Tests (synthetic scenes only, ARCH-03), one table test across the three calls where they share an assertion: input faults per call; `shownAt` at `start - 1`, `start`, `end - 1`, `end`, open start, open end; a "before" object ending at T and an "after" object starting at T are never both shown and never both hidden at any ms around T; the hidden set combines with a view (hidden by either); a body's orbit line hides with it; a frame-level test that marker/line/label are not drawn outside the span.
- API lock updated (`api-surface.lock.json`) and the README rows of `addBody`, `addBodyFromElements` and `addTrajectory` name `shownDuring` (API-01, API-07 README tables checked against types); CHANGELOG Unreleased entry (addition).
- No existing test's setup changes.

## Context Files

`.savepoint/objectives/O-071-show-a-body-or-path-only-for-a-span-of-time/Objective.md`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/planBodies.ts`, `packages/astraeus/src/api/planPaths.ts`, `packages/astraeus/src/api/assembleScene.ts`, `packages/astraeus/src/api/time.ts`, `packages/astraeus/src/shell/experience.ts` under `ExperienceObject`, `packages/astraeus/src/shell/objectModel.ts`, `packages/astraeus/src/app/viewHiding.ts`, `packages/astraeus/src/app/sceneFrame.ts` (`applyViewVisibility` and the hidden-set helper above it), `packages/astraeus/tests/viewFrame.test.ts`, `packages/astraeus/README.md` under `Bodies and paths` (the three rows), `packages/astraeus/CHANGELOG.md` (newest section only).

## Design References

`.savepoint/Design.md` under `Views of one scene` (the hidden set and `applyViewVisibility`) and `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

ARCH-02, ARCH-03, ARCH-06, API-01, API-04, API-05, API-07, TEST-01, TEST-03, STYLE-01, STYLE-02.

## Implementation Plan

1. Confirm `applyViewVisibility` reads one hidden set per frame and that the shell's objects carry `partOf`; REPLAN REQUIRED if hiding is per drawer instead.
2. Add the input type and a shared span checker (one function used by the three calls, beside the existing span planners); resolve to ms in the object list.
3. Add `shownAt` and the time-aware hidden-set builder; call it where the frame builds its hidden set.
4. Tests, lock, README rows, CHANGELOG.

## Boundaries

No menu, selection or camera work (next step); no fade; no body sets, groups or sky figures; no change to `availability` (a path's own bounds) or to how a path's marker shows only inside its samples.

## Technical Verification

Focused vitest runs while iterating (from the repo root config); hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` from the repo root. No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record the hidden-set change for the Design `Views of one scene` paragraph.
