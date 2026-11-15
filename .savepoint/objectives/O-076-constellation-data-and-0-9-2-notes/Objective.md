---
id: O-076
title: Constellation data and 0.9.2 notes
status: planned
depends_on: [O-075]
release: G-020
priority: medium
rank: 4
---

# O-076: Constellation data and 0.9.2 notes

## Outcome

`astraeus-data-constellations` can say which constellation holds a direction and lists its outlines apart from its figures; `astraeus-data` offers the Milky Way as its own export so a sky-only app does not ship the moon maps; and the 0.9.2 changelogs and release notes are ready for the owner.

## Why

G-020, Zodiac review F-10 (app wrote its own spherical winding test over the 88 loops), F-15 (menu read "Aries, Aries, ..."), F-06 (about 42 MB of moon maps copied into a sky-only build).

## Success Conditions

To be settled in this Objective's design interview (additions only: existing labels and exports keep working).

## Architectural Considerations

Data packages stay data (story data never in the engine); peers stay `>=0.9.0 <0.10.0` (API-07). Milky Way picture today in `packages/astraeus-data/src/pictures.ts`.

## Boundaries

**In scope:** the three data-package additions; 0.9.2 changelogs and `docs/release-notes-0.9.2.md`.
**Out of scope:** a version bump, tag or publish (owner's release step); events helpers for boundary crossings.
