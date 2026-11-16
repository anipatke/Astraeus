# PRD: Zodiac Explorer

Status: Proposed for review. Applies with the [shared requirements](README.md).

## Purpose and outcome

Help users trace the zodiac across the star field and understand why the Sun, Moon and planets appear near the ecliptic. Connect the view from Earth to the arrangement in space without requiring prior astronomy knowledge.

For Astraeus, this tests a sky-first experience built from overlays, labels, observers and stories, rather than a catalogue of animated bodies alone.

## Users and needs

- A visitor recognises zodiac names but wants to find the corresponding constellations.
- An educator wants to explain the ecliptic and apparent annual solar motion.
- An observer wants to locate a selected constellation from a chosen Earth location and time.

## Primary journeys

1. Open a sky overview with the ecliptic and constellation labels visible.
2. Select a zodiac constellation to frame it, reveal its outline and read its story.
3. Advance through the year to see the Sun’s apparent position change against the background sky.
4. Switch to a local Earth observer view and learn whether the target is above the horizon.
5. Switch to space to connect apparent solar motion with Earth’s orbit, then return to the same time.

## Required scope

### Sky layers

- Reuse the star field and add independently toggleable ecliptic, constellation figures and labels.
- Include the astronomical constellations crossed by the ecliptic, including Ophiuchus, while explaining how this differs from twelve astrological signs.
- Use a documented constellation figure convention; artistic connecting lines are not official boundaries.
- Show the Sun, Moon and planets where supported by available position data.
- Avoid implying that every moving body lies exactly on the ecliptic.

### Navigation and time

- Select a constellation through an accessible list as well as the scene.
- Provide target framing, reset, time selection, play/pause and a guided annual-motion sequence.
- Provide Earth observer location input and horizon status.
- Retain time and selection when moving between the sky and space explanations.
- Explain educational visibility modes that reveal stars near the Sun; these must not imply naked-eye daytime visibility.

### Stories and terminology

- Give each included constellation a concise identification story and pronunciation/name context where useful.
- Explain ecliptic, constellation, apparent motion and sign using plain language.
- Any equal-width sign overlay is optional and must be separately labelled; astronomical regions must not be drawn as equal thirty-degree segments.
- Clearly mark diagrammatic space-view aids and any exaggerated scale.

## Public API requirements

Use observer location/orientation, sky catalogue, labelled overlays, clock, selection and story interfaces. Constellation line sets and editorial text are consumer data.

Overlay placement must use declared celestial coordinates and follow the selected view correctly. Apps need public visibility controls for layers and public selection events; private renderer access is not acceptable.

## Data and scientific validation

Record star catalogue version, constellation figure source, coordinate epoch and transformations. If official boundaries are included, use an appropriate sourced boundary dataset and distinguish it from figure lines.

Validate selected star/label directions, ecliptic placement, solar motion and local horizon status against approved cases and dates. Establish a supported date interval rather than implying unlimited historical accuracy.

## Acceptance criteria

1. Users can trace the ecliptic continuously across the supported sky view, including across coordinate wrap boundaries.
2. Every included constellation is selectable, labelled and documented consistently.
3. Layer toggles preserve time, selection and camera orientation.
4. Reference checks establish overlay placement and body directions within agreed angular tolerances.
5. The local view correctly reports selected targets above or below the horizon for reference locations and times.
6. The distinction between signs, constellation figures and astronomical regions is understandable without reading external documentation.
7. The app uses public APIs only, and the owner accepts label readability and navigation.

## Delivery stages

1. Approve the constellation dataset, coordinate convention and educational narrative.
2. Build sky overlays and selection in a separate consumer.
3. Add local observer and linked space explanation.
4. Validate geometry, complete content and review accessibility and visual behaviour.

## Exclusions and open decisions

No horoscope generation, full planetarium catalogue, telescope control or atmospheric sky simulation. Review must decide whether official boundaries and an optional sign overlay belong at launch, and how much cultural constellation history to include.
