---
id: O-084
title: Each scene keeps its own moon data
status: planned
depends_on: []
release: G-024
priority: high
rank: 3
---

# O-084: Each scene keeps its own moon data

## Outcome

A scene's answers do not depend on what any other scene in the page or process has loaded: each scene binds its own moon dataset selection (and the barycentre-or-centre choice that follows from it), while decoded bytes from the same source are still shared and fetched once.

## Why

AH-03 (Codex F01; related Gemini SCI-08, F-15): moon fits install into the process-wide `MOON_SYSTEMS` (`api/data.ts:61-63`, `core/bodies/moonSystem.ts`), so after scene B loads Io, scene A's Jupiter moves 143 km at the same instant. Owner decision 2: fix in the first phase, after a reproduction test is pinned. AH-48: moon orbit lines may throw in the first year of coverage (`chebyshevEphemeris.loadedFromUtcMs` is not clamped).

## Success Conditions

- A failing two-scene reproduction test pinned first (public API, no renderer), then green.
- A/B load order, concurrent loads with different sources, the same source with different windows, a missing package and an old scene read back all give each scene its own stable answers.
- Shared decoded bytes keyed by source; no second fetch of a chunk already decoded.
- The resolver's memo cannot serve a state computed before that scene's data finished loading.
- The 1950 orbit-line path clamps like `boundsOf`, with a test.
- Two-viewer and lifecycle suites green; cold-load tests green; Horizons tests unchanged.

## Architectural Considerations

Touches the data-source boundary (`api/data.ts`), the moon systems and planet trajectories in core, and the resolver. A per-scene binding must not reintroduce shared mutable state between tests (Codex note on test preload). API-03, ARCH-04. High regression risk: the design interview settles where the binding lives before Tasks.

## Boundaries

**In scope:**
- Per-scene dataset binding, the shared byte cache, the resolver memo, the 1950 clamp, their tests.

**Out of scope:**
- Scoping moon loads to a body's shown span (AH-27, not verified); GPU resource sharing (O-092).
