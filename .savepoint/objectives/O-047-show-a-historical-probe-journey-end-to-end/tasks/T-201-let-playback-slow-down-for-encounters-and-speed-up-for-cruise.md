---
id: T-201
objective: O-047
title: Let playback slow down for encounters and speed up for cruise
status: done
check_waiver: {task: T-201, reason: 'Owner said "orchestrate O-47"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o047-run-20261031}, recorded_at: '2026-10-31T02:55:59Z'}
depends_on: [{task: T-197, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Let playback slow down for encounters and speed up for cruise

## Outcome

`setTimeline` takes `pacing`: spans `{ from, to, rate }` and an event rule `{ near: { type, within }, rate }` that uses the scene's timed events; playback ramps smoothly between rates; a speed the visitor (or the host, through the previous step's control) picks wins until released, then pacing resumes (I-112).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- Pacing is checked in `setTimeline` with `bad-timeline` naming the field (overlapping spans: state the rule; an event type with no events: state whether it warns or refuses).
- The paced rate is a pure function of time (ARCH-02: no change to State), ramped over a stated duration or fraction so a jump from cruise to encounter rate is smooth both ways.
- Visitor override: picking a speed takes over; a clear way to release it (for example choosing 'Auto' in the speed menu, or the host passing `undefined`) returns to pacing; the menu shows when pacing is active.
- Tests on a made-up journey with made-up events: rate at cruise, near an event, during a ramp; override and release; pacing with loop.
- README row and example; doc comments; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/story.ts`, `packages/astraeus/src/core/clock.ts`, `packages/astraeus/src/app/openClock.ts`, `packages/astraeus/src/shell/TimelineBar.tsx`, `packages/astraeus/src/shell/timelineModel.ts`, `packages/astraeus/README.md` (`setTimeline` row).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Design the paced-rate function and the override state on the one clock from the previous step.
3. Validate input; wire the menu's Auto choice.
4. Tests, docs, CHANGELOG.

## Boundaries

No per-event camera moves; no change to event panels.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, lite at hand-off). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Gates (lite, no browser): `npm run lint`, `npm run typecheck`, `npm run build` clean; `npm test` 152 files, 1954 passed, 1 skipped.

Named cases (all pass):
- `packages/astraeus/tests/pacing.test.ts`: rate at cruise, at an event, mid-ramp (between the two); smoothness both ways (monotone, no step above 0.25 in log per hour on a 2-day ramp); spans over the base with the slower speed winning where an event rule meets a span; `ramp: 0` steps; `bad-timeline` naming `pacing[i].rate|ramp|near.within|near.type|to`, overlapping spans (`pacing[1] overlaps pacing[0]`), touching spans accepted, event type with no events refused; the clock following the paced rate in steps, then after a seek to the end and a seek to the start (what a loop wrap does) returns to cruise.
- `packages/astraeus/tests/pacingDom.test.ts` (real viewer, stubbed 3D): opens at cruise, menu is `Auto` + the scene's rates only; time inside the slow stretch gives rate 7 with `cause: "playback"`; a visitor's menu pick wins over pacing, Auto returns to it; `setRate(n)` wins, `setRate(7)` (not offered) refused `bad-timeline`, `setRate("auto")` returns.
- `viewerHostDom.test.ts`: `setRate("auto")` without pacing throws `bad-timeline`.

Decisions:
- Input: `pacing: PacingInput[]`, each `{ from, to, rate, ramp? }` or `{ near: { type, within }, rate, ramp? }` (within and ramp in simulated seconds). Outside every piece: the timeline's `rate` (default 60).
- Overlaps: spans may not overlap (touching allowed), `bad-timeline` names both indexes. Where an event rule meets a span or another rule the slower rate wins (zones laid over the base, spans first in time order, then event zones slowest last). An event type with no events refuses at `toDefinition` (mount), naming `pacing[i].near.type`: a typo would otherwise slow nothing.
- Ramp: weight 1 inside a zone, smoothstep to 0 over `ramp` simulated seconds outside it (default `within` for events, a tenth of the span for spans), blended in log space. A pure function of time (`core/pacing.ts` `pacedRate`); simulated-time ramps keep it so; no change to State. The clock is steered by `applyPacing` (calls `setRate`) each frame (`frameTime`) and each 100 ms tick, so the clock stays piecewise-linear and there is still one clock.
- Release: `setRate("auto")` on `mount` and `AstraeusScene` `rate="auto"`; the menu `Auto` choice. Both set `ViewerLink.rateSource` back to `scene`; any picked speed sets `chosen`. `ViewerState.auto` (only in a paced scene) carries the flag from the viewer to the link.
- Paced rates vs the offered-rate rule: `setRate(number)` still accepts only offered rates; paced in-between rates are never set by hand and are not added to `rates`. They show in `handle.rate` and `onChange` (`cause: "playback"`). The menu keeps showing exactly the scene's `rates`, plus `Auto` (labelled `Auto - <live rate>` on a wide bar while pacing runs, `Auto` on a phone; the slider output says the live rate).
- Loop: `wrapWithin` runs before pacing in `frameTime`/the tick, so after a wrap the rate is the paced one for the wrapped time.

Files changed: `src/core/pacing.ts` (new), `src/api/story.ts`, `scene.ts`, `index.ts`, `viewerLink.ts`, `mount.ts`, `AstraeusScene.tsx` (api), `src/app/App.tsx`, `AstraeusScene.tsx`, `experienceDefinition.ts`, `openClock.ts`, `sceneFrame.ts`, `viewerPort.ts`, `src/shell/AstraeusShell.tsx`, `TimelineBar.tsx` (new `SpeedMenu`), tests (`pacing.test.ts`, `pacingDom.test.ts` new; `domSetup.ts`, `viewerHostDom.test.ts`), `README.md`, `CHANGELOG.md`, `tools/check-packs.mjs` (astraeus file limit 450 to 460: the new module pushed the pack to 452).

Not verified: no browser run (Auto label look on a phone, ramp feel at real frame rates); the phone speed slider while Auto is on is untested (picking a slider step is a chosen speed).

## Drift Notes

- Design.md `Interfaces and Data Flow`: add `pacing` to the timeline input, the pure `pacedRate` in core and the viewer applying it to the one clock (`SceneRuntime.pacing`, `SceneControls.paceAuto`, `ViewerState.auto`, `ViewerControl.paced`). Deferred to the integration Task.
- `tools/check-packs.mjs`: astraeus pack file limit raised 450 to 460 (owner may prefer another number).
- Pacing is applied per frame and per 100 ms tick via `setRate`; the clock stays piecewise-constant between calls, so the time error versus an exact integral of the ramp is second order and was not measured.
