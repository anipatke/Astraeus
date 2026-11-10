---
id: I-163
title: setTimeline takes a rate in milliseconds without a word
type: guardrail
status: open
source:
  kind: check
  check: C-161
  actor: {role: checker, session: o064-check-20261110}
  at: '2026-11-10T02:44:58Z'
tasks: [T-293]
checks: [C-161]
guardrail_ids: [API-04]
severity: low
history:
  - at: '2026-11-10T02:44:58Z'
    actor: {role: checker, session: o064-check-20261110}
    kind: observed
    note: 'Follow-up outside the O-064 scope (setTimeline is not changed by O-064); not material to O-064 closure. Captured under the AGENTS.md "Strategic fix first" rule because the owner hit the trap during the T-293 look (commit 67f3cd32).'
    check: C-161
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
