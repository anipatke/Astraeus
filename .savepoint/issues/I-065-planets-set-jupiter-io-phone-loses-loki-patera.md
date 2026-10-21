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
---

# I-065: Planets set: jupiter-io on a phone does not find Loki Patera

## Summary

In this Check's one planets run, `browser-jupiter-io` failed on the phone pass: `AssertionError: phone: io:loki-patera is shown when its side faces the camera` (`tools/validate/browser-jupiter-io.mjs:218`). The desktop pass of the same script passed (moons 30 s, places 38 s), and the other six planets steps exited 0 with zero error lines. The script's O-037 change is only the harness preamble (`launchBrowser`, `openPage`, `watchErrors`). The cause is not established: a timing fault under load (the step took 187 s against 148 to 157 s on 2026-10-20) or a change in the feature-marker stage (T-124's `updateOverlays`). Not rerun: the owner cut the browser checks during this Check.

## Evidence

C-094: `npm run check:demo -- planets` 2026-10-21T10:56:05Z to 11:03:06Z; `docs/evidence/demo-planets-20261021T105605Z/summary.txt`; log `/tmp/astraeus-check-logs-Yz0TEc/jupiter-io.log`. Prior passes: `demo-planets-20261020T140051Z`, `demo-planets-20261020T141653Z`.

## Proof Needed

One run of `npm run check:demo -- planets` (or of `browser-jupiter-io.mjs` alone) with the phone pass green, or a reproduction that names the cause.
