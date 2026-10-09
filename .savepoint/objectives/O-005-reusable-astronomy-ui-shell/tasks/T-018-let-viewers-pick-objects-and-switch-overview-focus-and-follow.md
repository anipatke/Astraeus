---
id: T-018
title: Let viewers pick objects and switch overview, focus and follow
objective: O-005
status: in_progress
stage: audit
depends_on: [{task: T-017, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: g002-replan-2026-10-06}
---

# Let viewers pick objects and switch overview, focus and follow

## Outcome

A generic object picker and camera control let a viewer choose Earth, Moon, Columbia or Eagle (from configuration) and switch between overview, focus and follow with plain labels such as "Focus Earth", "Follow Columbia" and "Earth–Moon overview". Camera transitions are smooth, manual drag/zoom resumes after scripted movement, and a generic label primitive names bodies, spacecraft and event markers.

## User Check

Select each object; use Overview, Focus and Follow; drag and zoom after a transition; confirm labels are readable, do not obviously overlap at the overview, and hide when unsuitable. Confirm range and speed readouts in developer mode do not change when the camera changes at a fixed time.

## Done When

1. Selection is generic shell state; objects, display names and camera presets come from configuration.
2. Camera modes reuse `CameraRequest` / `OrbitCameraState`; transitions ease per the audit's donor pattern and restore manual control.
3. Camera and selection changes leave scientific State identical at a fixed time (named test, extending the existing focus-independence evidence).
4. A generic label primitive serves bodies, spacecraft and event markers, avoids obvious overlap where practical and can hide by zoom; `AnchorLabels` is either built on it or kept as a developer-mode diagnostic, as the audit decided.
5. Objects outside their trajectory bounds are shown as unavailable rather than selectable into an empty view.
6. No mission naming in `src/shell/`; core and data unchanged; configured gates pass.

## Context Files

`docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `src/app/CameraController.tsx`, `src/app/EarthMoonScene.tsx`, `src/app/TrackedBodyView.ts`, `src/app/AnchorLabels.ts`, `src/app/mission.ts`, `src/app/sceneLayout.ts`, `src/mission/apollo11.ts`, `tests/sceneTransforms.test.ts`, `tests/missionScene.test.ts`.

## Design References

Design: Interfaces and Data Flow (camera, floating origin, tracked bodies). Brief sections 3 (object selector, camera), 7, 8.

## Guardrails

TEST-01, TEST-03, STYLE-02, STYLE-05, STYLE-09, ARCH-01, ARCH-02, PROV-01.

## Implementation Plan

1. Add generic selection state and wire the picker to configuration.
2. Map overview/focus/follow to existing camera requests; add eased transitions from the audit's pattern.
3. Build the label primitive and apply it to bodies, spacecraft and event markers.
4. Handle out-of-bounds objects.
5. Tests for State independence, preset resolution and out-of-bounds handling; run gates.

## Boundaries

No info panel, provenance or scale UI (next Task). No floating-origin or `ScalePolicy` changes.

## Technical Verification

Focused tests; configured gates at handoff; browser script with 0 console errors covering each camera mode.

## Technical Evidence

Started 2026-10-07T08:29:24Z. Dependency gate is Ready: T-017 is done with its recorded owner waiver for the optional Task Check, which satisfies `requires: clear`; O-005 is already in progress. Router already selects O-005/T-018/G-003.

### Acceptance outcomes — 2026-10-07

1. **Satisfied.** `AstraeusShell` owns the selected object ID. `ExperienceConfig` supplies object labels, colors, trajectory availability, label priorities, distance limits, and camera presets; Apollo provides its objects and labels through `apollo11Experience`.
2. **Satisfied.** Overview, focus, and follow flow through the existing `CameraRequest` and `OrbitCameraState`. Target, distance, and the lunar focus angle ease; pointer drag, pinch, and wheel input cancel pending scripted motion and retain manual control. Follow keeps the current framing distance while tracking its configured target.
3. **Satisfied.** Named test `shell object selection and overview, focus, and follow requests leave State identical at a fixed time` in `tests/missionScene.test.ts` compares the same trajectory State around selection and camera transitions. The browser scenario also compares the developer mission/range/speed readout before and after camera changes while paused.
4. **Satisfied.** Generic `Label` is used for projected body/spacecraft labels and event-marker labels. Scene labels are priority ordered, suppress collisions, and use per-object zoom limits. The browser scenario sees selected spacecraft labels close up, hides them at overview, and confirms visible overview labels do not overlap. `AnchorLabels` remains the developer-mode anchor diagnostic.
5. **Satisfied.** The picker disables and marks objects unavailable outside configured trajectory bounds; selection rejects unavailable IDs. If a selected camera target leaves its bounds, the shell selects an available object and requests overview. Unit and browser scenarios cover both ends of Columbia's bounds and the fallback after Eagle leaves its bounds.
6. **Satisfied.** `rg -in 'apollo|columbia|eagle' src/shell` found no matches. `git diff -- src/core data` is empty. The configured gates passed.

### Targeted extra reads

- `src/app/App.tsx`: inspect current shell composition and app-owned selection/camera wiring before integrating generic object controls.
- `src/shell/experience.ts`, `src/shell/AstraeusShell.tsx`, `src/shell/TimelineBar.tsx`, and `src/shell/style.css`: inspect the existing shell contract and UI extension points for configured selection, camera actions, and generic labels.
- `tools/validate/browser-shell.mjs`: inspect the existing browser scenario before extending it to exercise each camera mode with zero console errors.
- Targeted reference search for `ExperienceConfig` and camera preset usage in `src/` and `tests/`: check the impact of extending the shell configuration contract.
- `src/app/floatingOrigin.ts`: verify the coordinate values used for projected-label zoom checks after the browser scenario exposed a mismatch between expected and actual label visibility.

### Verification

- Fresh configured gates at 2026-10-07 10:26 UTC; Node v22.22.2, npm 10.9.7, Vite 8.3.2, Vitest 5.0.3: `npm run typecheck` exit 0; `npm run build` exit 0; `npm test` exit 0 (8 files, 139 tests).
- Build reports the existing large-chunk advisory; final minified JS chunk is about 1.41 MB.
- `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_URL=http://127.0.0.1:5199/ node tools/validate/browser-shell.mjs`: exit 0 at 1280×800; 30 event rows; exercises Earth, Moon, Columbia and Eagle; Overview, Focus and Follow; unavailable/bounds fallback; event-marker label; camera-independent range/speed readout; close/overview label visibility and overlap; drag and zoom after camera transitions; zero page or console errors. Chromium required an escalated run because the workspace sandbox blocks its Linux sandbox startup.
- `git diff --check` exit 0. `git diff -- src/core data` is empty. The shell mission-name search had no matches.

### Owner-requested visual follow-up — 2026-10-07

Owner review called out inconsistent type sizes, unclear playback rates (`1000×` versus `1 hour/sec`), generic scrollbars, and a cluttered Developer mode. Follow-up changes establish a consistent UI type scale, theme the shell scrollbars, group developer controls and readouts into titled sections, and express timeline rates uniformly as simulated time per real second. The developer rate controls retain their compact multipliers with an explanation (`1,000×` is 16 min 40 sec per real second; `1 hour/sec` is 3,600×). The app now starts in TrueScale; ReadableScale remains available as an explicit developer option, with its distance compression explained. `src/core/scalePolicy.ts` and scientific State are unchanged.

Fresh follow-up commands at 2026-10-07: `npm run typecheck` and `npm run build` both exit 0; `git diff --check` exits 0. The build retains Vite's large-chunk advisory. The test suite and browser validation were not rerun after these UI edits, so the prior test/browser results above predate this follow-up. No Task Check or Task completion is recorded.

After the owner reported the changing UTC timestamp shifted the playback-rate dropdown, `.timeline-time` received a fixed 24-character monospace slot sized for the millisecond timestamp. Fresh `npm run build` and `git diff --check` passed after this layout fix; the test and browser validations remain pending.

The owner then requested clearer information architecture. Developer mode now separates time and playback, mission context, vehicle telemetry, display settings, and scientific diagnostics into five titled panels. Mission notes are separated from live telemetry, whose initial values are populated immediately. Fresh `npm run typecheck`, `npm run build`, and `git diff --check` passed after this change; test and browser validations remain pending.

Latest owner feedback questioned the order and requested instrumentation. The panel now leads with time/playback and live spacecraft telemetry, then scene measurements, display settings, and mission context. Static mission notes and advanced coordinate/orientation vectors are behind disclosures. Scene measurements are presented as metric cards for physical Earth–Moon distance, rendered separation, and geometric lunar illumination; the illumination bar uses its meaningful 0–100% range, and no arbitrary gauge scale was added. The existing `.mission .readout` and `dl.overlay` browser selectors remain present. Fresh `npm run typecheck`, `npm run build`, and `git diff --check` passed; test/browser validation remains pending.

The owner also requested the same instrumentation treatment for spacecraft telemetry. Each in-bounds vehicle now has a compact card with distinct range and inertial-speed values, explicit units, and an in-bounds state; the no-vehicle state is stated separately. The existing `.mission .readout` browser selector remains present. Fresh `npm run typecheck`, `npm run build`, and `git diff --check` passed after this change; tests and browser validation remain pending.

Files changed for this follow-up: `src/app/App.tsx`, `src/app/DebugControls.tsx`, `src/app/DebugOverlay.tsx`, `src/app/MissionPanel.tsx`, `src/app/style.css`, `src/shell/TimelineBar.tsx`, `src/shell/timelineModel.ts`, and `src/shell/style.css`.

### Test-stage verification of the follow-up — 2026-10-09

Fresh run against the post-follow-up tree. The first `npm test` at 2026-10-09T06:38:55Z failed 2 of 139 tests. Both are tests of UI replaced by the owner-requested follow-up (Objective success condition 10 allows updating these), not regressions:

- `tests/missionScene.test.ts` › `event jumps and playback` › `offers 1×, 100×, 1,000× and 10,000× on top of the existing speeds` expected the old bare labels. Now it asserts the new owner-requested wording, `10,000× — 2 hours 46 min 40 sec per real second` and `1× — real time`. Rate set and ordering are unchanged.
- `tests/controls.test.ts` › `debug readout` › `overlay rows list every required item` expected the row `Speed`. The follow-up renamed it to `Playback rate`, and the test now requires that label. All other required rows are unchanged.

`tools/validate/browser-shell.mjs` failed at `dl.overlay` because the follow-up put the advanced readouts in a collapsed `<details>` element. Now the scenario waits for the scene-measurement cards, asserts there are three, opens `.advanced-readouts summary` as a viewer would, and then asserts `dl.overlay`.

Commands, final tree, 2026-10-09T06:43:31Z, Node v22.22.2:
- `npm run typecheck`: exit 0. `npm run build`: exit 0 (existing large-chunk advisory). `npm test`: exit 0, 8 files, 139 tests.
- `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_URL=http://127.0.0.1:5199/ node tools/validate/browser-shell.mjs` against `npx vite --port 5199` at 2026-10-09T06:42:16Z: exit 0 at 1280×800. 30 event rows; overview, focus and follow; 2 visible labels; scene-measurement cards and advanced readouts; zero page or console errors. Chromium needed an unsandboxed run, as before.
- `git diff --check`: exit 0. `rg -in 'apollo|columbia|eagle' src/shell`: no matches.

The acceptance outcomes recorded on 2026-10-07 still hold on this tree; the named test for criterion 3 passes in the fresh run.

Limitations:
- `tools/validate/browser-spike02.mjs` (waits for `Follow Columbia (CSM)`) and `tools/validate/browser-anchor-labels.mjs` (waits for a visible `UTC date and time` without opening Developer mode) fail with timeouts. Both drive the Spike 01/02 controls that T-017/T-018 replaced. Re-running or superseding them with named equivalents is T-020 Done When 4, so they were not changed here. Neither reached its evidence write, so `docs/evidence/spike02*` was not overwritten.
- Responsive and mobile layouts and owner visual review remain in T-020.

Extra reads for this stage: `src/app/DebugOverlay.tsx` and `src/app/App.tsx` (diagnose the hidden `dl.overlay` and the 250 ms readout refresh); `src/shell/timelineModel.ts` (confirm the new rate labels); `tools/validate/browser-spike02.mjs`, `tools/validate/browser-anchor-labels.mjs` and T-017's evidence (decide whether those failures belong to this Task).

Files changed in this stage: `tests/missionScene.test.ts`, `tests/controls.test.ts`, `tools/validate/browser-shell.mjs`, and this Task.

### Files read

- Workflow and selection: `agent-skills/savepoint-task/SKILL.md`, `.savepoint/router.md`, this Task, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, T-017 (dependency), `.savepoint/config.yml`, `.savepoint/Guardrails.md`.
- Task Context Files: `docs/ASTRAEUS_SPIKE_03_BRIEF.md` (sections 3, 7, 8), `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `src/app/CameraController.tsx`, `src/app/EarthMoonScene.tsx`, `src/app/TrackedBodyView.ts`, `src/app/AnchorLabels.ts`, `src/app/mission.ts`, `src/app/sceneLayout.ts`, `src/mission/apollo11.ts`, `tests/sceneTransforms.test.ts`, `tests/missionScene.test.ts`.
- Targeted extra reads/searches above: `src/app/App.tsx`, `src/shell/experience.ts`, `src/shell/AstraeusShell.tsx`, `src/shell/TimelineBar.tsx`, `src/shell/style.css`, `tools/validate/browser-shell.mjs`, references to `ExperienceConfig` and camera preset usage in `src/` and `tests/`, and `src/app/floatingOrigin.ts`. Owner feedback follow-up also read `src/app/DebugControls.tsx`, `src/app/DebugOverlay.tsx`, `src/app/MissionPanel.tsx`, `src/app/style.css`, `src/core/scalePolicy.ts`, and searched existing browser selectors for time-rate and scale control compatibility.

### Files changed

- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-018-let-viewers-pick-objects-and-switch-overview-focus-and-follow.md`
- `src/app/App.tsx`, `src/app/CameraController.tsx`, `src/app/EarthMoonScene.tsx`, `src/app/MissionPanel.tsx`, new `src/app/SceneLabels.ts`
- `src/mission/apollo11.ts`
- `src/shell/AstraeusShell.tsx`, `src/shell/experience.ts`, `src/shell/TimelineBar.tsx`, `src/shell/style.css`, new `src/shell/ObjectControls.tsx`, `src/shell/objectModel.ts`, `src/shell/Label.tsx`
- `tests/missionScene.test.ts`, `tools/validate/browser-shell.mjs`

Responsive screenshots and final owner visual review remain in T-020. No Task Check, Task completion, or owner Task-check waiver is recorded. Fresh test and browser evidence was recorded on 2026-10-09 (above) and the Task moved to `audit`, which means it is ready for a Check, not that it has passed one.

## Drift Notes

- Owner-requested follow-up on 2026-10-07 sets TrueScale as the initial render policy, superseding the planned deferral of default scale choice. ReadableScale remains a developer option; scale-policy algorithms, scientific State, and core are unchanged. Reconcile the user-facing scale choice in the planner when that planned work starts.
