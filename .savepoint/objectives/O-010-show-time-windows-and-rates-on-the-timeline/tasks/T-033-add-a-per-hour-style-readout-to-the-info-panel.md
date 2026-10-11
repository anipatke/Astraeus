---
id: T-033
title: Add a "per hour" style readout to the info panel
objective: O-010
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o010-plan-2026-10-11}
lane: rate-metric
planned_reads: [src/shell/metrics.ts, src/shell/MetricVisual.tsx, tests/metricVisuals.test.ts, src/app/style.css]
planned_writes: [src/shell/metrics.ts, src/shell/MetricVisual.tsx, tests/metricVisuals.test.ts, src/app/style.css]
---

# Add a "per hour" style readout to the info panel

## Outcome

The shell has a generic `rate` metric kind for "how many per unit time", shown with the same numbers-first readouts as distance, speed and progress. Existing metric kinds look and behave exactly as before.

## Astraeus Hypothesis

- **Capability tested:** that the shell can present a count-per-time value next to the existing physical metrics.
- **Contract reused:** `Metric`, `ScalarMetric` fields (value, unit, digits, context, unavailable), `MetricRange`, `MetricVisual`.
- **Gap or hypothesis:** `Metric` has no rate kind (audit GAP-4); one kind reusing existing fields closes it with no new data path.
- **Generic change:** `RateMetric` (`kind: "rate"`, optional `range` with its basis, optional `peak` as a `MetricReference`) in `src/shell/metrics.ts`, and its case in `MetricVisual.tsx`.
- **Perseids-independent evidence:** made-up rate metrics in component tests (for example "passes per hour", "launches per day"); no shower data.

## User Check

None for the owner directly; the rate readout first appears on screen in the integration Task.

## Done When

1. A `rate` metric renders its value and unit numbers-first; with a `range` it draws a bar against the stated limits and shows the basis; with a `peak` reference it marks it; without either it is numeric-only; a `null` value shows its `unavailable` text. Only real limits are used (no maximum chosen to fill a bar), following the existing `MetricRange` rule.
2. Tests in `tests/metricVisuals.test.ts` cover each branch above with made-up rates, and a named test shows every existing kind renders unchanged (TEST-03: name the existing cases that still pass).
3. The rate readout is legible at the mobile and desktop widths used by `browser-spike03.mjs` (checked in the integration Task's browser run; here, CSS follows existing metric classes).
4. No meteor, shower or Perseids naming in `src/shell/`; the name check still passes.
5. Configured typecheck, build and test gates pass; record counts.

## Context Files

`.savepoint/objectives/O-010-show-time-windows-and-rates-on-the-timeline/Objective.md`, `src/shell/metrics.ts`, `src/shell/MetricVisual.tsx`, `tests/metricVisuals.test.ts`, `src/app/style.css`.

## Design References

Design: Interfaces and Data Flow (Metric values from adapters through `metricsFor`).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, TEST-01, TEST-03, STYLE-02, STYLE-04, STYLE-05, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm the `Metric` union and `MetricVisual` switch shapes; return REPLAN REQUIRED if changed.
2. Add `RateMetric` to the union and a `RateVisual` reusing the existing bar/marker helpers where they fit.
3. Add styles alongside existing metric styles.
4. Write tests; run gates.

## Boundaries

No core, timeline or experience change; no rate calculation in the shell (values arrive from the experience). No new visual library.

## Technical Verification

Focused `tests/metricVisuals.test.ts` during iteration; handoff runs the configured build and test gates per AGENTS.md's Verification Policy. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here for reconciliation in the integration Task.
