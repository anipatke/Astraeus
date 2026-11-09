---
id: O-063
title: Match NASA planet positions near flybys
status: planned
depends_on: [O-062]
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

## Boundaries

**In scope:** the core planet series and its provenance (ARCH-05, PROV-01).

**Out of scope:** probe or mission data in the engine; breaking changes; a data package change without owner approval (DATA-01).
