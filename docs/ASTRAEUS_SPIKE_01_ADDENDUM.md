# Astraeus Spike 01 — Architecture Addendum

Owner scope revision, 2026-10-06. Continue the existing Spike 01 implementation and plan. Do not restart, rewrite working code, or expand scope unnecessarily. This addendum supersedes conflicting decisions in the original plan; it is a requirement record, not evidence of implementation.

## Scientific coordinates and independent rendering layers

Store scientific positions in `positionKm: Float64Array`, with optional `velocityKmS: Float64Array`. Use real kilometres internally. Scientific state is never altered for presentation.

Keep the pipeline explicit:

```text
Scientific state → ScalePolicy → Floating origin → Three.js coordinates
```

ScalePolicy maps physical distances and sizes for readability. Floating origin independently solves GPU precision:

```text
renderPosition = scaledAbsolutePosition - scaledCameraOrigin
```

Keep absolute scientific coordinates in Float64 values and send small local coordinates to Three.js. Prove Earth, Moon and camera behavior with a simple implementation; do not build world streaming.

## Replaceable scale policies

Provide `TrueScale` and `ReadableScale` behind a small `ScalePolicy` interface with `mapPosition` and `mapRadius`. TrueScale preserves physical ratios. ReadableScale may compress orbital distances and optionally exaggerate body size while preserving direction. Its experimental formula must remain replaceable. Both policies operate on identical scientific State, and changing policy must never mutate that State.

## Astronomy provider evaluation

Before custom propagation, frame or time calculations, inspect current orb.js 3.x using primary documentation/source. Evaluate astronomical time, Earth/Moon positions, reference frames, coordinate transforms, Kepler propagation and state vectors. Compare with the planned Astronomy Engine provider where needed.

If useful, integrate behind an Astraeus trajectory adapter; do not expose orb.js in Astraeus's public API. Preserve a small provider boundary that can later accommodate sampled trajectories, JPL Horizons, mission data or custom trajectories without implementing them now. Document unsuitable capabilities rather than forcing orb.js into the spike.

## Scientific orientation and illumination

State includes time, position, optional velocity, orientation, frame and center. Use a quaternion or another unambiguous orientation representation with documented conventions.

Earth orientation uses rotational phase at the requested timestamp, axial orientation and real rotation rate. Moon orientation uses orbital state for approximate tidal locking. Arbitrary visual mesh spin must not supply either body's scientific orientation. Texture alignment may remain a presentation offset.

Introduce only enough Sun geometry/state to determine which side of Earth faces the Sun, which side of the Moon is illuminated and approximate Moon phase. Visible phase emerges from lighting geometry, with no independent phase animation. This validates time → position → orientation → frame → rendering.

## Explicit reference conventions and library boundary

Express Moon relative to Earth, Earth relative to Sun and Moon relative to Sun without redefining the physical bodies. Make frame, center, axes, units and orientation conventions explicit; avoid a large frame framework.

Keep Astraeus reusable inside an existing Three.js scene. Do not introduce a monolithic Simulation owning canvas, renderer, scene, camera, clock, bodies and UI. Preserve an astronomical clock independent of frame delta.

## Additional success criteria

1. Scientific positions have explicit real-world units.
2. Floating origin keeps rendering stable.
3. TrueScale and ReadableScale operate on identical scientific state.
4. Earth has credible date-based orientation.
5. Moon orientation is approximately tidally locked.
6. Sun geometry yields credible day/night boundaries and Moon phase.
7. Earth/Moon/Sun states have explicit reference frames and centers.
8. Proven astronomy maths is reused where sensible, with documented provider evaluation.

These augment the existing spike criteria and independent accuracy validation.

## Scope and completion documentation

Exclude full Solar System support, eclipses, libration, barycentric simulation, SPICE, N-body physics, terrain and general-purpose scene management.

At completion update `docs/ASTRAEUS_SPIKE_01.md` with adopted changes, rejected changes, reasons and consequences for the proposed architecture. Floating origin as its own layer and orientation/illumination as scientific state are the two priorities; other design details may bend based on implementation evidence.
