---
id: I-031
title: Story markers on the same object stack and hide each other
type: defect
status: resolved
checks: [C-069, C-071, C-072]
source:
  kind: report
  actor: {role: checker, session: o011-orchestrator-check-20261016-night}
  at: '2026-10-16T12:40:00Z'
tasks: [T-059]
resolution:
  disposition: verified
  check: C-072
  actor: {role: checker, session: o015-full-recheck-20261018}
  at: '2026-10-18T02:30:00Z'
  reason: Repair proven by the CLEAR O-015 Full Objective Recheck C-072.
history:
  - at: '2026-10-16T12:40:00Z'
    actor: {role: checker, session: o011-orchestrator-check-20261016-night}
    kind: observed
    note: 'Reported by the T-061/T-062 builder and recorded by the orchestrator. When several story panels name the same scene object (e.g. Eagle), their scene markers draw on top of each other and the topmost swallows the clicks, so only one of those panels can be reopened from the scene. Every panel still opens from its timeline marker. The builder did not patch it (T-061 Boundaries); it is a T-059 capability gap.'
  - at: '2026-10-17T23:20:00Z'
    actor: {role: executor, session: o015-t088-lane-builder}
    kind: repair_attempted
    note: 'T-088 (lane o015-t088): src/app/StoryMarkers.ts now merges panels that name the same object into one scene marker (groupStoryMarkers), whose data-panel-ids lists them in time order. A press opens the latest panel the clock has reached (or the first), and a press while one of its panels is open opens the next, wrapping round (panelForMarkerPress), so every panel on the object is reachable from the scene. Generic, no object names. The scene marker update now receives the clock time (AstraeusScene) and each spec carries its panel time (App). Apollo 11 powered-descent and ascent-docking now name eagle and tei names columbia, so every Apollo panel is reachable from the scene and the timeline. Proof: tests/storyMarkers.test.ts (synthetic story, three panels on one object); browser-story-panels asserts one Eagle marker carries all three Eagle panels and each opens from it (driver pressSceneStoryMarker). Browser evidence is recorded in T-088. Status left open for the Check.'
  - at: '2026-10-18T01:45:00Z'
    actor: {role: checker, session: o015-full-check-20261018}
    kind: rechecked
    note: 'C-071 (O-015 Full Objective Check) verified the Proof Needed on HEAD 88c5d02. Proof 1: groupStoryMarkers and panelForMarkerPress are generic, with one marker per object; checker probes cover the clock rule at its boundaries, presses while another panel is open, and cycling that reaches all three panels. Proof 2: tests/storyMarkers.test.ts plus the browser step "a shared marker reaches every panel on it (powered-descent, touchdown, ascent-docking)". Proof 3: story-panels, shell and spike03 passed with zero console errors in the fresh full run docs/evidence/o015-full-check-20261018T011817Z (24/24). Left open: C-071 is NEEDS WORK on other Issues (I-038, I-039), and only a CLEAR Check may close this as verified.'
    check: C-071
  - at: '2026-10-18T02:30:00Z'
    actor: {role: checker, session: o015-full-recheck-20261018}
    kind: rechecked
    note: 'C-072 (O-015 Full Objective Recheck, CLEAR) on HEAD 43b51df: StoryMarkers.ts, the Apollo panels and tests/storyMarkers.test.ts unchanged since C-071 verified Proof 1-2; Proof 3 repeated in the fresh full run docs/evidence/o015-recheck-20261018T020900Z (24/24; story-panels shared Eagle marker reaches powered-descent, touchdown, ascent-docking; shell and spike03 exit 0, zero console errors). Closed as verified.'
    check: C-072
---

# I-031: Story markers on the same object stack and hide each other

## Summary

The scene markers from T-059 (`src/app/StoryMarkers.ts`) draw one marker per panel at the named object's screen position. Panels that share an object overlap exactly, and only the top marker can be clicked.

## Proof Needed

1. Several panels on one object can each be reached from the scene: one marker per object that opens a short chooser, or the marker for the panel nearest the current time, or markers offset. The rule is generic, with no object names.
2. A test with a synthetic story that has two panels on one object, plus a browser assertion that both can be opened from the scene.
3. browser-story-panels, shell and spike03 still pass with zero console errors, in a fresh evidence directory.
