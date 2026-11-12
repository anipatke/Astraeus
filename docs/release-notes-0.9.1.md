# Astraeus 0.9.1

## astraeus 0.9.1 (unreleased)

First-download size: to be measured at release (`npm run measure:example`); 0.9.0 was 1,759,084 bytes raw, 505,483 bytes gzip.

A patch release from the Closest Calls review: playback and flybys behave as the README says, a body or path can be shown for a span of time only, reduced-motion visitors no longer wait for the camera, and the README fills the gaps the review found. Additions and fixes only; no call changed shape. The nine packages move together to 0.9.1; the `astraeus-data*` packages are unchanged in content and keep peering on `astraeus` `>=0.9.0 <0.10.0`.

### What changed for app makers

- **Paced playback.** Where pacing pieces overlap or their ramps meet, the paced speed is now what the README says: faster spans set the cruise, slower spans and event rules ease down from it, so a slow-down inside a faster span starts without a jump. (O-069)
- **Flyby lines.** A `provider` path is drawn through its 128 even moments plus up to 3,968 more where it bends or the body moves fast, as seen from the path's `center`, so a one-hour flyby on a six-year path no longer draws as a straight line past the marker. A `samples` path is unchanged. (O-070)
- **Show for a span of time.** `shownDuring: { start?, end? }` on `addBody`, `addBodyFromElements` and `addTrajectory` shows a body or path only while `start <= t < end`. Outside it nothing is drawn, it cannot be picked, it leaves the object menu and `setSelected` and `setCamera` refuse it; a selection it held is dropped and the camera holds. `stateOf` and the readouts are unchanged. (O-071)
- **Reduced motion.** With `prefers-reduced-motion: reduce`, every eased camera move arrives on the next frame. Without it nothing changes. (O-072)
- **README.** States the whole-millisecond time rule and its current `RangeError`, the ecliptic obliquity (84381.406 arcseconds, against JPL Horizons' 84381.448), the `provider` `stateAt` contract, the 45 degree orbit field of view, an elements body's colours and the anchor-label switch. (O-072)

Full details: `packages/astraeus/CHANGELOG.md`.

### Upgrading

Install the `astraeus-data*` packages with `astraeus` 0.9.1 (they accept any 0.9.x). Nothing needs a change.
