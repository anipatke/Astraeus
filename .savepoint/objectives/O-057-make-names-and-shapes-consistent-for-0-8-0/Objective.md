---
id: O-057
title: Make names and shapes consistent for 0.8.0
status: planned
depends_on: [O-056]
release: G-016
priority: high
---

# O-057: Make names and shapes consistent for 0.8.0

## Outcome

Names, units, spans, time inputs and frame fields follow API-04; story panels are typed, checked at the call and take `Provenance`; `addStoryPanels` appends; internals stop leaking through `Scene` (`toDefinition` removed, `SceneCamera` type-only, `RateSource` resolved); Swift-Tuttle moves to the showers demo; groups must state their `plane`; old names keep working as aliases until 0.9.0; one CHANGELOG migration table covers every change in 0.8.0, with notes for apps that used `toDefinition` or `swift-tuttle` (review F4, F5, F7, F12; owner D2, D3, D5, D10).

## Why

G-016 chunk 5, the breaking chunk, last so every replacement exists first. After it, 0.8.0 can be released.

## Success Conditions

Detailed when this Objective is planned. Named outcomes: the renames with aliases; typed story panels; `toDefinition` gone with the O-056 replacements documented; Swift-Tuttle added by the showers demo through `addBodyFromElements`; required group `plane`; the O-053 type-lint and front-door allowlists emptied for these entries; migration table; README and API reference regenerated.

## Architectural Considerations

ARCH-01 catalogue rule (Sun, planets, dwarf planets, moons only); aliases live in one place per input and are listed for removal in 0.9.0.

## Boundaries

**In scope:** F4, F5, F7, F12, D2, D3, D5, D10.

**Out of scope:** moving the planets demo off the internal definition and splitting `Scene` (after 0.8.0); publishing.
