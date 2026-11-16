# PRD: Solar System Explorer

Status: Proposed for review. Applies with the [shared requirements](README.md).

## Purpose and outcome

Provide a coherent app for exploring the solar system from its overall structure down to planets, supported moon systems and surface-observer views. Users should understand relative position, motion and scale without becoming lost when changing focus.

“Full scale” means physical positions and body dimensions retain their declared scale. It does not mean every minor body, terrain feature or historical date is included. Any display exaggeration must be explicit.

For Astraeus, this is the integration test of packaged data, hierarchical navigation, time, observer views and rendering across very different distances.

## Users and needs

- A visitor wants to find a planet and explore its moons.
- An educator wants to demonstrate scale and orbital relationships.
- An enthusiast wants to see the sky from another body, such as Jupiter from Io.

## Primary journeys

1. Open the solar-system overview, select a planet and travel to its system.
2. Select a moon, inspect its relationship to the planet and follow its motion.
3. Enter an observer view on a supported body and track another body.
4. Return to the previous space view without losing time or selection context.
5. Compare distances and sizes using readouts and labelled visibility aids.

## Required scope

### Catalogue and data

- Include the Sun, eight planets, Pluto and the moons approved from the available data packages.
- Publish a coverage table naming bodies, supported time intervals, data quality and observer support. Inclusion in the catalogue does not automatically imply surface-observer support.
- Load selected planetary-system datasets on demand.
- Show useful loading/error states and retain a working overview if a system dataset is unavailable.

### Navigation

- Provide a searchable body list, a visible hierarchy and a clear route back to the system overview.
- Support focus, follow, reset and transitions between system, planet/moon and observer views.
- Keep target identity and time visible during transitions.
- Avoid camera paths through opaque body interiors. Allow interruption of a transition.
- Give a meaningful selected-body view even when its orbit is too small to distinguish at the current scale.

### Time, scale and information

- Provide play/pause, time selection and appropriate speed controls with explicit supported-range behaviour.
- Offer a global toggle for configured orbit lines. Additional per-body filtering is optional.
- Preserve true physical placement; show separately labelled selection markers or apparent-size aids when necessary.
- Present sourced body facts and contextual distance readouts with units and defined reference points.
- Clearly distinguish schematic teaching diagrams from the physical scene if such diagrams are included.

### Observer experience

- Reuse the generic observer API and its supported-body rules.
- Include Earth, Moon and Io demonstrations after their shared capability is validated.
- Preserve observer location and view state on return where practical.

## Public API requirements

Compose catalogue/data sources, body providers, clock, camera navigation, orbit lines, observer views and stories through public interfaces. The consumer controls which systems and assets are offered.

The API must support loading/unloading systems, reporting coverage and selecting bodies without hard-coded demo names. A consistent time state must drive every loaded system.

## Data and scientific validation

Maintain a per-provider coverage and accuracy inventory. Validate representative positions and relative separations at shared times, including a planet/moon case and a system-scale case.

Test precision and clipping across the largest required scale transitions. Source-compatible data and frame transformations must be established before combining different packages. Do not silently freeze a moon while its planet continues beyond the moon dataset’s valid interval.

## Acceptance criteria

1. All approved catalogue bodies are reachable through the same navigation model.
2. A user can complete overview → planet → moon → observer → overview while preserving the selected time.
3. Position, size and distance reference cases meet agreed tolerances.
4. Scale aids are identifiable and do not change the underlying scientific readouts.
5. Missing packages or unsupported dates produce explicit states.
6. Optional systems load on demand and repeated system changes release obsolete resources.
7. The packed consumer passes public-boundary checks; the owner accepts navigation, legibility and scale transitions.

## Delivery stages

1. Approve catalogue and data coverage; define scale/navigation behaviour.
2. Build overview and one complete planet/moon system.
3. Add remaining approved systems and lazy loading.
4. Integrate observer views, validate cross-system consistency and complete consumer review.

## Exclusions and open decisions

No exhaustive asteroid catalogue, terrain, landing simulation, live spacecraft tracking or general-purpose gravitational simulator. Review must approve the moon list, launch date interval and preferred visibility aids.
