---
id: T-286
title: Treat an app's time jump as a seek
objective: O-061
status: planned
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

Pending execution.

## Drift Notes

None yet.
