---
id: I-074
title: A switch made while the loading cover is still fading out loses the cover
type: defect
status: open
source:
  kind: check
  check: C-102
  actor: {role: checker, session: o030-full-check-20261023}
  at: '2026-10-23T03:19:00Z'
tasks: [T-153]
checks: [C-102]
guardrail_ids: [TEST-01]
severity: low
history:
  - at: '2026-10-23T03:19:00Z'
    actor: {role: checker, session: o030-full-check-20261023}
    kind: observed
    check: C-102
    note: 'O-030 Success Condition 3 (the loading animation covers the change). hideBootLoader schedules boot.remove() on the element it faded; showBootLoader reuses that same element when it is still in the page, so the pending timer removes the cover mid-switch. Reproduced in a scratch happy-dom test (removed after the run).'
  - at: '2026-10-23T03:22:41Z'
    actor: {role: executor, session: o030-coordinator-20261023}
    kind: repair_attempted
    note: 'Owner: "Fix it, short recheck (Recommended)". showBootLoader now cancels a pending removal and counts showings; hideBootLoader(showing) ignores a scene mounted before the latest showing (sceneFrame FrameState.coverShowing, noted at mount). New tests in tests/bootLoader.test.ts: hide, show within the fade, past the fade the cover stays loading, a later hide still removes it; an older scene cannot hide a newer showing. Neighbouring cases still pass (hide once, fail, no loader). lint, typecheck, build, npm test (114 files, 1524 passed) pass. Not run in a browser (no browser script changed).'
---

# I-074: A switch made while the loading cover is still fading out loses the cover

## Summary

O-030 Success Condition 3 says the loading animation covers a switch. When a scene's first frame hides the cover, `hideBootLoader` (`src/shell/bootLoader.ts:42-49`) sets `data-state="done"` and schedules `boot.remove()` on that element after the fade (`seconds * 1000 + 100`, line 48; the fade is 0.6 s by default and up to 3 s in settings). A switch or Back press inside that window calls `showBootLoader` (lines 32-38), which finds the same element still in the page and sets it back to `loading`. The pending timer then removes it, so the cover goes away while the next experience is still building, and the old scene and then the new, not yet drawn canvas show through. That is the flash this Objective removes.

Adjacent case (same cause, not separately probed): every scene's first frame calls `hideBootLoader` (`src/app/sceneFrame.ts:195`); if a scene mounts and a second switch or Back starts before that frame, the first scene's frame hides the cover the second switch showed.

## Evidence

Checker probe (happy-dom, fake timers), C-102: `hideBootLoader()`; advance 200 ms; `showBootLoader()`; advance 2000 ms; expected `#boot` with `data-state="loading"`, actual: `#boot` removed. The control case (switch after the fade ends) passes: the cover is rebuilt from the template and hides again. No test covers a switch during the fade: `tests/` has no test of `showBootLoader`.

## Proof Needed

A fast test: hide, then show within the fade, then run past the fade: the cover is still there in `loading`; and hide after that still fades and removes it. Optionally, a stale first-frame hide from an overtaken mount does not hide a newer switch's cover.
