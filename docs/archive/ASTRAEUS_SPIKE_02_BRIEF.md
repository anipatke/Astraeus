# Astraeus Spike 02 — Apollo 11

> Owner brief, supplied 2026-10-06. Canonical scope for O-002. Planning decisions confirmed by the owner are recorded in `.savepoint/objectives/O-002-apollo-11-sampled-trajectory/Objective.md`; where they narrow this brief, the Objective governs.

We are continuing development of **Astraeus**, a lightweight TypeScript/Three.js astronomy visualisation engine for interactive 3D space storytelling.

Spike 01 successfully proved:

```text
absolute time
→ scientific State
→ ScalePolicy
→ floating origin
→ Three.js
```

It also established:

- real kilometre-based `Float64` scientific coordinates
- explicit reference centres
- astronomical time
- body orientation
- Sun-derived illumination
- `TrueScale` and `ReadableScale`
- orb.js behind an Astraeus adapter
- reusable Earth/Moon rendering
- no monolithic Simulation object

Do **not** redesign these unless Spike 02 exposes a real architectural flaw.

---

# Objective

Prove that Astraeus can support a fundamentally different trajectory source:

> **Apollo 11 travelling from Earth to the Moon and back using a reconstructed sampled mission trajectory grounded in authoritative NASA postflight data.**

The important test is not whether we can make Apollo 11 fly.

The important test is:

> Can a sampled spacecraft trajectory implement the same Astraeus `Trajectory → State` contract already used by natural bodies, while everything downstream remains unchanged?

If significant Apollo-specific logic leaks into Astraeus core, treat that as an architectural warning.

---

# 1. Apollo 11 data reality

Do not spend significant time searching for a perfect downloadable NASA Apollo 11 trajectory dataset.

Previous research established:

- NASA produced a **45-day Apollo 11 Best Estimated Trajectory (BET)** in Apollo Trajectory format.
- The detailed trajectory listing was published as **Volume II** of the postflight trajectory documentation.
- Volume II was explicitly not generally distributed and is not currently exposed as a convenient public trajectory dataset through NTRS.
- The publicly accessible **Apollo 11 Mission Report, Table 7-II** contains postflight trajectory parameters derived from the BET at major mission events.
- Those records include useful state information such as:
  - GET timestamp
  - reference body
  - latitude
  - longitude
  - altitude
  - body-centred inertial velocity magnitude
  - flight-path angle
  - heading
- These provide authoritative **anchor states**, not a dense second-by-second mission trajectory.
- NASA's 2022 Apollo 11 powered-descent reconstruction provides higher-detail reconstruction material for the final descent, but not the entire mission.
- JPL Horizons contains Apollo-related objects including the Apollo 11 S-IVB departure trajectory, but **not the complete Columbia/Eagle Apollo 11 mission trajectory**.
- NAIF does not currently provide a complete Apollo 11 spacecraft SPICE trajectory kernel suitable for this purpose.

Therefore:

> Spike 02 should build an explicitly documented **educational Apollo 11 trajectory reconstruction**, rather than pretend a complete as-flown sampled dataset exists.

Do not describe the resulting dataset as an exact NASA as-flown trajectory.

---

# 2. Authoritative source hierarchy

Use the following hierarchy.

## Primary anchors

Use the **Apollo 11 Mission Report**, particularly Table 7-II and related trajectory sections, as the primary source of postflight trajectory anchor states.

Capture, where available:

- mission elapsed time / GET
- reference body
- position-related parameters
- velocity-related parameters
- event identity

## Mission chronology

Use authoritative NASA Apollo chronology / flight journal material to establish major mission-event times and context.

## Final descent

Evaluate NASA's **2022 Apollo 11 powered-descent trajectory reconstruction** for a higher-resolution descent segment.

Only use it if integration is straightforward and its coordinate/time conventions can be documented confidently.

## Secondary validation

Other historical/reconstruction sources may be used for cross-checking, but must not silently override NASA postflight data.

Document all sources and provenance.

---

# 3. Build an offline reconstruction pipeline

Do not put trajectory reconstruction physics inside Astraeus runtime core.

Create a build-time/offline process:

```text
NASA postflight anchor states
        ↓
normalisation
        ↓
segment reconstruction / interpolation
        ↓
dense sampled trajectory
        ↓
Astraeus SampledTrajectory
```

The browser should consume already-normalised samples.

Astraeus runtime should not care how those samples were produced.

---

# 4. Normalised Apollo dataset

Produce a deterministic static dataset conceptually like:

```ts
{
  metadata: {
    mission: "Apollo 11",
    kind: "reconstructed",
    source: [...],
    accuracy: "...",
    frame: "EQJ",
    center: "earth"
  },

  samples: [
    {
      time,
      positionKm: [x, y, z],
      velocityKmS?: [x, y, z]
    }
  ],

  events: [...]
}
```

Keep raw source material / extraction results separate from final normalised data where practical.

---

# 5. Normalise reference centres offline

Spike 01 uses explicit Earth/Sun/Moon states.

For Apollo, prefer producing one consistent runtime coordinate representation:

> **Earth-centred EQJ kilometres**

When NASA anchor states are Moon-relative:

```text
Apollo / Moon
    +
Moon / Earth
    ↓
Apollo / Earth
```

Perform this normalisation offline using Astraeus astronomical state at the same timestamp.

The final sampled Apollo trajectory should therefore not need to switch between Earth-centred and Moon-centred reference systems during runtime.

If this proves inaccurate or architecturally unsound, document why before choosing another strategy.

---

# 6. Reconstruct Cartesian anchor states

Where NASA source material provides:

- latitude
- longitude
- altitude
- inertial velocity magnitude
- flight-path angle
- heading
- reference body

derive Cartesian position and velocity vectors in a clearly documented inertial frame.

Do not guess conventions.

Explicitly document:

- latitude definition
- longitude convention
- body reference radius/model
- heading convention
- flight-path angle convention
- epoch/frame transformation
- time conversion

Validate derived vectors wherever independent historical values are available.

---

# 7. Reconstruction strategy

Do **not** simply spline sparse mission-event positions and present the result as physical truth.

Segment the mission according to real mission phases.

Likely phases include:

```text
Earth parking orbit
→ translunar injection
→ translunar coast
→ lunar orbit insertion
→ lunar orbit
→ descent
→ lunar surface
→ ascent
→ rendezvous / lunar orbit
→ trans-Earth injection
→ Earth return coast
→ entry
```

For each segment, choose the simplest defensible reconstruction method.

Possible techniques may include:

- propagation from anchor state vectors
- Kepler/two-body propagation over appropriate coast segments
- patched centre-of-attraction treatment offline
- interpolation where sample density makes it reasonable
- specialised reconstructed data for powered descent

This logic belongs in the **offline reconstruction tool**, not in Astraeus core.

The goal is not navigation-grade reconstruction.

The goal is a trajectory that:

- passes through authoritative NASA anchor states
- has physically credible curvature between them
- remains transparent about its limitations

---

# 8. Provenance must be first-class

Introduce trajectory metadata if useful.

Conceptually:

```ts
trajectory.metadata = {
  sourceType: "reconstructed",
  sources: [...],
  accuracy: "...",
  notes: "...",
}
```

Do not over-engineer a provenance framework yet.

But Astraeus should be capable of distinguishing:

```text
ephemeris
observed
reconstructed
illustrative
```

This matters for scientific honesty.

---

# 9. Preserve the existing Astraeus contract

Apollo must fit the existing conceptual interface:

```ts
interface Trajectory {
  stateAt(time): State
}
```

The existing downstream systems should not care whether a state came from:

```text
orb.js lunar ephemeris
or
sampled Apollo mission data
```

If the existing interface genuinely cannot represent Apollo, document exactly why before extending it.

Prefer the smallest generic extension possible.

---

# 10. Introduce SampledTrajectory

Implement a generic sampled trajectory source.

Conceptually:

```ts
new SampledTrajectory({
  samples: [
    {
      time,
      positionKm,
      velocityKmS?,
      frame,
      center
    }
  ]
})
```

It should support:

- deterministic `stateAt(time)`
- interpolation between samples
- explicit frame
- explicit centre
- optional velocity
- start/end bounds
- clear behaviour outside trajectory bounds

Do not name this `ApolloTrajectory`.

Apollo should simply consume the generic sampled trajectory implementation.

---

# 11. Runtime interpolation

The offline reconstruction should produce sufficient sample density that runtime interpolation can remain simple.

Prefer:

- linear interpolation if sufficiently dense
- Hermite interpolation if velocity samples materially improve smoothness

Avoid putting complex orbital reconstruction into runtime interpolation.

Document:

- sample interval
- interpolation method
- measured interpolation error

---

# 12. Major mission events

Create a small generic event model:

```ts
{
  time,
  id,
  label,
  type?
}
```

Populate supported Apollo 11 events such as:

- launch
- Earth orbit insertion
- translunar injection
- transposition/docking/extraction
- midcourse correction
- lunar orbit insertion
- lunar module separation
- powered descent initiation
- lunar landing
- lunar ascent
- rendezvous
- trans-Earth injection
- entry
- splashdown

Use authoritative event times.

These events are timeline/story metadata, not trajectory physics.

---

# 13. Rendering

Reuse the existing Astraeus pipeline unchanged:

```text
Apollo scientific State
        ↓
ScalePolicy
        ↓
FloatingOrigin
        ↓
render transform
        ↓
Three.js
```

Do not build a separate Apollo coordinate system.

Render:

- spacecraft marker/model
- travelled path
- future trajectory
- optional mission-event markers

Reuse existing path rendering where practical.

---

# 14. Spacecraft representation

Keep the spacecraft visual deliberately simple.

A marker or simple low-detail representation is sufficient.

Allow spacecraft visual size to be exaggerated independently from scientific state.

This deliberately proves:

```text
physical position ≠ rendered object size
```

Do not spend this spike modelling the Command Module.

---

# 15. ScalePolicy test

Demonstrate Apollo using:

```text
TrueScale
ReadableScale
```

The same scientific samples must drive both.

ReadableScale should make the Earth–Moon mission understandable without modifying trajectory state.

Any exaggeration belongs exclusively to presentation.

---

# 16. Floating-origin stress test

Use Apollo to test floating origin across:

- close Earth orbit
- translunar coast
- close lunar orbit
- spacecraft focus
- return to Earth

Verify:

- spacecraft does not jitter
- trajectory remains continuous
- focus transitions do not alter scientific state
- rebasing does not introduce visible jumps

Only change the floating-origin implementation if a reproducible problem requires it.

---

# 17. Camera

Add only generic behaviours needed to inspect the mission:

```text
focus Earth
focus Moon
focus Apollo
follow Apollo
Earth–Moon overview
```

Avoid Apollo-specific camera code.

This should inform, but not yet become, Astraeus's eventual storytelling camera API.

---

# 18. Timeline

Reuse Spike 01 controls.

Adjust the timeline to the Apollo 11 mission window.

Support:

- play
- pause
- seek
- accelerated playback
- mission-event jumps

Choose sensible rates such as:

```text
1×
100×
1,000×
10,000×
```

State at timestamp T must remain deterministic regardless of how T is reached.

---

# 19. Orientation and lighting

Reuse Spike 01 Earth/Moon behaviour unchanged.

Do not regress:

- Earth orientation
- Moon tidal-lock approximation
- Sun direction
- lunar phase
- terminators

Apollo must exist inside the same astronomical scene.

Spacecraft attitude is out of scope.

---

# 20. Validation of reconstruction

Validation is particularly important because this is a reconstructed trajectory.

At every authoritative NASA anchor:

- evaluate the reconstructed trajectory
- compare position/state back to the source anchor
- record residual error

Validate representative points around:

- Earth departure
- translunar coast
- lunar arrival
- lunar orbit
- descent where supported
- TEI
- return coast

The reconstruction should pass through authoritative anchor states within explicitly documented tolerances.

Also perform qualitative checks:

- correct side of Earth departure
- Moon is actually at the arrival location at arrival time
- lunar orbit surrounds the Moon rather than a stale Moon position
- return trajectory intersects Earth correctly

Do not make accuracy claims between anchors without evidence.

---

# 21. SampledTrajectory tests

At minimum test:

### Determinism

Same time produces identical state.

### Bounds

Correct handling:

- before first sample
- first sample
- between samples
- last sample
- after final sample

### Interpolation

Known fixtures interpolate correctly.

### Frames / centres

Invalid combinations fail loudly.

### Scale independence

Changing ScalePolicy leaves scientific state unchanged.

### Floating-origin independence

Rebasing leaves scientific state unchanged.

### Playback independence

Timestamp T returns identical state whether reached through:

- seek
- normal playback
- accelerated playback

---

# 22. Architecture review

At completion classify every change:

## UNCHANGED

Existing Astraeus abstraction worked as-is.

## GENERIC EXTENSION

Apollo revealed something broadly reusable.

## MISSION-SPECIFIC

Must remain outside Astraeus core.

Pay particular attention to:

```text
State
Trajectory
SampledTrajectory
reference centres
frames
ScalePolicy
floating origin
path rendering
camera
timeline
events
provenance
```

If Apollo creates special cases in core, explain why.

---

# 23. Explicit scientific wording

The UI/documentation must not call the generated path:

> "the exact Apollo 11 flight path"

Prefer:

> **Apollo 11 educational trajectory reconstruction based on NASA postflight trajectory data.**

Where useful, distinguish visually or in metadata between:

- authoritative anchor points
- reconstructed samples
- illustrative presentation scaling

Astraeus should favour honest uncertainty over fake precision.

---

# 24. Do not build yet

Exclude:

- launch vehicle physics
- rocket staging simulation
- N-body simulation
- onboard guidance simulation
- maneuver optimisation
- SPICE integration
- spacecraft attitude
- detailed spacecraft models
- terrain
- EVA
- full storytelling DSL
- narration
- React package extraction
- npm publishing
- Perseids
- full Solar System support

The offline reconstruction tool may use orbital propagation as required.

The Astraeus runtime must remain a sampled-trajectory consumer.

---

# Deliverables

## A. Apollo 11 demo

Interactive Earth–Moon Apollo 11 reconstructed trajectory using Astraeus.

## B. Generic SampledTrajectory

No Apollo-specific naming or assumptions.

## C. Reconstruction pipeline

A deterministic offline tool that converts documented Apollo source states into the normalised sampled trajectory.

## D. Data package

Include:

```text
raw / extracted authoritative anchors
normalised anchor states
generated samples
mission events
provenance metadata
```

Do not redistribute source material whose licence does not permit it; store extracted factual data and source references where appropriate.

## E. Validation report

Document:

- source anchors
- reconstruction method by segment
- residual errors
- known gaps
- unsupported claims

## F. Tests

Core and trajectory tests.

## G. Design note

Create:

`docs/ASTRAEUS_SPIKE_02.md`

Include:

1. source research
2. why no complete as-flown public trajectory dataset was used
3. authoritative NASA anchors
4. reconstruction method
5. coordinate/frame conversions
6. sample density/interpolation
7. validation results
8. provenance model
9. generic Astraeus changes
10. Apollo-specific implementation
11. ScalePolicy/floating-origin findings
12. storytelling lessons
13. limitations
14. recommendation for Spike 03

---

# Success criteria

Spike 02 succeeds if:

1. Apollo 11 is represented by a transparent, reproducible reconstruction grounded in authoritative NASA postflight data.
2. Authoritative anchors and reconstructed samples are clearly distinguishable.
3. Runtime uses generic `SampledTrajectory`.
4. `SampledTrajectory` implements the same `Trajectory` contract as existing natural-body providers.
5. No Apollo-specific coordinate/rendering pipeline exists.
6. Earth-centred EQJ state is used consistently at runtime unless evidence proves another approach superior.
7. TrueScale and ReadableScale consume identical scientific states.
8. Apollo can be followed Earth → Moon → Earth without rendering instability.
9. Earth and Moon retain their Spike 01 behaviour.
10. mission events remain separate from trajectory physics.
11. reconstruction residuals against NASA anchors are measured and documented.
12. Astraeus core requires little or no mission-specific modification.

The strongest success signal remains:

> **Delete the word "Apollo" from the generic implementation and every abstraction still makes sense.**

If that is true, Astraeus has proven that `Trajectory` is genuinely reusable.
