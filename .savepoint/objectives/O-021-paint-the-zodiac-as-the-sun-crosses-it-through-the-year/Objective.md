---
id: O-021
title: Paint the zodiac as the Sun crosses it through the year
status: planned
release: G-006
---

# O-021: Paint the zodiac as the Sun crosses it through the year

## Outcome

A new experience centred on Earth. The view looks out at the real star map (HYG stars and the Milky Way) with the ecliptic, the Sun's yearly path, drawn across it. Playing through one year, the Sun slides along that path; as it enters each zodiac constellation, the constellation's stick figure is traced on the sky line by line and labelled. The demo's story: the dates the Sun really spends in each constellation differ from horoscope dates by about a month (precession), and the Sun also crosses a 13th constellation, Ophiuchus.

## Why

Owner, 2026-10-17: a third demo "for funsies", painting or tracing the 12 zodiac constellations on the star map with Earth as the centre. The owner chose the framing "The Sun's year through the zodiac" over a camera tour or an outside-looking-in view.

## Success Conditions

1. **Earth-centred sky view.** The camera stands at Earth looking outward; the viewer can turn to look around; the stars and Milky Way are the existing sky.
2. **The Sun on its real path.** The Sun's direction for the timeline's moment comes from the existing ephemeris, drawn on the sky with the ecliptic line; one year plays in a comfortable time and the timeline shows the date.
3. **Constellations painted in.** Each zodiac constellation (and Ophiuchus) is traced as the Sun enters it, with a label; once painted it stays (or fades to a softer line, decided at planning). Lines join real catalogue stars, so they sit exactly on the star map.
4. **Real dates.** The boundaries the Sun crosses are the IAU constellation boundaries, so the entry dates are real; story panels give the real dates against the horoscope dates and introduce Ophiuchus.
5. **Data is story data, credited.** Constellation lines and boundaries are a story or catalogue data file with a recorded source and licence (PROV-01, PROV-02), never engine code; candidate sources to confirm at planning: an openly licensed stick-figure set and the IAU boundary data.
6. **Reusable engine parts.** Sky lines, sky labels and "paint on reach" are generic engine or shell features configured by data (ARCH-01, ARCH-03), proven on made-up configuration first, so later demos can reuse them.
7. **Checks.** Gates, the lite browser check (the new experience is picked up automatically), a browser script for this experience, zero console errors, phone and desktop, and the owner's look.

## Owner Decisions — 2026-10-17

1. **Framing: the Sun's year through the zodiac,** Earth at the centre.
2. **A new Goal** (G-006), after the cleanup and first release ("new goal obv").

## Planning Notes

- **The Sun must not hide the zodiac** (owner question, 2026-10-17: "Won't the sun obscure the zodiac"). The Sun's disc is about 0.5 degrees across and a zodiac constellation spans 20 to 40 degrees, so only glare hides them. The sky stays dark (no daylight scattering), and the Sun is a small bright marker whose glow is a setting with a live control, so the constellation behind it stays readable. A story panel says that in reality daylight hides the Sun's constellation, and the one visible at midnight is opposite; planning decides whether to mark that one faintly.

## Boundaries

**In scope:** the experience, its data, the generic sky-line and paint-in parts, story panels, credits on the assets page.

**Out of scope:** astrology readings; constellation artwork (figures) unless the owner asks; non-zodiac constellations beyond Ophiuchus; a ground-observer horizon view.
