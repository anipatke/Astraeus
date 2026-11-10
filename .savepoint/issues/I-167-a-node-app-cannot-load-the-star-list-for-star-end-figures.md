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
  - at: '2026-11-10T20:46:00Z'
    actor: {role: checker, session: o067-check-20261111}
    kind: rechecked
    note: 'Reproduced at the O-067 Full Objective Check on the packed engine and packed constellations package in a scratch Node app (no fetch stub): constellations(["Ori"]) in a Scene, await scene.load() rejects missing-data ("the engine''s star list could not be read"); a figure naming an unknown HIP also gets missing-data, not unknown-star. Assessed as not material to O-067 closure: the limit is the engine''s headless star-list read (O-065/O-056 behaviour), O-067 Boundaries exclude engine changes beyond a found defect, browser apps (the Objective''s supported path, hello-sky) load the list, and the limit is stated in Design.md (Constellations, 4). Stays open as follow-up for the owner to schedule or accept.'
    check: C-167
---

# I-167: A Node app cannot load the star list for star-end figures

## Summary

`scene.load()` in Node cannot read the engine's bundled star list (it fetches a bundled URL), so a scene with sky figures whose ends name stars (`{ star: HIP }`) gets `missing-data` when used headless. O-056 made headless use a public promise (moon chunks read through `node:fs` for `file:` addresses); the star list was left out. Any Node consumer of `astraeus-data-constellations` hits it.

## Evidence

T-305 (O-067) Technical Evidence: the all-88 scene test passes only by stubbing global `fetch` to serve `packages/astraeus/src/assets/stars/hyg-v42-naked-eye.json` from disk.

## Proof Needed

A Node test with no `fetch` stub: a scene with a star-end sky figure passes `scene.load()` from the packed engine (the `check:node-consumer` path), and `unknown-star` is still thrown for an id not in the list.
