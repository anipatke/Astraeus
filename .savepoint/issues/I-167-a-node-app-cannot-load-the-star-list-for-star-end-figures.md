---
id: I-167
title: A Node app cannot load the star list for star-end figures
type: defect
status: open
source:
  kind: report
  actor: {role: planner, session: o067-run-20261110}
  at: '2026-11-10T08:58:02Z'
tasks: [T-305]
guardrail_ids: [API-01]
severity: medium
history:
  - at: '2026-11-10T08:58:02Z'
    actor: {role: planner, session: o067-run-20261110}
    kind: observed
    note: 'Found by the T-305 builder while proving all 88 constellations load headless; outside T-305 scope (no engine change there).'
---

# I-167: A Node app cannot load the star list for star-end figures

## Summary

`scene.load()` in Node cannot read the engine's bundled star list (it fetches a bundled URL), so a scene with sky figures whose ends name stars (`{ star: HIP }`) gets `missing-data` when used headless. O-056 made headless use a public promise (moon chunks read through `node:fs` for `file:` addresses); the star list was left out. Any Node consumer of `astraeus-data-constellations` hits it.

## Evidence

T-305 (O-067) Technical Evidence: the all-88 scene test passes only by stubbing global `fetch` to serve `packages/astraeus/src/assets/stars/hyg-v42-naked-eye.json` from disk.

## Proof Needed

A Node test with no `fetch` stub: a scene with a star-end sky figure passes `scene.load()` from the packed engine (the `check:node-consumer` path), and `unknown-star` is still thrown for an id not in the list.
