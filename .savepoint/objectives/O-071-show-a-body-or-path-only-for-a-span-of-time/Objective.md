---
id: O-071
title: Show a body or path only for a span of time
status: planned
depends_on: [O-070]
release: G-019
priority: medium
rank: 3
---

# O-071: Show a body or path only for a span of time

## Outcome

A host can give a body (`addBody`, `addBodyFromElements`) or a path (`addTrajectory`) a span of time outside which it is not drawn (marker, line, orbit ring, label) and not listed in the object menu, so a story shows a "before" orbit until an event and an "after" orbit from it, or an object only while it matters, without using views as a clock.

## Why

G-019, Closest Calls F-01, F-07, F-08: the app built 21 views (11 named "Overview") and three paths per asteroid to show the right orbit at the right time. The owner chose one general option; element-set switching and view-bounded objects are composed from it plus existing views. Covers most of parked I-157 (labels tied to a stretch of time).

## Success Conditions

Confirmed by the owner, 2026-11-12 (session plan-o071-20261112), in the lean form ("Lean, two steps"):

1. `addBody`, `addBodyFromElements` and `addTrajectory` take `shownDuring: { start?, end? }` (each end a `TimeInput`; either may be left off for an open end; at least one given; `end` after `start`); a bad value throws `bad-body`, `bad-element` (or the call's own body code) or `bad-trajectory` naming the field.
2. The object is shown from `start` up to but not including `end`: a "before" object ending at a moment and an "after" object starting at it never show together and leave no gap.
3. Outside its span the object counts as hidden exactly as when a view hides it: marker, line, orbit ring (`partOf`), label and picks are not drawn; it leaves the object menu; `setSelected` and `setCamera` refuse it as a hidden id; `cameraTargets` omits it. View and span combine: shown only when both allow it.
4. A selected object leaving its span is dropped and `onSelect` reports it with the cause of the move (`playback`, `visitor` or `host`, as for a path past its samples); the camera stays where it is (does not follow an unshown point or jump).
5. The change at a span edge is instant (no fade).
6. Presentation only: `stateOf`, readouts and State are unchanged (ARCH-02).
7. Additions only: API lock, README rows, CHANGELOG; the hello-scene example uses it; proven on both embedding paths (API-02) with synthetic scenes (ARCH-03). No owner preview check.

## Decisions

- **Shape** (owner, 2026-11-12): `shownDuring: { start?, end? }`, start counts and end does not. Rejected: both ends inclusive (both orbits at the handover); separate `shownFrom`/`shownUntil` (breaks API-04's one-span shape).
- **Leaving the span while selected** (owner, 2026-11-12): drop the selection with the move's cause, camera stays put. Rejected: keep it selected while hidden.
- **Lean build** (owner, 2026-11-12, asked "are we overcooking this?"): the span feeds the engine's existing hidden-object set (`viewHiding.ts`, `SceneControls.viewHidden`), so drawing, labels, picks, menu, selection checks and camera targets follow it; two steps. No fade, no preview look, no new object kinds (body sets, groups, sky figures out).
- I-157 (labels over a stretch of time) is covered for bodies and paths shown over a span; a label alone over a span is not. I-157 stays open for the owner to place.

## Architectural Considerations

Presentation only: State and `stateOf` never depend on it (ARCH-02). One shared visibility rule read by every drawer, the label layer and the menu (STYLE-07); proven with a synthetic scene (ARCH-03).

## Boundaries

**In scope:** the option on bodies and paths, drawing, labels, object menu, reads, README, CHANGELOG, an example update.
**Out of scope:** element-set switching as its own feature; hiding views from the view menu; timeline zoom (I-156); sky figures (they have `shown` already).
