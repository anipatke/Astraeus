# Astraeus 0.9.0

## astraeus 0.9.0 (2026-11-11)

First download of the packed example (`npm run measure:example`): 1,758,392 bytes raw, 505,337 bytes gzip (code and styles loaded on first open), against 1,720,047 raw and 493,478 gzip at 0.8.1.

The sky becomes a place to tell stories. An app can stand at a body and look out at the sky, draw any figure on it and trace it line by line, let a visitor tap it for a card, and walk through a story in steps that turns to the figure, selects it and traces it. A new optional package, `astraeus-data-constellations`, supplies all 88 IAU constellations. Nothing in the engine is specific to constellations or the zodiac. The nine packages move together to 0.9.0; every `astraeus-data*` package now peers on `astraeus` `>=0.9.0 <0.10.0`.

### What changed for app makers

- **Look out from a body.** `setCamera({ lookOut: id, direction?, fovDeg? })` and `scene.camera.lookOut(...)` stand the camera at a body's centre looking out; directions are J2000 right ascension and declination. A share link carries the sky pose. *Type-level change:* `CameraPose` is now `OrbitPose | SkyPose`; an app that reads `camera.focus` should check the kind first.
- **Sky figures.** `scene.addSkyFigures(...)` draws named figures (lines between Hipparcos stars or positions) and outlines on the sky. New switches: `skyFigures`, `skyBoundaries`, `ecliptic`, `celestialEquator`. Colours, label font and size are looks (`skyLines`, `labels`); lines and names fade in when they appear (`skyFadeInSeconds`, default 0.5).
- **Tracing.** `handle.traceSkyFigure(id, { durationSeconds?, after? })` and `handle.clearSkyTrace(id)`; a figure can start hidden until traced (`shown: "whenTraced"`).
- **Selecting.** A tap on a figure's name or near its lines selects it and opens its card (`description`, `facts`, `sources`, `provenance`).
- **Story steps.** Story panels without a time are steps with Back and Next; a panel can turn the camera, select and trace its figure when it opens. `handle.panel`, `setPanel`, `onPanel`.
- **Constellations package.** `constellations(["Ori"], options)` from `astraeus-data-constellations` returns figures ready for `addSkyFigures`; outlines load only when asked. Figures and outlines CC BY-SA 4.0 (Stellarium team; IAU and Sky & Telescope origin), names CC BY 4.0 (IAU), code MIT.
- **Fixes.** Star-based figures now load outside a browser (Node), as the moon data already did. `setTimeline` warns when a rate would cross the whole timeline in under a real second, which almost always means milliseconds were given where seconds per second were meant.
- **New example.** `examples/hello-sky` tells Orion's story in three steps.

Full details: `packages/astraeus/CHANGELOG.md`.

### Upgrading

Install every `astraeus-data*` package at 0.9.0 with `astraeus` 0.9.0. Only apps that read the camera pose need a change (the `OrbitPose | SkyPose` kind check); everything else is additive.
