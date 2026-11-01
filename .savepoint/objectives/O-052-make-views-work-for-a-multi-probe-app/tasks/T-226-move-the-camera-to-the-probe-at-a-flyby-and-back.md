---
id: T-226
title: Tell the app when playback enters and leaves a flyby
objective: O-052
status: planned
depends_on: [{task: T-225, requires: clear}]
owner_validation: {required: false}
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

Pending execution: named cases, results, files read/changed, gates, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
