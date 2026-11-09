---
id: O-061
title: Make app commands always land
status: planned
depends_on: []
release: G-017
priority: high
---

# O-061: Make app commands always land

## Outcome

A host's calls on the viewer handle never vanish: every call after `ready` takes effect (or throws) in the order made, including calls made before the first frame and from inside an `onChange` view-switch report; a view's follow rule works on a planet other views also show; a host `setTime` counts as a seek for story panels exactly as a visitor's does; a host can select and clear an object; `mount` shows the same loading cover as the React viewer; and the README says an event has one zone, as wide as its widest pacing rule.

## Why

The Voyagers review (owner, 2026-11-10): camera and selection timing cost the app the most time, and four of its five remaining workarounds are about timing or the camera. Issues I-150 (with I-153 merged), I-151, I-152, I-155, I-158.

## Success Conditions

- **No lost calls.** Host-style tests on both embedding paths (API-02): `setCamera`, `setTime`, `setView` and the new selection call made straight after `await ready`, before the first frame, and inside an `onChange` callback reporting a view switch each take effect in call order, or throw a `SceneError`; none is silently dropped. The README states the order rule.
- **Follow rule on a shared planet.** A scene with two views showing the same planet: switching to the view whose camera rule follows that planet makes the camera follow it (a test, made-up scene, ARCH-03).
- **Host seek.** A host `setTime` re-bases story panels as a visitor seek does (opens nothing by crossing), proven against the same visitor seek in one test.
- **Host selection.** A public call selects an object the showing view shows and clears the selection; `onSelect` reports it with `cause: "host"`; a bad id throws one named `SceneError` code; README table, API lock and CHANGELOG updated (API-01, API-04, API-05, API-07).
- **Loading cover.** `mount` shows the loading cover the React viewer shows, removed when the scene is drawn, with a test.
- **Docs.** One README line: an event has one zone, as wide as its widest pacing rule (checked against `core/pacing.ts`).
- Nothing existing changes shape: every addition is new; existing tests pass unchanged.

## Owner Decisions (2026-11-10)

- All eight review asks are in G-017; this Objective takes I-150 (with I-153), I-151, I-152, I-155, I-158 (owner "All eight", then "Three pieces, this order").
- 0.8.1, additions only; Voyagers is not updated (owner).

## Architectural Considerations

Host control is one seam: `app/viewerPort.ts` implemented by `api/viewerLink.ts` with `viewerCamera.ts`, `viewerClock.ts`, `viewerSelection.ts`. The order rule belongs in that seam, not in each call. ARCH-02: selection and camera consume State and never change it. The cause of each lost call is not yet known; the first Task finds it with failing host-style tests before any fix.

## Boundaries

**In scope:** the host link, the viewer handle, the mount loading cover, README and API lock.

**Out of scope:** changing existing call shapes or error codes; a `setCamera({ select })` variant (selection is its own call, modular over consumer-shaped); timeline and label work (O-062); planet positions (O-063).
