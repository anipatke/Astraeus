---
id: T-311
title: Make the menu, selection and camera follow an object's shown time
objective: O-071
status: planned
depends_on: [{task: T-310, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o071-20261112}
check_waiver: {task: T-311, reason: 'Owner said "go" to orchestrate O-071 under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o071-run-20261112}, recorded_at: '2026-11-12T10:41:40Z'}
---

# Make the menu, selection and camera follow an object's shown time

## Outcome

An object outside its `shownDuring` span leaves the object menu, cannot be selected or aimed at by the host, and, if selected when the clock leaves its span, is dropped with the cause of the move while the camera stays put; the hello-scene example shows it.

## User Check

None for the owner at this step.

## Done When

- Object menu (both the bar and the phone drawer) lists only objects shown at the clock time (and by the view), updating as the clock moves; an out-of-span object is absent, not marked "Unavailable".
- `setSelected(id)` and `setCamera` (and a camera request a story panel makes) refuse an object outside its span exactly as a view-hidden id (`bad-selection`, `bad-camera`); `cameraTargets` omits it.
- A selected object leaving its span is lost the way a path past its samples is today (`selectionLost` in `src/shell/AstraeusShell.tsx`): `onSelect` reports it with the move's cause (`playback`, `visitor`, `host`), consistent with `onChange`. The camera does not follow an unshown point and does not jump: it keeps its current pose. If today's lost-selection path picks a fallback object, keep that behaviour and say so in Technical Evidence.
- One lifecycle test suite runs it on both embedding paths (`mount` and `AstraeusScene`, API-02): menu contents before/at/after the edge, `setSelected` and `setCamera` refusals, the drop report and its cause for playback, `setTime` by the host and a visitor time change, and the camera pose unchanged across the drop. Synthetic scenes only (ARCH-03); one table test across the causes.
- `examples/hello-scene` gives its second probe a `shownDuring` span (one line) and builds from the packed tarball (`build:example`); README `Story panels, selection and views` "Selection" paragraph says a selection is dropped when its object leaves its shown time; CHANGELOG entry extended.
- No existing test's setup changes.

## Context Files

`.savepoint/objectives/O-071-show-a-body-or-path-only-for-a-span-of-time/Objective.md`, T-310's Technical Evidence and Drift Notes, `packages/astraeus/src/shell/objectModel.ts`, `packages/astraeus/src/shell/AstraeusShell.tsx` (selection loss and the object lists), `packages/astraeus/src/shell/ObjectControls.tsx`, `packages/astraeus/src/app/App.tsx` (`cameraTargets`, `setCamera`, the selection link), `packages/astraeus/src/app/viewHiding.ts`, `packages/astraeus/tests/selectionCauseDom.test.ts`, `packages/astraeus/tests/setSelected.test.ts`, `packages/astraeus/tests/lifecycle.test.ts` (structure only, to add a suite), `examples/hello-scene/src/main.js`, `packages/astraeus/README.md` under `Story panels, selection and views`, `packages/astraeus/CHANGELOG.md` (newest section only).

## Design References

`.savepoint/Design.md` under `Views of one scene` and `Views fixes for a multi-probe app` (item 4: camera targets).

## Guardrails

ARCH-02, ARCH-03, API-01, API-02, API-03, API-05, TEST-01, TEST-03, STYLE-01, STYLE-02, STYLE-07.

## Implementation Plan

1. Confirm T-310's shown rule and hidden set exist as its evidence says; REPLAN REQUIRED if not.
2. Feed the same rule to the shell's object list and to `selectionLost`, so the menu and selection read one rule with the frame.
3. Route `setSelected`, `setCamera` and `cameraTargets` through the time-aware hidden set.
4. Keep the camera's pose on a drop (no follow of an unshown point).
5. Tests, example line, README sentence, CHANGELOG.

## Boundaries

No fade; no automatic selection of the "after" object; no change to the view rules, `availability`, or sky figures.

## Technical Verification

Focused vitest runs while iterating; hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` from the repo root, plus `npm run build:example`. No browser run (the Full Check runs `check:browser` once). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record the menu/selection change for the Design `Views of one scene` paragraph.
