---
id: O-101
title: Group labels the host controls
status: planned
depends_on: [O-100]
release: G-027
priority: high
rank: 2
---

# O-101: Group labels the host controls

## Outcome

A host decides which point groups carry their own name label (`addGroup` takes `showLabel`), and places labels of its own (`scene.addLabels`, name final at detailing under API-04): each on a fixed point (`positionKm` with `frame` and `center`) or on the dots of one or more groups, where it sits on the dots (the densest part, or the drawn dot nearest their mean direction from the centre) and follows them as time moves, re-placed at the refill cadence. A tap on a host label selects one group as the object list does, selects several groups together (camera on their combined dots, one card), or opens a panel; with nothing named it is text only. Host labels join the one overlap and priority layout with their own `labelPriority`, and taps and drags on them follow the #33 rules (belt #36).

## Why

The belt draws populations as several brightness groups and today gets one label per split (21 and 33 labels in its two views, of which 10 and 14 name something a visitor points at), and a ring round the Sun is labelled at the Sun. It blocks the belt's O-007. G-027 finding 2 lists what the API already allows.

## Success Conditions

To be detailed after the owner answers G-027 Decisions 1 to 5. Already fixed by the brief: a group with `showLabel: false` draws no label and stays listed and selectable; a label anchored on groups lands within their dots, ring included, and follows them; a tap selects what it names; a drag that starts on a label moves the camera; bad input throws, naming the field; unit tests for each, and a browser check at desktop and phone size on a made-up scene with 4x2 brightness groups and two group-anchored labels (step chosen at detailing from `docs/BROWSER_CHECKS.md`, not `orbit-lines`).

## Architectural Considerations

- One label layout: host labels are entries in `app/SceneLabels.ts`, as sky labels are, never a second layer.
- A group-anchored label's place is computed from the CPU fills the group already makes for its centroid and extent (`app/PointsView.ts`), at the refill cadence, not per frame per dot.
- Picking: host labels are label-only tap targets in `app/scenePicking.ts`, as a group's name is (O-095).
- The several-group selection is the one new engine idea; it must work through `handle.selected`, `setSelected` and `onSelect` like any object (API-02, both embedding paths).
- Size: see G-027 Decision 5.

## Boundaries

**In scope:** `GroupInput.showLabel`; host labels (input, checks, placement, overlap, taps); the several-group selection; README, API lock, CHANGELOG; a made-up test scene in `packages/astraeus-site/src/synthetic/`.

**Out of scope:** hit-testing single dots; any change to bodies' labels; the belt's tweaks list.
