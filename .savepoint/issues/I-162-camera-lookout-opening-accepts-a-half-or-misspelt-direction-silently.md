---
id: I-162
title: camera.lookOut opening accepts a half or misspelt direction silently
type: defect
status: resolved
source:
  kind: check
  check: C-161
  actor: {role: checker, session: o064-check-20261110}
  at: '2026-11-10T02:44:58Z'
tasks: [T-292]
checks: [C-161, C-162]
guardrail_ids: [API-04, API-05, STYLE-07]
severity: low
resolution:
  disposition: verified
  check: C-162
  actor: {role: checker, session: o064-recheck-20261110}
  at: '2026-11-10T02:56:00Z'
  reason: Repair proven by C-162 (CLEAR).
history:
  - at: '2026-11-10T02:44:58Z'
    actor: {role: checker, session: o064-check-20261110}
    kind: observed
    note: 'Found by the O-064 Full Objective Check probe harness (session scratchpad, probe/extra.probe.test.ts). scene.camera.lookOut("earth", { direction: { raDeg: 10 } }) returns normally with pose { lookOut: "earth", raDeg: 10, decDeg: 0, fovDeg: 60 }; the same shape given to handle.setCamera throws bad-camera (lifecycle.test.ts line 446 asserts it).'
    check: C-161
  - at: '2026-11-10T13:50:00Z'
    actor: {role: executor, session: o064-i162-repair-20261110}
    kind: repair_attempted
    note: 'Repair done, awaiting the re-check. src/core/startView.ts: new shared validateSkyPosition (exactly raDeg and decDeg; half pair, array, extra key refused) and validateSkyLook (opening look: only direction and fovDeg keys, non-object look refused, omitted fields default to 0, 0, 60); setCamera lookDirection (viewerCamera.ts) now uses validateSkyPosition and camera.lookOut (planCamera.ts) uses validateSkyLook, so one check serves both (STYLE-07). Regression: lifecycle.test.ts "camera.lookOut opening refuses a half, empty, misspelt or extra-key direction and a non-object look as setCamera does (I-162)" failed before the fix. README and CHANGELOG lookOut lines updated. lint, typecheck, build, npm test pass.'
  - at: '2026-11-10T02:56:00Z'
    actor: {role: checker, session: o064-recheck-20261110}
    kind: rechecked
    note: 'Proof Needed met, by C-162 (CLEAR): through the public API at 754c2798, scene.camera.lookOut throws bad-camera at the call, keeping the prior opening pose, for a half pair either way, {}, [], null, misspelt or extra direction keys, non-number or out-of-range direction parts, unknown look keys ({fov}), non-object look (string, null, array, number, boolean, function) and null/string/out-of-range fovDeg; lookOut(body), lookOut(body, {}), {fovDeg} alone and {direction} alone keep the 0/0/60 defaults; setCamera refuses and accepts the same shapes as in C-161 (18 bad shapes, object/flat/id/keep/default directions vs a textbook oracle). One position check (validateSkyPosition) serves both. Regression test in lifecycle.test.ts passes on both drivers; full gate passes.'
    check: C-162
---

# I-162: camera.lookOut opening accepts a half or misspelt direction silently

## Summary

`scene.camera.lookOut(body, look)` (T-292) fills any missing part of `look.direction` with 0 and any missing `fovDeg` with 60, and ignores keys it does not know. A half-given, empty, misspelt or extra-key direction, or a misspelt field-of-view key, opens the scene looking somewhere else with no error. `handle.setCamera` refuses every one of these shapes with `bad-camera`, so the two entry points to the same sky reading disagree. The Objective's success condition says bad input throws `bad-camera` at the call (API-04: shape errors throw at the call that received them).

## Evidence

- Violated: O-064 success condition 2 ("bad input throws `bad-camera` at the call (API-04, API-05)"); Guardrail API-04 (shape errors throw at the call). Advisory: STYLE-07 (the opening and `setCamera` each have their own direction check, which is how they diverged).
- Code: `packages/astraeus/src/api/planCamera.ts` lines 59-64. Line 63 builds `{ lookOut: id, raDeg: direction?.raDeg ?? 0, decDeg: direction?.decDeg ?? 0, fovDeg: look?.fovDeg ?? 60 }` before `validateCameraView` sees it, so the full check never sees the missing or extra fields. Compare `packages/astraeus/src/api/viewerCamera.ts` `lookDirection` (extra keys and a half pair are `bad-camera`).
- Reproduction (each returns normally; resulting `scene.camera.pose` shown):
  - `{ direction: { raDeg: 10 } }` -> raDeg 10, decDeg 0, fovDeg 60
  - `{ direction: { decDeg: 10 } }` -> raDeg 0, decDeg 10
  - `{ direction: {} }` and `{ direction: [] }` -> raDeg 0, decDeg 0
  - `{ direction: { ra: 83.6, dec: 22 } }` (misspelt keys) -> raDeg 0, decDeg 0
  - `{ direction: { raDeg: 1, decDeg: 2, x: 1 } }` -> accepted, extra key ignored
  - `{ fov: 40 }` (misspelt key), `{ fovDeg: null }`, `look` = `"x"` or `null` -> fovDeg 60, no error
- Expected: `bad-camera` at the call for each, as `setCamera` does. Actual: accepted with defaults.
- Missing test evidence: `packages/astraeus/tests/lifecycle.test.ts` line 489 tests only out-of-range values for the opening (`fovDeg` 4/101, `decDeg` 95, `raDeg` NaN), not a half pair, empty/array direction, extra or misspelt keys, or a non-object `look`.

TypeScript callers are protected by `SkyDirection` (both fields required); JavaScript callers and directions read from data are not.

## Proof Needed

`scene.camera.lookOut` refuses with `bad-camera`, at the call, each shape listed above (half pair either way, `{}`, `[]`, misspelt or extra direction keys, unknown `look` keys, non-object `look`, non-number `fovDeg`), while `lookOut(body)`, `lookOut(body, {})` and `lookOut(body, { direction: { raDeg, decDeg }, fovDeg })` still work with the stated defaults. Ideally one direction check serves both the opening and `setCamera` (STYLE-07). A test in `tests/lifecycle.test.ts` lists these shapes and fails before the fix.
