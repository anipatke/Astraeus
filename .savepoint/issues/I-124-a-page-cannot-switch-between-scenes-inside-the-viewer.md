---
id: I-124
title: 'A page cannot switch between scenes inside the viewer'
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: probe-switch-20261101}
  at: '2026-11-01T00:00:00Z'
severity: high
resolution:
  disposition: escalated
  actor: {role: planner, session: o051-plan-20261101}
  at: '2026-10-31T22:48:14Z'
  reason: 'Repair promoted into O-051 (Switch between views inside the viewer), owner-confirmed design.'
escalated_to: O-051
history:
  - at: '2026-11-01T00:00:00Z'
    actor: {role: planner, session: probe-switch-20261101}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.6.0, public API only), pasted by the owner. Owner chose to wait for a built-in switch; the app''s Voyager 1 / Voyager 2 / Both switch (its T-010) is paused before it started.'
  - at: '2026-10-31T22:48:14Z'
    actor: {role: planner, session: o051-plan-20261101}
    kind: escalated
    note: 'Escalated to O-051 (Switch between views inside the viewer) under G-014; owner chose views on one scene, views own paths, bodies, events and panels, camera rule per view (default stay).'
---

# I-124: A page cannot switch between scenes inside the viewer

## Summary

The public API gives a page no way to switch between variants of a scene inside the viewer. `setSwitches` covers only the three built-in switches (`orbitLines`, `labels`, `milkyWay`), nothing shows or hides a path or body at runtime, and `mount` holds one scene. An app that wants a choice such as Voyager 1 / Voyager 2 / Both must unmount the viewer and mount a new scene, restoring time and speed itself; camera framing and any open card are lost on each switch. Without that, every path sits in one object menu (in the Voyager 2 view the menu lists nine "Voyager 2 · …" pieces beside the planets and moons).

The meteor showers app already carries this unmount-and-remount code for its shower picker (anipatke/meteorshowers, `src/site/page.ts`), so a second app would duplicate it.

## Evidence

- Reported against 0.6.0; the owner rates it as blocking the probe app's switch.
- Confirmed in code: `SwitchesInput` in `packages/astraeus/src/api/switches.ts:9` is keyed only by `DisplaySwitchId`; `MountedScene` in `packages/astraeus/src/api/mount.ts:20` offers `unmount`, `time`, `rate`, `setTime`, `setRate` and change listening, with no scene replacement; no `showPath`, `showBody` or `setScene` exists in `packages/*/src`.

Suggested engine change (reporter's options, not a decision): (a) host-defined views on a scene, e.g. `scene.setViews([{ id, label, paths, events, bodies }], { place: "top-bar", start })`, each view keeping clock, speed and camera; (b) a host switch in the bar, e.g. `setSwitches({ custom: [{ id, label, options, on }] })` with an `onSwitch` callback plus runtime `showPath(id, visible)` / `showBody(id, visible)`; or (c) a mount-handle `setScene(scene, { keep: ["time", "rate", "camera"] })`. In each, a view's object menu lists only what that view shows.

## Proof Needed

A page built on the packed package, public API only, offers a viewer-level choice between at least two scene variants (for example Voyager 1 / Voyager 2 / Both), shown like the built-in switches. Switching keeps the time, speed and camera framing; the object menu lists only the chosen variant's objects; and the meteor showers picker could use the same mechanism instead of unmount-and-remount.
