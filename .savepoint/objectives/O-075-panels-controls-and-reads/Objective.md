---
id: O-075
title: Panels, controls and reads
status: planned
depends_on: [O-074]
release: G-020
priority: medium
rank: 3
---

# O-075: Panels, controls and reads

## Outcome

A moment panel can close once playback leaves it; the phone sheet's height cap is a public setting and documented; a look-out scene can hide the orbit controls and scale toggle; a switch can carry its own label; and a host can read back the scene's look, switches and pacing.

## Why

G-020, Zodiac review F-18 (phone sheet covered the traced figure for weeks of simulated time), F-03 (orbit buttons in a sky-only app), F-04 ("Sky outlines" cannot be renamed), F-05 and F-17 (looks, switches, pacing untestable in Node).

## Success Conditions

- `setStoryPanelPlayback` takes `closeAfterSeconds` (simulated seconds after a moment panel's time) and a moment panel input may carry its own `closeAfterSeconds`; once forward playback passes the panel's time plus that span, an open moment panel closes by itself. With none set, panels behave exactly as in 0.9.1. A bad value throws `bad-panels`.
- The phone sheet's height cap is a look, `sheetMaxPercent` (30 to 85, default 50), set by `scene.setLook` and live by `handle.setLook`, read back on `handle.look`; out of range throws `bad-look`. The Developer drawer slider keeps working.
- `scene.camera.setFocusChoices(ids)` and an Overview on/off (`scene.camera.setOverview(false)`) work like `setFollowChoices` and `setLookOutChoices`; with all three empty a look-out scene shows no Focus, Follow or Overview buttons. The README gives the sky-only recipe, including the existing `setScale(x, { only: true })` for the scale switch.
- A `setSwitches` entry may carry `label` (a non-empty string) shown wherever that switch shows (top bar, switch panel, Developer drawer); a bad label throws `bad-switch`.
- The scene reads back `look` (filled in with defaults), `switches` (place, on, label), `panelPlayback` (with defaults) and `timeline.pacing` (as given, absent when none), with no browser; the viewer handle's live reads are unchanged.
- Additions only; README, CHANGELOG `Unreleased`, API surface lock updated; configured gates pass.

## Architectural Considerations

Panel close rule beside crossings in `src/shell/storyPanels.ts`; sheet cap `sheetMaxPercent` in `src/shell/phoneLayout.ts` becomes a public setting (API-06); camera presets in `src/api/planCamera.ts`; `SwitchesInput` in `src/api/switches.ts`; reads on `src/api/sceneReads.ts`. General primitives, not Zodiac choreography.

## Design Decisions (owner, 2026-11-15, session plan-o075-20261115)

- D1 Panel close: after a span of simulated time set by the host (one playback setting, optional per-panel override), not a rule tied to event zones. Owner: "After a set span".
- D2 Hiding camera buttons: Focus choices and an Overview on/off beside the existing Follow and Look-out choices, not one "sky only" switch. Owner: "Match the Follow choice". The scale switch already hides with `setScale(x, { only: true })`, so only the README recipe is added for it.
- D3 Read-backs: on the scene (Node-testable); the viewer handle's live reads stay as they are (no live pacing-mode read). Owner: "On the scene".
- Planner choices in the confirmed summary: the sheet cap is a look (API-06), not a separate call; a switch label applies everywhere the switch shows. Owner confirmed the summary: "Yes, plan it".

## Boundaries

**In scope:** the five items above.
**Out of scope:** first-play hooks, step-bar hiding, host slots in the top bar, camera offsets.
