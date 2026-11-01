---
id: O-054
title: Give React and plain apps the same handle
status: planned
depends_on: [O-058]
release: G-016
priority: high
---

# O-054: Give React and plain apps the same handle

## Outcome

A React host gets the same handle a `mount` host gets (reads, setters, signals), start-up and shut-down follow the Design lifecycle contract on both paths, and hosts gain the controls a non-probe app needs: play/pause and `playing`, the selected object and a selection signal, and a camera-change signal (API-02; review F2, F8, F10; I-130).

## Why

G-016 chunk 2. I-130 and C-136 O1, O2, O5: React apps can do less than `mount` hosts; `ready` can resolve unusable or never settle; a throwing listener stops the others; StrictMode can fire `onReady` early.

## Success Conditions

1. **One handle type.** A new exported `ViewerHandle` holds every read, setter and signal; `MountedScene` is `ViewerHandle` plus `ready` and `unmount`, and a type test (run by `npm run typecheck`) fails if `Omit<MountedScene, "ready" | "unmount">` and `ViewerHandle` differ. `AstraeusScene` gives the same `ViewerHandle` through `ref` and `onReady(handle)`; its existing props stay as shortcuts.
2. **`ready` always settles.** A new `not-mounted` code: `ready` rejects with it when `unmount` comes before the viewer is drawn (before or after the data load), and every handle read stays undefined and every call throws it before `ready` and after `unmount`. `missing-data` no longer means "not drawn yet".
3. **StrictMode is safe.** Under React StrictMode `onReady` fires only after the viewer is attached, once per build, and the handle keeps working; a test proves it.
4. **Listeners stand alone.** A listener that throws (`onChange`, `onEventZone` and the new signals) does not stop the others; the throw is reported to the page, not swallowed.
5. **A mounted `Scene` is frozen.** After `mount` or `AstraeusScene` takes a scene, every `add*`, `set*` and `scene.camera` call on it throws a new code; reads (`stateOf`, `provenanceOf`) still work, and the same frozen scene can still be mounted again.
6. **Errors follow API-05 for F8.** Moon data naming a planet without a moon system throws a `SceneError`; the span planner throws no plain `Error`; the Sun-orbit planner recognises its internal faults by type, not message; a repeated activity id throws `duplicate-id`. The three O-053 `apiErrors` allowlist entries that name O-054 are removed in the same change.
7. **Controls a non-probe app needs, on both paths.** `playing` and `setPlaying(playing)`; `selected` (the object whose information is open) and `onSelect(listener)`; `onCameraChange(listener)` reporting the camera pose when it changes. Each is reachable from `mount` and from the React handle, and each is a signal on its own (ARCH-02: the engine signals, the host decides).
8. **One shared lifecycle suite** runs the same cases against `mount` and `AstraeusScene`: build fault, load fault, early unmount, before-ready and after-unmount calls, callbacks stop after unmount, listener isolation, frozen scene, rebuild with a new scene, and StrictMode on the React path.
9. **`hello-react` restores the camera** after an encounter, through the handle, as the vanilla example does; it builds from the packed tarball.
10. **Surface recorded honestly.** `packages/astraeus/api-surface.lock.json` regenerated with `npm run api:lock`; the README error table regenerated (`npm run api:errors`) and README API rows match the new handle; CHANGELOG Unreleased lists each change with a migration note for app makers; Design.md reconciled; the full gate, `check:pack`, `check:node-consumer`, `check:react-consumer`, `check:engine-alone` and one `check:browser` pass at the Full Objective Check.

## Architectural Considerations

Follows the `ViewerLink` attach/publish pattern; ARCH-02 (controls consume State, never change it). New reads come through `ViewerControl` (`app/viewerPort.ts`) and each new signal is its own host-link part beside `viewerClock`, `viewerViews`, `viewerCamera` and `viewerZones` (O-058 split), fed by the viewer's existing 100 ms publish.

Planned decisions (planner recommendations, confirmed by the owner on 2026-11-01, "Yes, all recommendations"; actor: owner, relayed by the coordinator):

- Handle type name `ViewerHandle`; React gets it through `ref` (React 19 ref-as-prop, no `forwardRef`) and `onReady(handle)`; the same handle object survives rebuilds. No `ready` on the React handle (`onReady` is the React form).
- New error codes `not-mounted` (from the review) and `scene-mounted` for an edit to a mounted scene; `bad-data` for a data package that names a planet without a moon system.
- Play control `playing` + `setPlaying(boolean)` (verb grammar: reads are properties, `set*` replaces), not `play()` / `pause()`.
- Selection is read and heard only: `selected` + `onSelect(listener)`; no host setter in this Objective.
- Camera signal `onCameraChange(listener)` receives the `CameraPose`, at most about ten times a second, only when the pose differs from the last one reported.
- New signals are reached from the handle only; no new `AstraeusScene` props.
- A throwing listener is reported with `globalThis.reportError` (else rethrown on a timer) after the others have run.
- No owner look at `hello-react` in this Objective (owner, 2026-11-01).
- Clean break, no aliases (owner, G-016): `missing-data` for not-drawn calls becomes `not-mounted`; activity repeats become `duplicate-id`; edits after mount throw.

## Boundaries

**In scope:** F2, F8, F10's play control, selection and camera signal, and I-130.

**Out of scope:** renames (O-057); headless loading (O-056); page isolation (O-055); F10's live scale and display-switch setters and readouts on `addBody` (moved to O-056 by the owner, 2026-11-01).
