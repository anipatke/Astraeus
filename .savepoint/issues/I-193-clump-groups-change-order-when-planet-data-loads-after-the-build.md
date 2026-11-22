---
id: I-193
title: Clump groups change order when planet data loads after the scene is built
type: defect
status: resolved
source:
  kind: report
  actor: {role: executor, session: orchestrate-g024-20261122}
  at: '2026-11-21T22:58:52Z'
tasks: [T-408]
checks: [C-207]
guardrail_ids: []
severity: medium
resolution:
  disposition: verified
  check: C-207
  actor: {role: checker, session: check-o088-20261122}
  at: '2026-11-22T02:28:16Z'
  reason: 'C-207 CLEAR: sceneLoadOrder.test.ts compares the definition after prepare, group order included, with no exclusion; it fails on the pre-fix assembleScene.ts (ring/belt swapped) and passes on 3c3e46fe; an interleaved probe (p1, c1, p2, c2, p3) keeps declared order in both load orders.'
history:
  - at: '2026-11-21T22:58:52Z'
    actor: {role: executor, session: orchestrate-g024-20261122}
    kind: observed
    note: 'T-408 scratch diff of fixtures/scenePin.json (seriesLoaded vs seriesNotLoaded): case "groups: with and without a clump, a rate readout, an activit…" has definition.groups ids [ring, belt] when the planet series are loaded and [belt, ring] when not; the clump group "ring" is built late in prepare (planGroups.ts lateGroups) and appended after "belt" instead of keeping its declared position. The scene pin froze both orders, so it never flagged it.'
  - at: '2026-11-21T23:05:30Z'
    actor: {role: executor, session: build-t408-20261122}
    kind: repair_attempted
    note: 'assembleScene.ts: in `prepare`, late-built group layers are merged with the early ones and put back in declared (addGroup) order (`inDeclaredOrder`) instead of appended. Proof: packages/astraeus/tests/sceneLoadOrder.test.ts case "groups: with and without a clump, ..." fails on the pre-fix file (ring/belt swapped) and passes after; no exclusion for group order.'
  - at: '2026-11-22T02:28:16Z'
    actor: {role: checker, session: check-o088-20261122}
    kind: rechecked
    note: 'C-207: Proof Needed met; closed as verified.'
    check: C-207
---

# Clump groups change order when planet data loads after the scene is built

## Problem

A group with a clump near a body is built late (in `prepare`) when the planet series are not loaded yet. The late group is appended after the groups built early, so `definition.groups` order depends on load order. G-024's outcome asks for the same answer for every load order.

## Proof Needed

`sceneLoadOrder.test.ts` (T-408) compares the two load orders with `toEqual` on the definition after `prepare`, including `definition.groups` order, with no exclusion for this case; it fails on the code before the fix.

## Repair Routing

Fixed inside T-408 (coordinator decision, owner rule "strategic fix first"): keep each group at its declared position whether built early or late.
