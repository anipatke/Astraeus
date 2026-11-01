---
id: I-130
title: A React app cannot read the camera or call the viewer directly
type: other
status: resolved
source:
  kind: report
  actor: {role: planner, session: o052-run-20261101}
  at: '2026-11-01T04:40:00Z'
tasks: [T-225, T-226, T-227]
severity: medium
resolution:
  disposition: escalated
  actor: {role: planner, session: api-review-20261101}
  at: '2026-11-01T06:30:00Z'
  reason: 'Promoted into O-054 (give React and plain apps the same handle), G-016, after the owner-approved whole-package review.'
escalated_to: O-054
history:
  - at: '2026-11-01T04:40:00Z'
    actor: {role: planner, session: o052-run-20261101}
    kind: observed
    note: 'Found while building the T-227 examples: hello-react follows the encounter probe but cannot restore the camera afterwards. Input for the whole-public-API review the owner asked for after O-052.'
  - at: '2026-11-01T05:00:00Z'
    actor: {role: planner, session: o052-run-20261101}
    kind: observed
    check: C-136
    note: 'C-136 (CLEAR) non-blocking observations for the same API review: ready after an early unmount resolves unusable (before load) or never settles (render to attach), doc covers only the second; StrictMode close() makes a later rebuild skip whenAttached so onReady could fire early; doc comments mount.ts:39 and viewerLink.ts:162 still say camera is undefined before the first frame; README API rows for mount and AstraeusScene omit address; a throwing onEventZone listener stops later listeners; React camera prop compares by JSON.stringify (key order re-applies).'
  - at: '2026-11-01T06:30:00Z'
    actor: {role: planner, session: api-review-20261101}
    kind: escalated
    note: 'Escalated to O-054 (G-016); the C-136 observations above are split across O-054 (lifecycle, StrictMode, listeners, camera prop) and O-053 (doc comments, README address rows).'
---

# I-130: A React app cannot read the camera or call the viewer directly

## Summary

`mount` returns a handle with reads (`time`, `rate`, `view`, `camera`, `eventZones`) and calls (`setTime`, `setRate`, `setView`, `setCamera`). `AstraeusScene` exposes only props applied on change plus `onChange` / `onEventZone` callbacks, so a React app cannot read the camera pose and so cannot compose "camera to the encounter and back" (O-052's composition) without remounting through `mount`. The two embedding paths have drifted apart in what a host can do; the owner wants the package modular and consumable, with the same building blocks on both paths.

## Evidence

`examples/hello-react/src/main.jsx` (T-227): follows the encounter's probe via the `camera` prop but does not return, because no prop or callback gives the pose. `packages/astraeus/src/api/AstraeusScene.tsx` props vs `MountedScene` in `packages/astraeus/src/api/mount.ts`.

## Proof Needed

A React app reaches the same reads and calls as a `mount` host (for example a handle given through `onReady` or a ref), shown by hello-react restoring the camera after an encounter, with tests for parity between the two paths. To be settled in the whole-public-API review Objective (owner, 2026-11-01).
