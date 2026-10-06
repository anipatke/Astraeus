---
type: idea
status: planned
---

# Idea: Astraeus — space, time and trajectories for Three.js

## Intent

Astraeus is a lightweight TypeScript/Three.js engine for interactive astronomy storytelling. It handles astronomical time, trajectories, orientation, scale and reference frames so developers can build scientifically grounded, explorable space experiences without rebuilding the hard parts every time. Astraeus is reusable browser infrastructure for turning astronomical state into interactive space stories — not the story itself.

Guiding principle (owner, 2026-10-06): be reliable where the data exists, plausible where it doesn't, and explicit about the difference. There will always be a gap between scientific fact and good storytelling; creative liberties that cover missing or unclear facts are allowed, but they are carried as explicit metadata, never hidden.

History: G-001 (Spike 01, Earth–Moon foundation) and G-002 (Spike 02, Apollo 11 sampled trajectory) are the spikes that led to this Idea; their original intent is kept in their Goal records.

## User

Developers building astronomy experiences in the browser; the owner is the first of them. End viewers are the audience of applications built with Astraeus, not Astraeus's primary user, so their UI needs do not become engine requirements.

## Core Experience

Give Astraeus a time and one or more state/trajectory providers, and it knows where things are, how they are oriented, how they relate to each other, and how to render that safely at astronomical scale. The intended developer experience is roughly:

```ts
const scene = new Astraeus.Scene()
scene.addBody(earth)
scene.addBody(moon)
scene.addTrajectory(apollo11)
scene.setTime("1969-07-20T20:17:40Z")
scene.setScale(new ReadableScale())
scene.camera.follow("apollo11")
```

The same engine then serves a meteor shower, a comet or a satellite instead of Apollo. The central abstraction is `trajectory.stateAt(time)`.

## Scope

Four layers:

- **Scientific state** — time, position, velocity, orientation, reference frame, centre, provenance.
- **State/trajectory providers** — ephemerides, sampled mission data, Kepler orbits, future Horizons/SPICE adapters, meteor particles, custom data; astronomy maths supplied by libraries such as orb.js behind adapters.
- **Presentation engine** — true/readable scale, floating origin, paths, bodies, lighting, camera, labels.
- **Story layer** — timeline, events, focus/follow, annotations, uncertainty, eventually chapters and narration.

## Out of Scope

A planetarium; a Universe Sandbox-style simulator; mission-navigation software; a one-off Solar System demo; a large orbital-mechanics library of its own (providers supply that maths behind adapters); forcing a particular uncertainty presentation on viewers (that is application presentation policy).

## Success Criteria

1. Every trajectory provider produces deterministic scientific state for a given time, and the downstream presentation pipeline is reused without provider-specific logic.
2. A developer can build a scene through a small API without copying application code or understanding Astraeus internals.
3. A second, materially different astronomy experience runs on the same engine without requiring experience-specific changes to the core.
4. Every reconstruction, approximation or creative liberty carries explicit provenance/uncertainty metadata that an experience can expose to its viewer; Astraeus preserves that metadata so hiding uncertainty is hard to do by accident.
