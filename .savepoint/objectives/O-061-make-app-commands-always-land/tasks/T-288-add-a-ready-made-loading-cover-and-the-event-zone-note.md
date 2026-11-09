---
id: T-288
title: Add a ready-made loading cover and the event zone note
objective: O-061
status: planned
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: voyagers-review-20261110}
check_waiver: {task: T-288, reason: 'Owner said "orchestrate O-061" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o061-run-20261110}, recorded_at: '2026-11-09T20:44:20Z'}
---

# Add a ready-made loading cover and the event zone note

## Outcome

A host can ask the viewer for a ready-made loading cover, the same option on `mount` and `AstraeusScene`, which covers the viewer until the first frame and fades out over the `loadFadeSeconds` look; hosts that do not ask see no change. The README says an event has one zone, as wide as its widest pacing rule.

## User Check

On the localhost:5490 preview, at 375x667 and 1280x720, a page using the cover shows it while loading and fades it at the first frame, sized to the viewer, not the window; no overlap with viewer controls.

## Done When

Opt-in option on both paths (API-02), off by default; styles scoped to the viewer root (API-03); `prefers-reduced-motion` honoured; tests for shown, faded at first draw, absent when not asked, two viewers; README row and CHANGELOG; the event-zone README line, checked against `packages/astraeus/src/core/pacing.ts`; API lock updated.

## Context Files

`packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/app/AstraeusScene.tsx`, `packages/astraeus/src/api/look.ts`, `packages/astraeus/src/core/pacing.ts`, `packages/astraeus/tests/viewerStyles.test.ts`, `packages/astraeus/tests/twoViewers.test.ts`, `packages/astraeus/README.md` (`onFirstDraw` row, event zone section), `packages/astraeus/CHANGELOG.md`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

API-01, API-02, API-03, API-06, API-07, TEST-01.

## Implementation Plan

1. Add the opt-in option to the mount and React options, fading on the existing first-draw signal and the `loadFadeSeconds` look.
2. Scope the cover's styles to the viewer root; respect reduced motion.
3. Tests, README rows, CHANGELOG, lock.
4. Add the event-zone README line after reading `pacing.ts`.

## Boundaries

Default off, so existing hosts see nothing new. No change to `onFirstDraw`.

## Technical Verification

`npm run check:gates` (lint, typecheck, build, `npm run test:full`, engine-alone, pack, node and react consumer checks); browser scripts only at the Full Objective Check (`npm run check:browser`). Evaluated later under `agent-skills/references/check-method.md`. Owner look on localhost:5490 at the end of the Objective.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
