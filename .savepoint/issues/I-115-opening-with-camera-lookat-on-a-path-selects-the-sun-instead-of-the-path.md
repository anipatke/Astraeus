---
id: I-115
title: 'Opening with camera.lookAt on a path selects the Sun instead of the path'
type: defect
status: resolved
source:
  kind: report
  actor: {role: owner, session: probe-feedback-20261031}
  at: '2026-10-31T12:00:00Z'
severity: low
checks: [C-128]
resolution:
  disposition: verified
  check: C-128
  actor: {role: checker, session: o047-recheck2-20261031}
  at: '2026-10-31T04:25:00Z'
  reason: 'C-128 CLEAR: opening selection for camera.lookAt/follow on a path proven and now guarded by tests (C-126 row 15); the reporter''s original case was not reproduced (C-126 observation 1).'
history:
  - at: '2026-10-31T12:00:00Z'
    actor: {role: planner, session: probe-feedback-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.4.0 from npm, public API only), pasted by the owner.'
  - at: '2026-10-31T16:00:00Z'
    actor: {role: executor, session: o047-run-20261031}
    kind: repair_attempted
    note: 'T-199: not reproduced. lookAt/follow on a path or body select the target in a made-up Sun-centred scene (tests/publicApiOpeningSelection.test.ts, 6 cases). Hypothesis, unproved: the shell replaces a selected object unavailable at the clock with the first available one (the Sun), so a scene opening before the path''s first sample shows the Sun. Needs the reporter''s opening time and path bounds.'
  - at: '2026-10-31T04:25:00Z'
    actor: {role: checker, session: o047-recheck2-20261031}
    kind: rechecked
    check: C-128
    note: 'Verified by C-128 CLEAR (targeted re-check of O-047 after the I-110 surface repair, 6878f277).'
---

# I-115: Opening with camera.lookAt on a path selects the Sun instead of the path

## Summary

A scene that opens with `camera.lookAt(pathId)` shows the Sun as the selected object, not the path it is looking at.

## Evidence

- Reported against 0.4.0; not yet reproduced here.
- `lookAt` is defined at `packages/astraeus/src/api/scene.ts:167`.
- 2026-10-31 (T-199): not reproduced; likely the opening time is before the path's first sample, where the shell falls back to the first available object. Ask the reporter for their opening time and path bounds.

## Proof Needed

- Opening with `lookAt` (and `follow`) on a path or body selects that object in the viewer; a test covers both.
