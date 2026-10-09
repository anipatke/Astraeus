---
id: T-022
title: Show common measurements as compact, reusable visuals
objective: O-005
status: in_progress
stage: audit
depends_on: [{task: T-018, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: owner-metric-visuals-2026-10-09}
check_waiver:
  task: T-022
  reason: Owner waived the optional Task Check after reviewing the visuals in the running app; the Full Objective Check for O-005 remains mandatory.
  actor: {role: owner, session: t018-test-and-metric-visuals-2026-10-09}
  recorded_at: '2026-10-09T07:55:25Z'
---

# Show common measurements as compact, reusable visuals

## Outcome

The reusable shell has a small vocabulary of Metric Visuals: compact readouts where the number and unit come first and a minimal visual adds context. Three or four representative types are built first and replace text-heavy measurements in the current Apollo UI. Each has one configuration contract (type, value, unit, reference body/frame and, where it applies, a meaningful reference or range) and a numeric-only fallback. A second experience configuration with no Apollo naming renders the same components unchanged, which shows they can be reused.

Replaces the earlier T-022 scope (spacecraft range tape, signed range-rate and trend trace, planned 2026-10-07). Owner brief: `docs/ASTRAEUS_SPIKE_03_METRIC_VISUALS_BRIEF.md`.

## User Check

In the Apollo experience, compare the measurements before and after: speed, distances and lunar illumination, plus whichever other types were chosen. Read each value and unit at a glance. Confirm that each visual adds meaning (a real reference, a range or a phase shape) rather than decoration, and that the panel feels less text-heavy. Check at 1280×800 and mobile portrait. Record your verdict on each indicator.

## Done When

1. A short review of the current Spike 03 UI records which text-heavy measurements were chosen as the first 3–4 types and why, and which types were deferred for lack of demonstrated need. Speed, Distance and Phase are the expected first candidates because they already appear as text or ad-hoc cards.
2. Metric Visuals live in `src/shell/` as generic presentation components with one typed configuration contract. They contain no mission, experience or dataset names (ARCH-01) and no Apollo-specific branching. They are not a charting framework.
3. Values come from existing scientific State or experience-provided data. The components never change State and never repeat a scientific calculation (ARCH-02, STYLE-07). A named test shows State is identical at a fixed time with the visuals mounted, updated and removed.
4. A visual that needs a reference or range (a speed arc, a distance bar) draws it only from a configured or State-provided reference. Nothing is invented to fill a dial. When no meaningful reference exists, the component falls back to numeric-only, and named tests cover both paths.
5. Each readout states its units, plus its reference body and frame where that applies. Uncertainty, where configured, shows as a range or ± value without implying false precision (PROV-01). Values and labels are readable without colour or hover and have accessible text alternatives.
6. The same metric type looks the same everywhere it appears: same sizing, type scale and the existing Astraeus palette, with restrained colour and no unnecessary animation. Readouts fit small panels and mobile portrait without covering much of the canvas.
7. A non-Apollo fixture configuration (in tests, not a built experience) renders the chosen types through the same components without modification. This is the reuse evidence.
8. `docs/ASTRAEUS_METRIC_VISUALS.md` documents the component set, the configuration contract, the reference/fallback rule, and the deferred types with the need that would justify each one.
9. Browser validation covers the visuals at 1280×800 and mobile portrait with zero console errors. Configured gates pass fresh. Owner visual validation is recorded after that evidence.

## Context Files

`docs/ASTRAEUS_SPIKE_03_METRIC_VISUALS_BRIEF.md`, `docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-018-let-viewers-pick-objects-and-switch-overview-focus-and-follow.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-019-show-object-information-data-trust-and-the-scale-choice-on-request.md`, `src/shell/experience.ts`, `src/shell/objectModel.ts`, `src/shell/AstraeusShell.tsx`, `src/shell/style.css`, `src/app/App.tsx`, `src/app/MissionPanel.tsx`, `src/app/DebugOverlay.tsx`, `src/app/mission.ts`, `src/app/style.css`, `src/mission/apollo11.ts`, `tests/missionScene.test.ts`, `tools/validate/browser-shell.mjs`.

## Design References

Design: Interfaces and Data Flow (State, scale and presentation). Brief sections 3, 4 and 9; Metric Visuals brief in full.

## Guardrails

ARCH-01, ARCH-02, PROV-01, TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07, STYLE-09.

## Implementation Plan

1. Review the current UI (MissionPanel telemetry and metric cards, DebugOverlay, timeline) and choose the first 3–4 types. Record the choice in the evidence.
2. Confirm that each chosen visual's reference or range exists in State or can honestly be configured. Where it cannot, plan that type as numeric-only. Return `REPLAN REQUIRED` only if no honest reference exists for any visual type.
3. Define the metric configuration contract in `src/shell/` and build the components with a shared visual grammar and numeric-only fallback.
4. Replace the chosen Apollo text readouts through configuration. Keep the existing browser selectors working or update them with named equivalents.
5. Add named tests (State independence, reference/fallback paths, non-Apollo fixture) and browser scenarios at desktop and mobile. Write the contract doc and run the gates.

## Boundaries

Stays within Spike 03. No redesign of the UI shell, no general charting or visualisation framework, no generic direction indicator, no new scientific calculations, and no changes to `src/core/`, `ScalePolicy` or generated data. Remaining metric types (Relative distance, Altitude, Progress, Uncertainty, Coordinates) are built only where this Task demonstrates a need; otherwise they are recorded as deferred. Range-rate and trend instruments from the superseded scope are not required.

## Technical Verification

Focused tests during iteration. At handoff, fresh configured gates plus the scene-affecting browser validation under `tools/validate/` at 1280×800 and mobile portrait with zero console errors. Owner visual validation follows.

## Technical Evidence

Started 2026-10-09T07:14Z by owner instruction ("waive the task check and start T-022"). The dependency gate was Ready: the owner closed T-018 on the board at 2026-10-09T07:13:04Z with a recorded `check_waiver`. The board had advanced the router to T-019, which is blocked on this Task, so the router was set to O-005/T-022 with `release: G-003` unchanged. A duplicate T-018 waiver written by this session two seconds after the board's was removed; the board's waiver stands.

### UI review and choice (criterion 1)

Text-heavy measurements in the current UI: spacecraft range and speed (`MissionPanel` cards), Earth–Moon distance, rendered separation and lunar illumination (`DebugOverlay` cards), and the advanced vector rows. First types chosen: **Speed**, **Distance** and **Phase**, which cover every one of these measurements. Advanced vectors stay as rows: they are coordinates for diagnosis, not a viewer need yet. Progress is already shown by the timeline bar. Relative distance, Altitude, Uncertainty and Coordinates are deferred with their needs in `docs/ASTRAEUS_METRIC_VISUALS.md`.

### Acceptance outcomes

1. **Satisfied.** Choice and deferrals above and in the doc's Deferred types.
2. **Satisfied.** `src/shell/metrics.ts` (typed `Metric` contract and pure shape helpers) and `src/shell/MetricVisual.tsx` (one component), with styles in `src/shell/style.css`. No charting library. `rg -in 'apollo|columbia|eagle' src/shell` has no matches, and the existing glob test `tests/timeline.test.ts` covers the new files.
3. **Satisfied.** Values come from existing State through `trackedReadouts` (now also carrying `frame` and `center`) and `DebugReadout`. The only new arithmetic is a vector magnitude (`Math.hypot`), as already used by `trackedReadouts` and `buildDebugReadout`, plus a maximum over anchor states. Named test: `tests/metricVisuals.test.ts` › `Apollo metric configuration` › `metric visuals mounted, updated and removed leave State identical at a fixed time`. The browser scenario's camera-independence comparison of `.mission` text still passes with the visuals in it.
4. **Satisfied.** References come only from State or data:
   - The speed arc spans 0 to the vehicle's peak speed at NASA source anchors (Columbia 11.032 km/s at A-36, entry interface; Eagle 2.679 km/s at A-21). The sample peak was rejected because it is the accepted I-008 post-TLI join artefact (73.543 km/s at 1969-07-16T16:22:08.200Z), which would have made the arc misleading. At that moment the arc pins and the text says "outside that range".
   - The range bar marks the Moon's current distance, only when it is measured from the same centre and frame.
   - Earth–Moon distance and rendered separation are numeric-only.
   - Named tests: `draws a speed arc only against a stated range`, `draws a distance bar only against reference markers and spans them all`, `renders numeric-only readouts without any visual, and states unavailable values`, `tops each speed gauge at the vehicle's peak speed at NASA source anchors, not at a reconstruction artefact`, `marks the Moon on a range bar only when measured from the same centre and frame`, and `keeps Earth–Moon distance numeric-only and lunar illumination as a band without a lit side`.
5. **Satisfied.** Every readout shows its unit. Range shows "from Earth centre · EQJ"; speed shows "inertial, relative to Earth centre · EQJ", the gauge limits and their basis. Lunar illumination states it is seen from Earth's centre, and no phase glyph is drawn because the core gives no lit side. Each visual is an `svg role="img"` labelled by `describeMetric` (test `carries value, unit, context and references in text, not only in the shape`). No per-value uncertainty exists in State, so none is shown (deferred).
6. **Satisfied, pending owner judgement.** One shared `.metric` grammar uses the existing palette (cream monospace value, orange fill, lavender reference marks) with no animation. Inside a spacecraft card the metrics drop their own border to avoid boxes inside boxes. The browser scenario asserts that no `.metric` overflows at 390×844.
7. **Satisfied.** Test `metric visuals reuse outside Apollo` renders a meteor-shower fixture (entry speed against the 11.2–72.8 km/s bound-meteoroid limits, height against the Kármán line, a Moon glyph with a known lit limb, and a numeric-only comet distance) through the same components.
8. **Satisfied.** `docs/ASTRAEUS_METRIC_VISUALS.md`.
9. **Gates and browser satisfied; owner visual validation pending.** See Verification.

### Verification

- Fresh run at 2026-10-09T07:21:02Z, Node v22.22.2: `npm run typecheck` exit 0; `npm run build` exit 0 (existing large-chunk advisory); `npm test` exit 0, 9 files, 150 tests (11 new in `tests/metricVisuals.test.ts`); `git diff --check` exit 0; shell naming search no matches; `git diff --stat -- src/core data` empty.
- `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_URL=http://127.0.0.1:5199/ ASTRAEUS_METRIC_SCREENSHOTS=docs/evidence/spike03 node tools/validate/browser-shell.mjs` against `npx vite --port 5199`, last run 2026-10-09T07:22:07Z: exit 0, viewports 1280×800 and 390×844, all earlier shell assertions, the new metric assertions, zero page or console errors. Chromium needed an unsandboxed run, as before.
- Screenshots for owner review: `docs/evidence/spike03/metric-visuals-telemetry-1280x800.png`, `metric-visuals-scene-1280x800.png`, `metric-visuals-390x844.png`.

### Limitations

- The State-independence unit test uses server rendering, which mounts nothing and runs no effects. Live mounting and update are covered only by the browser scenario's camera-independence and metric checks.
- In mobile portrait the developer panel sits under the object controls. That is the existing developer-panel layout, not the metrics, and belongs to T-020's responsive work.
- `tools/validate/browser-spike02.mjs` and `browser-anchor-labels.mjs` still target replaced controls (T-020 Done When 4), as recorded in T-018.
- The visuals live in Developer mode for now. T-019's info panel is planned to use them in the default viewer UI.

### Extra reads

- `src/core/illumination.ts`, `src/core/moonTrajectory.ts`, `src/core/sampledTrajectory.ts`, `src/core/state.ts`: confirm what the core already computes (no lit side) and that the Moon and spacecraft states share Earth centre and EQJ.
- `.savepoint/issues/I-008-post-tli-coast-still-produces-impossible-speed.md` and the head of `data/apollo11/generated/columbia.json`: identify the 73.5 km/s sample peak seen in the first screenshot.
- `vite.config.ts`, `tsconfig.json`, `package.json`, `tests/timeline.test.ts`: test environment, server rendering availability and the existing shell naming test.
- Temporary probe tests (deleted after use) listed the top sample and anchor speeds.

### Files changed

- New: `src/shell/metrics.ts`, `src/shell/MetricVisual.tsx`, `src/app/metricReadouts.ts`, `tests/metricVisuals.test.ts`, `docs/ASTRAEUS_METRIC_VISUALS.md`, `docs/evidence/spike03/metric-visuals-*.png`.
- Changed: `src/shell/style.css`, `src/app/style.css`, `src/app/MissionPanel.tsx`, `src/app/DebugOverlay.tsx`, `src/app/App.tsx`, `src/app/mission.ts`, `tools/validate/browser-shell.mjs`, `.savepoint/router.md`, this Task, and T-018 (duplicate waiver removed).

No Task Check, owner visual validation or completion is recorded. `audit` means ready for a Check and owner review, not passed.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
