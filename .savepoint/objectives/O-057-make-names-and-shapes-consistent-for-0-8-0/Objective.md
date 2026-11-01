---
id: O-057
title: Make names and shapes consistent for 0.8.0
status: planned
depends_on: [O-059]
release: G-016
priority: high
---

# O-057: Make names and shapes consistent for 0.8.0

## Outcome

Names, units, spans, time inputs and frame fields follow API-04; story panels are typed, checked at the call and take `Provenance`; `addStoryPanels` appends; internals stop leaking through `Scene` (`toDefinition` removed, `SceneCamera` type-only, `RateSource` resolved); Swift-Tuttle moves to the showers demo; groups must state their `plane`; old names are removed outright, no aliases (owner, 2026-11-01: "we only have two apps built from this, so we can afford to break and re-work them now", replacing D2's aliases); one CHANGELOG migration table covers every change in 0.8.0, with notes for the Voyagers and showers apps (`toDefinition`, `swift-tuttle`, every rename) (review F4, F5, F7, F12; owner D2 revised, D3, D5, D10).

## Why

G-016's breaking chunk, last so every replacement exists first (after O-059 so the planets demo and site's new public features are renamed with everything else). After it, 0.8.0 can be released.

## Success Conditions

Detailed when this Objective is planned. Named outcomes: the renames as a clean break (no aliases); typed story panels; `toDefinition` gone with the O-056 replacements documented; Swift-Tuttle added by the showers demo through `addBodyFromElements`; required group `plane`; the O-053 type-lint and front-door allowlists emptied for these entries; migration table; README and API reference regenerated.

## Architectural Considerations

ARCH-01 catalogue rule (Sun, planets, dwarf planets, moons only); no alias code: an old name fails with a `SceneError` naming its replacement only where the type system cannot catch it (plain JavaScript callers).

## Boundaries

**In scope:** F4, F5, F7, F12, D2, D3, D5, D10.

**Out of scope:** publishing; changes inside the Voyagers and showers apps (their migration follows the table, after 0.8.0 is out).
