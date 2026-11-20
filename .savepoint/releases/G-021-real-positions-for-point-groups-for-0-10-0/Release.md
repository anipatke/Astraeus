---
id: G-021
title: Real positions for point groups for 0.10.0
status: in_progress
---

## Outcome

`scene.addGroup` can place each dot at its real position along its orbit from a catalogue mean anomaly and epoch, instead of the engine's illustrative even spread, with the group's card stating the measured source and the two-body limit honestly. Groups without mean anomalies behave exactly as in 0.9.2.

## Why

Owner, 2026-11-20 (session plan-g021-20261120): a new app, "Astraeus: The Asteroid Belt" (`/home/user/code/belt`, a separate app), draws about 110,000 real main-belt asteroids from NASA/JPL SBDB elements as point groups. With 0.9.2 their positions would be made up, which that app's science rules forbid. The engine already places each member from a mean anomaly; only the source of that number is missing. Owner chose "Yes, as described": a new Goal with one Objective, version 0.10.0 (a new public field is a minor bump under docs/RELEASING.md).

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine package (`addGroup` input, listed orbit group core, card provenance and limits), its README, CHANGELOG, API lock and tests.

**Out of scope:** per-dot colour or size, picking individual group members, orbit lines for group members, perturbation modelling (follow-up Issues only if shown to be needed); any change to Meteor Showers (`/home/user/code/showers`) or the belt app; the version bump, data-peer range moves and publishing (the owner's release steps).
