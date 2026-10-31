---
id: I-115
title: 'Opening with camera.lookAt on a path selects the Sun instead of the path'
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: probe-feedback-20261031}
  at: '2026-10-31T12:00:00Z'
severity: low
history:
  - at: '2026-10-31T12:00:00Z'
    actor: {role: planner, session: probe-feedback-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.4.0 from npm, public API only), pasted by the owner.'
---

# I-115: Opening with camera.lookAt on a path selects the Sun instead of the path

## Summary

A scene that opens with `camera.lookAt(pathId)` shows the Sun as the selected object, not the path it is looking at.

## Evidence

- Reported against 0.4.0; not yet reproduced here.
- `lookAt` is defined at `packages/astraeus/src/api/scene.ts:167`.

## Proof Needed

- Opening with `lookAt` (and `follow`) on a path or body selects that object in the viewer; a test covers both.
