---
id: I-125
title: 'A path cannot change its drawing frame along its length'
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: probe-switch-20261101}
  at: '2026-11-01T00:00:00Z'
severity: high
resolution:
  disposition: escalated
  actor: {role: planner, session: probe-switch-20261101}
  at: '2026-11-01T01:00:00Z'
  reason: 'Repair promoted into O-050 (Follow a probe as one path), owner-confirmed design.'
escalated_to: O-050
history:
  - at: '2026-11-01T00:00:00Z'
    actor: {role: planner, session: probe-switch-20261101}
    kind: observed
    note: 'Reported from the Voyager probe app (astraeus@0.6.0, public API only) as "Following a probe stops at the end of each piece", pasted by the owner in the open-requests summary of 2026-11-01. Rated blocks. Folds in the app''s earlier entry "One path cannot change what its line is fixed to over time".'
  - at: '2026-11-01T01:00:00Z'
    actor: {role: planner, session: probe-switch-20261101}
    kind: escalated
    note: 'Escalated to O-050 (Follow a probe as one path) under G-014; owner confirmed the design.'
---

# I-125: A path cannot change its drawing frame along its length

## Summary

`addTrajectory`'s `lineFixedTo` is one body for the whole path. A flyby mission needs its line Sun-fixed in cruise and planet-fixed through each encounter, so apps split one probe into pieces that meet end to start (Voyager 1: five, Voyager 2: nine). The pieces are separate objects. When the followed piece's time ends it shows "(Unavailable)" in the object menu and the camera does not move on, so the visitor has to pick the next piece by hand. The menu also lists every piece, and each piece has its own card. The mount handle has no runtime camera call, so the app cannot hand over the camera itself.

Wanted: one probe followed from launch to today as one object for the menu, card, readouts and `camera.follow`. The fix is reusable beyond Voyager: any flyby or orbiter (Cassini, Juno, New Horizons, Galileo, Rosetta) and Apollo's lunar orbits drawn against the Moon, including the engine's own Apollo 11 scene.

## Evidence

- Owner on astraeus@0.6.0, 2026-11-01: Voyager 2 playback "doesnt go smoothly". At each piece's end the camera stays put and the piece shows "(Unavailable)". Voyager 1's five pieces do the same.
- Engine: `lineFixedTo?: BodyId` is a single body (`packages/astraeus/src/api/scene.ts:113`). A followed tracked body is held at its clamped end state outside its bounds (`TrackedBodyView.absolute` → `stateClampedToBounds`, `packages/astraeus/src/app/TrackedBodyView.ts:130`).
- Voyager app: `leg()` and `transit()` in `src/data/probe.ts` build one `addTrajectory` per cruise leg and per encounter.

Suggested engine change (reporter's options, not a decision): host-listed stretches (`lineFixedTo: [{ until, body }]` or `lineFixedToSpans`, like `provenanceSpans`), or automatic choice of the dominant body by sphere of influence (`lineFixedTo: "auto"`). Not wanted: a camera hand-over between separate paths, which only papers over the split.

## Proof Needed

On the packed package, public API only: one `addTrajectory` for a Voyager-style journey draws Sun-fixed in cruise and planet-fixed through each encounter (the swing past the moons held against the planet). Followed from launch at fast playback, the camera stays on the probe through every encounter with no "(Unavailable)" and no selection by the visitor. The probe is one object-menu entry with one card and continuous readouts. The same mechanism draws an Apollo lunar orbit against the Moon.
