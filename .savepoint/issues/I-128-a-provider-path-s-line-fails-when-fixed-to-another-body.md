---
id: I-128
title: "A provider path's line fails when it is fixed to another body"
type: defect
status: resolved
source:
  kind: check
  check: C-132
  actor: {role: checker, session: o050-check-20261101}
  at: '2026-10-31T22:20:00Z'
tasks: [T-213, T-216]
checks: [C-132, C-133]
guardrail_ids: [TEST-01]
severity: medium
resolution:
  disposition: verified
  check: C-133
  actor: {role: checker, session: o050-recheck-20261101}
  at: '2026-10-31T22:30:00Z'
  reason: 'Repair 87803afc verified by C-133: provider path sample times are rounded to whole ms (providerBody, scene.ts:950-952). C-132''s own probe re-run unchanged now draws id "earth", the [sun, earth] list and "auto" on 2-day bounds; an independent probe on a 401 h + 7 ms provider flyby of Earth draws every form, resolves auto to sun/earth/sun within one sample step of the analytic sphere-of-influence crossing, matches a sampled path at the same times to 6.8e-7, and gives 128 whole-ms, exact-ended times over seven spans. Regression test publicApiProviderLines.test.ts passes; fresh gates, test:full (2064 passed), check:pack, check:engine-alone and check:node-consumer pass.'
history:
  - at: '2026-10-31T22:20:00Z'
    actor: {role: checker, session: o050-check-20261101}
    kind: observed
    note: 'Found by an independent probe in the O-050 Full Objective Check (C-132). An addTrajectory given as provider + bounds fails with a RangeError ("timeUtcMs must be an integer JavaScript UTC Unix-millisecond value") once its line is fixed to a body other than the scene centre: "auto" fails at toDefinition, and a listed stretch list (and a plain id, already before O-050) fails when the line is drawn. Sampled paths are not affected.'
    check: C-132
  - at: '2026-10-31T22:30:00Z'
    actor: {role: checker, session: o050-recheck-20261101}
    kind: rechecked
    check: C-133
    note: 'Repair 87803afc verified by C-133: provider path sample times are rounded to whole ms (providerBody, scene.ts:950-952). C-132''s own probe re-run unchanged now draws id "earth", the [sun, earth] list and "auto" on 2-day bounds; an independent probe on a 401 h + 7 ms provider flyby of Earth draws every form, resolves auto to sun/earth/sun within one sample step of the analytic sphere-of-influence crossing, matches a sampled path at the same times to 6.8e-7, and gives 128 whole-ms, exact-ended times over seven spans. Regression test publicApiProviderLines.test.ts passes; fresh gates, test:full (2064 passed), check:pack, check:engine-alone and check:node-consumer pass.'
---

# I-128: A provider path's line fails when it is fixed to another body

## Summary

`addTrajectory` takes a path either as `samples` or as `provider` + `bounds` (`TrajectoryBase`, `packages/astraeus/src/api/scene.ts:142-145`), and `lineFixedTo` (one id, a list of stretches or `"auto"`) is on both. A provider path's drawn times are `bounds.start + index * step` with `step = (end - start) / 127` (`providerBody`, `scene.ts:943-944`), which is not a whole millisecond unless the span is a multiple of 127 ms. The state resolver refuses a non-integer time, so:

- `lineFixedTo: "auto"` on a provider path throws a `RangeError` (not a `SceneError`) from `toDefinition`, in `#autoStretches` (`scene.ts:704-726`), whatever the bodies.
- A listed stretch list that names a body other than the scene centre is accepted at build, then throws the same `RangeError` the first time `TrackedBodyView` draws the line (`#relative` → `relativeTrailKm` at the sample times).
- A plain body id other than the centre fails the same way when drawn. That part is older than O-050 (the drawing path and the provider times were not changed by it); O-050 widened it to the list and `"auto"` forms, which promise to work on "the path's own samples".

Expected: every `lineFixedTo` form works on a provider path as on a sampled one, or is refused at build with a named `SceneError`.

## Evidence

Probe (checker session, not in the repo; source and output kept in the C-132 record): a Sun + Earth scene, `addTrajectory({ id: "p", center: "sun", provider, bounds: { start: 2026-01-01, end: +2 days }, lineFixedTo })`, the provider returning a valid `createState` near Earth, then `toDefinition()` and one `TrackedBodyView.update`:

| `lineFixedTo` | Result |
|---|---|
| none | drawn |
| `"earth"` | `RangeError: timeUtcMs must be an integer ...` (older than O-050) |
| `[{ sun, day 0-1 }, { earth, day 1-2 }]` | `RangeError` when drawn |
| `"auto"` (2-day bounds) | `RangeError` from `toDefinition` |
| `"auto"` (bounds of 127 h, a whole-ms step) | drawn; resolves to `["earth"]` |

The new tests (`publicApiLineStretches.test.ts`, `publicApiAutoStretches.test.ts`) and `check:node-consumer` use sampled paths only, so they miss this.

## Proof Needed

A provider path whose span is not a multiple of 127 ms is drawn with `lineFixedTo` set to a non-centre id, to a stretch list naming a non-centre body, and to `"auto"` (resolving to a non-centre body). Each case builds and draws, or is refused at build with a named `SceneError`, and a regression test covers all three. Sampled-path cases stay unchanged. The general fix is probably whole-millisecond provider path times, rather than a special case in the auto resolver.
