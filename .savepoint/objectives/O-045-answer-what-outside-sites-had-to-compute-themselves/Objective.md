---
id: O-045
title: Answer what outside sites had to compute themselves
status: planned
depends_on: [O-044]
release: G-012
---

# O-045: Answer what outside sites had to compute themselves

## Outcome

The public API answers the questions the showers site answered with its own code: where any body in a built scene is at a given time, how far out the camera must go to show a whole orbit on any screen shape, which accuracy class a position comparison falls in and whether an elements record is valid, and how far each body is from the Sun on its card, with provenance that can say "modelled" and differ per event.

## Why

G-012: findings E1, E2, E3, E7, G2 and G3 in `/home/user/code/showers/docs/astraeus-handoff.md`, the most-asked changes in that report. The engine already computes these internally (`Scene.stateOf` covers only `addTrajectory` paths; the accuracy limits, `classifyPositionError` and `parseElementsBodyRecord` are internal; the 45° field of view is fixed in `AstraeusScene.tsx`).

## Success Conditions

To be settled with the owner when this Objective is planned in detail, after O-044.

## Architectural Considerations

Thin additions in `packages/astraeus/src/api/` over existing engine code (O-036 decision); each new call proven on a made-up configuration (ARCH-03), documented on the API reference page, and listed in the CHANGELOG.

## Boundaries

**In scope:**
- A read-only position query for any body in a built scene, with exported result types
- A camera call that fits a body's orbit (or a reach given as an angle) independent of screen shape
- Exporting the accuracy limits, `classifyPositionError` and `parseElementsBodyRecord`
- The live "Distance from Sun" readout for bodies added from elements; a machine-readable accuracy class for built-in bodies
- A "modelled" provenance type shared with panel badges, and provenance per event

**Out of scope:**
- Swapping scenes inside one mounted viewer (E5), reading camera state (G4), a leap-second table (E4): later, if asked again
- Radiant drawing, panel time tokens, the Showers demo loader
