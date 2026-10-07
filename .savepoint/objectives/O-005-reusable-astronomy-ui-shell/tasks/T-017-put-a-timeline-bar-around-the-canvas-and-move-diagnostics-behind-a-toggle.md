---
id: T-017
title: Put a timeline bar around the canvas and move diagnostics behind a toggle
objective: O-005
status: done
depends_on: [{task: T-016, requires: clear}]
owner_validation:
    required: false
    accepted_check: ""
planned_by: {role: planner, session: g002-replan-2026-10-06}
check_waiver:
    task: T-017
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-07T08:28:26Z"
---

# Put a timeline bar around the canvas and move diagnostics behind a toggle

## Outcome

The app opens on a canvas-first viewer UI: a generic shell in `src/shell/` driven by an experience configuration, with a persistent timeline bar (play/pause, current UTC date/time, speed, scrub/seek, previous/next event, event markers where practical, compact current-event title and an expandable event list). The existing debug controls and overlay are reachable only through a developer toggle.

## User Check

Open the app at 1280×800: the canvas dominates, the timeline bar is the only persistent control strip, play/pause/seek/speed work, previous/next event jumps to the 30 Apollo events in order and the current event title updates. Turn on developer mode and find the previous diagnostics.

## Done When

1. An experience configuration type (grown from `MissionConfig` per the audit) carries objects, events, timeline window and rates; Apollo supplies it from `src/mission/apollo11.ts`.
2. The timeline bar drives the existing `SimulationClock`; seeking and rate changes produce the same clock states as the previous controls (named tests).
3. Previous/next event and the "where am I / what just happened / what next" readout are derived from `TimelineEvent` data without changing the event model (named tests for boundaries: before first, on an event, after last).
4. Developer mode exposes every diagnostic the current `DebugControls`/`DebugOverlay`/`MissionPanel` show; default viewer mode shows none of them.
5. `src/shell/` has no mission naming; a test greps it for `apollo`, `columbia` and `eagle` (case-insensitive).
6. `src/core/` and generated data are unchanged; configured gates pass.

## Context Files

`docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `src/app/App.tsx`, `src/app/mission.ts`, `src/app/DebugControls.tsx`, `src/app/DebugOverlay.tsx`, `src/app/MissionPanel.tsx`, `src/app/style.css`, `src/mission/apollo11.ts`, `src/core/clock.ts`, `src/core/events.ts`, `tests/controls.test.ts`, `tests/missionScene.test.ts`.

## Design References

Design: Components/Codebase Map, Interfaces and Data Flow (clock, events). Brief sections 2, 3 (timeline), 4, 9, 11, 14.

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07, STYLE-09, ARCH-01, ARCH-02, PROV-01.

## Implementation Plan

1. Confirm the audit's configuration shape and primitive list; return REPLAN REQUIRED if the audit calls for a core change.
2. Introduce the experience configuration and Apollo's instance, keeping `MissionConfig` consumers working or migrating them.
3. Build the shell layout and timeline bar using the audit's KEEP/ADAPT patterns and tokens.
4. Derive event navigation from events and clock time.
5. Move existing diagnostics behind a developer toggle.
6. Add tests, including the no-mission-names grep; run gates.

## Boundaries

No object picker, camera, info or provenance UI yet (later Tasks). No changes to core, events, `ScalePolicy` or data.

## Technical Verification

Focused tests during iteration; configured typecheck, build and test gates at handoff. Browser smoke via a script under `tools/validate/` with 0 console errors.

## Technical Evidence

Started 2026-10-07T07:21:44Z. Runtime dependency gate reports Ready. Router already selects O-005/T-017/G-003; owning Objective is already in progress.

### Acceptance outcomes — 2026-10-07

1. Satisfied: `src/shell/experience.ts` defines generic object labels, events, timeline bounds and rates; `src/mission/apollo11.ts` projects them from the existing `MissionConfig` and `TimelineEvent` data.
2. Satisfied: timeline play/pause, rate and seek actions call the existing `SimulationClock` through app-owned callbacks. Existing named cases pass: `seeks forward and backward while paused and stays paused`, `seeks while playing and keeps advancing from the target at the current rate`, and `changing rate does not move the requested timestamp or its state` (`tests/controls.test.ts`).
3. Satisfied: event context and strict previous/next navigation derive from the existing event records. Named boundary cases pass: `shows the first event as next before the event window begins`, `shows the event at the current time and navigates to its neighbours`, `keeps the last event as the current story point after the event window`, and `moves through all 30 configured events in chronological order` (`tests/timeline.test.ts`).
4. Satisfied: the browser smoke confirms default mode hides the developer panel and mission readouts; Developer mode reveals the existing UTC controls, focus/scale controls, MissionPanel and DebugOverlay.
5. Satisfied: `contains no experience-specific names` checks every shell TypeScript, TSX and CSS source file for `apollo`, `columbia` and `eagle`, case-insensitively.
6. Satisfied: `git diff -- src/core data` is empty. Configured typecheck, build and test gates pass.

The generic shell owns the persistent timeline and developer-mode toggle. The app owns the scene and diagnostic content. No event-model, scientific-core, generated-data or `ScalePolicy` changes were made.

### Targeted extra reads

- `.savepoint/config.yml`: identify the configured handoff gates.
- `src/main.tsx` (targeted stylesheet-import lookup): confirm the existing global CSS entry point before adding shell-local styles.
- `tools/validate/browser-spike02.mjs`: inspect the existing headless browser smoke and its expected app controls for the required zero-console-error validation.
- `src/shell/experience.ts`, `src/shell/timelineModel.ts`, `src/shell/TimelineBar.tsx`, `src/shell/AstraeusShell.tsx`, and `src/shell/style.css`: review the new generic configuration, event derivation, canvas layout, and control accessibility during integration verification.
- `tests/timeline.test.ts`: review the boundary, ordering, and shell-name checks against the Task criteria.
- `tools/validate/browser-shell.mjs`: review the focused 1280×800 smoke assertions before running them and capture a temporary settled screenshot for layout inspection.

### Verification

- Fresh configured gates at 2026-10-07 08:19 UTC: `npm run typecheck` exit 0; `npm run build` exit 0; `npm test` exit 0, 8 files / 136 tests passed.
- Build note: Vite reports the existing large-bundle advisory (1.40 MB minified JS chunk).
- Focused iteration run `npm test -- --run tests/timeline.test.ts tests/controls.test.ts tests/missionScene.test.ts`: exit 0, 3 files / 60 tests passed.
- `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js node tools/validate/browser-shell.mjs`: exit 0 at 1280×800; 30 event rows found, event selection/next navigation and developer diagnostics verified, zero page or console errors. Chromium required an elevated run because its Linux sandbox host was denied inside the workspace sandbox.
- Temporary settled screenshot `/tmp/astraeus-t017-1280x800-settled.png` visually confirms the canvas fills the viewport with the timeline as the persistent control strip. The screenshot is not a saved Objective evidence artifact; responsive and owner visual review remain for T-020.
- `git diff --check`: exit 0. Lint gate is `null`; no lint command ran. `src/core/` and generated `data/` are unchanged.

### Files read

- Workflow and selection: `agent-skills/savepoint-task/SKILL.md`, `.savepoint/router.md`, this Task, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-016-audit-planetary-explorer-s-ui-for-patterns-worth-reusing.md`, `.savepoint/config.yml`, `.savepoint/Guardrails.md`.
- Task Context Files: `docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `src/app/App.tsx`, `src/app/mission.ts`, `src/app/DebugControls.tsx`, `src/app/DebugOverlay.tsx`, `src/app/MissionPanel.tsx`, `src/app/style.css`, `src/mission/apollo11.ts`, `src/core/clock.ts`, `src/core/events.ts`, `tests/controls.test.ts`, `tests/missionScene.test.ts`.
- Targeted extra reads listed above, including the five new `src/shell/` files, `tests/timeline.test.ts`, and both browser validation scripts.

### Files changed

- `src/app/App.tsx`, `src/app/DebugControls.tsx`, `src/app/DebugOverlay.tsx`, `src/app/mission.ts`, `src/app/style.css`, `src/mission/apollo11.ts`.
- New generic shell: `src/shell/AstraeusShell.tsx`, `src/shell/TimelineBar.tsx`, `src/shell/experience.ts`, `src/shell/timelineModel.ts`, `src/shell/style.css`.
- `tests/timeline.test.ts`, `tools/validate/browser-shell.mjs`, `tools/validate/browser-spike02.mjs`, and this Task evidence.
- Router, Objective, and T-016 records were already modified in the shared checkout before T-017 started; this Task did not change them.

No Check, technical `CLEAR`, Task completion, or owner Task-check waiver is recorded. Task remains `in_progress` at `audit` for the owner’s handoff decision. Responsive and final owner visual review remain for T-020.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
