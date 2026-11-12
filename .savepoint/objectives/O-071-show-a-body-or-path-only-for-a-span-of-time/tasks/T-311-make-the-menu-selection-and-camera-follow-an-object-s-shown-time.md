---
id: T-311
title: Make the menu, selection and camera follow an object's shown time
objective: O-071
status: done
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

Gates from the repo root, all passing after the last edit: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (255 files, 3792 passed, 2 skipped), `npm run build:example`. No browser run. The lifecycle I-174 test did not fail. The generated API page limit was not touched (no public doc comment changed; the API lock is unchanged).

Rule used: one rule, T-310's `shownAt`. `isObjectAvailable` (`src/shell/objectModel.ts`) now requires `shownAt` and the availability bounds, so every shell use (menu, `availableObjectById`, `firstAvailableObject`, `selectionLost`, picks, presets, related buttons) reads it. `cameraTargets` in `App.tsx` uses `hiddenWithShownSpans` over the view's hidden set at the live clock time, so `setSelected`/`setCamera` (which check against `cameraTargets()` in `src/api/`) refuse as for a view-hidden id with no change in `src/api/`.

| Done When | Evidence |
|---|---|
| Menu (bar and phone drawer) lists only objects shown at the clock time; absent, not "Unavailable" | `listedObjects(experience, selectedId, timeUtcMs?)` filters with `shownAt` (the selected object stays so the list never shows a blank); `ObjectControls.tsx` passes the shell's `snapshot.timeUtcMs`. The shell already re-renders on every clock snapshot (the app sets one every 100 ms, so the menu follows the clock at that rate with one cheap pass over the objects; no new timer or state). `tests/shownDuringMenu.test.ts`: "lists only the objects shown at the clock time, before, at and after the edge" (E-1 ms, E, E+5 days; no "Unavailable" text) on `mount` and `AstraeusScene`; "the phone drawer's object menu" at phone width. |
| `setSelected`, `setCamera` refuse as view-hidden; `cameraTargets` omits; panel camera | Same file, "refuses setSelected and setCamera ..." on both paths: `bad-selection` for `setSelected` before/after the edge, `bad-camera` for `focus`, `follow` and a `lookOut` direction. `cameraTargets` (`App.tsx`) now includes time. A story panel's camera request is skipped when it names an object outside its span (`shownAtClock` in `App.tsx`, `markOpenPanel`); this path has no test of its own (see below). |
| Selected object leaving its span is dropped like a path past its samples; `onSelect` cause; camera keeps its pose, no follow | `selectionLost` uses `isObjectAvailable` (so `shownAt`); the lost-selection path is the existing one and reports `move`, which the link maps to the move's cause. Table test "drops a selection that leaves its span with the move's cause, and keeps the camera pose" across host `setTime` (`host`), the visitor's timeline scrub (`visitor`) and playback crossing the edge (`playback`), on both paths, expecting `[["pa","visitor"],["earth", cause]]` and `handle.camera` unchanged (the 3D scene is a stand-in there, so the pose check is weak). Camera: in the shell effect, a followed or focused object whose shown time ended gets `loseCameraTarget("hold")`: the active preset is cleared and `onCameraHold` is called (keeps the pose, stops following), never the overview request an unavailable path gets. Shell test "keeps the pose (a hold, no overview request) ..." (via `mountShell`, `holds()` count and no overview request). Fallback: the existing path still picks the first available object (`firstAvailableObject`, now skipping unshown ones), here the planet; it may be the object that starts at the edge only when that object is first in the list. |
| Lifecycle suite on both paths, synthetic only, one table across causes | `tests/shownDuringMenu.test.ts` (8 tests), made-up scene (Earth and two paths, A shown until the edge, B from it). Run against the pre-change `src/`, all 8 fail. |
| Example, README, CHANGELOG | `examples/hello-scene/src/main.js`: Probe B `shownDuring: { start: start + 2 * HOUR }`; `build:example` passes. README "Selection" paragraph: drop on leaving the shown time, camera keeps its pose, `bad-selection` for an out-of-span id, menu absence. CHANGELOG Unreleased `shownDuring` entry extended. |
| Story step camera at an unshown object | `tests/shownDuringMenu.test.ts` "a story step's camera and an object outside its shown time": a step whose `camera` focuses a path shown only from the edge opens (with the viewer, then by `setPanel` before the edge) and the scene controls' `cameraRequest` is not the focus request; after `setTime` to the edge, `setPanel` of a second such step makes `{ kind: "focus", target: "pb" }`. Fails with the `shownAtClock` guard removed. Gates rerun: lint, typecheck, test pass (3793 tests). |
| No existing test's setup changes | `tests/domSetup.ts` gained an optional `holds()` count and an `onCameraHold` probe in the shared shell host; no existing test's setup or expectation changed. |


Marked done by the coordinator 2026-11-12T10:54:41Z under the owner's "go" (orchestrate O-071) standing rule ("I mark them as they pass"): gates passed (lint, typecheck, build, test 3,793 passed, build:example); diff reviewed (`tests/domSetup.ts` gained an additive `holds` probe only).

## Drift Notes

For Design `Views of one scene` (hidden set, menu and selection): `isObjectAvailable` is now `shownAt` plus `availability`, so the object menu, picks, presets, the lost-selection check and the camera-target check read one rule with the frame. `cameraTargets` is the view's hidden set plus the not-shown-at-clock set (`hiddenWithShownSpans`), read live; `setSelected`/`setCamera` refusal needs no `src/api/` change. A selection or camera object leaving its span: selection falls back as a path past its samples does (`firstAvailableObject`, cause `move`); the camera holds its pose (`onCameraHold`) instead of the overview jump a path past its samples gets. A story panel's camera is skipped when it names an unshown object. No architecture change beyond that; nothing deferred.
