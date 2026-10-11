---
id: T-035
title: Show a made-up window in the test experience and check nothing else broke
objective: O-010
status: planned
depends_on: [{task: T-032, requires: clear}, {task: T-033, requires: clear}, {task: T-034, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o010-plan-2026-10-11}
planned_reads: [src/synthetic/syntheticDefinition.ts, src/app/metricReadouts.ts, src/core/timeWindow.ts, src/shell/metrics.ts, src/shell/experience.ts, tests/experiencePlugIn.test.ts, tests/experienceDefinition.test.ts, tools/validate/browser-synthetic.mjs, tools/validate/browser-shell.mjs, tools/validate/browser-spike03.mjs, tools/validate/browser-spike02.mjs, tools/validate/browser-anchor-labels.mjs, tools/validate/browser-synthetic-ring.mjs, .savepoint/Design.md]
planned_writes: [src/synthetic/syntheticDefinition.ts, tests/experiencePlugIn.test.ts, tests/experienceDefinition.test.ts, tools/validate/browser-synthetic.mjs, .savepoint/Design.md]
---

# Show a made-up window in the test experience and check nothing else broke

## Outcome

The made-up experience (`?experience=synthetic`) shows a made-up window with a rising and falling rate, a peak, a rate readout and a visible change of provenance partway through, all through the generic contracts. Every existing experience and browser check still passes, Design is reconciled, and the owner has looked at it on phone and desktop sizes.

## Astraeus Hypothesis

- **Capability tested:** that windows, rates and time-ranged provenance reach the screen from configuration alone, for an experience with no meteor concept.
- **Contract reused:** `ExperienceDefinition`, `ExperienceConfig.windows`, `createMetrics`, T-032's `createWindows`/`rateAt`, T-033's `rate` metric, T-034's timeline and information panel.
- **Gap or hypothesis:** no generic code change is needed to mount a window experience; if one is, it is recorded as a finding (REPLAN REQUIRED if it breaks the brief's stop condition).
- **Generic change:** none expected. Only `src/synthetic/` configuration, tests, the browser script and Design.
- **Perseids-independent evidence:** this Task is the ARCH-03 evidence for O-010; no shower data.

## User Check

Open the made-up experience (`?experience=synthetic`) on a desktop-size window and a phone-size window. Find the shaded window on the timeline, its rate curve and peak marker. Use Previous/Next to step to where it opens, its peak and where it closes. Open its details either side of the midpoint and confirm the source wording changes. Select the made-up object and read its rate. Say whether it is clear and nothing looks broken; then open Apollo and confirm its timeline looks as before. Record your judgement.

## Done When

1. Made-up window: `syntheticDefinition.ts` declares one made-up window (for example a "contact window" with "passes per hour") inside the experience's timeline, with rate samples, a peak, and two provenance spans, both `illustrative`, whose accuracy and notes differ so the change is visible (PROV-01: nothing made-up is labelled measured). Its object's metrics include a `rate` metric computed with `rateAt` from the same window (STYLE-07), outside the window shown as unavailable. `synthetic-bare` keeps working.
2. Contract tests in `tests/experiencePlugIn.test.ts` show the made-up experience mounts its window through `ExperienceConfig.windows`, its rate metric equals `rateAt` at sampled times, and Apollo's config has no windows and unchanged events. The name check in `tests/experienceDefinition.test.ts` covers every new generic file from T-032 to T-034 (name each) and finds no meteor, shower or Perseids naming.
3. Browser: `browser-synthetic.mjs` gains assertions for the band, curve, peak marker, Previous/Next stops at open/peak/close, the "Inside" context line, the provenance change across the span boundary and the rate readout, at mobile and desktop widths. Every browser script (`browser-shell.mjs`, `browser-spike03.mjs`, `browser-spike02.mjs`, `browser-anchor-labels.mjs`, `browser-synthetic.mjs`, `browser-synthetic-ring.mjs`) passes with zero console errors in a fresh run directory; record each path, command, time and result. If the timeline change invalidated an older script, record the update and map each prior scenario to its new assertion. No historical evidence is overwritten.
4. Configured typecheck, build and test gates pass; record counts.
5. Design.md: the window contract, `ExperienceConfig.windows`, timeline presentation, merged navigation, time-ranged provenance in the information panel and the `rate` kind are described as implemented; each Drift Note from T-032, T-033 and T-034 is accounted for as reflected or explicitly non-architectural with a reason.
6. Owner visual judgement (User Check) is recorded after the evidence above exists.

## Context Files

`.savepoint/objectives/O-010-show-time-windows-and-rates-on-the-timeline/Objective.md`, `.savepoint/Design.md`, `src/synthetic/syntheticDefinition.ts`, `src/app/metricReadouts.ts`, `src/core/timeWindow.ts`, `src/shell/metrics.ts`, `src/shell/experience.ts`, `tests/experiencePlugIn.test.ts`, `tests/experienceDefinition.test.ts`, `tools/validate/browser-synthetic.mjs`, `tools/validate/browser-shell.mjs`, `tools/validate/browser-spike03.mjs`, `tools/validate/browser-spike02.mjs`, `tools/validate/browser-anchor-labels.mjs`, `tools/validate/browser-synthetic-ring.mjs`, and the T-032, T-033 and T-034 Task files for their Drift Notes.

## Design References

Design: Experience plug-in boundary; Interfaces and Data Flow; Current Technical State.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-07, STYLE-09, STYLE-10.

## Implementation Plan

1. Confirm T-032 to T-034 landed with the shapes their evidence records; return REPLAN REQUIRED if a generic change is needed to mount the window.
2. Add the made-up window and rate metric to the made-up experience.
3. Write contract tests and extend the name check.
4. Extend `browser-synthetic.mjs`; run all browser scripts into a fresh run directory.
5. Run gates; reconcile Design.md and Drift Notes.
6. Ask the owner for the User Check and record it.

## Boundaries

No generic code change unless recorded as a finding; no Perseids or shower data or wording; no scene effects driven by the rate.

## Technical Verification

Focused tests during iteration; handoff runs the configured build and test gates plus every browser script (scene-affecting fuller gate). This Task produces the full-gate and browser evidence the Full Objective Check needs, evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
