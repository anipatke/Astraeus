# Changelog: astraeus

Versions follow [semantic versioning](https://semver.org). While the version starts with `0.`, the public API (the names exported from `astraeus`) may still change between minor versions; each change is listed here.

## Unreleased

- Story calls (O-041), no existing call changes. `addTrajectory` takes `description`, `knownLimitations`, `anchors` (labelled dots where the data was published; a time outside the path throws `bad-anchor`) and `readouts` (info-card bars: `range`, `speed`, `distance`, `altitude`); `addBody` takes `description`. New `Scene` methods: `addEvents` (timed events with optional `provenance`; `bad-event`), `addStoryPanels` (panels at a time, event or anchor; `bad-panels`), `setTimeline` (span, speeds, opening speed, or `{ none: true }` for no timeline; `bad-timeline`), `stateOf` (state of a path at a moment) and `camera.lookAt` (opening view without following). `setScale` takes `{ only: true }` to offer one scale. The camera menu lists a Focus and a Follow entry for every body and path. `examples/hello-scene` now uses all of them.

- An API reference page is published at <https://astraeus.anipatke.com/api/>, generated from the public types and doc comments; the package `homepage` points at it. Every export now has a doc comment (a test keeps it so). No change to the API.

- New export `AstraeusScene` (with its props type `AstraeusSceneProps`): a React component that draws the same viewer as `mount`, `<AstraeusScene scene={scene} data={[...]} onReady onError />`. It rebuilds when the `scene` prop changes and cleans up on unmount.
- Needs React 19 and `@react-three/fiber` 9.8.2 or later: `react`, `react-dom`, `@react-three/fiber` and `three` are now peer dependencies, not dependencies, so the host app's own copies are used and installed once. Install them beside `astraeus`. No change to the public API.

## 0.1.1

No changes to the code, data or public API. The first version published by the GitHub release workflow, with npm provenance ("Built and signed on GitHub Actions").

## 0.1.0 (preview)

First release.

- Public API: `Scene` (`addBody`, `addTrajectory`, `setTime`, `setScale`, `camera.follow`), `mount(element, scene, { data })`, the ready-made bodies (`sun`, `earth`, `moon`, the planets and their moons), `trueScale` and `readableScale`, `SceneError` with its codes.
- `mount` draws the full viewer: time controls and timeline, camera presets, scale choice, body information with provenance.
- `addBody(body, { orbit: true })` draws the body's orbit line (the Moon about Earth, Io about Jupiter); other bodies throw `SceneError` code `no-orbit`.
- `camera.follow` opens the scene already following its target.
- Planet positions (2010 to 2030) and the pictures of the Sun, Earth, Moon and the eight planets are included. Moon pictures, the 8k Venus map and the Milky Way are in `astraeus-data`; moon positions are in `astraeus-data-<planet>`.
- Needs a bundler (Vite, webpack 5 or Parcel): the compiled code keeps extensionless imports and references its pictures with `new URL(..., import.meta.url)`.
