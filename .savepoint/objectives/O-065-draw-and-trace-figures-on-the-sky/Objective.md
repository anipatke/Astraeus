---
id: O-065
title: Draw and trace figures on the sky
status: planned
depends_on: [O-064]
release: G-018
priority: high
---

# O-065: Draw and trace figures on the sky

## Outcome

The engine's star list carries catalogue ids (HIP), and a scene can add named figures drawn at infinity like the stars (segments between sky directions or star ids, a label point), trace any figure line by line on command or at a time (stay, fade or clear afterwards; reduced motion draws at once), and show ready-made ecliptic and celestial-equator lines and boundary outlines; the Sun and Moon seen from a look-out view keep a glow (a look setting) that never hides a figure.

## Why

G-018: tracing any constellation is the core capability; zodiac is one user.

## Success Conditions

To be detailed when planned. Made-up figures only in engine tests (ARCH-01, ARCH-03).

- **Colours are configurable** (owner, 2026-11-10: "colour, line colours should be configurable"): each figure's line colour (and its label colour) can be set per figure when it is added, with a scene-wide default as a public look setting (API-06) that a figure's own colour overrides; the same for the ecliptic, equator and boundary lines, and for a traced line versus a faded one. Changeable live from the host (`setLook`) and the Developer drawer, like other looks.
- **Label size and font are configurable** (owner, 2026-11-10: "label sizes too, and font configurable"): sky-figure labels take a size and a font (a CSS font family the host page has loaded) per figure, with scene-wide defaults as public look settings; phone-first sizing so labels stay readable at 375x667 and never collide (panels-no-collisions rule). Planning checks whether the existing body and path labels should share the same font and size settings rather than gaining a second, separate set (STYLE-07).
- **Star brightness only** (owner, 2026-11-10: asked for brightness and size, then "do we NEED size? brightness should be enough"): the existing `starBrightness` look stays the one star setting; no star size look (STYLE-05). Planning decides whether a figure's own stars can be emphasised (brighter while traced or selected) through brightness.

## Boundaries

**In scope:** sky figures, tracing, reference lines, star ids, looks and switches.
**Out of scope:** constellation data (O-067); clicking and stories (O-066).
