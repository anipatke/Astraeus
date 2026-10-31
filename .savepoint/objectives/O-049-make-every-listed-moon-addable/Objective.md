---
id: O-049
title: Make every listed moon addable
status: planned
depends_on: [O-048]
release: G-014
priority: high
---

# O-049: Make every listed moon addable

## Outcome

In an app on the public API, `scene.addBody(id)` works for every moon in the engine's moon lists (`data/moons/<planet>.json`) whose positions a data package holds, by one rule over those lists, not a list of names: Miranda, Ariel, Umbriel, Titania and Oberon draw from `astraeus-data-uranus` at Voyager 2's 1986 dates, and `{ orbit: true }` draws each listed moon's orbit line about its planet.

## Why

G-014, I-122 from the probe app on 0.5.1: Uranus's five main moons have positions in `astraeus-data-uranus` back to 1950 but no catalogue body, so its Voyager 2 Uranus flyby view is paused. The same gap covers Hyperion, Phoebe, Nereid and every smaller listed moon.

## Success Conditions

Settled with the owner, 2026-10-31 (session probe-feedback-3-20261031): "One rule for every moon with data"; "Add to G-014, plan now"; "Slim lookup table"; design confirmed. Standing rule: strategic fix first.

- **One rule (I-122, must).** Every listed moon with an `ephemeris` pointer becomes a catalogue body by id: label, mean radius (from the list, with its recorded source), parent planet, its data package as `requires`, and its position from that package's fit set. The existing detailed moons (Io, Europa, Ganymede, Callisto, Phobos, Deimos, Saturn's seven, Triton, Charon) keep their own definitions and look; the rule fills the rest. No moon id is named in the rule (ARCH-01, ARCH-05).
- **Orbit periods.** Each listed moon carries a sidereal orbit period from JPL Planetary Satellite Mean Elements (already a cited list source), added by the moon-list importer with its source recorded (PROV-01), so `addBody(moon, { orbit: true })` draws one lap about its planet by the I-119 rule. A moon with no published period is refused with `no-orbit` naming why.
- **Slim lookup.** `addBody` resolves listed moons synchronously from a generated slim table (id, label, radius, parent, period, data package), not the full moon lists, so the first download grows by about 25 kB raw (~8 kB gzip) or less; a test fails if the table and the lists disagree. The full lists stay on demand.
- **Look.** A listed moon without a picture draws as a grey sphere at its mean radius, as Phobos does; a picture the picture pack already has is used. No new pictures.
- **Errors.** An unknown id still throws `unknown-body`, with a message that stays readable with hundreds of moons (the planets plus how to list moons, not every id). A listed moon whose data package is not passed to `mount`, or whose span misses the timeline, fails as today (`missing-data`, `out-of-span`).
- **Proof.** Made-up configurations (ARCH-03); `check:node-consumer` adds Miranda and Titania-with-orbit on the packed package; a synthetic 1986 Uranus scene shows the five moons; one `npm run check:browser`; one owner look on `localhost:5490` before the Full Objective Check.
- **Documentation.** README rows (`addBody`, the `astraeus-data-uranus` README line "no ready-made moon bodies yet"), CHANGELOG `Unreleased` with the size change, Design reconciled.

## Architectural Considerations

ARCH-01 (no mission names), ARCH-03, ARCH-05 (each moon defined once: the list is the source; the slim table is generated from it), ARCH-06 (one rule by data, never by name), PROV-01/PROV-02 (radius and period sources recorded), story data stays out of the engine. The catalogue lookup stays synchronous at `addBody`; positions still load at `prepare`/`mount` from the data package.

## Boundaries

**In scope:**
- I-122; the moon-list importer, the slim table, the catalogue rule, the README, CHANGELOG, API reference and example lines.

**Out of scope:**
- New pictures or looks; refitting moon data or extending small moons before 2010 (G-014 boundary); mission data; the Voyager 2 Neptune 5.2 km note (the probe app checks it first); publishing a release.
