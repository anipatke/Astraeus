---
id: T-207
objective: O-048
title: Let Go to frame an event's object
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-207, reason: 'Owner said "orchestrate O48"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o048-run-20261031}, recorded_at: '2026-10-31T08:47:03Z'}
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

- Gates (fresh, after last change): `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 158 files, 2003 passed, 1 skipped.
- Case `carries an event's object, refuses one the scene lacks ... and Go to frames it (I-120)` in `packages/astraeus/tests/publicApiStory.test.ts`: object kept on the definition's event, absent when not given; ghost object throws `bad-event` naming event "flyby" and id "ghost"; empty object `bad-event`; pressing the Plain event row issues no camera request; pressing the Flyby row issues `{kind:"focus", target:"moon"}`, selects `moon`, clock at the event time.
- Changed: `src/core/events.ts` (optional `object`), `src/api/story.ts` (field, per-event shape check, `checkEventObjects`), `src/api/scene.ts` (check at `toDefinition`), `src/shell/AstraeusShell.tsx` (`seekToEvent` activates `focusPresetFor` of the event's object; `activatePreset` takes the availability time, the event's), README row, CHANGELOG Unreleased line, test.
- Framing is the picker/`lookAt` Focus preset (`focus-<id>`), named by the event only (ARCH-06); no State change (ARCH-02). Previous/Next use the same `seekToEvent`.
- Not run: browser (waived to last step). First download not re-measured (no new imports; stated in CHANGELOG). Go to for an object unavailable at the event time only seeks.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- `TimelineEvent` (core) gains optional `object`; `EventInput.object` is validated at `toDefinition` (`bad-event`); the shell frames it on Go to via the existing focus preset. Reconcile into Design.md `Interfaces and Data Flow` at the integration step.
