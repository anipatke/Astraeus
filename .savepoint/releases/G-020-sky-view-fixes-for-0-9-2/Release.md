---
id: G-020
title: Sky-view fixes for 0.9.2
status: planned
---

## Outcome

The `astraeus` package and the constellation data answer the Zodiac project review of 0.9.1 with general parts any sky or story app can use, shipped as 0.9.2 with additions and fixes only: look-out camera turns glide as documented and a tap keeps the sky view; a scene can open paused; playback stops exactly on the timeline's end and a panel there opens; the clock bar and event list can read in the visitor's zone and to the day; a story panel can close once playback leaves it; a look-out scene can hide the orbit controls; switches can be relabelled; looks, switches and pacing can be read back; and the constellation data can say which constellation holds a direction, labels its outlines apart, and ships the Milky Way on its own.

## Why

Owner, 2026-11-15 (session plan-g020-20261115): pasted the Zodiac review (a phone-first zodiac sky app built on the public 0.9.1 API only; findings F-01 to F-26 in that app's findings document) and said "not convinced we need all of these in the main engine". The owner chose a critical split:

- Engine bugs, where the engine breaks its own README (in): F-24 look-out `setCamera` snaps, F-02 plays before the host can pause, F-13 a label over the Sun picks the Sun and leaves the sky, F-22 a zero-length clear leaves lines, F-26 stop at the end overshoots, F-08 fractional time throws a plain `RangeError` (I-176), F-01 `rgba()` alpha dropped, F-25 a panel at the timeline's end never opens; docs F-16.
- General features (in): F-11/F-19 time zone and date-only format, F-18 panel closes when playback leaves it and a public phone sheet cap, F-03 sky-only look-out, F-04 switch labels, F-05/F-17 scene reads.
- Constellation data (in, owner: "One Objective in this Goal"): F-10 `constellationOf`, F-15 outline labels, F-06 Milky Way as its own export.
- Dropped as app-shaped: F-12 per-fact sources, F-21 per-figure switches and trace colours, F-23 a host slot in the top bar, F-25's first-play hook and step bar, F-14 camera offset, F-20, F-09, F-07.

Version: owner "0.9.2, additions only". Tap rule: owner "Select it, stay in the sky".

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine package and `astraeus-data` / `astraeus-data-constellations`, their public API, READMEs, CHANGELOGs, tests and examples.

**Out of scope:** breaking changes (data peers `>=0.9.0 <0.10.0` stay valid); zodiac or story content in the engine; new demos; changes to the Zodiac app; publishing a release (the owner's action through the GitHub release workflow).
