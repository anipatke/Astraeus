---
id: T-197
objective: O-047
title: Let the host page read and set the viewer's time and speed
status: done
check_waiver: {task: T-197, reason: 'Owner said "orchestrate O-47"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o047-run-20261031}, recorded_at: '2026-10-31T02:49:28Z'}
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Let the host page read and set the viewer's time and speed

## Outcome

From the mount handle and from `AstraeusScene`, a host can read the current time and playback rate, set either (the viewer moves there), and receive a callback when playback or the visitor changes them (I-099); and the speed menu shows exactly the speeds a scene gives, or the README states which are added (I-106).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- Mount handle gains time and rate read/set and a change callback; `AstraeusScene` gains matching props; names and shapes stated in the README with an example.
- Setting a time outside the timeline fails with `bad-time`; setting a rate outside the offered list is either accepted as a custom rate or refused with a named error (state the choice).
- I-106: decide with evidence from the code whether the defaults stay; recommended: show only the given rates when `rates` is set. Test either way.
- Tests on a made-up scene: read, set, callback on playback and on a visitor seek; unmount stops callbacks.

## Context Files

`packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/core/clock.ts`, `packages/astraeus/src/app/openClock.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/shell/TimelineBar.tsx`, `packages/astraeus/src/shell/timelineModel.ts`, `packages/astraeus/README.md` (mount and `setTimeline` rows).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Read how the clock is owned between App and the shell; return REPLAN REQUIRED if the host control needs a second clock.
3. Expose read/set/subscribe on one clock through the mount handle and `AstraeusScene`.
4. Settle I-106.
5. Tests, README example, doc comments, CHANGELOG `Unreleased` line.

## Boundaries

No pacing yet (next step). No change to the timeline's look.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, lite at hand-off). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Gates (lite, no browser): `npm run lint`, `npm run typecheck`, `npm run build` clean; `npm test` 150 files, 1946 tests pass after the Apollo comparison fix (first run had one failure there, fixed, the apollo11 package rerun green).

Cases (`packages/astraeus/tests/viewerHostDom.test.ts`, happy-dom, real viewer on the made-up synthetic definition with the 3D scene stubbed, fake clock): handle reads nothing and `setTime` throws `missing-data` before ready; reads rate, `setTime(Date)` moves `time`, `setRate`, undefined after unmount; `bad-time` (after end, before start, junk text), `bad-timeline` (rate not offered), state unchanged on refusal; `onChange` hears `host` (setTime), `visitor` (speed select, play button, seek slider), `playback` (timer tick); no callbacks after unmount; `AstraeusScene` `time`/`rate` props apply once drawn, a fresh equal `Date` does not seek again, bad time reaches `onError`; speed menu options equal the scene's rates only; `speedsOf` dedups/sorts; `ViewerLink.rateSource` is `scene` until a visitor or host chooses, `chosen` after, `scene` again on re-attach.

Choices: one clock only (App's `runtime.clock`); host seeks/rates go through the same `seekTo`/`changeRate` handlers the timeline uses (no second clock; no REPLAN). Rate outside the offered list is REFUSED with `bad-timeline` (the picker always shows what runs). I-106 settled: the menu shows exactly the scene's `rates` (`speedsOf` replaces `mergeSpeeds`/`DEFAULT_PLAYBACK_SPEEDS`); a scene without rates keeps 1 min/1 h/1 day (scene.ts default). Apollo 11 demo now lists its full set (it relied on the additions) and its tests/comparison were updated.

Files changed: src/app/viewerPort.ts (new), src/api/viewerLink.ts (new), src/api/mount.ts, src/api/AstraeusScene.tsx, src/api/index.ts, src/app/App.tsx, src/app/mission.ts, src/shell/TimelineBar.tsx, src/shell/timelineModel.ts, tests/viewerHostDom.test.ts (new), README.md, CHANGELOG.md; demo-apollo11 apollo11Scene.ts, tests/timeline.test.ts, tests/missionScene.test.ts, tests/rebuildComparison.test.ts.

Limitations: no browser run; playback `onChange` fires on a 100 ms tick (the viewer's existing snapshot interval); the host cannot pause/play (not asked); `rateSource` is recorded but nothing reads it yet (for T-201).

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- New host-link seam: `app/viewerPort.ts` (interface the App is given as `host`) implemented by `api/viewerLink.ts` (`ViewerLink`, with validation and `SceneError`s). App attaches `{window, rates, read, seek, setRate}` on its one clock and publishes snapshots (`playback` on the 100 ms tick, `visitor` from the timeline handlers). `ViewerLink.rateSource` (`scene` | `chosen`) is the hook T-201's pacing override/release should use. Design.md Interfaces and Data Flow: reflect at the integration step.
- Public API: `MountedScene` gains `time`, `rate`, `setTime`, `setRate`, `onChange`; `MountOptions.onChange`; `AstraeusScene` props `time`, `rate`, `onChange`; exported types `ViewerChange`, `RateSource`.
- Behaviour change (I-106): the timeline offers exactly the experience `rates`. Other demos (showers, planets) that listed rates relying on the merged defaults now show only their own lists; not changed here.
