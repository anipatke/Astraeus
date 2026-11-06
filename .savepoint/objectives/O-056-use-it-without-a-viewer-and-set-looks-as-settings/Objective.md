---
id: O-056
title: Use it without a viewer and set looks as settings
status: done
depends_on: [O-055]
release: G-016
priority: high
---

# O-056: Use it without a viewer and set looks as settings

## Outcome

A Node or server app loads data with one public call and asks `stateOf` / `provenanceOf` about any body, moons included; `scene.check({ data })` throws exactly what `mount` would; public reads say what a scene holds (the replacements for `toDefinition`, D10); looks and viewer controls are public settings the address only overrides; events can carry their own zone, independent of pacing; a small non-probe example proves it (review F6, F11, F9, the non-probe example; API-06; owner D4).

## Why

G-016 chunk 4, ordered before the breaking chunk so the Voyagers and showers apps can move off `toDefinition` (they use it in tests to check scenes, load data and read composition) before O-057 removes it.

## Success Conditions

1. **Numbers without a viewer.** `await scene.load({ data })` loads what the scene's bodies need (planet series, the moon chunks of the passed data packages for the scene's window); afterwards `stateOf` / `provenanceOf` answer every body in the scene, moons included. Before it, a planet or moon read throws `missing-data` naming `scene.load` (no internal name in any message). A cold-start Node test (no preload) in `check:node-consumer` proves it on the packed package, and one public-API test file in the engine runs without `vitest.setup.ts`'s preload.
2. **One check, same errors.** `scene.check({ data })` runs exactly the build and data checks `mount` runs and throws the same `SceneError` (same code, same message) for every build fault; a table-driven test runs each fault through both.
3. **Read what a scene holds.** Read-only properties list what the scene holds as public types: `bodies`, `paths`, `groups`, `events`, `panels`, `views`, `scales`, `timeline` (owner decision 2: plain lists, not one summary call). Each answer is frozen and built from the scene's own plans, never from `ExperienceDefinition`. The Voyagers and showers test reads (body list, path ids, group count and provenance, event ids and provenance, view start, scale choices, clock start, story panels, camera far, planet orbit lines) each have a public answer, listed in a migration table in the CHANGELOG.
4. **Looks are settings.** One public `LookInput` (star brightness, Milky Way on/off and brightness, sky on/off, Sun glow size, scale and brightness, marker and feature sizes, load fade), with unit-carrying names and documented defaults, is set by `scene.setLook(look)` and changed live by `handle.setLook(look)` with a `handle.look` read, on both embedding paths (owner decision 1: both build and live). One table maps each address parameter to its `LookInput` key, read through `src/app/address.ts`; the address only overrides. The `addressOnly` section of `apiSettings.allowlist.json` is empty.
5. **Live host controls (F10 rest).** The handle gains a scale read and setter and display-switch reads and setters; `addBody` takes `readouts` (the `ReadoutInput` paths use). The shared lifecycle suite and `twoViewers.test.ts` cover every new handle member on both paths.
6. **Event zones stand alone (D4).** `EventInput.withinSeconds` gives an event its own zone; `onEventZone` and `eventZones` report it with or without pacing; a pacing event rule uses the event's zone where it has one. Zones remain presentation (ARCH-02).
7. **A third, non-probe example (owner decision 3).** `examples/hello-planets`: the Sun to Mars framed with `fitOrbit`, the host's own look sliders through `handle.setLook`, a live scale switch and a "distance from Sun" readout on a planet; built from the packed tarball by `build:example`, no data package, phone layout from the first build (375x667 and 1280x720, no overlaps).
8. API-surface lock, README tables and CHANGELOG updated in the same change as each surface change; Design reconciled; owner look at the example on `localhost:5490` before one Full Objective Check.

## Confirmed Decisions (owner, 2026-11-03)

1. Looks: set when building (`scene.setLook`) and live on a running viewer (`handle.setLook`).
2. Scene reads: plain read-only lists on the scene, not one summary call.
3. Third example: inner planets tour (Sun to Mars, fit to frame, look sliders, scale switch, distance readout), no data download.
4. Six steps in sequence under the O-055 run rules: one Sonnet builder at a time, step checks waived, coordinator marks done and commits per step, owner look at the last step, one Full Objective Check.

## Architectural Considerations

Settings and zones are presentation (ARCH-02); the address stays an override read through `src/app/address.ts` (T-223).

## Boundaries

**In scope:** F6, F9, F11, the non-probe example, the `toDefinition` replacements; F10's remaining host controls: live scale and display-switch setters on the handle, and readouts on `addBody` (moved here from O-054 by the owner, 2026-11-01, "Yes, all recommendations").

**Out of scope:** removing `toDefinition` and the renames (O-057).
