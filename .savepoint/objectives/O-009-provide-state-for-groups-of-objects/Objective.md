---
id: O-009
title: Provide state for groups of objects
status: planned
depends_on: [O-008]
release: G-004
---

# O-009: Provide state for groups of objects

## Outcome

If the O-008 audit confirms the gap: a generic provider that gives deterministic State for a large group of objects at a time, and a renderer for it, proven first with a synthetic particle cloud and then with Perseids. If the audit shows ordinary Trajectories suffice, this Objective is reshaped or dropped.

## Why

The engine models one Trajectory per body; a shower is thousands of particles. The hypothesis is that per-body Trajectories do not scale and a group contract belongs in Astraeus (comets' dust, satellite constellations and asteroid families need the same thing).

## Success Conditions

Shaped after O-008. At minimum: deterministic output for a given time and seed, explicit bounds and provenance, contract tests with a synthetic group, no meteor naming in generic code, Apollo unchanged.

## Architectural Considerations

Group state stays in EQJ km with explicit centre, and presentation never changes it (ARCH-02).

## Boundaries

**In scope:** generic group provider, its presentation layer, synthetic fixture.
**Out of scope:** Perseids-specific stream physics in generic code; observed meteor data.
