---
id: O-056
title: Use it without a viewer and set looks as settings
status: planned
depends_on: [O-055]
release: G-016
priority: high
---

# O-056: Use it without a viewer and set looks as settings

## Outcome

A Node or server app loads data with one public call and asks `stateOf` / `provenanceOf` about any body, moons included; `scene.check({ data })` throws exactly what `mount` would; public reads say what a scene holds (the replacements for `toDefinition`, D10); looks and viewer controls are public settings the address only overrides; events can carry their own zone, independent of pacing; a small non-probe example proves it (review F6, F11, F9, the non-probe example; API-06; owner D4).

## Why

G-016 chunk 4, ordered before the breaking chunk so the Voyagers and showers apps can move off `toDefinition` (they use it in tests to check scenes, load data and read composition) before O-057 removes it.

## Success Conditions

Detailed when this Objective is planned. Named outcomes: `scene.load`, `scene.check`, public composition reads; a cold-start node-consumer test and one public-API test file without the preload; a public look settings call mapped one-to-one to the address settings through one table; `EventInput` zone independent of pacing, which reuses it; a third, non-probe example; the O-053 settings-mapping allowlist emptied.

## Architectural Considerations

Settings and zones are presentation (ARCH-02); the address stays an override read through `src/app/address.ts` (T-223).

## Boundaries

**In scope:** F6, F9, F11, the non-probe example, the `toDefinition` replacements.

**Out of scope:** removing `toDefinition` and the renames (O-057).
