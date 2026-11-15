---
id: T-319
objective: O-075
title: Read back looks, switches and pacing from a scene
status: planned
depends_on: [{task: T-318, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-319, reason: 'Owner said "orchestrate O75" (orchestrate O-075) under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: plan-o075-20261115}, recorded_at: '2026-11-15T10:09:53Z'}
planned_by: {role: planner, session: plan-o075-20261115}
---

# Read back looks, switches and pacing from a scene

## Outcome

A host or test reads, from a `Scene` with no browser, the looks it set (filled in with defaults), its switch settings (place, on, label), its story panel playback (with defaults) and its timeline pacing, so these can be checked in Node (Zodiac review F-05, F-17).

## User Check

None required; proven by Node tests.

## Done When

- `Scene.look: LookRead`: the looks `setLook` set, filled in with defaults, the same shape and values `handle.look` reports on a fresh mount with no page address override (one resolver, STYLE-07).
- `Scene.switches`: for each switch `setSwitches` named, `{ place, on, label? }` (frozen; `on` filled in as true when not given; an unnamed switch absent).
- `Scene.panelPlayback`: `{ pauseSeconds, autoOpen, closeAfterSeconds? }` with defaults filled in.
- `Scene.timeline.pacing`: the pacing `setTimeline` was given, frozen; absent when none.
- Read types in `src/api/sceneReads.ts`, exported from the front door (API-01); the viewer handle's reads unchanged.
- Tests: one table over default and set values for each read, including the T-317 `closeAfterSeconds` and `sheetMaxPercent` and the T-318 switch `label`; a test that `Scene.look` equals `handle.look` on a fresh mount; reads are frozen. Existing tests' setup unchanged.
- README rows for the four reads (Reading a scene), CHANGELOG `Unreleased`; `npm run api:lock` rerun; configured gates pass.

## Context Files

- `packages/astraeus/src/api/scene.ts` (the read getters and `setLook`, `setSwitches`, `setStoryPanelPlayback`, `setTimeline`)
- `packages/astraeus/src/api/sceneReads.ts`
- `packages/astraeus/src/api/planTimeline.ts`
- `packages/astraeus/src/api/planStory.ts`
- `packages/astraeus/src/api/planViews.ts`
- `packages/astraeus/src/app/liveLook.ts` (`lookReadOf` only)
- `packages/astraeus/tests/sceneReads.test.ts`
- `packages/astraeus/README.md` under the heading that lists the `Scene` reads
- `packages/astraeus/CHANGELOG.md` under `Unreleased`
- `.savepoint/objectives/O-075-panels-controls-and-reads/Objective.md`

## Design References

Design `Public API shape (G-016, owner 2026-11-01)`; `Headless use and looks as settings`. Objective O-075 `Design Decisions` D3.

## Guardrails

ARCH-02, API-01, API-02, API-04, TEST-01..03.

## Implementation Plan

1. Add a pure look read built from the checked look and the same defaults `lookReadOf` uses; return REPLAN REQUIRED if the two cannot share one resolver without touching the viewer's behaviour.
2. Add the switches, panel playback and pacing reads from the plans that already hold them.
3. Tests, README rows, CHANGELOG, API lock.

## Boundaries

No live pacing-mode read on the viewer handle, no new setters, no change to the handle's reads.

## Technical Verification

Focused tests while iterating; configured gates at handoff. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record the new reads for Design reconciliation before the Full Objective Check.
