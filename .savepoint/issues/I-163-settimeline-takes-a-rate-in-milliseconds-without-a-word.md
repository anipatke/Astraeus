---
id: I-163
title: setTimeline takes a rate in milliseconds without a word
type: guardrail
status: resolved
source:
  kind: check
  check: C-161
  actor: {role: checker, session: o064-check-20261110}
  at: '2026-11-10T02:44:58Z'
tasks: [T-293]
checks: [C-161, C-168]
guardrail_ids: [API-04]
severity: low
resolution:
  disposition: verified
  check: C-168
  actor: {role: checker, session: release-0-9-0-issue-check-20261111}
  at: '2026-11-10T21:20:00Z'
  reason: Repair proven by C-168 (CLEAR).
history:
  - at: '2026-11-10T02:44:58Z'
    actor: {role: checker, session: o064-check-20261110}
    kind: observed
    note: 'Follow-up outside the O-064 scope (setTimeline is not changed by O-064); not material to O-064 closure. Captured under the AGENTS.md "Strategic fix first" rule because the owner hit the trap during the T-293 look (commit 67f3cd32).'
    check: C-161
  - at: '2026-11-10T02:47:40Z'
    actor: {role: owner, session: o064-run-20261110}
    kind: deferred
    note: 'Owner chose "Later in 0.9.0": fix before 0.9.0 ships, not inside O-064 (recorded by the coordinator on the owner''s direct answer).'
  - at: '2026-11-11T08:10:00Z'
    actor: {role: executor, session: release-0-9-0-builder}
    kind: repair_attempted
    note: 'Direct repair on release-0-9-0 (uncommitted), coordinator rule: warn, never throw. No warning channel existed in src/api, so setTimeline (timelineOf in api/story.ts) calls console.warn, as app/look.ts does, when rate or any offered rate would cross the whole span in under one real second; the message names ''simulated seconds per real second'', the value(s) and suggests milliseconds. Proof Needed re-run: packages/astraeus/tests/timelineRateWarning.test.ts plants the T-293 shape (rates [DAY_MS, 7*DAY_MS], rate DAY_MS over 120 days): one warning naming both values, no throw; one fast offered rate with a sane opening rate also warns. Neighbours: no warning for the right units, for a 2 h span at 7200 s/s (exactly one second), for none:true, or for the synthetic journey scene; the whole npm test run printed no such warning, which covers every scene built in tests and the site/demo/example scenes the suite builds (their rates read by hand: all cross their span in over a second). Documented in the setTimeline README row, CHANGELOG Unreleased and Design.md. api:lock unchanged. Gates all pass as in I-167''s entry. Unverified: pacing rates are not checked (only rate and rates); examples/ run in a browser were read, not run. Not verified or resolved by this entry.'
  - at: '2026-11-10T21:20:00Z'
    actor: {role: checker, session: release-0-9-0-issue-check-20261111}
    kind: rechecked
    note: 'Proof Needed holds under the coordinator rule (warn, never throw): the T-293 shape warns once naming the unit and both values; independent probes on the packed engine (ISO and Date moments, rates only, negative rate, 7201 s/s over 7200 s) warn; sane rates and none:true do not; rate 0 still throws bad-timeline; no warning in npm test or check:browser logs. Pacing rates not checked (observation).'
    check: C-168
---

# I-163: setTimeline takes a rate in milliseconds without a word

## Summary

`Scene.setTimeline` takes `start` and `end` as moments (Unix milliseconds or other `TimeInput`) but `rates` and `rate` as simulated seconds per real second. A host that reuses a millisecond constant for a rate (`rate: DAY_MS`) gets a clock 1,000 times too fast, and nothing says so. This happened in O-064 T-293: `syntheticLookOutScene.ts` gave `rates: [DAY_MS, 7 * DAY_MS], rate: DAY_MS`, the clock ran to the end of its 120-day window at once, the Sun left the view, and the owner reported "Cant see the sun". The builder fixed the scene (67f3cd32), not the rule that let it through.

## Evidence

- `packages/astraeus/src/api/story.ts` `timelineOf` (lines 137-150): `rate` must only be finite and non-zero, `rates` only positive; no check relates a rate to the window. The units are stated only in the doc comment (line 35, "simulated seconds per real second").
- The trap's signature is mechanisable: at `rate` 86,400,000 the 120-day window (10,368,000 s) is crossed in 0.12 real seconds. A rate (or any offered rate) that crosses the whole window in well under a second is almost certainly a unit mistake.
- Rule: AGENTS.md Astraeus Project Rules, "Strategic fix first" (fix the rule that allowed the trap and add a check where it can be mechanised). API-04 (one unit, carried in the name) is related: `rate`/`rates` carry no unit in their name, unlike the `...Seconds` and `...UtcMs` fields beside them.

Not a defect in O-064's own work; recorded as durable follow-up.

## Proof Needed

A planner decides the general rule (for example, `setTimeline` throws `bad-timeline`, or warns, when `rate` or an offered rate would cross the timeline's span in less than about one real second, naming seconds per real second in the message; or a unit-named alias). A test plants the T-293 shape (`rate: 86_400_000` over a 120-day window) and shows the new rule catches it, while the existing scenes' rates still pass.
