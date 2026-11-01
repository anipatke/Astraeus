---
id: O-058
title: Split the scene builder and host link by concern
status: planned
depends_on: [O-053]
release: G-016
priority: high
---

# O-058: Split the scene builder and host link by concern

## Outcome

The `Scene` builder (about 1,050 lines planning every concern) becomes one small planner per concern (bodies, paths, groups and activity, story layer, timeline and pacing, views and switches, camera) joined by a single assembler; `ViewerLink`'s four jobs (clock, views, camera, event zones) are separate parts behind the same host link; input parsers live in `src/api/` or `src/core/`, not in display code. The public surface does not change: the O-053 API-surface lock passes untouched (review F15; I-132).

## Why

Owner, 2026-11-01: "yes, early" and "lets do this right". O-054 to O-057 and O-059 all change `scene.ts` and `viewerLink.ts`; splitting first keeps each later change small and reviewable (owner's "small change, small diff"; STYLE-01, STYLE-10; C-136 style note).

## Success Conditions

Planned 2026-11-01 (planner session o058-planning-20261101), from the owner's settled intent: pure refactor, no public API change, lock untouched, no behaviour change, full suite plus one browser check at the end.

1. **Same output, pinned first.** A new characterisation test, written before any code moves, records what today's `Scene` produces for scenes that use every concern (the definition's data, its metrics and `prepare` results, and the code and message of each build error, in the order they are thrown). It passes unchanged after every step, so each move is shown not to change behaviour.
2. **One planner per concern, one assembler.** Bodies, paths, groups and activity, story layer, timeline and pacing, views and switches, and camera each have their own module in `packages/astraeus/src/api/` (flat in that folder, so the O-053 scans cover them); one assembler module builds the definition from them in the same check order as today. `scene.ts` keeps the public input types, the `Scene` class with its public methods delegating to the planners, and `stateOf`/`provenanceOf`; no module of the split is over 300 lines and `scene.ts` is under 450 (was 1,048).
3. **`ViewerLink` in four parts.** Clock (time, rate, playing, `setTime`, `setRate`, `onChange`), views (`view`, `setView`), camera (`camera`, `setCamera`) and event zones (`eventZones`, `onEventZone`) are separate parts in their own modules; `ViewerLink` keeps the attach, detach, close and `whenAttached` lifecycle and joins them behind the same members.
4. **Parsers out of display code.** The story-panel parser (`parseStoryPanels`, `StoryPanelError`, its input and output types) and the camera-pose check (`validateStartView`, `StartView`) live in `packages/astraeus/src/core/`; nothing in `src/api/` imports them from `src/app/` or `src/shell/`. A new test fails when a `src/api/` file imports an `app/` or `shell/` module outside a short, reasoned list (the definition contract, the viewer port and the viewer itself).
5. **Nothing public moves.** `packages/astraeus/api-surface.lock.json`, every O-053 allowlist and `DEEP_IMPORT_COUNTS` are byte-for-byte unchanged; no existing test file is edited; no `Scene`, `SceneCamera` or `MountedScene` member is added or removed; no CHANGELOG entry (nothing a host sees changes).
6. **Gates.** Lint (complexity at most 20), typecheck, build, `npm test`, `npm run test:full`, `npm run check:engine-alone`, `npm run check:pack` and the node and React consumer checks pass; one `npm run check:browser` at the Full Objective Check; Design.md describes the new module layout.

## Architectural Considerations

Pure refactor: same inputs, same definition, same errors and messages. The O-053 checks are the safety net; a lock diff means the refactor changed the API and must be undone.

Planned module layout (planner, 2026-11-01; Design.md is reconciled by the last Task when it lands):

- `src/api/` planners, flat: `planPaths.ts` (trajectories: samples, providers, plane, anchors, readouts, `lineFixedTo` and `"auto"` stretches, the path cover), `planBodies.ts` (catalogue and elements bodies, listed moons, body options and looks, label reach, moon and Sun orbit lines, data needs), `planGroups.ts` (groups and activities, group readouts and layers), `planStory.ts` (events, event provenance, story panels), `planTimeline.ts` (window, opening time, clock, pacing, rates), `planViews.ts` (views and display switches), `planCamera.ts` (`SceneCamera`, camera presets, reach, fit and up entries), and `assembleScene.ts` (the planet-series read guard and the one function that builds the definition and its `prepare`). Existing input planners (`activity.ts`, `group.ts`, `story.ts`, `views.ts`, `switches.ts`, `sunOrbit.ts`, `pathProvenance.ts`) stay as they are.
- `src/api/` host link: `viewerClock.ts`, `viewerViews.ts`, `viewerCamera.ts`, `viewerZones.ts`, joined by `ViewerLink` in `viewerLink.ts`.
- `src/core/storyPanels.ts` and `src/core/startView.ts` hold the parsers; `src/shell/storyPanels.ts` and `src/app/viewLink.ts` re-export the moved names so display code, demos, the site and existing tests keep their imports (deep-import counts unchanged; O-059 removes the demos' deep imports).
- Constraints from the O-053 checks: the public input types, `TrajectoryBase` (an `apiOutsideTypes` entry keyed to `scene.ts`) and `stateOf`'s message match (an `apiErrors` entry keyed to `scene.ts`) stay in `scene.ts`; `index.ts` keeps exporting from `./scene`; the parsers go to `core/` rather than `api/` because they throw `RangeError` and `StoryPanelError`, which the `api/` plain-throw scan would add as new breaks; `src/core/` imports nothing from `app/` or `shell/` (ARCH-04).

## Boundaries

**In scope:** `packages/astraeus/src/api/scene.ts`, `viewerLink.ts`, the parsers they use, their tests' imports.

**Out of scope:** any public API change, rename or new feature (later Objectives).
