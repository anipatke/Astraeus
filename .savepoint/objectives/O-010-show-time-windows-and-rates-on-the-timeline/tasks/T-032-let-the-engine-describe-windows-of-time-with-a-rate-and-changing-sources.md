---
id: T-032
title: Let the engine describe windows of time with a rate and changing sources
objective: O-010
status: done
depends_on: []
owner_validation:
    required: false
    accepted_check: ""
planned_by: {role: planner, session: o010-plan-2026-10-11}
lane: core-windows
planned_reads: [src/core/events.ts, src/core/provenance.ts, src/core/state.ts, src/core/trajectory.ts, tests/core.test.ts, tests/experienceDefinition.test.ts]
planned_writes: [src/core/timeWindow.ts, tests/timeWindow.test.ts, tests/experienceDefinition.test.ts]
check_waiver:
    task: T-032
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-11T04:54:43Z"
---

# Let the engine describe windows of time with a rate and changing sources

## Outcome

`src/core/` has a generic time-window contract: something that lasts from a start to an end, with an optional peak, optional rate samples and optional provenance spans, plus pure helpers that give the rate and the applicable provenance at any time. Nothing existing changes.

## Astraeus Hypothesis

- **Capability tested:** that the story layer can describe a period that lasts and changes, independent of any experience.
- **Contract reused:** `assertUtcUnixMs`, `TimeBounds`, `Provenance`/`createProvenance`, the frozen-copy validation style of `createEvents`.
- **Gap or hypothesis:** `TimelineEvent` is an instant and provenance is one record per source (audit GAP-3, GAP-3b); an additive window type closes both without touching `TimelineEvent`.
- **Generic change:** a new `src/core/timeWindow.ts`: `TimelineWindow` (id, label, optional type, `startUtcMs`, `endUtcMs`, optional `peakUtcMs`, optional `rate: { unit, samples: { timeUtcMs, value }[] }`, optional `provenance: { startUtcMs, endUtcMs, provenance }[]`), `createWindows`, `rateAt(window, t)` and `provenanceAt(window, t)`.
- **Perseids-independent evidence:** made-up windows in contract tests (an eclipse-like window with no rate, a pass window with a rate, a window whose first span is `observed` and second `illustrative`); no shower data.

## User Check

None for the owner directly; this Task has no visible change. Its evidence is the named contract tests.

## Done When

1. `createWindows` returns frozen copies and rejects, with named errors: non-UTC times, end not after start, empty or duplicate ids (also unique against nothing else; event ids are a separate list), a peak outside the window, rate samples outside the window, unsorted or duplicate-time samples, negative or non-finite values, an empty unit, provenance spans outside the window, unsorted or overlapping spans. Windows are sorted by start (ties allowed). Gaps between spans are allowed.
2. `rateAt` returns the linear value between samples, the exact sample value at a sample time, and `null` outside the window, before the first sample or after the last, and for a window without a rate. `provenanceAt` returns the span covering the time (a shared boundary belongs to the later span), and `null` when no span covers it or the window has none; callers fall back to their existing provenance.
3. Contract tests in `tests/timeWindow.test.ts` cover each rule above with made-up windows, including one with differing source types along the window. `TimelineEvent`, `createEvents`, `State`, `Trajectory`, `Provenance` and `ScalePolicy` are unchanged (git diff shows no change to their files).
4. The name check covers `src/core/timeWindow.ts` (it already scans `src/core/`; confirm and name the test case). No meteor, shower or Perseids naming.
5. Configured typecheck, build and test gates pass; record counts.

## Context Files

`.savepoint/objectives/O-010-show-time-windows-and-rates-on-the-timeline/Objective.md`, `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`, `src/core/events.ts`, `src/core/provenance.ts`, `src/core/state.ts`, `src/core/trajectory.ts`, `tests/core.test.ts`, `tests/experienceDefinition.test.ts`.

## Design References

Design: Interfaces and Data Flow; Experience plug-in boundary.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-01, STYLE-04, STYLE-05, STYLE-06, STYLE-07.

## Implementation Plan

1. Confirm `TimelineEvent`, `createEvents` and `createProvenance` still have the shapes above; return REPLAN REQUIRED if not.
2. Write the types and `createWindows`, reusing `assertUtcUnixMs` and `createProvenance`.
3. Write `rateAt` (binary search, linear blend) and `provenanceAt`.
4. Write contract tests for every rule and helper branch.
5. Confirm the name check covers the new file; run gates.

## Boundaries

No shell, app or experience change. No change to existing core types. No rate smoothing beyond linear, no curve fitting, no time-ranged provenance on trajectories or groups.

## Technical Verification

Focused `tests/timeWindow.test.ts` during iteration; handoff runs the configured build and test gates per AGENTS.md's Verification Policy. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor evidence (2026-10-11), claims for a fresh Check to verify.

Per criterion:
1. `createWindows` returns frozen copies (nested rate and spans too), sorts by start with ties allowed, allows gaps, and rejects every listed case with a named error; each has a test in `tests/timeWindow.test.ts` ("createWindows" block).
2. `rateAt`: exact at sample times, linear between, `null` outside the window, before the first or after the last sample, and with no rate or no samples. `provenanceAt`: span covering the time, shared boundary goes to the later span, `null` for gaps or no spans; the end of the last span counts as covered (my reading, tested).
3. Contract tests use made-up windows (no-rate eclipse-like, a pass with a rate, observed-then-illustrative spans). `git status` shows no change to the files of `TimelineEvent`, `createEvents`, `State`, `Trajectory`, `Provenance` or `ScalePolicy`.
4. The existing "generic code boundary" case ("contains no experience-specific names in core, shell or generic app code", `tests/experiencePlugIn.test.ts`) scans `src/core/` and passes with the new file; the file has no meteor/shower/Perseids naming.
5. Gates pass.

Commands run: `npx vitest run tests/timeWindow.test.ts tests/experiencePlugIn.test.ts` (30 passed); `npm run typecheck` (clean); `npm run build` (succeeds, existing chunk-size warning only); `npm test` (17 files, 274 tests passed).

Files read: Objective.md, GAP audit doc, `src/core/events.ts`, `provenance.ts`, `state.ts` (only `assertUtcUnixMs`), `tests/experiencePlugIn.test.ts` (name check). Not read: `trajectory.ts`, `core.test.ts`, `experienceDefinition.test.ts` (nothing needed from them). Extra read beyond Context Files: `tests/experiencePlugIn.test.ts`, to confirm the name check covers `src/core/`.
Files changed: `src/core/timeWindow.ts` (new), `tests/timeWindow.test.ts` (new); Task and Objective status.

Limitations: no scene validation scripts run (no rendering change). Whether the end of the last span is covered is not stated in the Task; I chose inclusive.

## Drift Notes

Record architecture deltas here for reconciliation in the integration Task that adds the made-up window (last in this Objective).
