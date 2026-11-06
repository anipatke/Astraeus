---
id: I-144
title: Two demo rules lost their tests when the site tests moved
type: verification
status: open
source:
  kind: check
  check: C-148
  actor: {role: checker, session: o059-check-20261107}
  at: '2026-11-06T19:51:42Z'
tasks: [T-272]
checks: [C-148]
guardrail_ids: [TEST-01, TEST-03]
severity: low
history:
  - at: '2026-11-06T19:51:42Z'
    actor: {role: checker, session: o059-check-20261107}
    kind: observed
    note: 'Named by T-272 and Design as a coverage gap left for the Full Objective Check; judged case by case in C-148.'
    check: C-148
  - at: '2026-11-07T07:05:00Z'
    actor: {role: executor, session: o059-repair-20261107}
    kind: repair_attempted
    note: 'Repair: tests/moonFreeMetrics.test.ts (a made-up Moon-free scene; a spying resolver is never asked for the Moon) and a new block in tests/markerRuleEveryBody.test.ts (bodies a scene defines for itself with addBodyFromElements, with and without a radius: drawn size, marker far off, sphere close up). Deep-import counts unchanged (engine tests, no site import). Mutations: a Moon read through a variable in assembleScene createMetrics fails moonFreeMetrics; forcing radiusKm 0 in core/elementsBody.ts fails both marker rows; both undone. Design drift line for T-272 corrected. Gates as I-143. Unverified: the real shower scenes (swift-tuttle, phaethon) are not walked; the made-up body takes the same code path (addBodyFromElements).'
    check: C-148
---

# I-144: Two demo rules lost their tests when the site tests moved

## Summary

T-272 dropped seven kinds of assertion, saying they are "not asserted anywhere now", and Design calls this a known gap "to be re-proved". Five are in fact still held by named tests. Two are not: a Moon-free scene never asks about the Moon, and the marker rule on bodies a shower defines for itself. Both behaviours still work today; nothing fails if they break.

## Evidence

Violated: TEST-03 (no exact file and case recorded, and none exists for these two) and TEST-01 (the rules had named evidence on main and lost it in this Objective).

- **Moon-free metrics.** Removed with `packages/astraeus-site/tests/experiences.test.ts` ("answers every Perseids metric without asking the resolver about the Moon"). With a non-throwing Moon read added to `createMetrics` (`packages/astraeus/src/api/assembleScene.ts:175`) in a scratch copy, only `nameCheck.test.ts` fails, and only because the mutation spells a body name. A read through a variable fails nothing.
- **Marker rule on shower-defined bodies.** Removed from `packages/astraeus-site/tests/demoRules.test.ts` (main line 59). `packages/astraeus/tests/markerRuleEveryBody.test.ts` walks the built-in catalogue only, which holds no comets, so `swift-tuttle` and `phaethon` are outside it. With the `packages/astraeus/src/core/elementsBody.ts:232` radius forced to 0 in a scratch copy, no engine, showers or site test fails beyond the copy's own baseline.

Today's behaviour, by a scratch probe on both shower scenes: the Moon is never asked (14 resolver reads each), and `swift-tuttle` and `phaethon` have a radius above 0, a marker far off and a sphere close up.

The other five are held: orbit-line listing (`demoShowers.test.ts` "lists the stream once and every mounted body..."; `rebuildComparison.test.ts`), label defaults and Earth path samples (showers `rebuildComparison.test.ts` "draws the same orbit lines on the same bodies..."), scale factor (`demoShowers.test.ts` "offers True and Solar-system scale..."; `bodyMarkers.test.ts`), Apollo metric rows (Apollo `rebuildComparison.test.ts` "gives Earth and the Moon the same distance row..."; `metricVisuals.test.ts`).

## Proof Needed

A fast test for each rule, on a made-up Moon-free scene or body in the engine (ARCH-03) or on the shower scenes in the showers package, without raising its deep-import count. Each fails under the matching mutation above: a Moon read reached through a variable, and a radius of 0 on a body from `addBodyFromElements`. Correct the Design drift line for T-272 to name what is held and what was restored.
