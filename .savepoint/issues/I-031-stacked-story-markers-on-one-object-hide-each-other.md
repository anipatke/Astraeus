---
id: I-031
title: Story markers on the same object stack and hide each other
type: defect
status: open
source:
  kind: report
  actor: {role: checker, session: o011-orchestrator-check-20261016-night}
  at: '2026-10-16T12:40:00Z'
tasks: [T-059]
history:
  - at: '2026-10-16T12:40:00Z'
    actor: {role: checker, session: o011-orchestrator-check-20261016-night}
    kind: observed
    note: 'Reported by the T-061/T-062 builder and recorded by the orchestrator. When several story panels name the same scene object (e.g. Eagle), their scene markers draw on top of each other and the topmost swallows the clicks, so only one of those panels can be reopened from the scene. Every panel still opens from its timeline marker. The builder did not patch it (T-061 Boundaries); it is a T-059 capability gap.'
  - at: '2026-10-17T23:20:00Z'
    actor: {role: executor, session: o015-t088-lane-builder}
    kind: repair_attempted
    note: 'T-088 (lane o015-t088): src/app/StoryMarkers.ts now merges panels that name the same object into one scene marker (groupStoryMarkers), whose data-panel-ids lists them in time order. A press opens the latest panel the clock has reached (or the first), and a press while one of its panels is open opens the next, wrapping round (panelForMarkerPress), so every panel on the object is reachable from the scene. Generic, no object names. The scene marker update now receives the clock time (AstraeusScene) and each spec carries its panel time (App). Apollo 11 powered-descent and ascent-docking now name eagle and tei names columbia, so every Apollo panel is reachable from the scene and the timeline. Proof: tests/storyMarkers.test.ts (synthetic story, three panels on one object); browser-story-panels asserts one Eagle marker carries all three Eagle panels and each opens from it (driver pressSceneStoryMarker). Browser evidence is recorded in T-088. Status left open for the Check.'
---

# I-031: Story markers on the same object stack and hide each other

## Summary

The scene markers from T-059 (`src/app/StoryMarkers.ts`) draw one marker per panel at the named object's screen position. Panels that share an object overlap exactly, and only the top marker can be clicked.

## Proof Needed

1. Several panels on one object can each be reached from the scene: one marker per object that opens a short chooser, or the marker for the panel nearest the current time, or markers offset. The rule is generic, with no object names.
2. A test with a synthetic story that has two panels on one object, plus a browser assertion that both can be opened from the scene.
3. browser-story-panels, shell and spike03 still pass with zero console errors, in a fresh evidence directory.
