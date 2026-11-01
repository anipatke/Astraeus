---
id: T-226
title: Tell the app when playback enters and leaves a flyby
objective: O-052
status: done
depends_on: [{task: T-225, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-226, reason: 'Owner said "orchestrate 052" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o052-run-20261101}, recorded_at: '2026-11-01T04:14:22Z'}
planned_by: {role: planner, session: voyagers-feedback-20261101}
---

# Tell the app when playback enters and leaves a flyby

## Outcome

The host hears when playback enters and leaves the zone of a pacing event rule for an event the showing view has, so it can compose its own behaviour (such as moving the camera to the probe and back with `setCamera` and `camera`); the engine builds in no camera behaviour (O-052 "Event zone signal"; replanned 2026-11-01, owner chose "General signal" over a built-in follow rule for modularity).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `MountedScene.onEventZone(listener)` returns a stop function; `listener({ event, type, object?, entered, time, cause })` where `event` is the event id, `type` and `object` come from the event, `entered` is true on entry and false on leaving, and `cause` is `playback`, `visitor` or `host`. Nothing arrives after `unmount`.
- `MountedScene.eventZones` reads the ids of the zones active now (empty list in a scene without pacing event rules; undefined before `ready` and after `unmount`).
- Zones are the same per-view zones pacing uses (T-224): only `near` rules, only events the showing view has. Playback crossing a boundary reports with cause `playback`; seeking in or out reports with the seeker's cause; a view switch that hides an active zone reports leave, and one that shows a zone the time is inside reports enter, with the switch's cause. Overlapping zones report independently. A zone already active when the viewer opens reports enter once after `ready`.
- `AstraeusScene` prop `onEventZone` with the same payload.
- No new `EventInput` field and no `camera` option on pacing rules.
- Tests with a made-up two-probe scene: enter and leave by playback, seek in and out, view switch hiding and showing an active zone, overlap, opening inside a zone, no zones, after unmount, React prop; and one test of the README composition (on enter `setCamera({ follow: object })` after saving `camera`, on leave `setCamera(saved)`) through the camera request path.
- README: `onEventZone` / `eventZones` rows and the "camera to the encounter" composition example under Paced playback; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/core/pacing.ts`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/sceneFrame.ts`, `packages/astraeus/tests/pacing.test.ts`, `packages/astraeus/tests/viewerHostDom.test.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-06, CODE-02, TEST-01, TEST-03, TEST-04, CODE-01; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. A pure function from (zones, view, time) to the active zone ids, reusing T-224's tagged zones; test it alone.
3. The viewer compares active ids on each clock publish, seek and view switch and publishes enter/leave through `ViewerLink` like `onChange`.
4. `mount` and `AstraeusScene` expose it; tests, README, CHANGELOG.

## Boundaries

No built-in camera behaviour; no zones for span rules or for events without a `near` rule; no State change (ARCH-02).

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Files read (Context Files only; no extra reads): `core/pacing.ts`, `api/story.ts` (pacingFor), `api/mount.ts`, `api/viewerLink.ts`, `app/viewerPort.ts`, `api/AstraeusScene.tsx`, `app/App.tsx`, `tests/pacing.test.ts`, `tests/pacingViewsDom.test.ts`, `tests/hostCameraDom.test.ts`, `tests/viewerHostDom.test.ts`, `README.md`, `tests/domSetup.ts`.

Files changed (packages/astraeus): `src/core/pacing.ts` (`activeEventZones`), `src/app/viewerPort.ts` (`ViewerState.zones`, `ViewerControl.events`), `src/app/App.tsx` (stateNow carries `zones`, attach passes `events`), `src/api/viewerLink.ts` (`EventZoneChange`, `onEventZone`, `eventZones`, zone diff in `publish`), `src/api/mount.ts`, `src/api/AstraeusScene.tsx`, `src/api/index.ts` (export `EventZoneChange`), `tests/pacing.test.ts`, new `tests/eventZonesDom.test.ts`, `tests/viewerHostDom.test.ts` and `tests/viewerHostReady.test.ts` (made-up control gains `events: []`), `README.md`, `CHANGELOG.md`.

Approach: `activeEventZones(zones, shown, time)` reuses `zonesInView` (T-224) and takes only zones with an `eventId`. The viewer puts the active ids in `ViewerState.zones` on every state read; `ViewerLink.publish` diffs them against the last reported set after the ordinary change report and sends leave then enter reports with the publish's cause. Playback ticks, visitor seeks/view choice and host `setTime`/`setView` all already go through `publish`, so each cause and trigger shares one path. Opening inside a zone: `attach` resets the known set to empty, so the first tick after `ready` (within 100 ms, cause `playback`) reports enter, which a listener added right after `await ready` hears; a viewer rebuild starts over the same way. An event with two rules is one event id (listed once, in zone order). No new `EventInput` field, no pacing option, no camera behaviour, no State change.

Gates (from `.savepoint/config.yml`): `npm run lint` clean; `npm run typecheck` clean; `npm run build` OK; `npm test` 179 files, 2201 passed, 1 skipped. No browser run.

### Done When to test

| Done When claim | Proving test(s) |
|-----------------|-----------------|
| `onEventZone(listener)` returns a stop function | `eventZonesDom` "nothing arrives after unmount, and a stopped listener hears nothing more" |
| payload `event`, `type`, `object` from the event | `eventZonesDom` "reports enter then leave as the clock runs..." (type and object), "AstraeusScene onEventZone gets the same payload" |
| `entered` true on entry, false on leaving; `time` | `eventZonesDom` playback test (enter then leave, times inside the zone) and host seek test |
| cause `playback` | `eventZonesDom` "reports enter then leave as the clock runs across a zone" |
| cause `visitor` | `eventZonesDom` "a visitor's timeline seek in and out" and the visitor view-button part of "a switch that hides an active zone" |
| cause `host` | `eventZonesDom` "the host's setTime in and out", host `setView` part of the view-switch test |
| Nothing arrives after `unmount` | `eventZonesDom` "nothing arrives after unmount..." |
| `eventZones` reads active ids now | `eventZonesDom` "eventZones reads the active ids now..." |
| `eventZones` empty list without pacing event rules | same test (`plain()` scene gives `[]`) |
| `eventZones` undefined before `ready` and after `unmount` | same test |
| Zones are pacing's per-view zones: only `near` rules, never a span | `pacing.test` "counts only the showing view's events, and never a span" |
| Only events the showing view has | `pacing.test` same; `eventZonesDom` "a zone of the other view is not reported..." |
| Playback crossing a boundary reports with cause playback | playback test above |
| Seeking in or out reports with the seeker's cause | host and visitor seek tests above |
| View switch hiding an active zone reports leave, with the switch's cause | "a switch that hides an active zone reports leave..." (host and visitor) |
| View switch showing a zone the time is inside reports enter, with the switch's cause | same test |
| Overlapping zones report independently | `eventZonesDom` "overlapping zones report separately"; `pacing.test` "lists overlapping zones each once" |
| A zone already active when the viewer opens reports enter once after `ready` | `eventZonesDom` "a zone already active when the viewer opens reports enter once, to a listener added right after ready" |
| `AstraeusScene` prop `onEventZone` with the same payload | `eventZonesDom` "the React prop" |
| No new `EventInput` field | no change to `story.ts`/`EventInput` (diff); not separately tested (absence) |
| No `camera` option on pacing rules | no change to pacing types or `pacingFor` (diff); not separately tested (absence) |
| Test: no zones | `eventZonesDom` "a scene without pacing reports nothing" |
| Test: after unmount | `eventZonesDom` unmount test |
| Test: README composition through the camera request path | `eventZonesDom` "the README composition" (enter gives follow request, leave gives pose request) |
| README rows and composition example; CHANGELOG line | README Paced playback "Event zones" paragraph and example, API rows; CHANGELOG Unreleased. Documentation: read, not tested |

### Limitations

Playback enter/leave is tested with a one-hour zone at an hour a second; a tick can land well inside a zone, so the reported `time` is inside the zone, not exactly at its edge. Opening-inside reports with cause `playback` on the first 100 ms tick, not synchronously at `ready`. Not run in a browser or in the packed package (T-227).

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- `ViewerState` gains optional `zones` and `ViewerControl` gains `events` (host link only, not public API); `ViewerLink` reports zone changes. Deferred to T-227 integration: reflect in Design.md `Interfaces and Data Flow` (host link carries active event zones; no engine camera behaviour).
