# PRD: Eclipses & Transits Explorer

Status: Proposed for review. Applies with the [shared requirements](README.md).

## Purpose and outcome

Explain the Moon, Mercury and Venus passing in front of the Sun by connecting a spatial view of the bodies with the sky seen from a specific Earth location. Users should see why one event covers the Sun while another produces a small moving silhouette.

For Astraeus, this validates observer-dependent apparent geometry, angular sizes, precise event playback and synchronised views.

## Users and needs

- A visitor wants to understand the difference between an eclipse and a transit.
- An educator wants to relate alignment in space to appearance in the sky.
- An enthusiast wants to replay a documented event from an appropriate location and inspect its timing.

## Primary journeys

1. Select an event and load a default observing location where it is visible.
2. Play the event in the observer view, pausing at labelled stages.
3. Switch to or open a linked space view explaining the alignment at the same time.
4. Change observing location to see how circumstances differ or why the event is not visible.
5. Compare the Moon, Mercury and Venus cases using the same controls.

## Required scope

### Launch events

- One well-documented solar eclipse, one Mercury transit and one Venus transit.
- Choose the initial solar eclipse and observing sites to demonstrate an unambiguous event; total/partial differences across sites should be explained where supported.
- Support a data-driven event catalogue. Annular eclipses are an extension unless explicitly selected for launch.
- Each event includes a supported time window, recommended observing locations, source notes and explanatory chapters.

### Observer view

- Accept Earth latitude, longitude and elevation through the shared observer interface.
- Show the Sun and foreground body with physically correct angular size relationships.
- Support target tracking and magnification without changing the ratio between apparent discs.
- Display horizon status and explicitly explain below-horizon or unavailable circumstances.
- Provide play/pause, scrubbing, event-relative time and jumps to supported contact markers.
- Label the image as a simulated astronomical view; do not present visual filter styling as actual photographic colour.

### Space view and event information

- Present the participating bodies, alignment and observer location using declared physical or diagrammatic scales.
- Preserve time when switching views; linked simultaneous panes are optional if a toggle satisfies the explanation.
- Identify contact markers by both name and plain-language description.
- Report site-specific contact times only where calculated and validated. A global catalogue timestamp must not be substituted for a local contact.
- Explain that an orbit-line toggle controls configured paths; it does not alter event geometry.

### Eclipse shadow extension

An Earth shadow footprint or moving eclipse path is a separately validated extension, not a launch dependency. If included, distinguish umbra, penumbra and any schematic exaggeration; verify the footprint and event timing independently.

## Public API requirements

Depend on the observer-view foundation for surface position, orientation, local horizon and view switching. Reuse clock, body providers, target tracking, overlays, line controls, stories and timed markers.

Apparent positions used for contact calculations and the rendered view must use a documented consistent model. Shared geometry needed by multiple consumers should be public engine capability, while event selection and stories remain app-owned.

## Data and scientific validation

Select events only after confirming sufficient ephemerides, body radii/orientation data and independent site-specific reference circumstances. Document treatment of light-time, aberration, refraction, limb shape and other corrections; do not claim precision beyond the adopted model.

Before implementation acceptance, agree tolerances for angular separation, apparent diameters and contact timing. Account for omitted atmospheric effects near the horizon. Use distinct evaluation samples, not only the values from which a visual path was constructed.

## Acceptance criteria

1. All three event types work through a common viewing and playback implementation.
2. Reference locations reproduce angular alignment, apparent-size ratios and supported contact times within approved tolerances.
3. Changing location updates the event circumstances and horizon state consistently.
4. Observer and space views preserve the same selected time and event.
5. Magnification and teaching aids are clearly distinguished from physical geometry.
6. Missing or out-of-range data cannot silently produce a plausible-looking event.
7. The owner accepts the educational comparison and visual behaviour; the consumer uses public exports only.

## Delivery stages

1. Complete the observer capability and select reference events/sites.
2. Validate one eclipse without a shadow map.
3. Add Mercury and Venus through the same data contract.
4. Validate contacts and location changes, then complete content and review.

## Exclusions and open decisions

No comprehensive event search, lunar eclipse experience, terrain-based contact prediction, atmospheric optics or observing-equipment guidance. Review must choose launch events, supported precision and whether shadow mapping is worth a later objective.
