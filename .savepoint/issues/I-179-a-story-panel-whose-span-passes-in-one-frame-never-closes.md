---
id: I-179
title: A story panel whose close span passes within one frame never closes by itself
type: defect
status: open
source:
  kind: check
  check: C-183
  actor: {role: checker, session: o075-check-20261116}
  at: '2026-11-16T08:19:29Z'
tasks: [T-317]
checks: [C-183]
severity: medium
history:
  - at: '2026-11-16T08:19:29Z'
    actor: {role: checker, session: o075-check-20261116}
    kind: observed
    note: Found by the O-075 Full Objective Check probe of the close rule at a playback speed where one frame moves the clock further than the span.
    check: C-183
---

# I-179: A story panel whose close span passes within one frame never closes by itself

## Summary

O-075 Success Condition 1 and T-317 Done When: "once forward playback passes the panel's time plus that span, an open moment panel closes by itself." The rule is implemented as a crossing test (`previousMs < time + span <= currentMs`, `panelSpanPassed`, `packages/astraeus/src/shell/storyPanels.ts:30-35`), evaluated in `useStoryPanels` only for the panel that was already open *before* the tick (`packages/astraeus/src/shell/useStoryPanels.ts:37-42`). When one tick carries the clock across both the panel's time and its close time, the tick opens the panel (the newest crossing wins), and on every later tick the close time is already behind `previousMs`, so the panel stays open until the visitor or host closes it.

This happens whenever the clock moves further in one frame than the span: a short span (`closeAfterSeconds: 1`) at the demo's opening speed, or any span once the visitor raises the speed (at a week per second one frame is about 2.8 simulated hours). The visitor controls the speed, so a host cannot choose a span that is always safe. It is the case the feature exists for (Zodiac review F-18: fast playback over weeks).

## Evidence

Reproduction (temporary DOM probe through `tests/domSetup.ts` `mountShell`, the same harness `tests/storyPanelClose.test.ts` uses; deleted after the run):

```ts
m = mountShell({ storyPanelSettings: { autoOpen: true, pauseSeconds: 0, closeAfterSeconds: 1 } });
m.clock.seek(panels[0].timeUtcMs - 1_000); m.advance(0);
press($(m.container, ".timeline-play"));
m.advance(100);                       // opens marker-loop (6 simulated s per 100 ms)
for (let i = 0; i < 8; i += 1) m.advance(100);
```

- Expected: the panel closes once the clock is past its time + 1 s (`onPanel` cause `playback`).
- Actual: clock 53 s past the panel's time, `marker-loop` still open; panel changes `[{id:null,cause:"visitor"},{id:"marker-loop",cause:"playback"}]`, no close.
- Control: the same probe with `closeAfterSeconds: 20` and `pauseSeconds: 2` closes (span larger than one frame).
- Pure rule: `panelSpanPassed({ timeUtcMs: T, closeAfterSeconds: 1 }, undefined, T + 5000, T + 10000, true)` is `false` after the opening tick from `T - 500` to `T + 5000`.

Test gap: the close table in `tests/storyPanelClose.test.ts` (`MOVES`) and the DOM test use spans (10 s, 20 s) larger than one tick's advance, and never open the panel on the same tick its close time is crossed.

Adjacent case for the repair to decide (Check observation, not separately blocking): a panel the visitor reopens from its scene marker after its close time (no seek) also stays open while playback runs forward, though the README row for `setStoryPanelPlayback` says "The close applies to an open panel however it opened".

## Proof Needed

- With a span shorter than one frame's clock advance, an auto-opened moment panel closes by itself on a later forward-playing tick (or on the opening tick, as the repair defines), reported as `cause: "playback"`; a test pins it (including a speed raised after the panel opened).
- The existing table (seek past, rewind, paused never close; no span never closes; the stop-on-end close) still holds.
- README/CHANGELOG state the rule the code applies, including the marker-reopen-after-span case.
