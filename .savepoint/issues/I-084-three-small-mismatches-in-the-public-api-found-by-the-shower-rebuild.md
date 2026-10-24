---
id: I-084
title: Three small mismatches in the public API found by the shower rebuild
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:47:47Z'
severity: low
history:
  - at: '2026-10-24T02:47:47Z'
    actor: {role: planner, session: improvements-intake-20261024}
    kind: observed
    note: 'Owner, 2026-10-24: "can we add the fixes as issues, and iterate through and fix them with agents" (after "no more demos, here on in only improvements").'
---

# I-084: Three small mismatches in the public API found by the shower rebuild

## Summary

Leftovers noted at the O-042 close (C-115 era, 2026-10-24) and offered to the owner as improvements: (1) `Scene.addGroup`'s doc comment (packages/astraeus/src/api/scene.ts, line ~274) says a bad centre throws `bad-group`, but a centre that is not a catalogued body may reach `unknown-body` first; (2) `setTimeline({ loop: true })` is silently ignored when the scene has no timeline bar (`{ none: true }`) or no timeline at all, with no error or doc note; (3) the showers demo validates a stream quality default (`stream.quality.default`, showers settings) that nothing reads after T-172 dropped the per-orbit quality columns.

## Evidence

Coordinator read 2026-10-24: scene.ts lines 274 and 367-369 (bad-group checks for centre and clump), story.ts lines 29, 38, 76, 82 (loop validated and carried), scene.ts 541-544 (loop passed only from a timeline). Items 1 and 2 are not yet reproduced by a test; item 3 is from the O-042 close notes.

## Proof Needed

For each item: a test first showing the mismatch (or a recorded finding that it does not exist), then the fix: doc and code agree on the error code for a bad centre; `loop` with no timeline either throws a named `SceneError` or is documented as ignored (prefer the doc note unless the API reference already promises otherwise); the unread quality default is removed or used. CHANGELOG `Unreleased` lists any visible API change. Gates and `check:engine-alone` green.
