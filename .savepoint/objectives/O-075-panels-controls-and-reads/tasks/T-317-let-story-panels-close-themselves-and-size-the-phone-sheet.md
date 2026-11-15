---
id: T-317
objective: O-075
title: Let story panels close themselves and size the phone sheet
status: done
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

Per criterion:
- Inputs: `StoryPanelPlaybackInput.closeAfterSeconds` and `StoryPanelInput.closeAfterSeconds` checked in `core/storyPanels.ts` (`spanOf`: finite, above 0); on a step or a bad value `bad-panels` names panel and field. Tests: `tests/storyPanelClose.test.ts` "closeAfterSeconds checks" (6 throw cases, 1 accept).
- Close rule: pure `panelSpanPassed` beside `CrossingTracker` in `shell/storyPanels.ts` (adds `previousMs`/`wasPlaying` getters); `useStoryPanels` calls it each tick before `advance`; a newly crossed panel wins the same tick; close reports cause `playback`. Table test 4 span kinds (playback span, panel span over longer playback span, panel span not yet reached, none) x 4 movements (forward pass, seek past, rewind, paused) = 16 rows, plus a stop-on-end row. DOM test: auto-opened panel stays open then closes, reported `{id: null, cause: "playback"}`; no span never closes.
- Sheet look: `sheetMaxPercent` row in `LOOK_FIELDS` (`param: null`, range from `PHONE_LAYOUT_LIMITS`), `LookInput`/`LookRead`, `SceneControls.sheetMaxPercent` (one value) set by `applyLook`, read by `lookReadOf`; App's phone layout takes it from `sheetShown`, and the Developer slider and Reset write the controls. Tests: look table row in `tests/look.test.ts` (default 50, set, address ignored), `storyPanelClose.test.ts` sheet look (default, live change via `applyLook`, `bad-look` for 29, 86, NaN).
- Docs: README rows (`addStoryPanels`, `setStoryPanelPlayback`, `setLook`, `handle.look`), CHANGELOG Unreleased, `npm run api:lock` rerun (lock updated).

Gates (repo root): `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` 261 files passed, 3982 tests passed, 2 skipped. (An earlier test run failed `apiRules` API-04 on `sheetMaxPercent`; fixed by adding `Percent` to `UNIT_SUFFIX` in `tools/api-rules.mjs`, since percent is a unit; no allowlist entry added.) A first lint run flagged `App` complexity 22; moved the story settings into `liveStorySettings`.

Files changed: packages/astraeus/src/core/storyPanels.ts, src/shell/storyPanels.ts, src/shell/useStoryPanels.ts, src/shell/AstraeusShell.tsx, src/api/story.ts, src/api/scene.ts, src/api/look.ts, src/app/look.ts, src/app/liveLook.ts, src/app/AstraeusScene.tsx, src/app/App.tsx, tests/storyPanelClose.test.ts (new), tests/look.test.ts (one CASES row, required by its coverage test), tests/helpers/viewerPresentation.ts (FAKE_LOOK gains `sheetMaxPercent: 50`, required by the LookRead type), README.md, CHANGELOG.md, api-surface.lock.json, tools/api-rules.mjs, this Task file.
Extra reads: none beyond the Context Files (README/CHANGELOG by the named headings only; `tests/domStory.test.ts`, `tests/domSetup.ts`, `src/shell/AstraeusShell.tsx` (story settings line), `src/synthetic/syntheticDefinition.ts` (panel/rates), `src/api/lookInput.ts`, `tools/api-rules.mjs` read to write the DOM test and fix the API-04 lint).
Limitations: no browser run (not required); a panel opened by the visitor after the clock is already past its span stays open until a visitor close (the rule fires only on a crossing).

## Drift Notes

- Close rule: `panelSpanPassed` in `src/shell/storyPanels.ts` (beside `CrossingTracker`), called from `useStoryPanels`; span carried as `StoryPanel.closeAfterSeconds` (resolved from the panel input) and `StoryPanelSet.closeAfterSeconds` / `PanelPlayback` (playback), passed to the hook as `StoryPanelSettings.closeAfterSeconds` (App `liveStorySettings`, shell `ownStorySettings`). Steps carry none.
- Sheet look: `sheetMaxPercent` row in the look table (`src/app/look.ts`), held in `SceneControls.sheetMaxPercent` (`liveLook.ts` apply/read); App's `phoneLayout` is the own phone settings with `sheetMaxPercent` from that one value; the Developer "Sheet height" slider and Reset write it.
- Tooling: `tools/api-rules.mjs` `UNIT_SUFFIX` gains `Percent` (API-04).

- Coordinator (2026-11-15T10:15:57Z): accepted the builder's two flagged changes: adding `Percent` to `UNIT_SUFFIX` in `tools/api-rules.mjs` (a percent is a unit, the general fix over an allowlist entry), and the additive look-table row and `FAKE_LOOK` field (no existing setup changed). Gates pass (lint, typecheck, build, test 261 files / 3982 passed); marked done per the owner's "orchestrate O75".
