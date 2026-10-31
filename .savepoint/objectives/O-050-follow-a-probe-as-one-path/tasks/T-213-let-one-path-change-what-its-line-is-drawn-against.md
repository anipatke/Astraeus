---
id: T-213
title: Let one path change what its line is drawn against
objective: O-050
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-213, reason: 'Owner said "orchestrate O50"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o050-run-20261101}, recorded_at: '2026-10-31T21:09:37Z'}
planned_by: {role: planner, session: probe-switch-20261101}
---

# Let one path change what its line is drawn against

## Outcome

`addTrajectory` takes `lineFixedTo` as a body id (unchanged) or a list of `{ start, end, body }` stretches, and draws each stretch against its own body, so a flyby mission is one path: one object-menu entry, one info card, continuous readouts and one `camera.follow` target (I-125, listed half).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `lineFixedTo` accepts a list of `{ start, end, body }` (times as `TimeInput`, like `provenanceSpans`): sorted, not overlapping and inside the path's span, and every body in the scene. Each fault throws `bad-trajectory` naming the index. A single body id behaves exactly as today.
- Drawing: each stretch's samples are placed from its body at their own time and carried to that body's place at the clock time (the relative-trail rule per stretch). Uncovered time is drawn against the scene centre. The travelled/future split and anchors follow the same per-stretch frame. Remapping stays per clock time only for stretches fixed to a moving body.
- One object: a made-up flyby path (Sun-fixed cruise, planet-fixed encounter, Sun-fixed cruise) is one menu entry that never shows "(Unavailable)" inside its span. `camera.follow` keeps the marker in view across both stretch boundaries (scene-frame or camera test, not browser). Readouts are continuous across the boundaries.
- Tests on made-up configurations (ARCH-03): validation faults, the single-body case unchanged (existing `publicApiSunPaths`/`publicApiPaths` cases still pass), the per-stretch line against a hand-computed vertex at a boundary, and a Moon-orbit stretch drawn against the Moon in an Earth-centred scene.
- README `addTrajectory` row and API comment; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/scene.ts` (TrajectoryBase, `#buildTracked`, the `lineFixedTo` check near `toDefinition`), `packages/astraeus/src/api/pathProvenance.ts`, `packages/astraeus/src/app/mission.ts`, `packages/astraeus/src/app/TrackedBodyView.ts`, `packages/astraeus/src/app/pathRules.ts`, `packages/astraeus/src/shell/ObjectControls.tsx`, `packages/astraeus/tests/publicApiSunPaths.test.ts`, `packages/astraeus/tests/publicApiPaths.test.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04, CODE-01, CODE-02; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Widen the `lineFixedTo` type and validate the list (reuse the `provenanceSpans` planning pattern rather than copying it).
3. Carry resolved stretches on the tracked body; make `TrackedBodyView` resolve the frame per stretch when mapping the line and anchors.
4. Confirm the menu, card, readouts and follow need no change once the probe is one path; fix any that assume one frame.
5. Tests, README, CHANGELOG.

## Boundaries

No `"auto"` (next step), no camera hand-over between separate paths, no change to State or `stateOf` (ARCH-02), no Apollo 11 demo change.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built per plan. `lineFixedTo` is `BodyId | { start, end, body }[]`; the list is planned by `planLineStretches`, which shares one `planSpans` helper with `planPathProvenance` (`api/pathProvenance.ts`). `TrackedBody.lineFixedTo` carries the planned stretches (`app/mission.ts`: `LineStretch`, `lineAgainstAt`, `lineBodies`); `TrackedBodyView.#relative` places each run of samples from its own body and carries it to the scene centre at the clock time; `#remap` re-maps per clock time when any stretch is fixed to a body other than the centre. Menu, card, readouts and follow needed no change (availability is the path's bounds; the marker is the state, not the line). No browser run.

- `npx vitest run publicApiLineStretches publicApiSunPaths publicApiPaths`: 49 passed (new file: 6 tests: one menu entry across the span, index faults, boundary vertex against Mars versus hand-computed, single id equals one stretch, Moon stretch in Earth-centred scene, marker continuity at both boundaries).
- Follow test (`camera follow keeps the followed target at the marker, in view and available at, just before and just after each boundary`, `publicApiLineStretches.test.ts`): drives the real follow code without a browser (`stepCameraTarget` with a follow request, `focusAbsoluteOf`/`canFocus`/`labelPositionOf`, `resolveCamera`, `poseCamera`, `TrackedBodyView.update`) at one hour before, at and one hour after day 60 and day 140 of the Sun/Mars/Sun flyby; asserts focus stays "probe", target available, camera look-at target equals the marker position, and the marker is visible and inside the camera frustum. Passes (7 in file).
- `npm run lint`: pass. `npm run typecheck`: pass. `npm run build`: pass (chunk-size warning only). `npm test`: 163 files passed, 2036 passed, 1 skipped.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- `lineFixedTo` is now `BodyId | readonly {start, end, body}[]` on `addTrajectory`; `TrackedBody.lineFixedTo` holds `string | LineStretch[]` (ms). Pathrule unchanged (relative trail), applied per run of samples; a shared boundary sample belongs to the later stretch, uncovered time to the scene centre.
- `api/pathProvenance.ts` now holds the shared span planner (`planSpans`) behind `planPathProvenance` and `planLineStretches`. No change to State or `stateOf`.
