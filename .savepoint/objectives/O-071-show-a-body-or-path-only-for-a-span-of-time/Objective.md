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

To be settled in the owner design interview when this Objective is detailed (after O-070): option name and shape (API-04 span rules), what happens to a selected or followed object leaving its span, cards, camera targets, `stateOf` (planner's view: unchanged, presentation only, ARCH-02), interaction with views, and an addition-only API (lock and README updated).

## Architectural Considerations

Presentation only: State and `stateOf` never depend on it (ARCH-02). One shared visibility rule read by every drawer, the label layer and the menu (STYLE-07); proven with a synthetic scene (ARCH-03).

## Boundaries

**In scope:** the option on bodies and paths, drawing, labels, object menu, reads, README, CHANGELOG, an example update.
**Out of scope:** element-set switching as its own feature; hiding views from the view menu; timeline zoom (I-156); sky figures (they have `shown` already).
