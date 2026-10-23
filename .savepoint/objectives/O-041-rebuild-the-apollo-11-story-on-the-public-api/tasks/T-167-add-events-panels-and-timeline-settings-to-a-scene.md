---
id: T-167
title: Add events, panels and timeline settings to a scene
objective: O-041
status: done
depends_on: [{task: T-166, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o041-planning-20261024}
check_waiver:
  task: T-167
  reason: 'Owner said "go ahead" on the O-041 plan; under the standing rule of no per-step checks and one Full Objective Check at the end, the optional Task Check is waived.'
  actor: {role: owner, session: o041-run-20261024}
  recorded_at: '2026-10-23T21:11:52Z'
---

# Add events, panels and timeline settings to a scene

## Outcome

A developer can add timed events with their provenance and story panels to a scene, set the timeline's span, speeds and starting rate or switch the timeline off (time frozen at a moment, or running on its own), offer true scale only, and open on a camera view that does not follow; the camera menu lists Overview plus Focus and Follow for every body and path.

## User Check

None required; the owner's look comes with the Apollo rebuild.

## Done When

- `scene.addEvents(events, { provenance? })`, `scene.addStoryPanels(raw)` (checked at `toDefinition` against the scene's events, anchors and object ids; a mistake throws `SceneError` `bad-panels` naming the panel and field), `scene.setTimeline({ start, end, rates?, rate? })`, `setScale(scale, { only: true })`, `scene.camera.lookAt(id, view)`, and a small public read `scene.stateOf(id, time)` (for figures a story quotes, e.g. a peak speed).
- **No timeline** (O-041 Decision 6): the timeline call can say there is none; the shell then draws no timeline bar on desktop or phone (no drawer, no `--timeline-space` gap), and the time is either frozen at a chosen moment or runs on its own at a chosen rate. Existing experiences, which all have timelines, are unchanged.
- Camera menu automatic (Decision 3): Overview plus Focus/Follow for every body and path; the change in hello-scene's preset count is recorded.
- Made-up story tests (ARCH-03): panels resolving by utc, event and anchor; `bad-panels`; window and rates from `setTimeline`; true-scale-only; opening view not following; presets per body and path; no-timeline frozen and running (shell renders no bar; clock behaviour), each error code.
- Doc comments and a "Story" section on `/api`; existing api, hello-scene and shell tests still pass.
- Hand-off gates green, plus `npm run check:engine-alone`.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/shell/storyPanels.ts`, `packages/astraeus/src/shell/experience.ts`, `packages/astraeus/src/shell/AstraeusShell.tsx`, `packages/astraeus/src/shell/TimelineBar.tsx`, `packages/astraeus/src/shell/useDrawers.ts`, `packages/astraeus/src/core/events.ts`, `packages/astraeus/src/core/clock.ts`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/tests/publicApi.test.ts`, `packages/astraeus-site/tools/site/api-reference.mjs`.

## Design References

Design Interfaces and Data Flow (experience definition, shell), Current Technical State O-040.

## Guardrails

ARCH-02, ARCH-03, PROV-01, STYLE-06, STYLE-07, TEST-01, TEST-03.

## Implementation Plan

1. Events, panels, timeline span/rates, true-scale-only, `lookAt`, automatic presets, `stateOf` on Scene over the existing definition fields.
2. A definition-level "no timeline" setting the shell honours (no bar, no phone drawer), with frozen and running clock modes; keep the default exactly as today.
3. Tests on a made-up story; doc comments and reference section.

## Boundaries

No event or pick listeners (Decision 1); no chapters or narration; no change to existing demos' timelines.

## Technical Verification

Focused tests while iterating; hand-off gates plus `check:engine-alone`. No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session o041-run-20261024 (builder). Stage reached: audit (ready for a Check; not passed). Router not edited and status not set to done, per the run rules.

Files read: the Task, Objective, `savepoint-task` skill, and the Context Files (scene.ts, index.ts, errors.ts, storyPanels.ts, experience.ts, AstraeusShell.tsx, useDrawers.ts, events.ts, clock.ts, experienceDefinition.ts, App.tsx (lines 85-125, 485-533 and greps), publicApi.test.ts, api-reference.mjs). Partial reads of TimelineBar.tsx (grep only).

Extra reads (logged, with reason):
- `packages/astraeus/tests/domSetup.ts` (mountShell helper, to write the no-timeline shell tests).
- `packages/astraeus/src/shell/TimelineBar.css`, `phone.css`, `style.css`, `embedded.css` (grep only: where `--timeline-space` and `--shell-timeline-space` are set, to remove the gap).
- `packages/astraeus/src/shell/objectModel.ts`, `TopBar.tsx` (grep: how presets are looked up by target).
- `packages/astraeus/src/app/mission.ts` (grep: `anchorLabels`), `core/provenance.ts` (grep: source types).
- `packages/astraeus-site/tools/validate/check-hello-scene.mjs` (it names preset id `follow-target`, which the automatic menu renames).

Files changed:
- New: `packages/astraeus/src/api/story.ts` (EventInput, AddEventsOptions, TimelineInput, StoryPanelsInput types; eventsOf, timelineOf, panelsOf), `packages/astraeus/src/api/time.ts` (toUtcMs and TimeInput moved out of scene.ts, re-exported there), `packages/astraeus/src/app/openClock.ts`, `packages/astraeus/tests/publicApiStory.test.ts`.
- Edited: `packages/astraeus/src/api/scene.ts`, `index.ts`, `errors.ts` (codes bad-event, bad-panels, bad-timeline); `packages/astraeus/src/app/App.tsx` (uses openClock), `experienceDefinition.ts` (`clock.playing?`); `packages/astraeus/src/shell/experience.ts` (`hideTimeline?`), `AstraeusShell.tsx` (ShellTimeline wrapper, `data-timeline-hidden`), `TimelineBar.css` (no reserved space when hidden); `packages/astraeus/tests/publicApi.test.ts` (preset expectations); `packages/astraeus-site/tools/site/api-reference.mjs` (Story section); `packages/astraeus-site/tools/validate/check-hello-scene.mjs` (preset id `follow-target` -> `follow-probe`; not run).

Per-criterion outcomes:
1. New calls: `addEvents(events, {provenance?})`, `addStoryPanels(raw)` (parsed at `toDefinition` against events, anchors, object ids and the window; mistakes throw SceneError `bad-panels` with the panel and field in the message), `setTimeline({start,end,rates?,rate?})`, `setScale(scale,{only:true})`, `camera.lookAt(id, view)`, `stateOf(id,time)` -- met; tests in `publicApiStory.test.ts` (all pass).
2. No timeline: `setTimeline({none:true, at?, rate?})` -- frozen (`clock.playing:false`, at `at` or the setTime moment) or running (`rate`); the shell draws no TimelineBar, no phone timeline drawer (`.drawer-handle-top` absent) and sets `--timeline-space` and `--shell-timeline-space` to 0 via `[data-timeline-hidden="true"]` CSS -- met; proved on wide and phone shells and on `openClock`. A scene with a timeline is asserted unchanged (bar drawn, clock plays, `hideTimeline` absent). CSS result not seen in a browser (limitation below).
3. Camera menu automatic: Overview plus `focus-<id>` / `follow-<id>` for every body and path, labels "Focus <label>" / "Follow <label>". hello-scene (Earth, Moon, probe) goes from 3 presets (Overview, Focus, Follow of the probe) to 7 (Overview plus Focus/Follow for Earth, Moon, probe): +4 menu items. Opening preset is now `follow-<id>` (was `follow-target`) or, for lookAt, `focus-<id>`.
4. Made-up story tests (ARCH-03): panels by utc/event/anchor; bad-panels (7 cases); window and rates from setTimeline; true-scale-only; lookAt does not follow; presets per body and path; no-timeline frozen and running; every new error code (bad-event, bad-panels, bad-timeline, plus bad-time/unknown-body for stateOf and lookAt) -- met (33 new tests).
5. Doc comments on every new export and a "Story" section on `/api` (SECTIONS in api-reference.mjs); the existing undocumented-exports test passes. Existing api, hello-scene (unit side), shell tests pass -- met. The rendered page was not opened.
6. Gates (all green): `npm run lint` (clean; CODE-01 kept by extracting cameraPresetsOf, spanOf, clockOf, scaleChoicesOf in scene.ts and a ShellTimeline wrapper in the shell), `npm run typecheck` (clean), `npm run build` (built), `npm test` (122 files, 1633 passed, 1 skipped), `npm run check:engine-alone` (pass, 13.8 s).

Limitations / not verified: no browser run and no screenshots (run rules), so the hidden-timeline CSS and the `check-hello-scene.mjs` rename were not exercised in a browser; hello-scene `main.js` not changed (its story is a later Task); `npm run check:pack` not run (not in this Task's gates). The info card selection when `lookAt` is used is the target (the focus preset is in force). `stateOf` covers trajectories only, not catalogued bodies.

## Drift Notes

Record the no-timeline shell change and new Scene calls for Design reconciliation in the Apollo rebuild Task.

Drift recorded for that reconciliation: (1) `ExperienceConfig.hideTimeline` and `ExperienceDefinition.clock.playing` are new definition fields, with `app/openClock.ts` building the clock; (2) the public Scene's camera preset ids are now `focus-<id>` / `follow-<id>` per body and path (was `focus-target` / `follow-target`); (3) `api/time.ts` and `api/story.ts` are new public-API helper files; (4) new SceneErrorCodes `bad-event`, `bad-panels`, `bad-timeline`.
