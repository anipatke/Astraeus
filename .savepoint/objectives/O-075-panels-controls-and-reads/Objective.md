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

To be settled in this Objective's design interview.

## Architectural Considerations

Panel close rule beside crossings in `src/shell/storyPanels.ts`; sheet cap `sheetMaxPercent` in `src/shell/phoneLayout.ts` becomes a public setting (API-06); camera presets in `src/api/planCamera.ts`; `SwitchesInput` in `src/api/switches.ts`; reads on `src/api/sceneReads.ts`. General primitives, not Zodiac choreography.

## Boundaries

**In scope:** the five items above.
**Out of scope:** first-play hooks, step-bar hiding, host slots in the top bar, camera offsets.
