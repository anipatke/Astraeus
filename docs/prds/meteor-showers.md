# PRD: Meteor Showers

Status: Proposed for review. Applies with the [shared requirements](README.md).

## Purpose and outcome

Turn the existing shower demonstration into an educational app covering approximately twelve meteor showers. Users should understand where a shower comes from, how Earth encounters its stream and where its radiant appears in their sky.

For Astraeus, the product proves that a family of related experiences can be built from shared public APIs and varied data, rather than separate implementations for each shower. Catalogue size is a product requirement; unsupported scientific fidelity is not.

## Users and needs

- A curious visitor wants to understand a named shower in a few minutes.
- An observer wants to locate its radiant for a chosen place and time, with clear limits on what the app predicts.
- An educator wants a controllable explanation of the relationship between stream, Earth and radiant.
- An integrating developer wants a repeatable way to add a shower without modifying Astraeus.

## Primary journeys

1. Open the app, choose a shower and read a short description while its solar-system context loads.
2. Advance time through the encounter, displaying Earth, the parent orbit when available and a representative stream.
3. Switch to an Earth observer location and locate the radiant relative to the horizon and stars.
4. Open the story to learn about the parent body, typical activity period and the meaning of the visualisation.
5. Select another shower while retaining applicable location and viewing preferences.

## Required scope

### Catalogue and selection

- Ship approximately twelve showers, including the existing Perseids and Geminids. The additional names require an approved data inventory.
- Each entry supplies display name, identifiers, activity period, representative peak information, radiant model, parent association when supported and source notes.
- Explain that activity periods and peaks are representative or year-specific, as appropriate. A generic date must not be presented as a precise forecast.
- Selection updates the scene, narrative and readouts together. A missing parent-body association does not disable the shower.

### Stream and orbital view

- Show Earth’s relationship to the selected stream and any supported parent trajectory.
- Distinguish measured orbit samples from illustrative particles or stream envelopes.
- Provide play, pause, time scrubbing, target framing, reset and a toggle for configured orbit lines.
- Define the valid interval of each moving dataset; outside it, stop or show an explicitly labelled approximation.

### Observer view

- Accept latitude, longitude and observation time without requiring device geolocation.
- Display radiant direction, horizon and useful text such as above/below horizon status.
- Meteor streaks, if included, are illustrative and must not imply a forecast of actual meteor timing or rates.
- Explain that darkness, weather and observing conditions affect visibility. The app does not compute a comprehensive observing-quality forecast.

### Content and continuity

- Use the same story and controls structure for every shower.
- Preserve selected time when switching views; frame the new view sensibly.
- Preserve location across shower changes. Where a time change is necessary to reach a shower’s representative event, make that change explicit.

## Public API requirements

Use shared clock, body/trajectory providers, object groups, line rendering, stories and observer controls. Shower-specific inputs should be supplied through consumer-owned data and configuration.

The API must support changing the active configuration and disposing replaced resources without creating another engine instance unnecessarily. Radiant/stream relationships must not require names such as Perseids inside engine logic.

## Data and scientific validation

Prepare an inventory before promising all catalogue entries. Record availability and quality of stream samples, parent trajectories and radiant motion separately. A simplified model is acceptable when labelled and appropriate to the educational claim.

Validate representative radiant positions and Earth/stream relationships against approved references. Test at least one shower with rich data and one with sparse data. Dates, coordinate conventions and radiant motion models must be explicit.

## Acceptance criteria

1. The approved catalogue is available through one shared experience implementation.
2. A developer can add a documented extra shower by supplying data/configuration and content, without changing engine source.
3. Selecting, playing, scrubbing and switching views keep scene and readouts consistent.
4. Radiant direction and horizon status meet pre-agreed reference tolerances for selected test cases.
5. Missing or out-of-range data produces an honest, usable state rather than an invented precise result.
6. The built consumer uses public exports only; all primary controls are keyboard accessible.
7. The owner accepts the stream explanation, radiant presentation and transition between views.

## Delivery stages

1. Audit the two existing shower datasets and public API usage; approve the expanded catalogue.
2. Build the common catalogue/stream experience and prove a third shower needs no bespoke engine code.
3. Integrate observer view and validate radiant geometry.
4. Populate the remaining catalogue, review content and run the consumer acceptance gates.

## Exclusions and open decisions

No live detections, exact meteor-count forecasts, weather service, exhaustive shower database or claim of uniform dataset fidelity. Review must settle the additional shower list, representative year/date policy and whether animated streaks are needed for launch.
