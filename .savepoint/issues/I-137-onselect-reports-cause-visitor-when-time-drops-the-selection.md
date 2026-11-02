---
id: I-137
title: onSelect reports cause visitor when time drops the selection
type: defect
status: resolved
source:
  kind: check
  check: C-141
  actor: {role: checker, session: o054-check-20261101}
  at: '2026-11-01T09:55:00Z'
tasks: [T-247]
checks: [C-141, C-142, C-143]
guardrail_ids: [API-02, ARCH-02]
severity: medium
resolution:
  disposition: verified
  check: C-143
  actor: {role: checker, session: o054-recheck2-20261102}
  at: '2026-11-02T08:33:00Z'
history:
  - at: '2026-11-01T09:55:00Z'
    actor: {role: checker, session: o054-check-20261101}
    kind: observed
    note: 'Found by the O-054 Full Objective Check (C-141) on ad3d724b. A selected path drops out when the clock leaves its sample span. The host setTime case and the playback case are both reported to onSelect with cause visitor, not host or playback. Checker probes P1, P2 (made-up definition) and P6 (real Scene, real prepareScene). Probe sources are in the checker scratchpad (zzC054probe.final.test.ts, zzC054real.test.ts).'
    check: C-141
  - at: '2026-11-01T11:00:00Z'
    actor: {role: executor, session: o054-repair}
    kind: repair_attempted
    note: 'Repair (executor, o054-repair): the selection cause now comes from whatever last moved the clock or view, the source onChange and onEventZone use. ViewerClock.publish returns whether it reported a change; ViewerLink keeps that change''s cause (#mover, reset to playback on attach/detach); the shell marks its time/view fallback drop byMove; App.updateSelectedObject calls ViewerPort.publishSelection(state, byMove), which names #mover for a drop and visitor for a pick. The host-setView-only selectionCause ref and hostSetView wrapper are removed. Doc comments, README, Design T-247 note updated. Evidence: viewerHostDom ''a drop caused by time'' x3 (host setTime -> host, clock running -> playback, visitor seek after a host move -> visitor), the two existing view-switch causes unchanged, no report while nothing changes; selectionCauseDom.test.ts on a real Scene + real prepareScene (30-min path, 100-day timeline, probe P6 shape) on mount and AstraeusScene, 6 cases pass; the two time cases fail with src reverted (stash). listeners.test.ts link case covers publishSelection causes. Gates: lint, typecheck, build, npm test (191 files, 2339 passed, 1 skipped); lifecycle + viewerHostDom + selectionCauseDom 10x loop, 0 failures. Not verified: browser (not run); not a Check; setRate-driven drops not separately tested (no path to produce one).'
  - at: '2026-11-01T10:10:00Z'
    actor: {role: checker, session: o054-recheck-20261101}
    kind: rechecked
    note: 'Recheck C-142 (NEEDS WORK) at HEAD 9f5a726d: the reported cases now hold on a real Scene (probe P6 rerun: host setTime -> host, playback -> playback whether play was started by the host or the visitor, visitor seek -> visitor, visitor pick -> visitor, host setView drop -> host, visitor view drop -> visitor, no change -> no report; a paused clock after a host move keeps no stale host because ViewerClock.publish returns false). Still open: the repair regresses a host setView case (Proof Needed: host and visitor setView keep their causes). A host setView to a view whose camera rule frames another object (view b hides pa, camera {focus: pb}, camera focused on pa) reports [earth host, pb visitor]; pre-repair source at d778c4e1 reports [earth host, pb host]. Cause: AstraeusShell.tsx:286-288 applyViewRule calls onSelectionChange(target.id) without byMove, so App publishSelection(state, false) names visitor (viewerLink.ts:173). applyViewRule is called only from the move-driven effect (AstraeusShell.tsx:268), so marking it byMove is the general fix; add a DOM case for a host and a visitor switch to a view with a framing camera rule.'
    check: C-142
  - at: '2026-11-02T09:00:00Z'
    actor: {role: executor, session: o054-repair-2}
    kind: repair_attempted
    note: 'Second repair (executor, o054-repair-2; owner 2026-11-02 ''make the fix''), fixing C-142 R8. Root cause: the shell''s onSelectionChange took an optional byMove flag that only the fallback drop set, so any other move-driven path defaulted to visitor. Now the argument is a required SelectionOrigin (''visitor'' | ''move'') in AstraeusShell, so a new path cannot omit it; App.updateSelectedObject publishes with origin === ''move''. Path table (path -> who moved it -> expected cause): (1) menu choice selectObject -> visitor -> visitor; (2) activatePreset (Focus/Follow button, scene pick via pickObject, moon panel, event marker) -> visitor -> visitor; (3) mirror effect onSelectionChange(selectedObjectId) -> no change vs the ref, never reports; (4) fallback drop in the move-driven effect (object hidden by a view, or unavailable at the new time) -> last mover of clock/view -> host for setTime/setView, playback for ticks, visitor for a visitor seek or view button; marked ''move''; (5) applyViewRule framing target (view camera focus/follow, only called from the move-driven effect) -> last mover of the view -> same as (4); was unmarked, now ''move'' (the regression); (6) star/sky object-list change (O2 in C-142): reaches only (4) via the experience dependency, so it takes the last mover; not separately driven (no DOM path). Tests: selectionCauseDom.test.ts is now table-driven, 9 rows x mount and AstraeusScene on a real Scene + real prepareScene: host setView plain drop, visitor view switch plain drop, host setView to a framing view, visitor switch to a framing view, host setTime past end, playback past end, visitor seek, visitor pick, no change. Red before: with src stashed, the two host-framing-view rows fail (got [pa visitor, earth host], pb report missing/visitor) and the other 16 pass; green after: 18 of 18. Gates: lint, typecheck, build pass; npm test 191 files, 2351 passed, 1 skipped; selectionCauseDom + viewerHostDom + lifecycle 10x loop, 84 passed each run, 0 failures. Design T-247 note and viewerPort doc comment updated; public surface unchanged (no lock change). Not verified: browser (not run); not a Check; sky object-list path (6) not driven.'
  - at: '2026-11-02T08:33:00Z'
    actor: {role: checker, session: o054-recheck2-20261102}
    kind: rechecked
    note: 'Recheck C-143 (CLEAR) at HEAD 46d73ad0: C-142 R8 fixed. onSelectionChange now takes a required SelectionOrigin (visitor|move); an omitted origin fails tsc (planted onSelectionChange(target.id) at AstraeusShell.tsx:292 gives TS2554). Independent enumeration of every selection path in src/shell and src/app (selectObject, activatePreset via Focus/Follow, moon panel, canvas pick, event seek -> visitor; mirror effect never reports; fallback drop and applyViewRule -> move) matches the builder table. Probe zzC143probe (real Scene, mount and AstraeusScene): P6a host setTime -> host; P6b/P6b2 playback -> playback; P6c visitor seek -> visitor; P6d visitor pick -> visitor; P6e host then visitor view drop -> host, visitor; P6f no change -> no report; V1 host setView to a focus-rule view -> [earth host, pb host] (C-142: pb visitor); follow rule, stay rule, unavailable framing target, while playing, then visitor pick or seek all correct. selectionCauseDom fails exactly the 2 host framing rows on f8646234 source and passes 18/18 on HEAD. Gates pass (test:full x2 2351 passed; check:browser once). Verified.'
    check: C-143
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
