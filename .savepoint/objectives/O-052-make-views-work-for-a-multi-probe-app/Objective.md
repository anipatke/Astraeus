---
id: O-052
title: Make views work for a multi-probe app
status: done
depends_on: [O-051]
release: G-015
priority: high
---

# O-052: Make views work for a multi-probe app

## Outcome

An app on the public API with a Voyager 1 / Voyager 2 / Both choice built on `setViews` gets: playback that slows only at the events the showing view has; an opt-in camera move to the probe at an encounter and back; host camera control from `mount` and `AstraeusScene`; a `ready` after which every handle call works; a mounted viewer that does not read or write the host page's address unless asked, with every address parameter documented; and a runnable two-probe views example.

## Why

G-015: the Voyagers app (0.7.0) found two blockers (pacing brakes for hidden events; nothing can move the camera to the braking probe), one bug (`ready` resolves about two frames before the host link attaches, so the README's own `await ready; setView(...)` throws `missing-data`), one documentation gap with a clash (undocumented address parameters, a host's own `?view=` read as a camera pose, copy-link rewriting the host's address and omitting the view) and asked for a views example. Each was measured against 0.7.0 before planning (G-015 Why).

## Success Conditions

Settled with the owner, 2026-11-01 (session voyagers-feedback-20261101): new Goal G-015; pacing follows views automatically; camera: both a rule setting and a host call (replanned the same day: "General signal" instead of the rule, and a whole-API review next, owner after "make sure we are building this in a modular consumable way"); address handling off by default when embedded; views example in the existing `examples/`; plan summary "Yes, go ahead". Standing rule: strategic fix first.

- **Ready means usable (must).** `mount`'s `ready` resolves only once the host link is attached, so `time`, `rate`, `view` read real values and `setTime` / `setRate` / `setView` work immediately after `await ready`. `AstraeusScene`'s `onReady` fires at the same point. Tests run the README examples as written, awaiting `ready` without `act` flushing effects, so the gap that hid this bug cannot recur (strategic fix: the test helper pattern that masked it is named in the Task evidence).
- **Address handling (must).** `App` gains an address option (like `writeTitle`): on, it reads and writes the address as today; off, it reads no address parameter, never calls `history.replaceState`, and hides the copy-link button. `mount` and `AstraeusScene` take `address?: boolean`, default `false`; the site keeps it on. With it on, the link also carries the showing `setViews` view as `show=<view id>` and opening reads it back (an unknown id falls back to the scene's `start`). The README lists every address parameter the viewer reads or writes, with meaning and format.
- **Pacing follows views (must).** In a scene with views, event rules (`near`) apply only to events the showing view has; a view with several probes' events slows at all of them. Span rules (`from`/`to`) apply in every view. A scene without views paces exactly as 0.7.0. When a switch changes the paced rate, the rate eases over about one real second instead of jumping; seeking still lands on the right rate at once. A chosen speed still wins until `"auto"`.
- **Host camera (must).** `MountedScene.setCamera(target)` and `AstraeusScene` prop `camera` (applied once drawn and on change, like `view`), through the existing camera request path. `target` is `{ follow: id }`, `{ focus: id }` (the forms of a view's `camera`) or a pose read back from `MountedScene.camera`, which returns the current camera as a plain serialisable value (what it follows or focuses and its angles and distance, as the view link's pose), so a host can save a pose and restore it. An id not in the scene, or hidden by the showing view, throws `bad-camera` naming it (React: to `onError`); before `ready` or after `unmount`, `missing-data`.
- **Event zone signal (must; replanned 2026-11-01, owner: "General signal" over a built-in follow rule, for modularity).** The host hears when playback enters and leaves the zone of a pacing event rule (`near`) for an event the showing view has: `MountedScene.onEventZone(listener)` (returns a stop function) and `AstraeusScene` prop `onEventZone`, with `{ event, type, object?, entered, time, cause }`; `MountedScene.eventZones` reads the ids active now. Playback crossing a boundary, seeking in or out, and a view switch that shows or hides an active zone all report, with cause `playback`, `visitor` or `host`. Overlapping zones report independently. No camera behaviour is built in: the README and the example show a host moving the camera to the event's object on enter and restoring the saved pose on leave, with `setCamera` and `camera`. No new `EventInput` field and no `camera` option on pacing rules.
- **Example (must).** The `examples/` projects gain a made-up two-probe scene with A / B / Both views and pacing, whose host code moves the camera to each encounter and back using `onEventZone`, `camera` and `setCamera`, run on the packed package (`check:node-consumer` or the examples' own check). No real mission data (ARCH-03, story data stays out of the engine).
- **Proof and docs.** Focused tests per step; one `npm run check:browser`; one owner look on `localhost:5490` before the Full Objective Check. README rows and API comments, CHANGELOG `Unreleased` with the behaviour changes for 0.7.0 users (pacing in views, address off when embedded) and the first-download size change; Design reconciled.

## Architectural Considerations

ARCH-02: views, pacing and the camera are presentation; State and providers are unchanged. Pacing zones keep the id of the event they came from at `toDefinition`; the runtime filters them by the showing view's event set (no runtime rebuild, CODE-02). The paced rate stays a function of time and view; only the switch ease is a short real-time transition. `setCamera` goes through `controls.cameraRequest` like view camera rules (T-220). The event zone signal is a read of the same per-view zones pacing uses, published through `ViewerLink` like `onChange`; the engine composes no camera behaviour from it (modularity: one general signal, the host composes). Host calls follow the `ViewerLink` attach/publish pattern. No body, mission or demo names in rules or defaults (ARCH-01, ARCH-06).

## Boundaries

**In scope:**
- `mount` / `AstraeusScene` readiness; the address option and its documentation; `show=` in links; per-view pacing and the switch ease; `setCamera`, `camera` and the `camera` prop; `onEventZone` / `eventZones` and the `onEventZone` prop; the views example; tests, README, CHANGELOG, API reference, Design.

**Out of scope:**
- A built-in camera follow on pacing rules and an `EventInput.follow` field (replaced by the event zone signal, owner 2026-11-01); a review of the whole public API (planned as the next Objective, owner 2026-11-01); an address prefix (the owner chose off-by-default instead); pacing set per view in `setViews`; a new demo or views in the existing demos; changes to the Voyagers app; publishing a release.
