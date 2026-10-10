---
id: I-017
title: Group motion looks shaky because positions refresh in steps
type: defect
status: resolved
source:
  kind: report
  actor: {role: owner, session: o009-t029-owner-look-20261011}
  at: '2026-10-11T00:00:00Z'
tasks: [T-028, T-029, T-030, T-031]
guardrail_ids: [ARCH-02]
history:
  - at: '2026-10-11T00:00:00Z'
    actor: {role: executor, session: o009-t029-20261011}
    kind: observed
    note: Owner looked at the made-up debris ring and said the ring looks right but its own movement looks shaky; camera movement is fine. Owner then asked for the smoothing to be planned now.
  - at: '2026-10-11T00:00:00Z'
    actor: {role: planner, session: o009-smoothing-plan-2026-10-11}
    kind: owner_decision
    note: Owner asked for the smoothing to be planned now as a Task inside O-009 and for the best balance of performance and visuals. Planned as T-030 (blend between two exact fills). The Issue stays open for repair evidence and a checker or owner acceptance.
  - at: '2026-10-11T00:00:00Z'
    actor: {role: executor, session: o009-t030-20261011}
    kind: repair_attempted
    note: 'PointsView now holds two exact fills and draws a blend each frame; one fill per interval while playing on in either direction, one on a seek (default span 300 s). Proof Needed rerun: Node measurements for 10^4 members (fill ~9.4 ms, one slide ~12.5 ms, blend pass ~0.02 ms, worst blend error 7.9 km at 300 s) in docs/evidence/o009-t030-run1/node-measurements.txt; 241 tests pass including blend error, one-fill-per-interval both ways, seek, bounds and ARCH-02 cases; all six browser scripts pass with zero console errors; headless frame pacing recorded (software rendering, relative only). Not verified: the owner has not yet looked at the smoothed motion, and no before/after pacing comparison exists because the earlier PointsView was never committed. Awaiting owner look and a checker or owner acceptance.'
  - at: "2026-10-10T22:01:23Z"
    actor:
      role: owner
      session: board-owner
    kind: owner_decision
    note: Moved from open to in_progress by the owner from the board.
  - at: "2026-10-10T22:01:24Z"
    actor:
      role: owner
      session: board-owner
    kind: owner_decision
    note: Resolved by the owner from the board.
resolution:
  disposition: accepted
  actor:
    role: owner
    session: board-owner
  at: "2026-10-10T22:01:24Z"
  reason: Resolved by the owner from the board.
---

# I-017: Group motion looks shaky because positions refresh in steps

## Summary

The points layer refills a group's positions only after the clock has moved `refillAfterMs` (default 60 s of simulation time), the mitigation chosen for the O-009 fill-cost miss. At the default 600x rate that is about ten refills per real second, so a group moves in steps, and each refill of 10,000 Earth-centred members costs about 11 ms (T-027 measurement), which can also cause frame hitches.

## Evidence

Owner report on 2026-10-11 after viewing `?experience=synthetic-ring`: "The ring looks right, performance is shaky though", then "moving around is ok, but movement of debris ring looks shaky". Cause is inferred from the design of `PointsView` and T-027's fill measurement; it has not been measured in a real browser. Headless software rendering is not representative.

## Proof Needed

Measure frame pacing of the 10,000-member ring during playback before and after, in a real browser if possible. Moving the ring is smooth to the owner's eye at the default rate, at both scales, with group State unchanged (ARCH-02) and Apollo unchanged. Existing group, Apollo and browser checks still pass.
