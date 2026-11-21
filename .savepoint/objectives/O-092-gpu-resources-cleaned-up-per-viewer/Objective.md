---
id: O-092
title: GPU resources cleaned up per viewer
status: planned
depends_on: [O-087]
release: G-024
priority: medium
rank: 11
---

# O-092: GPU resources cleaned up per viewer

## Outcome

Unmounting one viewer frees what it owns and nothing another viewer uses: views dispose their GPU objects, shared textures are reference-counted, the loading-manager hooks survive out-of-order unmounts, a lost graphics context can be restored, and failed loads can be retried.

## Why

AH-13 (all three): path, points and tracked-body views have no `dispose`; one unmount releases shared glow, anchor and dot textures for all viewers; each viewer patches the global loading manager and restores a snapshot; no `webglcontextlost` handling. AH-39: rejected planet-series and star-file loads stay cached.

## Success Conditions

- First confirm on a real two-viewer page whether the second viewer is visibly affected today (records the actual harm).
- A table test listening for `dispose` on everything each view owns; mount-two-unmount-one keeps the second viewer drawing (browser).
- Reference-counted shared textures; loading-manager hooks per viewer.
- Context loss handled so restore can fire.
- Failed loads cleared on rejection, with retry tests.

## Architectural Considerations

API-03 per-viewer isolation.

## Boundaries

**In scope:**
- Disposal, shared assets, loading hooks, context loss, load retry.

**Out of scope:**
- Moon-data isolation (O-084); lighting design.
