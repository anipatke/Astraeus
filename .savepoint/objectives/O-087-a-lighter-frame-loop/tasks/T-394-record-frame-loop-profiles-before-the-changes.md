---
id: T-394
title: Record frame-loop profiles before the changes
objective: O-087
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-394, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:11:52Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: profile
planned_reads: [packages/astraeus-site/tools/validate/harness.mjs, packages/astraeus-site/tools/validate/runner.mjs, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tools/validate/driver-guard.mjs, docs/agents/browser-policy.md, packages/astraeus/src/app/LayeredRender.tsx]
planned_writes: [packages/astraeus-site/tools/validate/profile-frame-loop.mjs, packages/astraeus-site/tools/validate/run-profile.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/driver.d.mts, docs/evidence/o087-frame-profile/before.json]
---

# Record frame-loop profiles before the changes

## Outcome

One headless command records a repeatable CPU profile of the frame loop, paused and playing, with the diagnostics flag on and off, as numbers (no screenshots), and the "before" numbers are saved from the branch head before any O-087 code change lands. The same command is rerun by draft 07 for "after" (Objective success condition 1; AH-09 "Nobody profiled; measure first").

## User Check

None visual. `docs/evidence/o087-frame-profile/before.json` exists and lists, per case, script time, layout count, style-recalc count and frames drawn per second.

## Done When

- `node packages/astraeus-site/tools/validate/run-profile.mjs` builds the public site once (production React, the same scratch public build and preview `runner.mjs` uses for `public: true` steps), opens ONE Chromium through `harness.mjs`, and runs the cases one after another (one browser job at a time; nothing else may run a browser meanwhile).
- Cases: 2 scenes x {paused, playing} x {diagnostics on, off} = 8. Scenes: the default app page (`app.html`, Apollo 11: labels, a path, the Moon's orbit look) and the planets page for Saturn (`app.html?experience=planets&planet=saturn`: many labels and a small-moons orbit set). Each opens at a fixed address that pins the time (the share-link form), viewport 1280x800, waits for the first draw, then settles 2 s.
- Per case the script reads Chrome DevTools Protocol `Performance.getMetrics` (through a CDP session on the page, no selectors) at the start and end of a fixed 10 s window and records the deltas per second of `ScriptDuration`, `TaskDuration`, `LayoutCount`, `LayoutDuration`, `RecalcStyleCount`, `RecalcStyleDuration`, the `JSHeapUsedSize` change, and the `data-frames-drawn` delta per second. Each case runs 3 times; the median is recorded with the min and max.
- Diagnostics on/off is set by a driver helper, `requestDiagnostics(page, on)`, that adds an init script setting `globalThis.__ASTRAEUS_DIAGNOSTICS__ = on` before the page loads (the flag name is PLAN.md decision 2; draft 02 makes the engine read it). Before draft 02 the flag does nothing, so the "off" rows equal the "on" rows: that is the expected baseline and is said in the file.
- Paused/playing use the existing driver helpers (`ensurePaused`, `ensurePlaying`); metrics reading is a driver helper (`frameMetrics(page, windowMs)`), so the script holds no selector and `tests/browserDriverGuard.test.ts` passes.
- `profile-frame-loop.mjs` is NOT a step in `browser-steps.mjs` `STEPS` (O-086 moved the step list there; it never runs in `check:browser`); `run-profile.mjs` runs it through `runSet(name, steps, limits, "steps")` (O-086 tier argument: `"steps"` means no total-time limit) with its own one-step set.
- Output: JSON written to the path in `ASTRAEUS_PROFILE_OUT` (default under the run's evidence folder); this Task copies its run to `docs/evidence/o087-frame-profile/before.json` with the commit hash, machine core count, Chromium version and the command.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tools/validate/harness.mjs` (whole; small)
- `packages/astraeus-site/tools/validate/runner.mjs` (`buildPublicSite`, `startServers`, `runSet`; lines ~83-215 on main after O-086)
- `packages/astraeus-site/tools/validate/driver.mjs` (`loadAddress` ~999, `ensurePaused`/`ensurePlaying` ~215-230, the `addInitScript` loader watcher as the init-script pattern; line numbers moved in O-086, find by name)
- `packages/astraeus-site/tools/validate/driver-guard.mjs` (header rules)
- `docs/agents/browser-policy.md` (whole)

## Design References

`.savepoint/Design.md` under `Current Technical State` (gate times and limits).

## Guardrails

TEST-01, TEST-03, STYLE-05, STYLE-10.

## Implementation Plan

1. Add `requestDiagnostics(page, on)` and `frameMetrics(page, windowMs)` to `driver.mjs` (+ types in `driver.d.mts`); `frameMetrics` opens a CDP session with `page.context().newCDPSession(page)`, enables `Performance`, reads metrics before and after the window and returns deltas plus the frames-drawn delta.
2. Write `profile-frame-loop.mjs` with `checkScript` (one viewport) looping the 8 cases x 3 runs; median per case.
3. Write `run-profile.mjs` calling `runSet` with one `public: true` step so the profile reads a production build.
4. Run it once on the branch head before any 02-06 merge; save `before.json`.

## Boundaries

No engine change; no change to `run-browser.mjs`, its steps, the browser tiers (O-086) or `harness.mjs` (draft 02 owns it). No screenshots, traces or video. No timing assertion (the numbers are recorded, never asserted).

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/browserDriverGuard.test.ts packages/astraeus-site/tests/browserAssertions.test.ts`; then the one profile run (the only browser job for this Task). Handoff: `quality_gates`.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
