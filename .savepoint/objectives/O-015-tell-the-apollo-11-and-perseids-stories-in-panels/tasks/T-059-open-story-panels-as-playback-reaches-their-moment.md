---
id: T-059
title: Open story panels as playback reaches their moment
objective: O-015
status: done
depends_on: []
owner_validation: {required: true, accepted_check: C-038, accepted_by: {role: owner, session: owner-chat-20261018}}
planned_by: {role: planner, session: o015-plan-20261016}
---

# Open story panels as playback reaches their moment

## Outcome

Any experience can list story panels in its settings. Each panel opens when playback reaches its time (pausing briefly), sits on a marker you can tap to reopen it, and shows a title, short text, a badge (observed, modelled or illustrative) and its sources.

## User Check

Open a synthetic or demo story with two panels, press play, and watch each panel open in turn and pause playback briefly. Tap a marker to reopen a panel. Scrub back and forth past the markers: panels never stack. On a phone the panel is a bottom sheet that swipes away.

## Done When

1. Panel schema (id, time UTC or event/anchor id, title, body, badge, sources[]) validated with named errors (STYLE-06), read from the experience definition. No story wording in shell code (ARCH-01; nameCheck green).
2. Auto-open on forward playback crossing a panel's time; brief pause, then resume on its own (pause length a setting with a live control in Developer > Display settings) or on a tap. Seeking or scrubbing does not auto-open. Only one panel is open at a time.
3. Markers on the timeline (and, where the panel names a body or anchor, a marker in the scene) reopen the panel.
4. Desktop side panel; phone bottom sheet with swipe-to-dismiss. Ported from Planetary Explorer's SidePanel, BottomSheet, HotspotMarker and Badge, with each port recorded in docs/DONOR_PROVENANCE.md.
5. Contract tests on a synthetic story (ARCH-03); browser script `tools/validate/browser-story-panels.mjs` writes to a fresh evidence directory. Existing browser scripts still pass with zero console errors.

## Context Files

`src/shell/AstraeusShell.tsx`, `src/shell/experience.ts`, `src/shell/TimelineBar.tsx`, `src/shell/timelineModel.ts`, `src/shell/ProvenanceBadge.tsx`, `src/shell/style.css`, `src/app/App.tsx`, `src/app/experienceDefinition.ts`, `/home/user/code/planetary-explorer/src/features/hotspots/SidePanel.tsx`, `/home/user/code/planetary-explorer/src/features/hotspots/BottomSheet.tsx`, `/home/user/code/planetary-explorer/src/features/hotspots/HotspotMarker.tsx`, `/home/user/code/planetary-explorer/src/shared/components/Badge.tsx`, `docs/DONOR_PROVENANCE.md`.

## Design References

Design sections on the shell, experience definitions and settings.

## Guardrails

ARCH-01, ARCH-03, PROV-01, TEST-01..03, STYLE-06, STYLE-09.

## Implementation Plan

1. Define the panel schema and validator in the shell's experience types.
2. Port the panel and sheet parts, restyled to the shell's look.
3. Add the crossing detector (forward playback only), the pause setting and one-at-a-time state.
4. Add timeline markers, and scene markers where a body or anchor is named.
5. Write tests on a synthetic story, then the browser script.

## Boundaries

No chapters, narration or audio. No engine changes. Don't change State or the camera's behaviour.

## Technical Verification

Gates from `.savepoint/config.yml` plus the scene-affecting browser scripts (AGENTS.md project rules). Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder evidence, 2026-10-16 (UTC). Status in_progress, stage audit (ready for a Check; not a pass). Not set to done; no Check written; nothing committed or staged. Router not edited (owner keeps it on O-011).

Extra reads (outside Context Files), with reasons: `src/app/AstraeusScene.tsx`, `src/app/SceneLabels.ts` and `src/app/AnchorLabels.ts` (to place scene markers with the same projection as labels); `src/app/SettingControls.tsx`, `src/core/clock.ts`, `src/core/events.ts` (settings rows, clock play/pause, event shape); `src/experiences/apollo11/apollo11.ts` and `data/apollo11/normalised/anchors.json` (demo wiring and anchor facts); `tests/nameCheck.test.ts`; the donor's `useSwipeToDismiss.ts` (the sheet's swipe hook); `agent-skills/savepoint-task/SKILL.md` and `.savepoint/Guardrails.md`.

Panel schema (story settings, e.g. `data/stories/apollo11/panels.json`): `{ pauseSeconds?, autoOpen?, panels: [{ id, at: { utc | event | anchor }, title, body (string or lines), badge: observed | modelled | illustrative, sources: [lines], object? }] }`. `parseStoryPanels` (src/shell/storyPanels.ts) validates it with errors naming panel and field (STYLE-06) and returns `ExperienceConfig.storyPanels` (panels sorted by time, plus the two setting defaults).

Per-criterion outcomes:
1. Met. Schema and validator in `src/shell/storyPanels.ts`; read from `ExperienceConfig.storyPanels`; no story wording in src/shell or generic src/app; `tests/nameCheck.test.ts` green. `tests/storyPanels.test.ts` "story panel settings (T-059 Done When 1)": time resolution by event, anchor and UTC; defaults; 11 named-error cases (title, badge, sources, source line, body, UTC zone, two times, unknown event, unknown anchor, unknown object, outside window); duplicate id; out-of-range settings.
2. Met. `CrossingTracker` (forward-only; `rebase` on every seek; not while paused or with auto-open off; a loop wrap crosses nothing; the newest of several wins so one panel is open at a time) and `useStoryPanels` (hold, resume after the pause setting, Continue, Play during the hold takes over, closing during the hold resumes). Pause length and auto-open are live controls in Developer > Display settings > Story panels (SettingSlider and SettingButtons). Tests: "opening as playback reaches a panel (T-059 Done When 2)", 7 cases including scrubbing back and forth. Browser: forward playback opened the panel and held playback; it resumed by itself; Continue resumed at once; a seek forward (paused or playing) opened nothing; scrubbing opened nothing; pause 0 does not hold; pause 2 s held 1963 ms; auto-open off crosses silently; never more than one `.story-panel`.
3. Met. A timeline marker per panel (`.timeline-panel-marker`: seeks, then opens; aria-pressed when open) and a scene marker (`StoryMarkerLayer`) on a panel's named object. Browser: both open their panel and the second replaces the first; the scene marker was visible on Eagle at touchdown and clicking it opened the touchdown panel.
4. Met. `StoryPanelView`: side panel at the right on wide screens, bottom sheet with a handle at 700 px and narrower, swipe-down dismiss (80 px threshold, only from scrollTop 0). Browser (CDP touch) at 390x844: sheet at the bottom, full width, 368 px tall, handle visible, no horizontal scroll; a 140 px swipe dismissed it; a 26 px drag kept it. Ports recorded in docs/DONOR_PROVENANCE.md, section "Spike 04 — story panels: SidePanel, BottomSheet, HotspotMarker and Badge ports (T-059, 2026-10-16)".
5. Met. Contract tests on a synthetic story (made-up orbiter, 2100 dates) in `tests/storyPanels.test.ts`; panel view render test (badge, paragraphs, sources, Continue only while holding); demo wiring test (2 Apollo panels on A-02 and A-LND). `tools/validate/browser-story-panels.mjs` writes to a fresh directory (refuses a non-empty one). Existing browser scripts re-run: browser-shell, browser-spike03, browser-showers (Geminids and Perseids), zero console errors.

Demo wiring: `data/stories/apollo11/panels.json`, two observed panels (A-02 "Leaving Earth orbit", A-LND "Touchdown at Landing Site 2"); text only from the anchors file and event list, each sourced to its Mission Report table. Wired in `buildApollo11Experience` (src/experiences/apollo11/apollo11.ts), which supplies the anchor lookup. The full Apollo (T-061) and Perseids (T-062) panel content is not written.

Commands run: `npm run typecheck` clean. `npm run build` succeeded (chunk-size warning only). `npx vitest run` 48 files, 883 passed, 1 skipped (new: tests/storyPanels.test.ts, 24 tests). Two earlier full runs, made while a browser run loaded the CPU and another builder edited files, each showed one failure that passed on the next run; I did not identify which test. Browser, fresh directory docs/evidence/o015-t059-20261016T105725Z/ (own vite on port 5401, stopped afterwards; PLAYWRIGHT_CORE from the donor): `story-panels/` (browser-story-panels.mjs, 15 checks, passed, errors []), `shell/` (browser-shell.mjs, exit 0, errors []), `spike03/` (browser-spike03.mjs, exit 0, errors []), `showers/` (browser-showers.mjs, "2 of 2 showers passed", errors []). Screenshots in story-panels/: desktop-panel-open.png (1440x900), desktop-scene-marker-panel.png, desktop-developer-story-settings.png, phone-sheet-open.png (390x844), phone-sheet-mid-swipe.png, phone-sheet-touchdown.png. browser-anchor-labels.mjs was not run. data/local was not touched.

Fixes after browser runs found real problems: the Developer panel covered the side panel (it now steps left of an open panel on wide screens); the open Events list was hidden behind the panel (it now rises above it). My own earlier failed or superseded runs were deleted. browser-spike03 failed once from a vite page reload caused by another builder's file edits and passed on rerun; browser-showers timed out under load in the foreground and passed when run in the background.

Limitations: scene markers have no far-side test (a marker on a body behind the Moon still shows if the body is placed and on screen); the timeline panel markers are small among the dense event ticks; the pause-length bounds in the browser script are loose because timing depends on the machine; the "observed" badge on the Apollo panels covers the published times and places, and the second panel's text says the descent path is reconstructed; no Task Check was run; the phone sheet covers the timeline while open; the swipe hook is proven only in the browser run (no jsdom in the project).

## Drift Notes

New generic shell surface to reflect in Design.md at the O-015 integration Task: `ExperienceConfig.storyPanels`, `parseStoryPanels` and `CrossingTracker` (src/shell/storyPanels.ts), `StoryPanelView`, `useStoryPanels`, `StoryMarkerLayer` (src/app/StoryMarkers.ts) and the `SceneControls.storyMarkers` hook. The integration Task that accounts for these (reflected in Design.md, or non-architectural, with a reason) is not yet named; the planner should name it (T-063 per the plan, to confirm).

## Owner Completion — 2026-10-18

Accepted with the rewritten copy, as recorded in O-015 Decision 8, after the owner read the stories on the preview ("3 good"). Quick Task Check C-038 CLEAR. The copy this Task wrote was later rewritten in plain words by T-088 (C-069).
