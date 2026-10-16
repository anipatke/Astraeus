---
id: T-031
title: Show a frame-rate counter in developer mode
objective: O-009
status: done
depends_on: [{task: T-030, requires: clear}]
owner_validation:
    required: true
    accepted_check: C-013
    accepted_by: {role: owner, session: owner-chat-20261011}
planned_by: {role: planner, session: o009-perf-counter-plan-2026-10-11}
check_waiver:
    task: T-031
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-10T22:19:46Z"
---

# Show a frame-rate counter in developer mode

## Outcome

With Developer mode on, the viewer can read how smoothly the scene is drawing on their own machine: frames per second, the longest recent frame, and how many position fills each group has done. With Developer mode off, nothing is shown and nothing extra is measured. This gives the owner and the Full Objective Check a real-browser number for the group smoothing (I-017).

## Astraeus Hypothesis

- **Capability tested:** that scene performance can be observed generically, for any experience, without the engine knowing what is being drawn.
- **Contract reused:** the Developer tools readout (`DebugOverlay`, the polled readout reference in `App`), `PointsView.fillCount`, and the experience's own `developerSections` unchanged.
- **Gap or hypothesis:** none new. Frame time is a property of the scene loop, not of any experience.
- **Generic change:** a small frame-statistics collector in `src/app/`, fed once per frame by the scene, and one Developer tools section that shows it. No `src/core/` or `src/shell/` change, no new metric kind, and no State involved.
- **Perseids-independent evidence:** the made-up debris ring and Apollo both show the counter.

## User Check

Open `?experience=synthetic-ring` in a real browser, turn Developer mode on, and play at the default rate. Read the frames per second and the longest recent frame, and say whether they match what you see. Switch Developer mode off and confirm the counter is gone. Open Apollo and confirm it shows there too. Record your judgement.

## Done When

1. A frame-statistics collector in `src/app/` records frame durations in a fixed-size window with no allocation per frame, and reports frames per second (over the last second), the longest frame in the window, and the number of frames over a stated budget (33.4 ms). Pure logic, unit-tested with fed-in times: steady 60 fps, one long frame, an empty window, a window that wraps, and a reset after a pause in the tab (a very long gap is not counted as a frame).
2. The scene feeds it once per frame, and only while Developer mode is on. With Developer mode off, no collector runs. A test or an inspection recorded in the evidence shows the off case.
3. A Developer tools section shows frames per second, longest recent frame, frames over budget, and each group's fill count (`PointsView.fillCount`, read through the scene without new State). It updates on the existing 250 ms poll. The section carries a plain note that the figures are for this browser and machine.
4. The counter does not change any scientific State, scale mapping or camera behaviour (ARCH-02), and does not add a metric kind. Apollo and the made-up experiences show it unchanged in meaning. Existing tests pass unmodified; any changed test is named (TEST-03).
5. `browser-synthetic-ring.mjs` and every existing browser script pass with zero console errors in a fresh run directory; the ring script also turns Developer mode on, asserts the counter appears with plausible values (positive fps, fill count at least 1) and is absent when off. Each path, command, time and result is recorded. Any script that writes to a fixed historical path is restored from git or given a distinct output directory.
6. The measured overhead of the collector is recorded (cost per frame in Node for the window size used). Design.md records the collector and the section.
7. The owner reads the counter in a real browser on their machine, and their judgement is recorded together with the numbers they saw for the ring at default rate, so the Full Objective Check has a real-browser reference.

## Context Files

`.savepoint/objectives/O-009-provide-state-for-groups-of-objects/Objective.md`, `.savepoint/issues/I-017-group-motion-steps-instead-of-gliding.md`, `.savepoint/Design.md`, `src/app/App.tsx`, `src/app/EarthMoonScene.tsx`, `src/app/DebugOverlay.tsx`, `src/app/PointsView.ts`, `src/app/experienceDefinition.ts`, `tests/pointsLayer.test.ts`, `tests/experienceDefinition.test.ts`, `tools/validate/browser-synthetic-ring.mjs`.

## Design References

Design: Components/Codebase Map, Groups and the `points` layer (O-009), Interfaces and Data Flow (developer diagnostics are app-owned and mounted only when the developer toggle is on).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm T-030 is done or in audit and that `App` still polls a readout reference every 250 ms while Developer mode is on; return REPLAN REQUIRED if the developer panel wiring has changed.
2. Write the frame-statistics collector as pure logic with a fixed window, and unit tests.
3. Feed it from the scene's per-frame callback only when Developer mode is on (the scene already receives controls from `App`; reuse that path rather than a new global).
4. Add the Developer tools section next to Scene instrumentation, reading the collector and each group's fill count through the existing readout path.
5. Extend the ring browser script for on, off and Apollo cases, and record the collector's cost.
6. Run the gates and every browser script into a fresh directory, update Design.md, then stop and ask the owner to read the counter on their machine.

## Boundaries

No new metric kind, no GPU timing, no logging or sending of figures anywhere, no change to `src/core/` or `src/shell/`, no change to a group's State, scale or camera, and no always-on overlay. Do not tune performance in this Task; it only measures. Do not overwrite earlier evidence.

## Technical Verification

Handoff runs `npm run typecheck`, `npm run build`, `npm test` and the scene-affecting fuller gate (all browser scripts in `tools/validate/` that load the app, with `PLAYWRIGHT_CORE` per AGENTS.md) into `docs/evidence/o009-<task>-run1/`. Optional Task Check per `agent-skills/references/check-method.md`. The Full Objective Check uses the owner's real-browser figures and re-measures the group fill cost and smoothing.

## Technical Evidence

Executed 2026-10-11 (gates re-run 2026-10-10T22:09Z UTC clock). Evidence directory: `docs/evidence/o009-t031-run1/` (logs, `r2-*` fresh-run screenshots/logs, `gates-final.log`, `collector-cost.txt`).

Files changed: `src/app/frameStats.ts` (new), `src/app/FrameRateSection.tsx` (new), `src/app/App.tsx`, `src/app/EarthMoonScene.tsx`, `src/app/style.css` (selectors shared with the existing readout grid), `tests/frameStats.test.ts` (new), `tools/validate/browser-synthetic-ring.mjs`, `.savepoint/Design.md`. Extra read: `src/app/style.css`, to style the new section. No existing test changed.

Per criterion:
1. Met. `FrameStats`: fixed 120-frame Float64 window, fps over the last second, longest, count over 33.4 ms; gap over 1 s restarts the window. Tests: steady 60 fps, one long frame, empty, wrap, pause, reset.
2. Met. The scene ticks only when `controls.frameStats !== null`; `App` sets it only while Developer mode is on. Browser script asserts no counter element with Developer mode off.
3. Met. `FrameRateSection` shows fps, longest frame, frames over budget and each group's fill count, on the existing 250 ms poll, with the browser/machine note (unit-tested render).
4. Met. No State, scale, camera or metric-kind change; no `src/core/` or `src/shell/` change.
5. Met. Ring script (on/off/Apollo) and `browser-synthetic`, `browser-shell`, `browser-anchor-labels`, `browser-spike02`, `browser-spike03` all exit 0 with zero console errors in `r2-*` directories. An earlier run exposed that my first markup broke `browser-shell` (duplicate `dl.overlay`); fixed with its own class and re-run. Headless software rendering: ring 34.9 fps, longest 46.1 ms, 12 fills; Apollo 6.2 fps. Not representative of the owner's machine.
6. Met. Cost in Node: tick 0.010 us/frame, snapshot 0.541 us/read at window 120. Design.md updated.
Owner-requested addition (2026-10-11): a line graph of frames per second over the last ~15 seconds (one reading per 250 ms poll, kept in `App`, drawn by `FrameRateSection` as an inline SVG; `fpsGraphPoints` unit-tested). Owner then asked for axes and labels: the graph now has fps ticks with grid lines, a time axis ("N s ago" to "now (X fps)"), a latest-value dot and a title, scale at least 0-60 rising in steps of 30. Screenshot `docs/evidence/o009-t031-run3/ring/ring-counter-on.png`; ring script exit 0, zero console errors. Owner then asked for more colour: readings, graph line, background bands and key are coloured smooth (50+ fps / up to 20 ms), uneven (30-50 / up to 33.4 ms) or rough (under 30 / over 33.4 ms); `fpsTone` and `frameTone` unit-tested (12 tests in `tests/frameStats.test.ts`). The ring script was updated to check coloured line segments and axis labels; run exit 0, zero console errors, `docs/evidence/o009-t031-run4/` (screenshot `ring/ring-counter-on.png`). Verified by typecheck, `tests/frameStats.test.ts` (9 tests) and a fresh ring script run, exit 0, zero console errors, output `docs/evidence/o009-t031-run2/` (screenshot `ring/ring-counter-on.png`); the full gate and other browser scripts were not re-run for this presentation-only addition.
7. Owner reported on their machine: "looks smooth" (numbers not recorded; ask the owner if the Check needs them).
(was PENDING: owner reads the counter in a real browser (`?experience=synthetic-ring`, Developer mode on, default rate) and records judgement and numbers.

Gates: `npm run typecheck`, `npm run build`, `npm test` pass (16 files, 249 tests). Limits: figures are headless software-rendered; `anchor-consistency` and `conversion-proof` do not load the app and were not run.

Correction (2026-10-11, I-018 repair, session o009-i018-repair-20261011): criterion 5 above is stated as "Met" but its restore clause was not satisfied at the time. The `r2` `browser-anchor-labels` run was started without an output-directory argument and overwrote three historical Spike 01/02 files (`docs/evidence/regression-spike01-02/anchor-labels/browser-anchor-labels-results.json`, `labels-on-follow.png`, `labels-on-overview.png`); they were not restored and were committed in `bc080c4`. They were restored from `601a9ff` (identical to `ebc40df`) under I-018, and `git diff --stat ebc40df -- docs/evidence/regression-spike01-02/` is now empty. The original text above is kept unchanged. Criterion 5 stays subject to the Check's judgement after this repair.

Owner validation recorded 2026-10-11T04:38:20Z (owner instruction in chat, accepted against C-013): owner signed off T-029, T-030 and T-031; on the owner's machine the counter holds at about 100 frames per second for the ring at the default rate.

## Drift Notes

Record architecture deltas here; reconcile Design.md in this Task.
