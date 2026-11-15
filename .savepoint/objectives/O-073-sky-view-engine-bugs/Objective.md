---
id: O-073
title: Sky-view engine bugs
status: in_progress
depends_on: []
release: G-020
priority: high
rank: 1
---

# O-073: Sky-view engine bugs

## Outcome

The engine does what its README already promises in a look-out sky and at the timeline's edges: look-out turns glide, a visitor's tap keeps the sky view, a scene can open paused, playback stops exactly on the end and a panel there opens, a zero-length clear removes the lines, a fractional time throws a `SceneError`, and see-through line colours draw see-through.

## Why

G-020, Zodiac review F-24, F-13, F-02, F-26, F-25, F-22, F-08 (I-176), F-01, F-16. Each was confirmed in source while planning (2026-11-15); each forced app code or an app-side workaround.

## Success Conditions

Owner-confirmed 2026-11-15.

- **Look-out turns glide (F-24).** While the camera is already looking out, `handle.setCamera({ lookOut, direction?, fovDeg? })`, a story panel's camera and the timeline's Go to ease the direction (and field of view) like the orbit camera does; with `prefers-reduced-motion: reduce` they arrive on the next frame (O-072 rule). Entering look-out from orbit may still cut.
- **A tap keeps the sky (F-13, owner "Select it, stay in the sky").** In a look-out camera a sky-figure label hit wins over a body under it, and a visitor's pick of a body selects it without leaving look-out; the menu's Focus/Follow still fly there. Orbit-camera picking is unchanged.
- **Open paused (F-02).** `setTimeline({ playing: false })` opens the viewer paused on its opening time, before the first frame; default stays playing. Readable on `scene.timeline`.
- **Stop exactly on the end (F-26).** Playback that runs into a timeline edge stops on the edge, never one clock tick past it.
- **A panel at the end opens (F-25).** A moment panel at the timeline's end opens when forward playback stops there.
- **Zero-length clear clears (F-22).** `clearSkyTrace(id, { durationSeconds: 0 })` removes lines and label on the next drawn frame, paused or playing.
- **Fractional time (F-08, I-176).** Every public time input given a fractional or out-of-range value throws `SceneError` code `bad-time` (still an instance of `RangeError`, so existing catches keep working); README Errors and time rule updated; `tests/fractionalTime.test.ts` expectation moves with it.
- **See-through colours (F-01).** A look line colour with alpha (`rgba()`, `hsla()`, `#rrggbbaa` if accepted) draws with that alpha multiplied into the line's opacity.
- **Docs (F-16).** README `addEvents`, `EventInput` and `SceneEventRead` agree that an event's object may be a body, path or sky figure.
- CHANGELOG `Unreleased` entries; no version bump.

## Architectural Considerations

- Look-out easing: `applyLookOut` in `src/app/sceneCamera.ts` sets current and target angles together; `resolveCamera` (`src/app/CameraController.tsx`) already eases toward targets. Field of view needs a target on `LookOutState` (`src/app/lookOut.ts`).
- Picking order lives in `src/app/scenePointer.ts` / `src/app/scenePicking.ts`; a body pick's focus preset is in `src/shell/AstraeusShell.tsx` `pickObject`.
- Opening play state: `src/app/openClock.ts` reads `definition.clock.playing`, planned in `src/api/planTimeline.ts`.
- Clock edge: `stopWithin` in `src/core/clock.ts`; panel crossings in `src/shell/storyPanels.ts` (only while playing); frame wakes in `src/app/sceneFrame.ts` and `src/app/SkyFiguresView.ts` `clearTrace`.
- Fractional time: `assertUtcUnixMs` in `src/core/state.ts` stays core (ARCH-04); `src/api/` converts to `SceneError` (API-05).
- Colours: `isCssColour` in `src/core/lookValues.ts`; line materials in `src/app/SkyFiguresView.ts` and other look-line consumers.
- Public surface changes update the API lock, README tables and CHANGELOG together (API-01, API-07).

## Boundaries

**In scope:** the nine fixes above, their tests, README and CHANGELOG.

**Out of scope:** time zone/format (O-074); panel auto-close, sky-only mode, switch labels, reads (O-075); constellation data (O-076); camera offset; per-figure trace colours; a version bump or publish.
