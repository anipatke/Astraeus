# Astraeus 0.10.0

## astraeus 0.10.0 (2026-11-22)

Engineering health repairs. Confirmed defects from three independent audits are fixed, the engine says truthfully what it is unsure of, the frame loop does less work, two viewers on one page leave each other alone, and the docs describe the code as it is. The nine packages move together to 0.10.0; the `astraeus-data*` packages now peer on `astraeus` `>=0.10.0 <0.11.0`.

**Behaviour changes where it was wrong** (owner decision): a host written for 0.9.5 may notice the changes listed under "Breaking changes in 0.10.0" in the changelog, each with a one-line migration.

First download of the packed example (`npm run measure:example`): 1,827,404 bytes raw, 523,694 bytes gzip (code and styles loaded on first open), against 1,828,138 raw and 522,471 gzip at 0.9.5 (−734 raw, +1,223 gzip).

### What changed for app makers

- **three.js 0.169 to 0.187.** The `three` peer range is now `>=0.169.0 <0.188.0`, proved against 0.169, 0.181, 0.183, 0.186 and 0.187 with the matching `@types/three`. Hosts on three.js 0.181 or later no longer get type errors from the engine.
- **Right answers for every input.** One Kepler solver handles every eccentricity below 1. `addBodyFromElements` gives the same position whether the epoch is written in UTC or TT (they were about 2,000 km apart). Each scene keeps its own moon data. Reverse playback with pacing works.
- **Errors that say what went wrong.** New codes `bad-scene`, `too-many-bodies` (more than 30 lit bodies) and wider `bad-data`, `bad-view`, `bad-trajectory` and `bad-element`; `stateOf` outside the covered years throws `out-of-span`. `AstraeusScene` without `onError` logs to `console.error` instead of swallowing errors. `ScaleId` types the three scale ids.
- **Times must say their zone.** Date-time text needs `Z` or an offset; a date alone is midnight UTC.
- **Truthful cards.** Thirteen moons are labelled by the rotation model that actually turns them, and cards list each body's position limits.
- **Lighter and safer on a page.** A paused viewer stops re-rendering; labels and lines skip work when nothing changed. Removing a viewer frees its graphics memory and no longer affects another viewer on the page. A failed picture load is tried again.
- **Docs that match the code.** The package README is about a third of its old length; each option's detail is on the API page, which now shows the real version.

Full details: `packages/astraeus/CHANGELOG.md`.

## astraeus-data 0.10.0

No changes to the pictures or data; code reformatting only. `astraeus-data-constellations` finds the figure for a sky point about five times faster with identical answers. Released with `astraeus` 0.10.0 to keep the version numbers together.
