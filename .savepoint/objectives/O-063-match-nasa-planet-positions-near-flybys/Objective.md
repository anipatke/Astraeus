---
id: O-063
title: Match NASA planet positions near flybys
status: in_progress
depends_on: [O-061]
release: G-017
priority: medium
---

# O-063: Match NASA planet positions near flybys

## Outcome

Near a spacecraft flyby, the engine's planet positions match JPL Horizons within a measured tolerance stated in the provenance, so a host can drop Horizons probe samples in without re-placing them.

## Why

The Voyagers review (owner, 2026-11-10): the app re-places probe samples so the probes meet the planets. Issue I-154.

## Success Conditions

To be detailed when this Objective is planned. It starts with a bounded research Task: measure today's error against Horizons at the Voyager flyby dates (and a made-up check elsewhere), name the cause, and recommend the general fix and its cost (download size, span), for the owner to choose.

## Owner Decisions (2026-11-10)

- Kept in 0.8.1 while timeline zoom, timed labels and the box-size fix were parked: "Accuracy only, park zoom and labels (Recommended)".
- Plan: one research step (T-289) first; the owner reads its note and chooses the fix, or "state the measured error and stop", before any fix step is planned.
- After T-289's note (2026-11-09): the owner chose "Replace with NASA's numbers (Recommended)" over "State the error and stop": every planet's system barycentre is fitted from JPL Horizons (DE441), as Pluto already is, plus the planet's own offset from its barycentre when its moon package is loaded. This is the owner's explicit DATA-01 approval for changing the core planet data.
- During T-290 (2026-11-10), Horizons' Uranus (799) and Neptune (899) about the Sun come from the satellite ephemerides, whose barycentre differs from DE441's by up to about 3,178 km and 661 km. The owner chose "Match the planet as NASA reports it (Recommended)" over keeping the DE441 barycentre: the engine's planet matches Horizons' planet centre when its moon package is loaded, applied as one rule to every planet with a moon system.

## Boundaries

**In scope:** the core planet series and its provenance (ARCH-05, PROV-01).

**Out of scope:** probe or mission data in the engine; breaking changes; a data package change without owner approval (DATA-01).
