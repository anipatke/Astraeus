---
id: T-317
objective: O-075
title: Let story panels close themselves and size the phone sheet
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-317, reason: 'Owner said "orchestrate O75" (orchestrate O-075) under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: plan-o075-20261115}, recorded_at: '2026-11-15T10:09:53Z'}
planned_by: {role: planner, session: plan-o075-20261115}
---

# Let story panels close themselves and size the phone sheet

## Outcome

A host sets `closeAfterSeconds` in `setStoryPanelPlayback` (or on one moment panel) and an auto-opened or open moment panel closes once forward playback passes its time plus that span; a host sets the phone sheet's height cap through the looks (`sheetMaxPercent`). With neither set, the viewer behaves exactly as in 0.9.1 (Zodiac review F-18).

## User Check

None required; proven by tests. The owner may open any story demo on `localhost:5490` (default behaviour unchanged).

## Done When

- `StoryPanelPlaybackInput.closeAfterSeconds?: number` (simulated seconds, finite and above 0; absent = never closes by itself) and `StoryPanelInput.closeAfterSeconds?` on a moment panel (overrides the playback setting; on a step, or a bad value, throws `bad-panels` naming the panel and field).
- During forward playback, an open moment panel whose `time + closeAfterSeconds` the clock passes closes (as the visitor's close does, with `onPanelChange` reporting the change). A seek, rewind or pause does not close it; a panel the visitor opened from the list still closes on the same rule once playback passes its span. The decision lives beside `CrossingTracker` in `src/shell/storyPanels.ts` as a pure function and is tested there.
- `LookInput.sheetMaxPercent?` / `LookRead.sheetMaxPercent` (30 to 85, default 50, from `PHONE_LAYOUT_LIMITS`) through the look spec table, no page address parameter (`param: null`); `scene.setLook` sets it, `handle.setLook` changes it live, `handle.look` reads it; out of range throws `bad-look`. The Developer drawer "Sheet height" slider and the look stay one value (one source of truth, STYLE-07).
- Tests: one table over (playback span, panel span, none) x (forward pass, seek past, rewind, paused) for the close decision; a DOM test that an auto-opened panel closes after its span; the default (no span) never closes; `bad-panels` cases; the sheet look default, live change and `bad-look`. Existing tests' setup unchanged.
- README rows for `setStoryPanelPlayback`, `addStoryPanels` and `setLook` / `handle.look`; F-18's sheet cap documented under the looks; CHANGELOG `Unreleased`; `npm run api:lock` rerun; configured gates pass.

## Context Files

- `packages/astraeus/src/shell/storyPanels.ts`
- `packages/astraeus/src/shell/useStoryPanels.ts`
- `packages/astraeus/src/core/storyPanels.ts`
- `packages/astraeus/src/api/story.ts`
- `packages/astraeus/src/api/planStory.ts`
- `packages/astraeus/src/shell/phoneLayout.ts`
- `packages/astraeus/src/app/look.ts`
- `packages/astraeus/src/api/look.ts`
- `packages/astraeus/src/app/liveLook.ts`
- `packages/astraeus/src/app/App.tsx` (the phone layout state and Developer sliders only)
- `packages/astraeus/tests/storyPanelSettings.test.ts`
- `packages/astraeus/tests/look.test.ts`
- `packages/astraeus/README.md` under `Time, events and story` and `Looks, controls and views`
- `packages/astraeus/CHANGELOG.md` under `Unreleased`
- `.savepoint/objectives/O-075-panels-controls-and-reads/Objective.md`

## Design References

Design `Public API shape (G-016, owner 2026-11-01)`; `Headless use and looks as settings`. Objective O-075 `Design Decisions` D1.

## Guardrails

ARCH-02, ARCH-03, API-02, API-04, API-05, API-06, TEST-01..03.

## Implementation Plan

1. Add `closeAfterSeconds` to the playback and moment panel inputs with checks; resolve the effective span per panel.
2. Add the pure close decision beside `CrossingTracker` and call it from `useStoryPanels` each tick.
3. Add `sheetMaxPercent` to the look table; feed the phone layout from the look so the Developer slider and `setLook` share one value.
4. Tests, README rows, CHANGELOG, API lock.

## Boundaries

No event-zone close rule, no change to auto-open or pause behaviour, no step-panel close, no page address parameter for the sheet look.

## Technical Verification

Focused tests while iterating; configured gates at handoff. Evaluated later under `agent-skills/references/check-method.md`. No new browser check; defaults are unchanged.

## Technical Evidence

Pending execution.

## Drift Notes

Record where the close rule and the sheet look are carried for Design reconciliation before the Full Objective Check.
