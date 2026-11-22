---
id: O-092
title: GPU resources cleaned up per viewer
status: planned
depends_on: [O-087]
release: G-024
priority: medium
rank: 11
lanes: [{key: browser, title: Two-viewer browser step}, {key: textures, title: Pictures per viewer}, {key: views, title: Views free what they own}, {key: hooks, title: Loading wakes}, {key: retry, title: Failed loads retried}, {key: context, title: Context loss}, {key: integration, title: Design and changelog}]
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

## Decisions

- Owner 2026-11-21 (G-024 decision 7) "Orchestrate each objective to completion"; 2026-11-22 "Carry on" (after O-094). Step checks waived on T-427..T-433. No owner look (pictures load and draw as before).
- Owner 2026-11-22: "Own copies" — each viewer gets its own dot, glow, anchor and body pictures; no page-wide sharing and no reference count (this replaces "reference-counted shared textures" in Success Conditions; a viewer only ever frees what it owns).
- Planner defaults kept (orchestrate-g024-20261121, re-checked against main 2026-11-22): a dev-only two-viewer page (`?experience=synthetic-two-viewers`, never in the public build) and a full-tier-only `two-viewers` browser step with its own trigger row in browser-policy; failed body pictures retried at the next mount; the Full Check follows the O-094 rules: `npm test`, `check:pack`, `check:three-newest`, `check:browser -- --tier quick --step look-out --step two-viewers --skip-examples` (look-out switched on by shader and sky paths), no engine-alone.
- Engine size: cap 1,838,000 B raw; 1,826,428 B measured (C-211); per-Task caps total about 900 B.
- Waves: T-427, T-428, T-431, T-432 side by side (T-427 runs its browser step on today's code first, to record the harm); then T-429 and T-430 after T-428; then T-433.
- I-203 (viewerIds drawer wait) repaired directly on this branch (commit 1b473ba4); this Objective's Full Check verifies it.
