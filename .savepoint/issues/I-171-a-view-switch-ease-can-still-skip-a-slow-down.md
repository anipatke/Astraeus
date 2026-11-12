---
id: I-171
title: A view-switch ease can still skip a slow-down
type: defect
status: open
source:
  kind: check
  check: C-171
  actor: {role: checker, session: o069-check-20261112}
  at: '2026-11-12T04:15:00Z'
tasks: [T-308]
checks: [C-171]
severity: low
history:
  - at: '2026-11-12T04:15:00Z'
    actor: {role: checker, session: o069-check-20261112}
    kind: observed
    note: Found by the O-069 Full Objective Check.
    check: C-171
---

# I-171: A view-switch ease can still skip a slow-down

## Summary

`stepPacing` falls back to the old one-rate-per-frame advance for the whole `PACE_EASE_MS` (1 s) after a view switch that changes the paced speed. At cruise that second covers about 26 simulated days, and one-rate frames still step over a zone and its ramps, so the zone gets no slow-down and no `onEventZone` report. The Objective outcome promises the clock eases into every zone "at any cruise speed and frame rate"; Success Condition 2 keeps the ease's speed blend as today, which does not need the one-rate step (the eased rate can be integrated too). Lower likelihood: needs a view switch within about a second of reaching a zone.

## Evidence

- `packages/astraeus/src/core/pacing.ts` `stepPacing` (line ~172): `continuous` requires `view.ease === undefined`, else only `applyPacing`.
- Probe (fake clock, `stepPacing` at 16 ms frames, one zone of +-1.5 h at 1,200x with 4 h ramps, base 26 d/s, 76 start offsets 12-40 h before the zone): no ease 0 skips; 1 s hitch frame 0 skips; ease started at the first frame 27 of 76 skip the zone.

## Proof Needed

A node test: with a view-switch ease running, frames of 16 ms to 1,000 ms through a zone still enter it and report it with cause `playback`, while the rate blend over `PACE_EASE_MS` keeps its present shape (existing pacing-view ease tests unchanged).
