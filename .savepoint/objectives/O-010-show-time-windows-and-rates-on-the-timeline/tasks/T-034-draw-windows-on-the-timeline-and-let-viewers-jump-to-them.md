---
id: T-034
title: Draw windows on the timeline and let viewers jump to them
objective: O-010
status: done
depends_on: [{task: T-032, requires: clear}]
owner_validation:
    required: false
    accepted_check: ""
planned_by: {role: planner, session: o010-plan-2026-10-11}
lane: core-windows
planned_reads: [src/core/timeWindow.ts, src/core/events.ts, src/shell/experience.ts, src/shell/timelineModel.ts, src/shell/TimelineBar.tsx, src/shell/AstraeusShell.tsx, src/shell/infoModel.ts, src/shell/InfoPanel.tsx, src/shell/ProvenanceBadge.tsx, src/app/style.css, tests/timeline.test.ts, tests/infoProvenance.test.ts, tools/validate/browser-shell.mjs, tools/validate/browser-spike03.mjs]
planned_writes: [src/shell/experience.ts, src/shell/timelineModel.ts, src/shell/TimelineBar.tsx, src/shell/AstraeusShell.tsx, src/shell/infoModel.ts, src/shell/InfoPanel.tsx, src/app/style.css, tests/timeline.test.ts, tests/infoProvenance.test.ts]
check_waiver:
    task: T-034
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-11T05:01:09Z"
---

# Draw windows on the timeline and let viewers jump to them

## Outcome

When an experience supplies time windows, the timeline shows each as a shaded band with a faint rate curve and a peak marker, says when the clock is inside one and at what rate, stops Previous/Next at its start, peak and end, and opens its details with the provenance that applies at the current time. An experience without windows looks and behaves exactly as before.

## Astraeus Hypothesis

- **Capability tested:** that the generic shell can present and navigate periods, not only instants, from configuration alone.
- **Contract reused:** `ExperienceConfig`, `TimelineBar`, `timelineModel` (`eventContextAt`, `eventNavigationTargets`, `eventPositionPercent`), `InfoPanel`/`infoModel`, `ProvenanceBadge`, and T-032's `TimelineWindow`, `rateAt`, `provenanceAt`.
- **Gap or hypothesis:** the shell only knows instants (audit GAP-3) and one provenance per event list (GAP-3b); optional `windows` on `ExperienceConfig` plus model functions close both without changing event behaviour.
- **Generic change:** optional `ExperienceConfig.windows`; window band, curve and peak marker on the scrubber; window context in the context row; merged navigation stops; a window target in the information panel.
- **Perseids-independent evidence:** made-up windows in shell model and component tests; no shower data. The mounted made-up experience follows in the integration Task.

## User Check

None for the owner here; the owner looks at the result in the integration Task, where a made-up window is mounted.

## Done When

1. Model: `windowPositionPercent` (start and end, clamped to the timeline window); a pure curve path for a window's rate samples, normalised to the window's own maximum and drawn without inventing values outside samples; window context at a time (windows containing the clock and their current rate via `rateAt`); navigation stops that merge event times with each window's start, peak and end, de-duplicated, strictly before/after the clock as today. Unit tests in `tests/timeline.test.ts` cover inside/outside, boundaries, overlapping windows, a window without rate or peak, and coincident event and window times.
2. Presentation: each window is a band on the scrubber with an accessible name, a faint curve when it has rate samples, and a peak marker that seeks to the peak and opens the window's details. The context row adds "Inside: <label> — <rate> <unit>" only while inside a window (rate omitted when there is none). Previous/Next use the merged stops; their labels say which stop (for example "<label> opens"). Bands and markers stay legible and do not overlap controls at the mobile and desktop widths used by `browser-spike03.mjs`.
3. Details: the information panel has a window target showing label, start, end, peak and current rate, and the provenance from `provenanceAt` at the current clock time, falling back to `eventProvenance` when no span applies. It updates when the clock crosses a span boundary. Tests in `tests/infoProvenance.test.ts` show the provenance changing across a boundary and the fallback.
4. Unchanged without windows: named tests show an experience with no `windows` produces the same event context, navigation and markers as before (TEST-03: name the existing cases that still pass unmodified). `browser-shell.mjs` and `browser-spike03.mjs` pass on Apollo with zero console errors in a fresh run directory (scene-affecting fuller gate); record paths, command, time and result.
5. No meteor, shower or Perseids naming in `src/shell/`; the name check still passes. Configured typecheck, build and test gates pass; record counts.

## Context Files

`.savepoint/objectives/O-010-show-time-windows-and-rates-on-the-timeline/Objective.md`, `src/core/timeWindow.ts`, `src/core/events.ts`, `src/shell/experience.ts`, `src/shell/timelineModel.ts`, `src/shell/TimelineBar.tsx`, `src/shell/AstraeusShell.tsx`, `src/shell/infoModel.ts`, `src/shell/InfoPanel.tsx`, `src/shell/ProvenanceBadge.tsx`, `src/app/style.css`, `tests/timeline.test.ts`, `tests/infoProvenance.test.ts`, `tools/validate/browser-shell.mjs`, `tools/validate/browser-spike03.mjs`.

## Design References

Design: Interfaces and Data Flow (shell owns selection and information-panel state); Experience plug-in boundary.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-01, STYLE-02, STYLE-07, STYLE-09, STYLE-10.

## Implementation Plan

1. Confirm T-032's exports and the current `TimelineBar`/`infoModel` shapes; return REPLAN REQUIRED if they differ materially.
2. Add `windows?` to `ExperienceConfig`.
3. Add model functions (position, curve path, window context, merged stops) in `timelineModel.ts`, keeping existing event functions unchanged.
4. Render bands, curves and peak markers on the scrubber; extend the context row; switch Previous/Next to merged stops.
5. Add the window target to `infoModel`/`InfoPanel` with time-ranged provenance and fallback.
6. Style for mobile and desktop.
7. Tests; gates; fresh browser run of `browser-shell.mjs` and `browser-spike03.mjs`.

## Boundaries

No core change beyond reading T-032's exports, no experience data, no rate metric (T-033), no scene effects, no narration or chapters. Event behaviour without windows is unchanged.

## Technical Verification

Focused `tests/timeline.test.ts` and `tests/infoProvenance.test.ts` during iteration; handoff runs the configured build and test gates and the scene-affecting browser scripts named above, per AGENTS.md's Verification Policy and project rules. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

### Executor evidence (2026-10-11)

**Files read:** the Context Files only (Objective, `timeWindow.ts`, `experience.ts`, `timelineModel.ts`, `TimelineBar.tsx`, `AstraeusShell.tsx`, `infoModel.ts`, `InfoPanel.tsx`, `ProvenanceBadge.tsx`, tests, both browser scripts). Extra reads: `src/shell/style.css` (the plan names `src/app/style.css`, which does not exist; the shell styles live in `src/shell/style.css`, so that file was read and changed instead); `src/core/provenance.ts` (provenance shape for tests).

**Files changed:** `src/shell/experience.ts`, `timelineModel.ts`, `TimelineBar.tsx`, `AstraeusShell.tsx`, `infoModel.ts`, `InfoPanel.tsx`, `style.css`; `tests/timeline.test.ts`, `tests/infoProvenance.test.ts`.

**Per criterion:**
1. Model: met. `windowPositionPercent`, `windowCurvePath` (normalised to the window's own max, drawn from samples only), `windowContextAt` (uses `rateAt`), `navigationStops` merging events with window start/peak/end. Tests in `tests/timeline.test.ts` ("timeline windows") cover inside/outside, boundaries, overlap, no rate/peak, coincident event and window times.
2. Presentation: met in code only. Band (button with accessible name), faint curve, peak marker (seeks and opens details), "Inside: label — rate" context button (rate omitted when none), Previous/Next labelled "Previous/Next: <label> opens|peaks|closes". Apollo has no windows, so bands/curve/peak were never rendered in a browser; legibility and overlap at mobile/desktop widths is unverified until the integration Task (T-035) mounts a made-up window.
3. Details: met. `infoView(experience, {kind:"window"}, timeUtcMs)` shows label, start, end, peak, rate now; provenance from `provenanceAt`, falling back to `eventProvenance`. Shell passes the clock time, so it updates as the clock crosses a boundary. Tests in `tests/infoProvenance.test.ts` ("window information") show the change at the 40 boundary and the fallback.
4. Unchanged without windows: met. All existing timeline and Apollo info cases pass unmodified (e.g. `timeline event context`, `experience timeline data`); new test "behaves exactly as before without windows" compares `navigationStops` with `eventNavigationTargets` including tied times; button names stay "Previous event"/"Next event" without windows. Browser: `browser-shell.mjs` and `browser-spike03.mjs` run 2026-10-11T04:59Z against `npx vite --port 5199` with `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`; spike03 wrote to `docs/evidence/o010-t034-2026-10-11/browser-spike03/` (`ASTRAEUS_EVIDENCE_DIR`); both printed `"errors": []`. browser-shell wrote nothing to the run directory (stdout only).
5. Name check: met (`generic shell boundary` test now also forbids meteor/shower/perseid in `src/shell/`). Gates: `npm run typecheck` pass; `npm run build` pass (existing chunk-size warning only); `npm test` 17 files, 289 tests pass.

**Limitations:** no browser render of a window (see 2). Previous/Next to a window stop follows an open window panel but does not open one, matching events. Planned path `src/app/style.css` was wrong (see extra reads).


## Drift Notes

Record architecture deltas here for reconciliation in the integration Task.

- (Deferred to T-035) Shell gains optional `ExperienceConfig.windows`, a `window` info target that takes the clock time (`infoView(..., timeUtcMs)`), and merged navigation stops in `timelineModel`. Design.md shell/interface sections need these reflected or marked non-architectural.
