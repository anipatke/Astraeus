---
id: T-286
title: Treat an app's time jump as a seek
objective: O-061
status: done
depends_on: [{task: T-284, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: voyagers-review-20261110}
check_waiver: {task: T-286, reason: 'Owner said "orchestrate O-061" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o061-run-20261110}, recorded_at: '2026-11-09T20:44:20Z'}
---

# Treat an app's time jump as a seek

## Outcome

A host `setTime` re-bases story panels exactly as a visitor's seek does (a jump is never read as playback crossing a panel's time), proven by T-284's story-panel test passing unmarked.

## User Check

None on screen beyond the end-of-Objective owner look.

## Done When

The host-seek test passes on both paths and equals the visitor-seek result; README line on `setTime` says it counts as a seek; CHANGELOG entry.

## Context Files

T-284's Technical Evidence; `packages/astraeus/src/api/viewerClock.ts`, `packages/astraeus/src/shell/useStoryPanels.ts`, `packages/astraeus/src/shell/storyPanels.ts`, `packages/astraeus/tests/publicApiStory.test.ts`, `packages/astraeus/tests/domStory.test.ts`, `packages/astraeus/README.md` (`setTime` row), `packages/astraeus/CHANGELOG.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

API-02, ARCH-02, TEST-01, TEST-02.

## Implementation Plan

1. Route a host `setTime` through the same seek path the timeline uses for story panels.
2. Unmark the test; add the README and CHANGELOG lines; run the gates.

## Boundaries

No change to how playback opens panels.

## Technical Verification

`npm run check:gates` (lint, typecheck, build, `npm run test:full`, engine-alone, pack, node and react consumer checks); browser scripts only at the Full Objective Check (`npm run check:browser`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Fix: the shell (`packages/astraeus/src/shell/AstraeusShell.tsx`) fills a new optional prop `storySeekNote` with its `story.noteSeek` (the same function its `seek` calls for every visitor seek); `packages/astraeus/src/app/App.tsx` `hostSeekTo` calls it, then the existing `seekTo`, and is what the host link's `seek` now uses. One re-base path for visitor and host; playback and panel opening untouched.

| Done When | Proof |
|---|---|
| Host-seek test passes on both paths, unmarked | `tests/hostCallOrder.test.ts` "a host setTime across a panel while playing opens nothing, as a visitor seek does (I-151)" is plain `it` now, passes on `mount` and `AstraeusScene` (26 passed) |
| Equals the visitor-seek result | same describe block: the visitor slider seek baseline test and the host test both assert `panelOpen() === false` |
| README line on `setTime` says it counts as a seek | `packages/astraeus/README.md` `handle.setTime` row |
| CHANGELOG entry | `packages/astraeus/CHANGELOG.md` "Unreleased (0.8.1)" |

Files changed: `src/app/App.tsx`, `src/shell/AstraeusShell.tsx`, `tests/hostCallOrder.test.ts` (unmark + header comment), `tests/viewerHostDom.test.ts` (one line, see drift), `README.md`, `CHANGELOG.md` (all under packages/astraeus).

Commands: `npx vitest run tests/hostCallOrder.test.ts` 26 passed; `npm run check:gates` all 9 gates passed (lint, typecheck, build, test, test:full, engine-alone, pack, node-consumer, react-consumer), 179 s, 0 over limit. `check:browser` not run (Full Objective Check).

Limits: the ref is filled during render and cleared on unmount; a host `setTime` before the shell mounts is not a case (host calls need `ready`). Appearance not checked.

## Drift Notes

An existing test, `tests/viewerHostDom.test.ts` "calls back on a host set, on a visitor's seek...", relied on the bug: the synthetic scene has story panels, and its host `setTime(MID)` was read as playback crossing one, which paused the clock; the test then pressed play. With the fix the clock keeps playing, so the press paused it. One line added (`handle.setPlaying(false)` before the press) so the test starts paused; its assertions are unchanged. This breaks the plan's "no existing test changed"; flagged for the owner.
