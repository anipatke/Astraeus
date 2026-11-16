# Constellations in Astraeus, and Zodiac as the first story — draft (v0.2, 2026-11-10)

Status: draft for the owner. Owner decisions so far: engine first, then the app; the zodiac app's clock is the year (the Sun's path); the engine is not zodiac-specific — it can trace **any** constellation and overlay it with a story; the 88 constellations' figures and boundaries live in an **optional data package**.

Three layers, each reusable by the one above:

| Layer | Owns | Never owns |
|---|---|---|
| Engine (`astraeus`) | Looking out from a body, drawing and tracing figures on the sky, clickable sky items, sky story steps, ecliptic/equator lines | Any constellation, name, myth or zodiac idea |
| Data package (`astraeus-data-constellations`, optional) | All 88 IAU constellations: stick figures (by star id), boundaries, names, abbreviations; star ids for figure endpoints; sources and licences | Facts, myths, which constellations a story uses |
| Story app (Zodiac first) | Which constellations, the order, the facts and myths, the birthday idea, the copy | Engine code or data-package edits |

---

## Part A — Engine and data package (a future Astraeus Goal, after G-017)

General capabilities, each proven first on a made-up sky configuration (ARCH-03), never on zodiac data.

1. **Look out from a body.** A camera that stands at a body's centre (Earth) and turns to look around (drag to pan, zoom as field of view), with the same `setCamera`, `camera` and `onCameraChange` shapes as today. Also: turn to a sky direction or a sky item.
2. **Sky figures.** A scene call that adds a named figure drawn at infinity like the stars: line segments between sky directions (RA/Dec J2000) or between catalogue star ids, plus a label point. Look settings for colour, width, brightness; a display switch to show or hide all figures.
3. **Tracing.** Any figure can be drawn in line by line (stroke order from the data, or the given order), on command (`trace(id)` from the host or a story step) or as the clock crosses a time the scene gives; instant or eased over a set time; reduced motion draws at once. A traced figure can stay, fade to a softer line, or clear.
4. **Sky items you can click.** A figure (and optionally its boundary as a region) is selectable like a body: tap, object menu, `onSelect`, `setSelected`, with a card carrying `description`, `facts`, `sources`, provenance.
5. **Sky stories.** Story panels and events can name a sky item: opening a panel turns the view to it, selects it and traces it (each optional), so a story is a sequence of "look here, draw this, read this". Works with or without a timeline. (Builds on the existing story panels and `addEvents`, not a parallel system.)
6. **Reference lines and regions.** Ready-made ecliptic and celestial-equator lines; a boundary drawn as a faint outline or soft fill, switchable.
7. **Sun and Moon on the sky.** From a look-out view, drawn small with a glow that is a look setting and never hides the figure behind them.
8. **Star ids.** The engine's star list gains catalogue ids (HIP) so figures and stories can point at stars the engine already draws; an app can read a star's position by id.

**`astraeus-data-constellations`**: the 88 IAU constellations' stick figures (an openly licensed set, endpoints as HIP ids), IAU boundaries (Delporte 1930, machine-readable), names and abbreviations, each with source and licence recorded once; a helper to add one or many by abbreviation (`addConstellations(["Ori", "UMa"])`). Size kept small; follows the planet packages' pattern (peer range, `check:pack`).

Proof for the Goal: two made-up stories in tests (no real constellation names in engine code), plus one example in `examples/` tracing a non-zodiac constellation (e.g. Orion) with three story steps, so the zodiac app is not the only consumer.

---

## Part B — Prompt for the Zodiac app (use once Part A is released)

> You are building **Zodiac**, a small web app, as one story on the published `astraeus` package and `astraeus-data-constellations`. Use only their public APIs (`import … from "astraeus"`); never fork or patch the engine or import private paths. When the API can't do something, write it down as a finding (what you needed, what you tried, the workaround) — those findings are the main thing the Astraeus project wants back.
>
> **What the visitor sees and does**
> - The view stands at Earth and looks out at the star field. Drag to look around, zoom in and out. No ground or horizon.
> - The ecliptic is a faint line. The 13 constellations it crosses are added from the data package: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpius, **Ophiuchus**, Sagittarius, Capricornus, Aquarius, Pisces.
> - Clicking a constellation (on the sky or from a list) turns the view to it, traces its figure and opens a card: name, how to say it, the myth in two or three sentences, its brightest star, two or three fun facts.
> - **Time runs on a year.** Playing slides the Sun along the ecliptic; as it enters each constellation, a story step traces that figure and shows the real entry date. The Moon laps the whole zodiac about every 27 days. The visitor can type a date.
> - **The birthday story.** Enter a birthday; the app jumps to it and shows the constellation the Sun was really in next to the horoscope sign for that date, and explains why they differ (the slow wobble of Earth's axis, about a month's shift; Ophiuchus). Take the dates from the boundary data, not this prompt.
>
> **Honesty rules**
> - Stick figures are a drawing convention; the official areas are the IAU boundaries. Say so.
> - Constellations are uneven in width; never show equal 30° slices except as a labelled astrology band, if at all.
> - In real life daylight hides the Sun's constellation; the one best seen at midnight is opposite. Say this where the Sun's constellation is shown.
> - No horoscopes or personality readings. Every fact cites a source.
>
> **Build**: phone first (375×667 and 1280×720, no overlapping controls), keyboard-operable constellation list, selection not by colour alone, opens paused on today.
>
> **Report back** like the Voyagers review: what you built, every API finding ranked by cost, what worked, workarounds, top three asks.

---

## Open for the owner

- The app's repo and name (a new repo, like Voyagers?).
- Should Part A be the next Astraeus Goal after G-017 (0.8.1)? It is several Objectives: look-out camera; sky figures and tracing; clickable sky items and sky stories; star ids and the data package.
- Ophiuchus is in by default; say if you'd rather 12.
