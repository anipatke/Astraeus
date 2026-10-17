# Astraeus — Perseids Reference Capability

Owner specification, supplied 2026-10-11 during the O-011 replan of T-038. Kept verbatim below. It sets the reference capability target for Spike 04 alongside `docs/archive/ASTRAEUS_SPIKE_04_BRIEF.md`; where they differ, the decisions recorded in O-011 say which applies.

---

## Objective

Demonstrate that Astraeus can reproduce the essential scientific and interactive capabilities of:

https://www.meteorshowers.org/view/Perseids

This is a **reference capability target**, not a request to clone its interface.

Astraeus must support astronomy experiences operating at fundamentally different spatial scales, using different data sources and different scene compositions.

## Required experience

1. **Heliocentric scene** — Sun at the reference centre, Earth following its actual orbit, and the Perseid meteoroid stream represented in solar-system coordinates.
2. **Meteor stream** — Render many distinct meteoroid orbits or sampled particle trajectories from documented data. Support a swarm, not just one trajectory line.
3. **Time propagation** — Animate Earth and meteoroids according to their orbital states at a common timestamp.
4. **Intersection** — Show where Earth's orbit crosses the Perseid stream and how that relates to the annual meteor shower.
5. **Perspective** — Support solar-system overview, following Earth, and an Earth-based viewing perspective.
6. **Exploration** — Allow orbit, pan, zoom, time controls, object selection and optional trajectory visibility.
7. **Provenance** — Distinguish measured meteoroid orbital data from approximated or illustrative particle distributions.

## Architecture implications

The existing `Trajectory → State` abstraction should remain valid for individual objects.

However, Astraeus must also handle **collections of trajectories and large particle populations** efficiently.

Required generic capabilities:

- Sun-centred scenes alongside Earth-centred scenes.
- Consistent frame and reference-centre conversions.
- Keplerian orbital-element providers where suitable.
- Efficient batched/instanced rendering of large orbiting populations.
- Configurable scene composition, visibility and camera presets.
- Independent visual scale policies suitable for solar-system distances.
- Performance appropriate for an interactive browser experience.

These must not be implemented as Perseid-specific core features.

## Explicit prohibitions

- Do not build Perseids inside the Apollo Earth–Moon scene.
- Do not retain the Moon as a mandatory scene component.
- Do not use the Apollo reconstruction pipeline for meteor streams.
- Do not represent a meteor shower as particles orbiting Earth.
- Do not substitute arbitrary decorative particle animation for orbital geometry.
- Do not introduce hard-coded Perseid logic into Astraeus core.
- Do not assume one scene scale or one reference centre applies to every experience.

## Acceptance criteria

A viewer should be able to:

1. See Earth's orbit around the Sun.
2. See the Perseid stream occupying its own inclined orbital geometry.
3. Advance time and watch Earth approach, intersect and move beyond the stream.
4. Rotate and zoom to understand the three-dimensional relationship.
5. Follow Earth through the encounter.
6. Explore the same generic capabilities with a different meteor shower by changing configuration and data.

## Success condition

**Astraeus can build an experience comparable to MeteorShowers.org without requiring a new bespoke astronomy engine.**

The Perseids experience should supply its orbital data, presentation configuration and explanatory content.

Astraeus should supply the time, coordinates, trajectories, rendering, camera and interaction machinery.

A second meteor shower should require substantially less work than the first.
