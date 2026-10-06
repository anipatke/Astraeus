---
id: G-002
title: Astraeus Spike 02 — Apollo 11
status: done
---

## Outcome

Complete Astraeus Spike 02: an Apollo 11 educational trajectory reconstruction based on NASA postflight trajectory data, shown in the existing Earth–Moon scene through a generic sampled trajectory that honours the same `Trajectory → State` contract as natural bodies.

## Why

Prove that a fundamentally different trajectory source — sampled, reconstructed spacecraft data — reuses the Spike 01 state, scale, floating-origin and rendering pipeline without mission-specific logic leaking into Astraeus core.

## Success Conditions

The success criteria in `docs/ASTRAEUS_SPIKE_02_BRIEF.md` hold, as narrowed by O-002's confirmed decisions: a transparent, reproducible reconstruction with measured anchor residuals; a generic SampledTrajectory used at runtime; identical scientific state under both scale policies; Apollo followable Earth → Moon → Earth without instability; Earth and Moon behaviour unchanged; events separate from trajectory physics; and the design note `docs/ASTRAEUS_SPIKE_02.md`. Every Issue raised during G-002 is repaired or decided by the owner before the Goal closes (owner decision, 2026-10-06).

## Boundaries

Internal spike. Excludes everything in the brief's "Do not build yet" list: launch-vehicle physics, staging, N-body simulation, guidance, maneuver optimisation, SPICE, spacecraft attitude, detailed models, terrain, EVA, storytelling DSL, narration, package extraction, publishing, Perseids and full Solar System support. Never present the result as the exact Apollo 11 flight path.
