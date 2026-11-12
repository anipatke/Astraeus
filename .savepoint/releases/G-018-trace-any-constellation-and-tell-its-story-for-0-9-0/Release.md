---
id: G-018
title: Trace any constellation and tell its story, for 0.9.0
status: done
---

## Outcome

The `astraeus` engine can stand at a body and look out at the sky, draw any figure on the sky and trace it line by line, make it clickable with a card, and step through a story that turns to it, traces it and tells it; an optional `astraeus-data-constellations` package supplies all 88 IAU constellations (stick figures by star id, boundaries, names) with sources and licences. Zodiac is the first story built on it, as a separate app; nothing in the engine is zodiac-specific. Ships as 0.9.0.

## Why

Owner, 2026-11-10 (session voyagers-review-20261110): a zodiac app viewed from Earth (rotate the view, click constellations for fun facts, a year clock with the Sun's path). Checking 0.8.x found no look-out camera, no sky lines or labels, no clickable sky items, no ecliptic line and no star ids. Owner choices: "Engine first, then the app"; "Year: the Sun's path" for the app; "We need to ensure we build re-usable components, i.e. zodiac is just one story, but the engine should be able to trace and story board any constellation after this"; "engine should not be zodiac specific, rather have the functionality to trace any constellation and overlay with a story"; the 88 constellations in an "Optional data package"; "include as 0.9.0".

## Success Conditions

Every member Objective is done. Proof of reuse: tests on made-up sky figures (no real constellation names in engine code, ARCH-01, ARCH-03) and an example in `examples/` tracing a non-zodiac constellation (Orion) in three story steps.

## Boundaries

**In scope:** the engine's camera, sky drawing, selection and story layers; star ids in the engine's star list; the new data package; README, API lock, CHANGELOG; one example.

**Out of scope:** the Zodiac app itself and its facts, myths and birthday story (a separate project; draft prompt held by the owner); a ground view with a horizon and location (the "day" clock; later); precession of the stars; publishing (the owner's action). Follows G-017 (0.8.1).
