---
id: I-167
title: A Node app cannot load the star list for star-end figures
type: defect
status: resolved
source:
  kind: report
  actor: {role: planner, session: o067-run-20261110}
  at: '2026-11-10T08:58:02Z'
tasks: [T-305]
checks: [C-168]
guardrail_ids: [API-01]
severity: medium
resolution:
  disposition: verified
  check: C-168
  actor: {role: checker, session: release-0-9-0-issue-check-20261111}
  at: '2026-11-10T21:20:00Z'
  reason: Repair proven by C-168 (CLEAR).
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
  - at: '2026-11-11T08:10:00Z'
    actor: {role: executor, session: release-0-9-0-builder}
    kind: repair_attempted
    note: 'Direct repair on release-0-9-0 (uncommitted). The star list now loads through the engine''s one bundled-file reader (new core/readBytes.ts, moved out of moonSystem.ts: file: through node:fs, else fetch; sky.ts fetchStarFile uses it). Proof Needed re-run: (1) check:node-consumer builds the packed engine plus the packed astraeus-data-constellations and runs constellations([''Ori''], {outlines:true}) through scene.check() and await scene.load() in real Node with no fetch stub: passes; with sky.ts reverted it fails with missing-data, so the check catches the trap. (2) The same test loads a figure with an unlisted star number and gets code unknown-star. (3) The all-88 scene test in astraeus-data-constellations no longer stubs fetch and passes: the root vitest.config.ts gained a small plugin giving a .json?url import its file: address under test (as build-packages does for the packed package). Neighbours: moon chunk reads unchanged (same reader; the error text lost its ''moon fit chunk'' prefix); tests/hygStars.test.ts now expects no fetch for the file: address, tests/sky.test.ts import allowlist adds core/readBytes. Gates: lint, typecheck, npm test (248 files, 3669 passed, 2 skipped), build, check:engine-alone, check:pack, check:node-consumer all pass. Unverified: browser path (no browser check run, owner rule); fetch path for http addresses is covered only by existing tests. Not verified or resolved by this entry.'
  - at: '2026-11-10T21:20:00Z'
    actor: {role: checker, session: release-0-9-0-issue-check-20261111}
    kind: rechecked
    note: 'Proof Needed holds: check:node-consumer (packed engine + packed constellations, Node, no fetch stub) loads Orion and gets unknown-star for an unlisted HIP; independent plain-Node probe with fetch poisoned loads all 88 with outlines; mutation restoring the old fetch read gives missing-data; check:browser hello-sky and look-out pass (http path). Moon chunk error prefix change relied on by nothing.'
    check: C-168
---

# I-167: A Node app cannot load the star list for star-end figures

## Summary

`scene.load()` in Node cannot read the engine's bundled star list (it fetches a bundled URL), so a scene with sky figures whose ends name stars (`{ star: HIP }`) gets `missing-data` when used headless. O-056 made headless use a public promise (moon chunks read through `node:fs` for `file:` addresses); the star list was left out. Any Node consumer of `astraeus-data-constellations` hits it.

## Evidence

T-305 (O-067) Technical Evidence: the all-88 scene test passes only by stubbing global `fetch` to serve `packages/astraeus/src/assets/stars/hyg-v42-naked-eye.json` from disk.

## Proof Needed

A Node test with no `fetch` stub: a scene with a star-end sky figure passes `scene.load()` from the packed engine (the `check:node-consumer` path), and `unknown-star` is still thrown for an id not in the list.
