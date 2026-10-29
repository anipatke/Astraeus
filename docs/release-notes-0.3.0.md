# Astraeus 0.3.0

## astraeus 0.3.0 (2026-10-29)

First download of the packed example (`npm run measure:example`): 1,592,336 bytes raw, 453,513 bytes gzip (code and styles loaded on first open).

- The Milky Way is a new picture (I-026), no API change. The sky's Milky Way band is now the starless Gaia EDR3 render by Kevinmloch (CC BY-SA 4.0, 3840x1920), softer against the catalogue stars; it replaces the two ESO halves. The picture ships in `astraeus-data` (see its changelog) and is dimmed in the viewer; `milkyWayBrightness` still scales it, and it stays off by default.

- Answers for sites (O-045). `Scene.stateOf(id, time)` now answers for every body in the scene (ready-made bodies, moons, elements bodies), not only `addTrajectory` paths; they answer at any date, only a path refuses a moment outside it (`bad-time`), and a planet answers once the planet series are loaded (`missing-data` before). Its unknown-body message now reads "no body or trajectory with that id". New `Scene.provenanceOf(id)` returns the body's `Provenance`, which gains optional `accuracyClass` and `maxErrorFraction`: built-in Swift-Tuttle's is measured (0.00857); an elements body's is the limit of its class (0.01 approximate, 0.05 indicative), an upper bound and not a measured figure. New root exports: `APPROXIMATE_LIMIT_FRACTION`, `INDICATIVE_LIMIT_FRACTION`, `classifyPositionError` and `parseElementsBodyRecord`.

- Fit the zoom-out to an orbit (O-045). New `camera.fitOrbit(body)` sets the farthest zoom-out so the body's whole orbit fits the canvas from any direction, and re-fits when the canvas changes shape; the far plane is 2.5 times the reach. `setReach` and `fitOrbit` set the same limit, the later call wins. The opening view is unchanged except that it is clamped to the limit like any other. Labels are not limited in a fitted scene. `SceneError` `bad-camera` for a body that does not circle the Sun.

- Event labels (O-045). New provenance source type `"modelled"` (shown as "Modelled"). `addEvents` events take their own `provenance`, which wins over the batch's. Batch and per-event provenance are now validated: a malformed one throws `bad-event` (the batch one was not checked before). A group's info card shows "illustrative" as its source type, with the elements' type in the accuracy sentence (documented).

- Visible change (O-045). A body added with `addBodyFromElements` now has a live "Distance from Sun" row on its info card, and in the Geminids demo the Sun's card also lists "Distance to Phaethon".

- A better guest in a host page (O-044). `mount` and `AstraeusScene` no longer change `document.title`. The viewer's Escape handlers (story panel, phone drawer, switch panel) ignore a keydown the host already stopped with `preventDefault()`. The mount element and the `AstraeusScene` wrapper get `isolation: isolate`, so the viewer's `z-index` values (0 to 9) stay inside it; a `style` you pass to `AstraeusScene` can override it, and `mount` does not restore the element's old `isolation` on `unmount`.

- Node loading (O-044), no API change. The package's JSON imports now carry `with { type: "json" }`, and the root export has a `node` condition (order: types, node, import) that points at copies without the stylesheet import, so Node and Vitest's Node environment import `astraeus` with no inline setting. Bundlers keep the normal build. jsdom and happy-dom Vitest environments also take the `node` condition, so they do not load the viewer's CSS.

- Default time (O-044). A scene with no `setTime`, no `setTimeline` window and no trajectory now opens on the current time with a window of a month around it. This includes `setTimeline({ none: true })` with no `at`, which opens on the current time too (new in O-044; it was not changed in O-045).

- Phone story panel (O-044). On a phone, a wheel or two-finger pinch over an open story sheet zooms the scene behind it (the sheet has `touch-action: pan-y`).

- Documentation (O-044). The README says who needs `astraeus/style.css`, why a plain-JavaScript page still needs React, how story panels open and pause, that `camera.setReach(d)` also sets the far plane to 2.5 times `d`, and how to reload on `vite:preloadError`; `addStoryPanels`, `StoryPanelsInput` and `setReach` doc comments say the same.

- The Moon now shows libration (I-091), no API change. Its orientation was a plain tidal lock; it is now the IAU mean-Earth rotation model with its libration terms (Archinal et al. 2009 report, as saved in NAIF pck00011), so the Moon nods and sways by up to about 8 degrees as it does in the sky. Against JPL Horizons at seven dates from 1969 to 2050 the sub-Earth point and pole agree within 0.01 degrees (about 0.3 km on the surface); a surface place can no longer sit up to 8 degrees (254 km at Apollo 11's touchdown) from its true spot. Moon-surface features and mesh textures move accordingly.

- Documentation only: `addGroup` states that a `center` that is not a catalogued body throws `unknown-body` (a catalogued one missing from the scene throws `bad-group`), and `setTimeline` states that `loop` is ignored with `{ none: true }` or without a timeline. No behaviour changes.

## astraeus-data 0.3.0 (2026-10-29)

The Milky Way picture is now the starless Gaia EDR3 render by Kevinmloch (CC BY-SA 4.0), 3840x1920, 0.53 MB, replacing the two ESO halves (3.7 MB). The picture is `milky-way` (the names `milky-way-left` and `milky-way-right` are gone) and its licence record travels with it. The package is about 35.5 MB packed. The moon-position and data code is unchanged.

The six `astraeus-data-<planet>` packages have no changes and move to 0.3.0 with the rest.
