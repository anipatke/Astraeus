# PRD: Observe from Any Supported Body — Observer Views & Orbit Controls

Status: Proposed for review. Applies with the [shared requirements](README.md).

## Purpose and outcome

Let an Astraeus consumer place an observer on a supported body and explore the sky from that location as time advances. Support Earth, Moon and Io through one public contract, including the experience of looking at Jupiter from Io.

Also expose a public toggle for configured orbit lines, usable from both surface-observer and space views without resetting the scene.

This is a shared capability project with a separate consumer demonstration. It is not limited to three named bodies: those are required proof cases for a general contract.

## Users and needs

- An app developer needs a surface observer without implementing coordinate transformations or accessing renderer internals.
- A user needs a predictable way to look around, track a target and return to space.
- An educator needs consistent apparent geometry and a local horizon for explaining sky phenomena.

## Required demonstrations

| Observer | Target | Purpose |
|---|---|---|
| Earth | Sun and Moon | Establish the basis for eclipse and transit views |
| Moon | Earth | Prove rotation/orientation and geometry away from Earth |
| Io | Jupiter | Prove reuse across planetary systems and a large apparent target |

Demonstrations use the same API and shared controls. Consumer configuration selects bodies, initial locations and target choices.

## Primary journeys

1. Choose a supported body and enter a surface location.
2. Enter observer mode with a sensible initial direction and visible location/time context.
3. Look around the local sky or select a target to track.
4. Advance time while the observer stays attached to the rotating body.
5. Toggle configured orbit lines and inspect their relation to the sky.
6. Return to the prior space view at the current time, then return to the saved observer location.

## Functional requirements

### Observer contract

- Specify host body, latitude, longitude and elevation, with explicit angle and distance units.
- Declare longitude direction/range, latitude convention, reference surface and prime-meridian/rotation convention. Translate user-friendly input where needed without ambiguity.
- Require body position, orientation and shape capabilities for the requested interval. Return structured unsupported/missing-data information when these are absent.
- A spherical reference surface is acceptable initially if documented. Do not imply terrain accuracy or accept an ellipsoidal interpretation silently.
- Keep geometry reusable for app-provided bodies; body names must not select hidden special-case code.

### Time and orientation

- Compute observer world position and local east/north/up basis from the same clock and frame system as target bodies.
- Support rotating and synchronously rotating bodies through supplied orientation data, without assuming that every body uses Earth conventions.
- Define stable behaviour at poles and longitude wrap boundaries.
- Reject invalid locations and explain dates outside required providers’ coverage.
- State whether directions are geometric or include apparent-position corrections. Higher precision required by later products must be explicit.

### Viewing controls

- Support free look, target tracking, reset and switching to/from space view.
- Target selection may be outside the visible sky; report occultation or below-horizon status rather than forcing it to appear.
- Apply declared field-of-view limits consistently. Zoom changes magnification, not the physical angular relationship between bodies.
- Surface view occludes geometry behind the host body consistently. Other-body occlusion follows the shared scene geometry.
- The reference horizon can be a simple geometric horizon. A visually understandable ground mask is acceptable without detailed surface scenery.
- Report selected body/location, direction or target, time and relevant availability state through public interfaces.

### Orbit-line toggle

- Expose public visibility state and an operation for all orbit lines configured by the consumer.
- Demonstrate it through an accessible control in both viewing modes.
- Preserve time, observer, camera direction, target and line configuration when toggling.
- Hidden lines become visible again using their previous data and styling; visibility does not alter trajectories or readouts.
- In observer view, project lines using the observer camera and apply host/body occlusion. A conceptual path is not a claim that the orbit is physically luminous.
- If no lines are configured, the control explains that state or is disabled. It must not invent missing orbital paths.
- Per-body filtering, style editors and new trajectory types are outside this feature.

## Public API and integration requirements

Expose observer configuration, capability/coverage status, view mode, target/free-look controls and orbit-line visibility through documented exports. Exact symbols and signatures are design decisions after inspecting the current API.

Keep rendering and frame transformations inside Astraeus. Consumer UI may be custom. State changes must be observable without reading private camera objects; disposal and scene remounts must release observers/listeners correctly.

Provide a packed-package consumer example covering all three demonstrations, a minimal integration guide and a support matrix. Document required body data so an integrator can add a fourth body without engine modifications.

## Scientific validation

Validate observer position, local axes, target direction, horizon relation and apparent angular size against approved independent cases. Cover multiple Earth locations, lunar viewing of Earth and Io viewing Jupiter at multiple times.

Include pole/wrap boundaries, rotation over time, below-horizon targets, missing orientation and out-of-range dates. A synthetic body case should test that the contract has no dependency on bundled body identities.

Agree numerical tolerances before acceptance. Separate errors in input ephemerides/orientation from observer transformation errors. Record known limitations, including geometric horizons, surface approximation and any omitted apparent-position corrections.

## Acceptance criteria

1. Earth, Moon and Io demonstrations use one public observer contract and shared controls.
2. A consumer-provided body with complete supported data can be configured without changing engine code.
3. Position, local axes, direction and angular-size cases meet agreed tolerances across the supported interval.
4. Time changes, target tracking and view switching preserve consistent scientific state.
5. Unsupported bodies, invalid inputs and missing temporal coverage produce clear structured and visible feedback.
6. Orbit-line toggling works in both modes, preserves view state and respects geometric occlusion.
7. All primary controls work by keyboard, and the owner accepts navigation and the three demonstrations.
8. Documentation and the packed consumer prove public API use without private imports.

## Delivery stages

1. Audit current camera/frame/body contracts; approve observer semantics and data prerequisites.
2. Implement Earth observer geometry and a minimal consumer view.
3. Prove Moon and Io through the same contract; validate custom-body extensibility.
4. Add orbit visibility state/control and verify projection/occlusion in both modes.
5. Complete independent geometry evidence, consumer documentation and owner visual review.

## Exclusions and open decisions

No terrain, walking, surface collision physics, atmosphere/refraction, detailed ground textures, eclipse shadow mapping or catalogue of events. No promise that every currently catalogued body already has sufficient orientation data.

Review must approve the initial shape convention, required orientation datasets, geometric versus apparent-position precision, supported intervals and field-of-view limits. A future precision extension must not require apps to rewrite the basic observer contract.
