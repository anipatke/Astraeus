---
id: I-065
title: "Planets set: jupiter-io on a phone does not find Loki Patera"
type: verification
status: open
source:
  kind: check
  check: C-094
  actor: {role: checker, session: o037-full-check-20261021}
  at: '2026-10-21T11:10:00Z'
tasks: [T-124, T-126]
checks: [C-094]
history:
  - at: '2026-10-21T11:10:00Z'
    actor: {role: checker, session: o037-full-check-20261021}
    kind: observed
    check: C-094
    note: Found by the O-037 Full Objective Check.
  - at: '2026-10-21T11:22:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: deferred
    note: 'Asked how to find out whether O-037 broke it, the owner asked "what failed?" and paused for the night ("we pause here for tognit, write up the task"). Answer: the phone pass of browser-jupiter-io asserts Loki Patera''s marker shows when its side faces the camera, and it did not; desktop passed. T-129 reads the code first and asks the owner how to prove it.'
  - at: '2026-10-22T20:45:00Z'
    actor: {role: executor, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'T-129 read-only comparison, no browser run. O-037 did not change the marker path: src/app/FeatureMarkers.ts has no diff against main (last change O-025 T-103, 203419d9); the old inline call at AstraeusScene.tsx:379 on main and the new updateOverlays at src/app/sceneFrame.ts:235 pass the same host (featureHostOf, sceneFrame.ts:215), fov, canvas size, open key and min-px, in the same stage order (poseCamera, swap to markers, overlays). tools/validate/browser-jupiter-io.mjs:218 changed only in the harness preamble (launchBrowser, openPage, watchErrors). The shell changes (useDrawers extraction, AstraeusShell helpers) are extractions with the same open/close logic; the markers hide under the occluder selector panels (FeatureMarkers.ts:68), so a phone drawer or sheet left open would hide one, but no diff shows that. Cause therefore not established by reading; timing under load (187 s step vs 148-157 s) stays the likely cause. Owner decides: phone-size look on the preview (Jupiter, focus Io, turn to Loki Patera), or one run of browser-jupiter-io alone (about 3 minutes).'
---

# I-065: Planets set: jupiter-io on a phone does not find Loki Patera

## Summary

In this Check's one planets run, `browser-jupiter-io` failed on the phone pass: `AssertionError: phone: io:loki-patera is shown when its side faces the camera` (`tools/validate/browser-jupiter-io.mjs:218`). The desktop pass of the same script passed (moons 30 s, places 38 s), and the other six planets steps exited 0 with zero error lines. The script's O-037 change is only the harness preamble (`launchBrowser`, `openPage`, `watchErrors`). The cause is not established: a timing fault under load (the step took 187 s against 148 to 157 s on 2026-10-20) or a change in the feature-marker stage (T-124's `updateOverlays`). Not rerun: the owner cut the browser checks during this Check.

## Evidence

C-094: `npm run check:demo -- planets` 2026-10-21T10:56:05Z to 11:03:06Z; `docs/evidence/demo-planets-20261021T105605Z/summary.txt`; log `/tmp/astraeus-check-logs-Yz0TEc/jupiter-io.log`. Prior passes: `demo-planets-20261020T140051Z`, `demo-planets-20261020T141653Z`.

## Proof Needed

One run of `npm run check:demo -- planets` (or of `browser-jupiter-io.mjs` alone) with the phone pass green, or a reproduction that names the cause.
