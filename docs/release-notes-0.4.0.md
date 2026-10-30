# Astraeus 0.4.0

## astraeus 0.4.0 (2026-10-31)

First download of the packed example (`npm run measure:example`): 1,594,919 bytes raw, 453,695 bytes gzip (code and styles loaded on first open).

A recorded path can now cross the solar system (O-046, G-013), from findings sent back by an outside Voyager app built on 0.3.0.

- `addTrajectory` says which frame its positions use (I-097): equatorial J2000 (EQJ) about `center`, as before. A new `plane: "ecliptic-j2000"` option takes ecliptic vectors as JPL Horizons publishes them and rotates them to EQJ once on the way in (samples and provider states), so drawing, `stateOf` and readouts agree. A bad `plane` throws `bad-trajectory`.
- A path can cross the solar system (O-046). `addTrajectory` is now accepted in a Sun-centred scene (it threw `bad-trajectory`), and a new `lineFixedTo` option names the body the path's line is drawn against at each sample's own time (default the scene centre; `"sun"` for a probe). A `lineFixedTo` body the finished scene does not hold throws `bad-trajectory`. Paths in Earth-centred scenes draw as before.
- Behaviour change (O-046): `addTrajectory`'s `center` now defaults to the scene's centre (its first body) instead of always `"earth"`. Scenes whose first body is Earth (Apollo 11, the hello example) are unchanged; a scene whose first body is neither Earth nor the Sun now reads its paths' positions from that body, so add `center: "earth"` to keep the old reading. A path added before any body follows the first body added; with no catalogued first body the default stays Earth. Found when a made-up probe given from the Sun missed Earth by a wide margin in a Sun-first scene.
- `solarSystemScale` is exported beside `trueScale` and `readableScale`, and `setScale` accepts it (I-098), so a Sun-centred scene with an enlarged body can open on the Solar system view. In any other scene `toDefinition` throws `bad-scale`.
- Example and check (O-046 T-193): the README shows a made-up Sun-centred probe path ("A probe across the solar system"); the repository's dev site opens a fuller made-up one at `?experience=synthetic-probe` (not in public builds). A provider path's `orientation` is not rotated by `plane` (documented limit).
- A path's own name shows (I-100). Its label was limited to 4 scaled units from the camera, so it never showed at a normal view; it now has the same reach as a body's label (none in a Sun-centred or fitted scene, otherwise the camera reach, at least 500) and follows the `labels` switch. In Earth-centred scenes a path's label now shows as far out as a body's; give it `labelReach` to keep a shorter reach (Apollo 11 keeps 4).
- New `labelReach` option on `addBody` and `addTrajectory`: a positive number (the camera's `distance` units) that limits how far from the camera that label shows, replacing the shared rule for that item; a bad value throws `bad-body` / `bad-trajectory`. Apollo 11 sets `labelReach: 4` on its paths so they behave as before.
- Wording only (O-046): the `addActivity` error for a missing unit now suggests `"events per hour"` instead of `"meteors per hour"` (the engine names no shower, ARCH-06); the doc comment's example changed the same way.
- Labels (I-108): as before, the label of the selected object (the one `camera.follow` or `camera.lookAt` opens on) always wins a collision with another label, so follow a path to keep its name shown on a small screen; other labels keep their priority order (bodies before paths). A scene's labels also stay hidden until the first layout places them, so none shows unplaced for a moment after load.

## astraeus-data 0.4.0 (2026-10-31)

No changes to the code, data or public API. The six `astraeus-data-<planet>` packages also have no changes and move to 0.4.0 with the rest.
