# Changelog: astraeus

Versions follow [semantic versioning](https://semver.org). While the version starts with `0.`, the public API (the names exported from `astraeus`) may still change between minor versions; each change is listed here.

## 0.1.0 (preview)

First release.

- Public API: `Scene` (`addBody`, `addTrajectory`, `setTime`, `setScale`, `camera.follow`), `mount(element, scene, { data })`, the ready-made bodies (`sun`, `earth`, `moon`, the planets and their moons), `trueScale` and `readableScale`, `SceneError` with its codes.
- `mount` draws the full viewer: time controls and timeline, camera presets, scale choice, body information with provenance.
- `camera.follow` opens the scene already following its target.
- Planet positions (2010 to 2030) and the pictures of the Sun, Earth, Moon and the eight planets are included. Moon pictures, the 8k Venus map and the Milky Way are in `astraeus-data`; moon positions are in `astraeus-data-<planet>`.
- Needs a bundler (Vite, webpack 5 or Parcel): the compiled code keeps extensionless imports and references its pictures with `new URL(..., import.meta.url)`.
