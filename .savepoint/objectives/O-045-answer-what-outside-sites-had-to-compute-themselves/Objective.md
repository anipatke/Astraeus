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

Settled with the owner, 2026-10-28 (planning session o045-planning-20261028; four decisions, then "Yes, write the steps"):

- **Position query (owner: "Widen the existing call").** `Scene.stateOf(id, time)` answers for every body in the scene (built-in bodies and moons, bodies from `addBodyFromElements`, group members if addressable by id, and `addTrajectory` paths) with the engine's own State, and throws `bad-time` outside a body's data range and `unknown-body` for an id not in the scene. No `positionOf`, no solar-longitude helper.
- **Accuracy (owner: "A provenance read call").** A new `Scene.provenanceOf(id)` returns the body's `Provenance`, which gains optional machine-readable `accuracyClass` and `maxErrorFraction` fields, filled for built-in Swift-Tuttle and for bodies from elements records. The root exports `APPROXIMATE_LIMIT_FRACTION`, `INDICATIVE_LIMIT_FRACTION`, `classifyPositionError`, `parseElementsBodyRecord` and their result types. Built-in bodies' raw orbit numbers stay internal.
- **Orbit fitting (owner: "Fit to the real screen").** `camera.fitOrbit(body)` sets the farthest zoom-out so the whole orbit of a body circling the Sun fits the actual canvas from any view direction, and re-fits when the canvas changes shape; it changes only the zoom-out limit (and far plane), not the opening view.
- **Provenance alignment (owner: "Add modelled and per-event labels").** `ProvenanceSourceType` gains `"modelled"`, shared in wording with the panel badge; `EventInput` takes an optional `provenance` that overrides the `addEvents` one for that event; `GroupInput` documents the group's provenance override.
- **Card parity.** A body added from an elements record shows the same live "Distance from Sun" readout on its card as built-in Swift-Tuttle.
- **Documentation.** Every new call and field on the API reference page (doc comments), README examples, CHANGELOG `Unreleased` entries; Design reconciled.
- **Proof.** Each new call is proven on a made-up configuration (ARCH-03); `npm run check:node-consumer` exercises `stateOf` and `provenanceOf` on the packed package; one `npm run check:browser` and one Full Objective Check at the end. No owner look required (owner chose no extra look, 2026-10-28).

## Architectural Considerations

Thin additions in `packages/astraeus/src/api/` over existing engine code (O-036 decision); each new call proven on a made-up configuration (ARCH-03), documented on the API reference page, and listed in the CHANGELOG.

## Boundaries

**In scope:**
- A read-only position query for any body in a built scene (widened `stateOf`), with exported result types
- A camera call that fits a body's orbit (or a reach given as an angle) independent of screen shape
- Exporting the accuracy limits, `classifyPositionError` and `parseElementsBodyRecord`
- The live "Distance from Sun" readout for bodies added from elements; a machine-readable accuracy class for built-in bodies
- A "modelled" provenance type shared with panel badges, and provenance per event

**Out of scope:**
- Swapping scenes inside one mounted viewer (E5), reading camera state (G4), a leap-second table (E4): later, if asked again
- Radiant drawing, panel time tokens, the Showers demo loader
