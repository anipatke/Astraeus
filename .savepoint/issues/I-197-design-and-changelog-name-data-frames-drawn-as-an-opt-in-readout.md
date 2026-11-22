---
id: I-197
title: Design and the changelog name data-frames-drawn as an opt-in readout, but it is always written
type: drift
status: open
source:
  kind: check
  check: C-205
  actor: {role: checker, session: check-o087-orchestrator-20261122}
  at: '2026-11-22T02:03:31Z'
tasks: [T-400]
checks: [C-205]
guardrail_ids: []
severity: low
history:
  - at: '2026-11-22T02:03:31Z'
    actor: {role: checker, session: check-o087-orchestrator-20261122}
    kind: observed
    note: 'C-205: Design.md:122 and packages/astraeus/CHANGELOG.md:28 give data-frames-drawn as the example of the readouts that now need the flag; LayeredRender.tsx:39 writes it every drawn frame, flag or not (planner decision 3 kept it on).'
    check: C-205
  - at: '2026-11-22T02:10:06Z'
    actor: {role: executor, session: orchestrate-g024-20261122}
    kind: repair_attempted
    note: 'Design.md `A lighter frame loop (O-087)` and CHANGELOG 0.10.0 entry now name only gated readouts (data-paths, data-points, data-body-screen, data-scene) as opt-in and say the cheap state attributes (data-frames-drawn, data-pick-hover, data-sky-lines, data-body-set-hover/-named) stay on.'
---

# I-197: Design and the changelog name data-frames-drawn as an opt-in readout

## Summary

The O-087 Design note (`.savepoint/Design.md:122`, `### A lighter frame loop (O-087)`) says "The canvas readouts (`data-frames-drawn` and the like) are opt-in". The 0.10.0 changelog entry (`packages/astraeus/CHANGELOG.md:28`) says "The canvas readouts (`data-frames-drawn` and similar) now need `globalThis.__ASTRAEUS_DIAGNOSTICS__`". In fact `data-frames-drawn` is always written (`packages/astraeus/src/app/LayeredRender.tsx:39`). The Objective's planner decision 3 kept it, and the other cheap state attributes, always on. The readouts that are gated are `data-paths`, `data-points`, `data-body-screen`, `data-orbit-head-gap`, the body-set readouts, the scene data and `data-feature-markers` (as `docs/BROWSER_CHECKS.md` states correctly). T-400 asked for a Design note that describes the opt-in readouts. This note names the wrong example to future planners, and the changelog tells embedders the wrong thing.

## Evidence

- `grep -n "framesDrawn" packages/astraeus/src` finds only `LayeredRender.tsx:39`, which sets `gl.domElement.dataset.framesDrawn` with no flag check.
- `frameDiagnostics.test.ts` lists the gated keys; `framesDrawn` is not one of them.

## Proof Needed

- Design.md `### A lighter frame loop (O-087)` and the CHANGELOG 0.10.0 line name gated readouts only, for example `data-paths` and `data-body-screen`. If they mention the cheap state attributes at all, they say those (`data-frames-drawn`, `data-pick-hover`, `data-sky-lines`, `data-body-set-hover`/`-named`) stay on.
