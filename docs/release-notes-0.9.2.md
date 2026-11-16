# Astraeus 0.9.2

## astraeus 0.9.2 (2026-11-17)

A patch release from the Zodiac project review of 0.9.1: look-out camera turns glide as the README says, a tap keeps the sky view, a scene can open paused, the clock can read in the visitor's zone, and a scene can say back what it was set to. Additions and fixes only; no call changed shape. One stricter check may need a change: a story panel `at.time`, an anchor `time` or a `shownDuring` start or end must now be a whole millisecond within range (see Upgrading). The nine packages move together to 0.9.2; the `astraeus-data*` packages keep peering on `astraeus` `>=0.9.0 <0.10.0`.

First download of the packed example (`npm run measure:example`): 1,773,029 bytes raw, 510,085 bytes gzip (code and styles loaded on first open), against 1,764,446 raw and 507,330 gzip at 0.9.1 (+8,583 raw, +2,755 gzip).

### What changed for app makers

- **Look-out turns glide.** While the camera already looks out, `setCamera({ lookOut, direction?, fovDeg? })`, a story panel's camera and the timeline's Go to ease the direction and field of view instead of cutting. With `prefers-reduced-motion: reduce` they arrive on the next frame. Entering a look-out from the orbit camera still cuts. (O-073)
- **A tap keeps the sky.** In a look-out camera a tap on a sky figure's name or line wins over a body under it, and a tap on a body selects it and stays in the sky view. Orbit-camera taps are unchanged. (O-073)
- **Open paused.** `setTimeline({ playing: false })` opens the viewer paused on its opening time. `scene.timeline.playing` reads it. A non-boolean throws `bad-timeline`. (O-073)
- **Stop on the end.** Playback that runs into a timeline edge stops exactly on it, and a moment panel at the end opens when forward playback stops there. (O-073)
- **Clear at once.** `clearSkyTrace(id, { durationSeconds: 0 })` removes the lines and label on the next drawn frame, even when paused. (O-073)
- **Bad times.** A fractional or out-of-range time now throws a `SceneError` with code `bad-time` (still a `RangeError`), including `stateOf` on a provider path and `stateOf(provider, 1e16)`. A fractional panel `at.time`, anchor `time` or `shownDuring` start or end is refused with that call's own code (`bad-panels`, `bad-anchor`, `bad-body`, `bad-trajectory`). (O-073, I-176)
- **See-through line colours.** A sky-line colour with alpha (`rgba()`, `hsla()`, `#rrggbbaa`, `#rgba`) draws with that alpha. (O-073)
- **README.** An event's `object` may be a body, path or sky figure, in the README, `EventInput` and `SceneEventRead`. (O-073)
- **Time in the visitor's zone.** The look `time: { zone?, precision? }` (`scene.setLook`, `handle.setLook`; read on `handle.look.time`) sets how the clock bar, slider text, bound dates, event list and event cards read. `zone` is `"UTC"` (default), `"local"` or an IANA name; `precision` is `"day"`, `"minute"` or `"second"` (default). An unknown zone or precision throws `bad-look`. New type `TimeLook`. (O-074)
- **Panels that close themselves.** `setStoryPanelPlayback({ closeAfterSeconds })`, or `closeAfterSeconds` on one moment panel, closes an open moment panel once forward playback passes its time plus that many simulated seconds. `onPanel` hears it with `cause: "playback"`. With none set, panels behave as before. (O-075)
- **Phone sheet height.** The look `sheetMaxPercent` (30 to 85, default 50) caps the phone information and story sheet. (O-075)
- **Hide camera buttons.** `scene.camera.setFocusChoices(ids)` and `scene.camera.setOverview(false)` work like `setFollowChoices`; with all kinds empty, a look-out-only scene shows no orbit camera buttons. (O-075)
- **Switch labels.** A `setSwitches` entry takes `label`, shown in the top bar and the switch panel. (O-075)
- **Read it back.** `scene.look`, `scene.switches`, `scene.panelPlayback` and `scene.timeline.pacing` give back what the scene was set to, with no browser. New types `ScenePanelPlaybackRead`, `SceneSwitchRead`, `ScenePacingRead`. (O-075)

Full details: `packages/astraeus/CHANGELOG.md`.

## astraeus-data 0.9.2

- **Milky Way on its own.** `astraeus-data/milky-way` exports `milkyWaySource`, a data source holding the Milky Way picture alone, so a sky-only app copies that picture and not the moon and Venus maps. The main export, every picture and every licence record are unchanged. (O-076)

Full details: `packages/astraeus-data/CHANGELOG.md`.

## astraeus-data-constellations 0.9.2

- **Which constellation holds a direction.** `constellationFinder()` resolves to a synchronous function from a J2000 direction `{ raDeg, decDeg }` to the IAU abbreviation of the constellation that holds it (both Serpens loops answer `"Ser"`). A bad declination or a non-finite number throws a `RangeError` naming the field. (O-076)
- **Outline labels.** `constellations(..., { outlineLabel })` names each boundary outline's label so an app can tell outlines from figures. Labels are unchanged without it. (O-076)

This package has no changelog file of its own; its entries are in `packages/astraeus/CHANGELOG.md`.

### Upgrading

Install the `astraeus-data*` packages with `astraeus` 0.9.2 (they accept any 0.9.x, `>=0.9.0 <0.10.0`). One change may be needed: a fractional or out-of-range story panel `at.time`, anchor `time` or `shownDuring` start or end, accepted in 0.9.1, is now refused with that call's own code (`bad-panels`, `bad-anchor`, `bad-body` or `bad-trajectory`); round such times to a whole millisecond (for example `Math.round(ms)`). Nothing else needs a change. A `bad-time` error is still an `instanceof RangeError`, so existing catches keep working.
