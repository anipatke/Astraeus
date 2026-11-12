---
id: I-171
title: A view-switch ease can still skip a slow-down
type: defect
status: in_progress
source:
  kind: check
  check: C-171
  actor: {role: checker, session: o069-check-20261112}
  at: '2026-11-12T04:15:00Z'
tasks: [T-308]
checks: [C-171, C-172]
severity: low
history:
  - at: '2026-11-12T04:15:00Z'
    actor: {role: checker, session: o069-check-20261112}
    kind: observed
    note: Found by the O-069 Full Objective Check.
    check: C-171
  - at: '2026-11-12T05:00:00Z'
    actor: {role: executor, session: o069-repair-20261112}
    kind: repair_attempted
    note: "pacedAdvance takes an optional ease and integrates the eased rate (sub-steps stop at every edge and cover at most 1/32 of the ease second); stepPacing no longer falls back mid-ease. Partly proven: an ease from a slow rate enters every zone at 16-1000 ms frames; an ease from a cruise-scale rate still skips (the unchanged blend holds near the old rate for the zone's few milliseconds). Owner decision (O-069 Objective.md Decisions): ease only the switch. Then: the ease is the paced shape times exp(k0 (1 - weight)), k0 = log(fromRate) - log(paced rate at the switch), in both applyPacing and pacedAdvance; eases from cruise-scale rates now enter every zone. Awaiting a Check."
  - at: '2026-11-12T06:00:00Z'
    actor: {role: checker, session: o069-recheck-20261112}
    kind: rechecked
    note: "I-171 Proof Needed met under the owner's Ease only the switch: frozen cell 3,040 cases (offsets 12-40 h, frames 16-1,000 ms, from 5x to 10x cruise) all enter; constant-paced ease shape unchanged. Not closed: C-172 is NEEDS WORK on I-172."
    check: C-172
---

# I-171: A view-switch ease can still skip a slow-down

## Summary

`stepPacing` falls back to the old one-rate-per-frame advance for the whole `PACE_EASE_MS` (1 s) after a view switch that changes the paced speed. At cruise that second covers about 26 simulated days, and one-rate frames still step over a zone and its ramps, so the zone gets no slow-down and no `onEventZone` report. The Objective outcome promises the clock eases into every zone "at any cruise speed and frame rate"; Success Condition 2 keeps the ease's speed blend as today, which does not need the one-rate step (the eased rate can be integrated too). Lower likelihood: needs a view switch within about a second of reaching a zone.

## Evidence

- `packages/astraeus/src/core/pacing.ts` `stepPacing` (line ~172): `continuous` requires `view.ease === undefined`, else only `applyPacing`.
- Probe (fake clock, `stepPacing` at 16 ms frames, one zone of +-1.5 h at 1,200x with 4 h ramps, base 26 d/s, 76 start offsets 12-40 h before the zone): no ease 0 skips; 1 s hitch frame 0 skips; ease started at the first frame 27 of 76 skip the zone.

## Proof Needed

A node test: with a view-switch ease running, frames of 16 ms to 1,000 ms through a zone still enter it and report it with cause `playback`, while the rate blend over `PACE_EASE_MS` keeps its present shape (existing pacing-view ease tests unchanged).

## Repair evidence

| Proof Needed | Test |
|---|---|
| Frames of 16 ms to 1,000 ms through a zone with an ease running still enter it and report it with cause `playback` | `packages/astraeus/tests/pacingRepairs.test.ts` "enters the zone at 16 ms to 1,000 ms frames ... with an ease from any rate" (starts at 5x, 1,000x and the cruise-scale rates, 16/100/250/1,000 ms frames, offsets 12-40 h); also from CRUISE, CRUISE/2, CRUISE/4, CRUISE x1.01 and x4; reported with cause `playback` in "reports the zone with cause playback..." (16, 250, 1,000 ms) |
| Rate blend over `PACE_EASE_MS` keeps its present shape | same file, "integrates the eased rate" (area under the eased rate where the paced rate is constant: the shape is unchanged there); `pacingViews.test.ts` ease test unchanged |
