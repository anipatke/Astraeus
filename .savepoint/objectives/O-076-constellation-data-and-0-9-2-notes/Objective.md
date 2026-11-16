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

- `await constellationFinder()` (astraeus-data-constellations) loads the boundary outlines once and returns a synchronous function `(direction: { raDeg, decDeg }) => string` giving the IAU abbreviation of the one constellation holding that J2000 direction (`"Ser"` for both Serpens parts). Every direction gets exactly one answer, poles and the 0/360 seam included; a bad direction throws `RangeError`. Proven against named stars, both poles, the seam and the Sun's yearly path (Ophiuchus included), and for each of the 88 at least one direction inside it.
- `constellations(which, { outlines: true, outlineLabel })`: `outlineLabel?: (name: string) => string` names each outline (`name` is the label it would have had, such as `"Serpens Caput"`); without it labels are exactly as in 0.9.1.
- `astraeus-data/milky-way` exports `milkyWaySource`, a `DataSource` with only the `"milky-way"` picture; a sky-only app built with it copies no moon or Venus map (proven on a packed build). `astraeus-data`'s `dataSource` and `PICTURES` are unchanged.
- 0.9.2 changelog entries for every changed package and `docs/release-notes-0.9.2.md` covering G-020 are ready; no version bump, tag or publish.
- Additions only; data peers stay `>=0.9.0 <0.10.0`; configured gates pass.

## Architectural Considerations

Data packages stay data (story data never in the engine); peers stay `>=0.9.0 <0.10.0` (API-07). Milky Way picture today in `packages/astraeus-data/src/pictures.ts`.

## Design Decisions (owner, 2026-11-16, session plan-o076-20261116)

- D1 Which constellation: load once, ask often (`constellationFinder()` returning a synchronous function), not one async call per question. Owner: "Load once, ask often".
- D2 Outline names: an optional `outlineLabel` on `constellations`, not a menu-hiding option. Owner: "Optional outline label".
- D3 Milky Way alone: a separate export `astraeus-data/milky-way` in the same package, not a new package. Owner: "Separate export".
- Owner confirmed the summary: "Yes, plan it".

## Boundaries

**In scope:** the three data-package additions; 0.9.2 changelogs and `docs/release-notes-0.9.2.md`.
**Out of scope:** a version bump, tag or publish (owner's release step); events helpers for boundary crossings.
