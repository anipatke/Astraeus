---
id: T-310
title: Let a host give a body or path a time it is shown
objective: O-071
status: done
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

Gates from the repo root, all passing after the last edit: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (254 files, 3784 passed, 2 skipped). `npm run api:lock` regenerated `packages/astraeus/api-surface.lock.json`. No browser run. The lifecycle I-174 test did not fail. One earlier `npm test` failed `packages/astraeus-site/tests/apiReference.test.ts` (generated API page gzip over the 44,000 B limit by 257 B); fixed by shortening the new doc comments, limit untouched.

| Done When | Evidence |
|---|---|
| Public input `shownDuring?: { start?, end? }` on the three calls, checked at the call with the call's own code | `ShownDuringInput` in `src/api/shownDuring.ts` (root export in `src/api/index.ts`); `AddBodyOptions.shownDuring` (so `addBody` and `addBodyFromElements`, `bad-body`) and `TrajectoryInput.shownDuring` (`bad-trajectory`) in `src/api/scene.ts`; one checker `planShownDuring` called from `BodyPlan.#register` (`planBodies.ts`) and `buildTracked` (`planPaths.ts`). `tests/shownDuring.test.ts` "shownDuring input": a table across the three calls covers not an object, null, a list, neither end, a bad start, a bad end, end equal to and before start, each asserting the code and call name. The checker uses `toUtcMs` like every other moment; the repo has no separate whole-millisecond rule for moments to copy, so none is added. |
| Resolved once into the object list as ms, with one pure `shownAt` rule; orbit line follows | `ExperienceObject.shownDuring?: ShownSpan` (`src/shell/experience.ts`, separate from `availability`), set in `BodyPlan.bodyObject` and the tracked-object map in `assembleScene.ts`. `shownAt` in `src/app/viewHiding.ts`; test "shownAt" covers start-1, start, end-1, end, open start, open end, no span, and the before/after pair at T over T-3..T+3 (never both shown, never both hidden). "puts the span in ms on the object list" per call. Orbit line: `partOf` followers in `hiddenWithShownSpans` (test "adds every object not shown ... and what is part of one"), and the frame test hides the moon's composition orbit line through the existing `showOwned`. |
| One hidden set built in one place, applied by `applyViewVisibility`; no change for a frame with no spans | `hiddenWithShownSpans` in `src/app/viewHiding.ts` next to `hiddenByView`/`hiddenWithLookOut`; `hiddenOf(ctx, t)` in `src/app/sceneFrame.ts` calls it, and `applyViewVisibility(ctx, t)`, `shownUnderView(ctx, t)` and the story-marker call read that one set; `runFrame` passes `t`. Test "returns the same object when nothing is hidden by time" asserts identity (`toBe`) with no spans, spans all showing, and no time given; it allocates a set only when something is out. |
| `stateOf`, readouts, State unchanged (ARCH-02) | Test "changes nothing about State": `stateOf("probe", t)` equal with and without `shownDuring` at four times in and out of the span. The change touches no `core/` file. |
| Tests: table across calls, shownAt, before/after at T, combines with a view, orbit line hides with it, frame draws nothing outside | All in `packages/astraeus/tests/shownDuring.test.ts` (16 tests, synthetic scenes only): "combines with the view's hidden set" (hidden by either, view sets not edited); "draws the marker and line only while the span holds, and the label and pick list follow" runs `applyViewVisibility`, `shownUnderView` (pick list and label-hidden ids) and `hiddenOf` at T0, start, path end and body end. |
| API lock, README rows, CHANGELOG | `npm run api:lock` (diff: `shownDuring` rows on `addBody` options and `addTrajectory` input, `ShownDuringInput`); README `Bodies and paths` rows of `addBody`, `addTrajectory` (signature and text) and `addBodyFromElements` (via "`addBody`'s options, `shownDuring` included"); CHANGELOG Unreleased "Added" entry. `apiReference.test.ts` page-size test passes. |
| No existing test's setup changes | `git status` shows only the new `tests/shownDuring.test.ts`; no existing test file is modified. The `hiddenOf`/`applyViewVisibility` extra argument is optional, so the existing `viewFrame.test.ts` calls run as before. |

Marked done by the coordinator 2026-11-12T10:47:43Z under the owner's "go" (orchestrate O-071) standing rule ("I mark them as they pass"): gates passed (lint, typecheck, build, test 3,784 passed); diff reviewed.

## Drift Notes

For Design `Views of one scene` (hidden set): the frame's hidden set is now the view's hidden ids, plus every object not shown at the frame's clock time (`shownDuring`) and what is `partOf` one, plus the look-out body. The time-aware builder is `hiddenWithShownSpans(hidden, objects, timeUtcMs)` in `packages/astraeus/src/app/viewHiding.ts`; the pure rule is `shownAt(object, t)` in the same file (`startUtcMs <= t < endUtcMs`, open ends unbounded). `hiddenOf(ctx, t?)` in `src/app/sceneFrame.ts` is the one call site (reads `controls.labelObjects`, the full unfiltered experience object list, never the view-filtered one); `applyViewVisibility`, `shownUnderView` (now exported) and the story-marker stage all go through it. Next task (menu, selection, camera): reuse `shownAt` for the menu and picking lists and `hiddenWithShownSpans` or `hiddenOf` where it needs the set; `ExperienceObject.shownDuring` (ms) is the data. The experience object list given to the shell is not filtered by time, so the Object menu still lists a not-shown object until that task. The generated API page was 16 B over its gzip limit at first; doc comments on the new input were shortened to stay within 44,000 (no limit raised).
