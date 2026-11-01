---
id: I-137
title: onSelect reports cause visitor when time drops the selection
type: defect
status: open
source:
  kind: check
  check: C-141
  actor: {role: checker, session: o054-check-20261101}
  at: '2026-11-01T09:55:00Z'
tasks: [T-247]
checks: [C-141]
guardrail_ids: [API-02, ARCH-02]
severity: medium
history:
  - at: '2026-11-01T09:55:00Z'
    actor: {role: checker, session: o054-check-20261101}
    kind: observed
    note: 'Found by the O-054 Full Objective Check (C-141) on ad3d724b. A selected path drops out when the clock leaves its sample span. The host setTime case and the playback case are both reported to onSelect with cause visitor, not host or playback. Checker probes P1, P2 (made-up definition) and P6 (real Scene, real prepareScene). Probe sources are in the checker scratchpad (zzC054probe.final.test.ts, zzC054real.test.ts).'
    check: C-141
---

# I-137: onSelect reports cause visitor when time drops the selection

## Summary

O-054 Success Condition 7 and T-247 add `selected` and `onSelect(listener)`, which reports `{ object?, timeUtcMs, cause }`. The documented meaning of `cause` (`ViewerHandle.onSelect` in `packages/astraeus/src/api/viewerHandle.ts:38`, `SelectionChange.cause` in `src/api/viewerSelection.ts:11`) is: `visitor` for the object menu, a click or a view the visitor chose; `host` for a drop the host's own call caused; `playback` for a change picked up on a tick. `onChange` and `onEventZone` use the same causes: a host `setTime` is `host` and the clock running is `playback`.

The shell also drops the selection when time moves. If the selected object is no longer available at the new time, for example a path whose samples end before the timeline does, `AstraeusShell` sets the selection to the first available object (`src/shell/AstraeusShell.tsx:250-258`; the effect depends on `snapshot.timeUtcMs`). `App.updateSelectedObject` (`src/app/App.tsx:370-373`) then publishes that change with `selectionCause.current`. That ref is only ever `"visitor"` or `"host"`, and `"host"` is set only by `hostSetView` (`App.tsx:375`). So:

- A host `setTime` past the path's end is reported as `cause: "visitor"`; it should be `"host"`.
- Playback running past the path's end is reported as `cause: "visitor"`; it should be `"playback"`.
- `"playback"`, which the doc comments promise, is never produced. Every selection change goes through `updateSelectedObject`, which publishes at once with `visitor` or `host`.

This is a supported, ordinary configuration. The repo's own test scenes use it: `tests/hostCameraDom.test.ts` gives its probes four samples over 30 minutes on a 100-day timeline. So does any host that adds a probe path shorter than its timeline.

## Smallest Reproduction

Real `Scene` and real `prepareScene`; only the 3D canvas is stubbed (checker probe P6):

```ts
const scene = new Scene().addBody(earth)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples /* T0 .. T0+30 min */ })
  .setTimeline({ start: T0, end: T0 + 100 days, rate: 86_400, rates: [60, 86_400] });
const handle = mount(el, scene); await handle.ready;
handle.setPlaying(false); handle.setTime(T0 + 5 min);
handle.onSelect((c) => heard.push(c));
pick("pa");                      // visitor: { object: "pa", cause: "visitor" }  (correct)
handle.setTime(T0 + 50 days);    // pa is no longer available, so the shell falls back to earth
```

- Expected: the last report is `{ object: "earth", cause: "host" }`.
- Actual: `P6 heard [{"object":"pa","cause":"visitor"},{"object":"earth","cause":"visitor"}]`, so the probe fails with `expected 'visitor' to be 'host'`.
- Playback form (probe P2: the marker's availability ends at mid-window, the clock is paused just before, then plays): `P2 heard [..., {"object":"earth","cause":"visitor"}]`. Expected `playback`.

## Missing Test Evidence

`viewerHostDom.test.ts` "the selected object through the host" covers a visitor pick, no change, a host and a visitor `setView` drop, stop and unmount. It has no case where time drops the selection. The T-247 Limitations note says a drop to nothing "cannot be produced through the DOM (the synthetic scene always has a fallback object)". But a drop by time to a fallback object can be produced, as above. The lifecycle suite covers only the visitor pick.

## Proof Needed

- A drop caused by a host `setTime` (and `setRate` or `setPlaying`, if either can cause one) reports `cause: "host"`.
- A drop caused by the clock running reports `cause: "playback"`.
- The visitor and host `setView` cases keep their current causes.
- Fix the rule rather than add one more special case (Strategic fix first). The cause of a selection change should come from whatever moved the clock or the view, the same way `onChange` and `onEventZone` get theirs, not from a ref that only `setView` writes.
- Named DOM tests for the host-time drop and the playback drop, through `mount`, and through `AstraeusScene` or the lifecycle suite on both paths.
- Alternative: if the owner decides `cause` should mean something else for these drops, update the `onSelect` and `SelectionChange.cause` doc comments, the README rows and the CHANGELOG to match, and test that meaning.
