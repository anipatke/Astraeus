---
id: G-022
title: Change a group's look live for 0.9.4
status: planned
---

## Outcome

A host can change a point group's colour and dot size on a mounted viewer, on the next drawn frame and without rebuilding the scene (`handle.setGroupLook`, read back with `handle.groupLook`). Dots stay where they are; State, positions, provenance and refill timing are unchanged. Groups never given a live look render exactly as in 0.9.3.

## Why

Owner, 2026-11-20 (session plan-g022-20261120), from the Asteroid Belt app (`/home/user/code/belt`, item 11 of its `docs/astraeus-improvements.md`): its "Jupiter's influence" view dims every group except the two either side of a chosen Kirkwood gap. Today that needs a new Scene and a remount, which blocks the main thread for about 1.4 s (headless Chromium, SwiftShader) and is jarring even behind a fade. Owner chose "0.9.4 (Recommended)": additions only, like 0.9.1–0.9.3, so the data peers `>=0.9.0 <0.10.0` stay valid.

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine package (host handle, points layer, scene labels), its README, CHANGELOG, API lock and tests.

**Out of scope:** per-dot colours, picking group members, hiding a group's label, skipping refill for hidden groups (belt list items 2, 3, 5, 6); any change to Meteor Showers or the belt app; the version bump and publishing (the owner's release steps).
