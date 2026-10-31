---
id: O-051
title: Switch between views inside the viewer
status: planned
depends_on: [O-050]
release: G-014
priority: high
---

# O-051: Switch between views inside the viewer

## Outcome

In an app on the public API, one scene names views (for example Voyager 1 / Voyager 2 / Both), each listing the paths, bodies, timeline events and story panels it shows. A visitor picks a view from the viewer bar like the built-in display switches, on desktop and phone. Switching keeps time, speed and camera; the object menu, timeline markers, story panels and drawn objects show only that view's things. The app can set and read the view through the mount handle and the React component (I-124).

## Why

G-014, open request from the Voyager probe app on 0.6.0 (I-124): `mount` holds one scene and nothing hides a path or body at runtime, so an app's Voyager 1 / Voyager 2 / Both choice means unmount and remount, losing camera framing and any open card, and every probe's paths sit in one menu. The probe app paused its switch (its T-010) to wait for a built-in one. O-050 made each probe one path, so a view lists one path per probe.

## Success Conditions

Settled with the owner, 2026-11-01 (session o051-plan-20261101): "Views on one scene"; "Paths, bodies, events and panels"; camera rule "leave it up to the project" (each view chooses; default stay); plan summary "Yes, go ahead". Standing rule: strategic fix first.

- **Views (must).** `scene.setViews(views, { place, start })`: each view `{ id, label, paths?, bodies?, events?, panels?, camera? }`. Anything no view names shows in every view (shared bodies such as the planets); anything a view names shows only in the views that name it. `place` is `"top-bar"` or `"panel"` like `setSwitches`; `start` is the opening view (default the first). Unknown ids, duplicate view ids, an empty list, a bad place or a start that is not a view throw a named `SceneError` naming the view and field. A scene without views behaves exactly as today.
- **In the viewer.** The view choice shows in the bar (or the switch panel) like the built-in switches, also in the phone drawer, with no overlap at 1280x720 and 375x667. Switching hides the other views' paths, bodies, labels, picking targets, timeline events, story panels and story markers without rebuilding the runtime (no reload, no new clock); time, speed and playing state carry over.
- **Camera rule, chosen per view.** `camera` says what happens when the followed or focused object is not in the new view: `"stay"` (default: the camera keeps its pose and stops following; the card for the hidden object closes), `"start"` (the view's own framing, `{ follow | focus: id }` given in the view, else the scene's start), or `{ follow: id }` / `{ focus: id }`. When the object is still in the new view the camera is untouched.
- **Host control.** `MountedScene` gains `view` and `setView(id)` (unknown id throws a named error; before `ready` throws `missing-data` like `setTime`); `onChange` reports the view with cause `visitor` or `host`; `AstraeusScene` gains a `view` prop. No body, mission or demo names in the rule or defaults (ARCH-01, ARCH-06).
- **Proof.** Made-up configurations (ARCH-03): two made-up probes plus a "Both" view on the packed package (`check:node-consumer`) and a synthetic browser scene; one `npm run check:browser`; one owner look on `localhost:5490` before the Full Objective Check.
- **Documentation.** README rows and API reference, CHANGELOG `Unreleased` with the first-download size change, Design reconciled.

## Architectural Considerations

ARCH-02: a view is presentation only; State, `stateOf` and providers are unchanged, and hidden objects keep their state. Views resolve once at `toDefinition` into the definition; switching only changes a per-id visibility set read by the existing frame stages (CODE-02) and the shell's lists, never rebuilds `buildRuntime`. The existing `definition.switcher` (address navigation and rebuild) stays for demos that load different data per choice; the new view choice reuses its look but not its rebuild. Host control follows the `ViewerLink` attach/publish pattern.

## Boundaries

**In scope:**
- I-124: `Scene.setViews`, the view switch in the bar and phone drawer, per-view hiding of paths, bodies, events, panels and story markers, the per-view camera rule, `MountedScene.view`/`setView`, `AstraeusScene` `view`, `onChange` view, tests, README, CHANGELOG, API reference and example lines.

**Out of scope:**
- Moving the meteor showers picker or the planets switcher onto views (they keep their reload, since each choice loads its own data); swapping a whole scene in place; changes to the Voyager app or the Apollo 11 demo; a view in the address; publishing a release.
