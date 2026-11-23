# Astraeus 0.10.1

## astraeus 0.10.1 (2026-11-23)

Orbit lines stay on their body. A fix only: no public name, type or default changed, so a host on 0.10.0 upgrades without code changes. The nine packages move together to 0.10.1; the `astraeus-data*` packages keep their `astraeus` peer `>=0.10.0 <0.11.0`.

First download of the packed example (`npm run measure:example`): 1,832,457 bytes raw, 525,504 bytes gzip (code and styles loaded on first open), against 1,827,404 raw and 523,694 gzip at 0.10.0 (+5,053 raw, +1,810 gzip).

### What changed for app makers

- **Planet orbit lines no longer wobble or drift.** A planet's line round the Sun used to be drawn once, for the turn after the scene's opening time, from straight segments. Zoomed in to a few planet radii with time playing, the planet slid off its line and back about once a day for Earth (up to about one Earth radius, two for Mars), and years from the opening time the line belonged to the wrong year (Mars up to 14 radii off). The line is now one turn about the display time, redrawn as time moves on or jumps, and it ends exactly on the planet through a finer stretch near it. Measured: Earth, Mars and Jupiter stay within 0.011 of their own radius of the line in every year the planet positions cover.
- **Moon lines** (the Moon about Earth, Io about Jupiter) end on their moon the same way, and their points no longer shift each time they are redrawn.
- **Uranus and Neptune** are the exception: their turn outlasts the planet positions the engine ships, so their line is still the fitted ellipse and can run off the planet in the years between re-fits; their card says so.
- **Cost:** about 0.2 ms more per frame for three planet lines (measured against 0.10.0), with zoomed-out looks unchanged.

Full details: `packages/astraeus/CHANGELOG.md`.

## astraeus-data 0.10.1

No changes to the pictures, data or package code. Released with `astraeus` 0.10.1 to keep the version numbers together.
