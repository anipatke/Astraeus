---
id: O-084
title: Each scene keeps its own moon data
status: done
depends_on: []
release: G-024
priority: high
rank: 3
last_check: C-200
lanes: [{key: binding, title: Scene moon binding}, {key: clamp, title: 1950 clamp}, {key: docs, title: Docs and changelog}]
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

## Decisions

- Owner 2026-11-21 (G-024 decision 2, "Fix it in the first round": each scene's moon data becomes its own after a reproduction test is pinned; decision 7: design confirmed by "work through this list of objectives one by one. Orchestrate each objective to completion"; step checks waived on every Task).
- Planner (orchestrate-g024-20261121), settled from evidence (details and file:line in each Task):
  1. The binding lives on each `Scene`: its plan catalogue starts bound to that scene's own moon data (`api/planBodies.ts`), so every resolver path that reads `plan.catalogue` picks it up; the `assembleScene` shortcut that hands the viewer the unbound catalogue goes.
  2. Decoded moon files are shared per data source (keyed on its `loadIndex` reader, then chunk URL, in a `WeakMap`); failures are not cached; each loader keeps its own record of what it loaded (API-03: no page-wide cache that skips loading).
  3. Core callers without a scene keep the process-wide moon systems (22 test files and the Horizons tests keep their setup); a guard test in the preloaded project fails if any public path falls back to them.
  4. The reproduction runs in the cold project (the preload masks the defect) and is pinned with `it.fails` until T-358 flips it.
  5. A moon moment outside a scene's own loaded data is the O-083 `bad-time`, never an answer from another scene's data; the planet barycentre fallback is unchanged.
  6. Three assertions in `twoViewers.test.ts` that read the shared install after a public mount move to the viewer's own resolver with the same intent (assertion lines only; setup unchanged).
  7. The 1950 clamp mirrors `boundsOf` for `loadedFromUtcMs`; the resolver memo drops on a revision counter of the scene's moon data.
  8. One scene loaded twice with different sources for one planet: the last load wins for that scene only, no new code.
  9. No public type change; the behaviour change (a scene no longer borrows another's moon package) is breaking under decision 6 and is named in the CHANGELOG (T-360).

## Parked (2026-11-21, orchestrate-g024-20261121)

All seven Tasks are done and every Success Condition is proven, but Full Objective Check C-198 is NEEDS WORK on one gate: the engine's first download is 801 bytes over its raw size cap (I-191; gzip within). Under G-024 decision 7 ("a size budget goes red": park it, continue others) O-084 is left unmerged on branch `o084-scene-moon-data`. Owner choice needed (options in I-191): raise the raw cap a little, reset it by the earlier "measured + 5%" rule, or trim ~1 KB of engine code first. After the choice: apply it, re-run the Full Check, merge.
- Owner, 2026-11-22: "carry on size option a" (I-191: raw cap +3,000 B). O-084 set done by the orchestrating session after re-check C-200 CLEAR (G-024 decision 7, "Orchestrate each objective to completion"; "CLEAR: fast-forward merge to main and push").
