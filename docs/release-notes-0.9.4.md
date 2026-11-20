# Astraeus 0.9.4

## astraeus 0.9.4 (2026-11-21)

A patch release so an app can restyle a group of dots on a running viewer: change a group's colour and dot size at once, without building a new scene. Additions only, plus one stricter input check; no call changed shape. The nine packages move together to 0.9.4; the `astraeus-data*` packages keep peering on `astraeus` `>=0.9.0 <0.10.0`.

First download of the packed example (`npm run measure:example`): 1,777,827 bytes raw, 511,436 bytes gzip (code and styles loaded on first open), against 1,775,354 raw and 510,719 gzip at 0.9.3 (+2,473 raw, +717 gzip).

### What changed for app makers

- **Live group looks.** `handle.setGroupLook(id, { color?, dotSizePx? })` on the `mount` handle and the `AstraeusScene` ref changes a point group's dot colour and size on the next drawn frame, also while paused, with no rebuild, refill or re-plan: the dots stay where they are. The group's name label takes the colour. Fields left out keep their value; `handle.groupLook(id)` reads `{ color, dotSizePx }` in force. `scene.groups` keeps describing the scene as built. A non-group id or a bad value throws `bad-group`; before `ready` or after `unmount`, `not-mounted`. New types `GroupLookInput` and `GroupLookRead`. (O-078)
- **Speed.** 25 calls on 25 groups of 126,000 dots in all took under 0.3 ms in headless Chromium with software rendering, against about 1.4 s to rebuild the scene (a measurement, not a promise). (O-078)
- **Stricter options.** `setGroupLook`, `setLook` and `setCamera` refuse an argument that is not a plain object (a `Map`, a `Date`, a class instance) with their own error code instead of reading it as empty. (I-183)

Full details: `packages/astraeus/CHANGELOG.md`.

## astraeus-data 0.9.4

No changes to the pictures, data or code. Released with `astraeus` 0.9.4 to keep the version numbers together.
