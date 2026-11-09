---
id: O-061
title: Make app commands always land
status: done
depends_on: []
release: G-017
priority: high
---

# O-061: Make app commands always land

## Outcome

A host's calls on the viewer handle never vanish: every call after `ready` takes effect (or throws) in the order made, including calls made before the first frame and from inside an `onChange` view-switch report; a view's follow rule works on a planet other views also show; a host `setTime` counts as a seek for story panels exactly as a visitor's does and a host can select and clear an object; and the README says an event has one zone, as wide as its widest pacing rule.

## Why

The Voyagers review (owner, 2026-11-10): camera and selection timing cost the app the most time, and four of its five remaining workarounds are about timing or the camera. Issues I-150 (with I-153 merged), I-151, I-152, I-155, I-158.

## Success Conditions

- **No lost calls.** Host-style tests on both embedding paths (API-02): `setCamera`, `setTime`, `setView` and the new selection call made straight after `await ready`, before the first frame, and inside an `onChange` callback reporting a view switch each take effect in call order, or throw a `SceneError`; none is silently dropped. The README states the order rule.
- **Follow rule on a shared planet.** A view can opt in to apply its camera rule on every switch (owner decision); with it, switching to that view while the camera follows a planet both views show moves the camera to the view's target; without it, behaviour is unchanged (tests for both, made-up scene, ARCH-03; README `setViews` row updated).
- **Host seek.** A host `setTime` re-bases story panels as a visitor seek does (opens nothing by crossing), proven against the same visitor seek in one test.
- **Host selection.** A public call selects an object the showing view shows and clears the selection; `onSelect` reports it with `cause: "host"`; a bad id throws one named `SceneError` code; README table, API lock and CHANGELOG updated (API-01, API-04, API-05, API-07).
- ~~**Loading cover.**~~ Dropped by the owner after T-288 built it (see Owner Decisions): hosts keep `onFirstDraw` to fade their own cover.
- **Docs.** One README line: an event has one zone, as wide as its widest pacing rule (checked against `core/pacing.ts`).
- Nothing existing changes shape: every addition is new; existing tests pass unchanged.

## Owner Decisions (2026-11-10)

- All eight review asks are in G-017; this Objective takes I-150 (with I-153), I-151, I-152, I-155, I-158 (owner "All eight", then "Three pieces, this order").
- 0.8.1, additions only; Voyagers is not updated (owner).
- I-153, after T-284 found the current behaviour is documented (a view's camera rule applies only when the switch takes away the followed object): the owner chose "Opt-in per view (Recommended)" (2026-11-09 UTC). A view's `camera` rule gains an opt-in that makes it apply on every switch to that view; views without it behave exactly as today.

- Loading cover dropped (owner, 2026-11-09, on the T-288 preview: "why do we have it, i dont want to build things unecessarily", then "Take it out (Recommended)"). Neither viewer path had a built-in cover; a host fades its own on `onFirstDraw`. T-288 keeps only the event-zone README line.

## Architectural Considerations

Host control is one seam: `app/viewerPort.ts` implemented by `api/viewerLink.ts` with `viewerCamera.ts`, `viewerClock.ts`, `viewerSelection.ts`. The order rule belongs in that seam, not in each call. ARCH-02: selection and camera consume State and never change it. The cause of each lost call is not yet known; the first Task finds it with failing host-style tests before any fix.

## Boundaries

**In scope:** the host link, the viewer handle, the mount loading cover, README and API lock.

**Out of scope:** changing existing call shapes or error codes; a `setCamera({ select })` variant (selection is its own call, modular over consumer-shaped); timeline and label work (O-062); planet positions (O-063).
