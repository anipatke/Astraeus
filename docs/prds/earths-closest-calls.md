# PRD: Astraeus — Earth’s Closest Calls

Status: Proposed for review. Applies with the [shared requirements](README.md).

## Purpose and outcome

Explain exceptionally close recorded asteroid flybys through accurate, replayable trajectories and clear comparisons with Earth’s size. Users should understand what passed, how close it came, how fast it moved and how confidently its path is known.

For Astraeus, this proves external sampled trajectories, reference-frame changes, timed events and large changes in viewing scale through public APIs.

## Users and needs

- A visitor wants to understand a striking close-approach headline.
- An educator wants to explain why an encounter trajectory differs from a simple unperturbed ellipse.
- An enthusiast wants to inspect the encounter timing, distance, velocity and source quality.

## Catalogue definition

Launch with ten validated recorded flybys, with the same schema supporting approximately fifteen. The proposed historical window is 1 January 2000 through 23 October 2026; exclude known atmospheric impacts.

The owner-supplied provisional candidates are 2025 UC11, 2020 VT4, 2025 TF, 2024 XA, 2024 LH1, 2024 UG9, 2020 QG, 2021 UA1, 2025 BP6 and 2023 BU. Neither the ranking nor supplied numerical claims are independently verified by this PRD. Confirm object identities, exclusions, dates and source records before publication.

Rank by nominal closest Earth-centre distance minus a declared 6,371 km mean Earth radius. Label this as clearance above a mean spherical surface; it is not local terrain clearance. Preserve the snapshot date and disclose whether ranking completeness has been established.

## Primary journeys

1. Choose an encounter from a ranked list and read its key facts and confidence notes.
2. View the asteroid and Earth in heliocentric context over a separately defined overview interval.
3. Move to an Earth-centred flyby, pause and scrub around closest approach.
4. Inspect live centre distance, mean-surface clearance and relative speed.
5. Replay with a closest-approach marker and open the data/provenance explanation.

## One shared timeline (owner idea, 2026-11-10)

All ten provisional candidates fall between 16 August 2020 (2020 QG) and 30 October 2025 (2025 UC11), about five years and two months. Run them together on a single timeline instead of ten separate replays.

- **Pacing:** each flyby lasts hours, so a constant rate makes them blips. Mark each closest approach as a timed event and let playback slow automatically as each one approaches, running quickly through the months between and almost stopping for the minutes around closest approach.
- **Timeline zoom:** the visitor zooms from the whole span to the hours around one flyby.
- **Two views:** a Sun-centred overview shows all ten orbits crossing Earth's path across the years; an Earth-centred close-up shows each pass at its true distance. The app switches views as each flyby comes and goes.
- **Two kinds of position data:** orbital elements place each asteroid in the long stretches between flybys; sampled Horizons states take over in the window around each encounter. The hand-over must be continuous in time and position (see Trajectories and playback).
- **Ranked list as navigation:** the ranked list beside the timeline jumps to any encounter.

Expectation to confirm against the 0.9.0 public API before planning: this needs little or nothing new in the engine (timed events and slow-down zones, timeline zoom, views, element orbits and sampled paths already exist). Plan engine additions only for real gaps.

## Required scope

### Trajectories and playback

- Use sourced time-stamped states for the close encounter rather than an illustrative Keplerian ellipse.
- Target a 48-hour flyby window centred on closest approach, with roughly minute sampling near the encounter and coarser sampling only when validated.
- Treat sampling cadence as an initial proposal. Establish interpolation error against denser independent samples, especially for the fastest and closest cases.
- Use separately sourced heliocentric tracks for a useful orbital overview interval. A short flyby track must not masquerade as a complete orbit.
- Keep overview and flyby states consistent in time and document any differing propagation assumptions.
- Support play, pause, scrub, speed control, reset and line visibility.

### Presentation

- Show true Earth size and trajectory placement. Asteroid markers may be enlarged for selection if clearly identified.
- Show encounter-relative time and an explicit absolute time standard.
- Distinguish instantaneous clearance from the encounter’s minimum clearance.
- Explain nominal trajectory uncertainty without presenting a fabricated confidence envelope.
- If size estimates or familiar altitude comparisons are used, source them and show uncertainty or approximation.

## Public API requirements

Use sampled state providers, declared coordinate frames, shared clock, path lines, target tracking, timed markers and story panels. Reference-frame switching must not create a discontinuity in the represented encounter.

Distance and speed readouts must use public scientific state, not values reverse-engineered from rendered positions. The consumer owns catalogue ranking and encounter narratives.

## Data package and provenance

Proposed logical datasets: encounter catalogue, flyby tracks and heliocentric overview tracks. Final file boundaries may use per-encounter chunks for loading efficiency. Orbital elements are optional supporting data, not required if sampled overview tracks satisfy the experience.

Retain source query parameters, retrieval date, target identity, frame, origin, time standard, units, valid interval and applicable orbit-solution metadata. Candidate sources for validation include JPL close-approach records, Horizons states and small-body solution metadata; availability must be demonstrated during the data spike.

Review observational coverage, uncertainty and the relationship between the nominal trajectory and source close-approach solution. Do not imply a historical orbit is exact or that orbit metadata alone defines an uncertainty volume.

## Acceptance criteria

1. Every published entry has verified identity, provenance, units and an explicit validity interval.
2. Ranking and exclusions are reproducible for the declared snapshot; otherwise the title states it is a selection rather than a definitive top ten.
3. Independently evaluated minimum distance, timing and speed agree with source values within approved tolerances.
4. Interpolated tracks meet the approved positional error budget between samples.
5. Playback, markers and readouts remain synchronised through view changes.
6. An additional encounter can be added through data/content without engine changes.
7. The owner accepts the scale explanation and the separate consumer uses public APIs only.

## Delivery stages

1. Validate one candidate end to end, including data retrieval, interpolation and closest approach.
2. Prove overview/flyby continuity and the replay interface.
3. Validate and package the catalogue; reconcile provisional rankings.
4. Review scientific claims, accessibility and consumer integration.

## Exclusions and open decisions

No live hazard service, impact prediction, impact simulation or assurance of future safety. Review must approve the snapshot date, final catalogue, overview duration (the shared timeline suggests the whole 2020–2025 span) and numerical error budget. Data extraction is an early feasibility step, not completion of the product.
